import {
  getAlumnosFromSheet,
  getAsistenciasFromSheet,
  appendAsistenciaToSheet,
  updateAlumnoByDNI,
  getClasesElClubFromSheet,
  getPlanesFromSheet
} from '../services/googleSheets.js';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween.js'
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js"
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js'

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore)
dayjs.extend(isBetween)
dayjs.extend(weekOfYear)

const PLANES_ILIMITADOS = ['Pase libre', 'Personalizado premium', 'Libre', 'Personalizado gold'];

export const registrarAsistencia = async (req, res) => {
  try {
    const { dni } = req.body;
    if (!dni) return res.status(400).json({ message: 'DNI es requerido' });

    const alumnos = await getAlumnosFromSheet();
    const alumno = alumnos.find(a => a.DNI === dni);
    if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });

    const vencimiento = dayjs(alumno['Fecha_vencimiento'], ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']);
    const hoyDate = dayjs();
    if (hoyDate.isSame(vencimiento, 'day') || hoyDate.isAfter(vencimiento, 'day')) {
      return res.status(403).json({
        message: `El plan de ${alumno.Nombre} venció el ${vencimiento.format('DD/MM/YYYY')}`,
        fechaVencimiento: vencimiento.format('DD/MM/YYYY'),
      });
    }

    const hoy = dayjs().tz("America/Argentina/Buenos_Aires").format('DD-MM-YYYY');
    const asistencias = await getAsistenciasFromSheet();
    const asistenciasFormateadas = asistencias.map(a => {
      const fecha = dayjs(a.Fecha, ['D/M/YYYY', 'DD/MM/YYYY']);
      return { ...a, Fecha: fecha.format('DD-MM-YYYY') };
    });

    const yaAsistioHoy = asistenciasFormateadas.some(a => a.DNI === dni && a.Fecha === hoy);
    if (yaAsistioHoy) {
      return res.status(409).json({
        message: `El alumno ${alumno.Nombre} ya registró asistencia hoy`
      });
    }

    // Verificar clases del día
    const clases = await getClasesElClubFromSheet();
    const diaHoy = dayjs().locale('es').format('dddd');
    const clasesDeHoy = clases.filter(c => c.Dia.toLowerCase() === diaHoy.toLowerCase());
    const claseInscripto = clasesDeHoy.find(c => {
      const inscriptos = c.Inscriptos ? c.Inscriptos.split(',').map(d => d.trim()) : [];
      return inscriptos.includes(dni);
    });

    // Registrar asistencia
    const nuevaAsistencia = {
      Fecha: hoy,
      Hora: dayjs().tz("America/Argentina/Buenos_Aires").format('HH:mm'),
      DNI: alumno.DNI,
      Nombre: alumno.Nombre,
      Plan: alumno.Plan,
      Responsable: ''
    };

    await appendAsistenciaToSheet(nuevaAsistencia);
    const io = req.app.get('socketio');
    io.emit('asistencia-registrada', { dni, nuevaAsistencia });

    const plan = alumno.Plan;
    const esIlimitado = PLANES_ILIMITADOS.includes(plan);
    const realizadasActual = parseInt(alumno['Clases_realizadas'] || '0', 10);
    const realizadas = realizadasActual + 1;
    const gymCoinsActuales = parseInt(alumno['GymCoins'] || '0', 10);
    const gymCoinsActualizadas = gymCoinsActuales + 25;

    // Actualizar datos en la hoja
    await updateAlumnoByDNI(dni, {
      'Clases_realizadas': String(realizadas),
      'GymCoins': String(gymCoinsActualizadas),
    });

    let mensaje = 'Asistencia registrada correctamente';
    if (claseInscripto) {
      mensaje = `Bienvenido a la clase de "${claseInscripto['Nombre de clase']}"`;
    }

    io.emit('asistencia-actualizada', {
      dni,
      clasesRealizadas: realizadas,
      gymCoins: gymCoinsActualizadas
    });

    if (esIlimitado) {
      return res.status(201).json({
        message: mensaje,
        plan,
        clasesRealizadas: realizadas,
        gymCoins: gymCoinsActualizadas,
        fechaVencimiento: alumno['Fecha_vencimiento']
      });
    }

    const pagadas = parseInt(alumno['Clases_pagadas'] || '0', 10);

    if (realizadasActual >= pagadas) {
      return res.status(409).json({
        message: `El alumno ${alumno.Nombre} ya agotó sus clases pagadas`,
        plan,
        clasesPagadas: pagadas,
        clasesRealizadas: realizadasActual,
        gymCoins: gymCoinsActualizadas,
        fechaVencimiento: alumno['Fecha_vencimiento']
      });
    }

    res.status(201).json({
      message: mensaje,
      nombre: alumno.Nombre,
      plan,
      clasesPagadas: pagadas,
      clasesRealizadas: realizadas,
      gymCoins: gymCoinsActualizadas,
      fechaVencimiento: alumno['Fecha_vencimiento']
    });

    console.log(`Gymcoins Actualizadas: $${gymCoinsActualizadas}`)
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({ message: 'Error al registrar la asistencia' });
  }
};

export const verificarAlumno = async (req, res) => {
  const start = Date.now();
  try {
    const { dni } = req.body;
    if (!dni) return res.status(400).json({ message: "DNI es requerido" });

    const alumnos = await getAlumnosFromSheet();
    const alumno = alumnos.find((a) => a.DNI === dni);

    if (!alumno) return res.status(404).json({ message: "Alumno no encontrado" });

    const vencimiento = dayjs(alumno["Fecha_vencimiento"], [
      "D/M/YYYY",
      "DD/MM/YYYY",
      "YYYY-MM-DD",
    ]);

    const hoy = dayjs();
    const hoyStr = dayjs().tz("America/Argentina/Buenos_Aires").format("DD-MM-YYYY");
    const pagadas = parseInt(alumno["Clases_pagadas"] || "0", 10);
    const realizadas = parseInt(alumno["Clases_realizadas"] || "0", 10);
    const gymCoins = parseInt(alumno["GymCoins"] || "0", 10);

    const data = {
      nombre: alumno.Nombre,
      dni: alumno.DNI,
      plan: alumno.Plan,
      clasesPagadas: pagadas,
      clasesRealizadas: realizadas + 1,
      gymCoins: gymCoins + 25,
      fechaVencimiento: vencimiento.format("DD/MM/YYYY"),
    };

    if (hoy.isSame(vencimiento, "day") || hoy.isAfter(vencimiento, "day")) {
      const elapsed = Date.now() - start;
      console.log(`❌ Plan vencido:`, data, `⏱️ ${elapsed}ms`);
      return res.status(403).json({
        message: `El plan de ${alumno.Nombre} venció el ${vencimiento.format("DD/MM/YYYY")}`,
        ...data,
      });
    }

    const esIlimitado = PLANES_ILIMITADOS.includes(alumno.Plan);
    if (!esIlimitado && realizadas > pagadas) {
      const elapsed = Date.now() - start;
      console.log(`⚠️ Clases agotadas:`, data, `⏱️ ${elapsed}ms`);
      return res.status(409).json({
        message: `El alumno ${alumno.Nombre} ya agotó sus clases pagadas`,
        ...data,
      });
    }

    const elapsed = Date.now() - start;
    console.log(`✅ Alumno activo:`, data, `⏱️ ${elapsed}ms`);
    return res.status(200).json({
      message: "Alumno activo",
      ...data,
    });
  } catch (error) {
    console.error("Error al verificar alumno:", error);
    return res.status(500).json({ message: "Error en la verificación" });
  }
};

export const getAsistenciasPorDNI = async (req, res) => {
  try {
    const dni = req.params.dni;
    if (!dni) return res.status(400).json({ message: 'DNI es requerido' });

    const asistencias = await getAsistenciasFromSheet();
    const filtradas = asistencias.filter(a => a.DNI === dni);

    res.json(filtradas);
  } catch (error) {
    console.error('Error al obtener asistencias por DNI:', error);
    res.status(500).json({ message: 'Error al obtener asistencias del alumno' });
  }
};

export const getAsistenciasPorHora = async (req, res) => {
  try {
    const { dia, mes, anio } = req.params;
    const fechaFormateada = dayjs(`${anio}-${mes}-${dia}`, "YYYY-M-D").format("DD/MM/YYYY");

    const [asistencias, planes] = await Promise.all([
      getAsistenciasFromSheet(),
      getPlanesFromSheet()
    ]);

    const planesGimnasio = planes.filter(p => p.Tipo?.toUpperCase() === "GIMNASIO");
    const nombresPlanesGimnasio = new Set(
      planesGimnasio.map(p => p["Plan o Producto"]?.toLowerCase())
    );

    const conteoHoras = {};
    for (let h = 7; h <= 22; h++) {
      const hora = `${h.toString().padStart(2, "0")}:00`;
      conteoHoras[hora] = 0;
    }

    for (const asistencia of asistencias) {
      const fecha = dayjs(asistencia.Fecha, ['D/M/YYYY', 'DD/MM/YYYY'], true);

      if (fecha.isValid() && fecha.format("DD/MM/YYYY") === fechaFormateada) {
        if (!nombresPlanesGimnasio.has(asistencia.Plan?.toLowerCase())) continue;

        const [h] = asistencia.Hora.split(":");
        const horaClave = `${h.padStart(2, "0")}:00`;

        if (conteoHoras[horaClave] !== undefined) {
          conteoHoras[horaClave] += 1;
        }
      }
    }

    res.json(conteoHoras);
  } catch (error) {
    console.error("Error al obtener asistencias por hora:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


export const getPromediosRangosHorarios = async (req, res) => {
  try {
    const { dia, mes, anio } = req.params;
    const fechaFin = dayjs(`${dia}/${mes}/${anio}`, ['D/M/YYYY', 'DD/MM/YYYY'], true);

    if (!fechaFin.isValid()) {
      return res.status(400).json({ message: "Fecha inválida. Usa el formato correcto: /dd/mm/yyyy" });
    }

    const fechaInicio = fechaFin.startOf('month');
    const diasEnRango = fechaFin.diff(fechaInicio, 'day') + 1;
    const asistencias = await getAsistenciasFromSheet();

    const rangos = {
      manana: { total: 0 },
      tarde: { total: 0 },
      noche: { total: 0 },
    };

    for (const asistencia of asistencias) {
      const fechaClase = dayjs(asistencia.Fecha, ['D/M/YYYY', 'DD/MM/YYYY'], true);
      const horaStr = asistencia.Hora?.trim();

      if (!fechaClase.isValid()) continue;
      if (!fechaClase.isBetween(fechaInicio, fechaFin, 'day', '[]')) continue;

      const [hh] = horaStr.split(':');
      const hora = parseInt(hh);
      const cantidad = 1;

      if (hora >= 7 && hora < 12) {
        rangos.manana.total += cantidad;
      } else if (hora >= 15 && hora < 18) {
        rangos.tarde.total += cantidad;
      } else if (hora >= 18 && hora <= 22) {
        rangos.noche.total += cantidad;
      }
    }

    res.json({
      desde: fechaInicio.format('DD/MM/YYYY'),
      hasta: fechaFin.format('DD/MM/YYYY'),
      rangos: {
        manana: {
          total: rangos.manana.total,
          promedio: +(rangos.manana.total / diasEnRango).toFixed(2),
        },
        tarde: {
          total: rangos.tarde.total,
          promedio: +(rangos.tarde.total / diasEnRango).toFixed(2),
        },
        noche: {
          total: rangos.noche.total,
          promedio: +(rangos.noche.total / diasEnRango).toFixed(2),
        }
      }
    });
  } catch (error) {
    console.error("Error al calcular promedios por rangos horarios:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getPromedios = async (req, res) => {
  try {
    const { anio, mes, semana, fecha } = req.query

    const anioNum = parseInt(anio, 10)
    if (isNaN(anioNum)) return res.status(400).json({ message: 'Año inválido' })

    const mesNum = mes ? parseInt(mes, 10) : null
    const semanaNum = semana ? parseInt(semana, 10) : null
    if (mes && isNaN(mesNum)) return res.status(400).json({ message: 'Mes inválido' })
    if (semana && isNaN(semanaNum)) return res.status(400).json({ message: 'Semana inválido' })

    let useDateRange = false
    let startDate, endDate
    if (fecha) {
      endDate = dayjs(fecha, 'YYYY-MM-DD', true)
      if (!endDate.isValid()) return res.status(400).json({ message: 'Fecha inválida (debe ser YYYY-MM-DD)' })
      startDate = endDate.subtract(7, 'day')
      useDateRange = true
    }

    const [asistencias, planes] = await Promise.all([
      getAsistenciasFromSheet(),
      getPlanesFromSheet()
    ])

    const planesGimnasio = planes.filter(p => p.Tipo?.toUpperCase() === "GIMNASIO")
    const nombresPlanesGimnasio = new Set(planesGimnasio.map(p => p["Plan o Producto"]?.toLowerCase()))

    const rangos = { manana: 0, tarde: 0, noche: 0 }
    const diasConAsistencias = new Set()

    for (const a of asistencias) {
      const f = dayjs(a.Fecha, ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true)
      const h = dayjs(a.Hora, 'H:mm', true).hour()
      if (!f.isValid()) continue

      if (f.year() !== anioNum) continue

      if (useDateRange) {
        if (f.isBefore(startDate, 'day') || f.isAfter(endDate, 'day')) continue
      } else {
        if (mesNum && (f.month() + 1) !== mesNum) continue
        if (semanaNum && f.week() !== semanaNum) continue
      }

      if (!nombresPlanesGimnasio.has(a.Plan?.toLowerCase())) continue

      diasConAsistencias.add(f.format('YYYY-MM-DD'))

      if (h >= 7 && h < 12) rangos.manana++
      if (h >= 15 && h < 18) rangos.tarde++
      if (h >= 18 && h <= 22) rangos.noche++
    }

    const totalDias = diasConAsistencias.size || 1

    const promedios = {
      manana: { total: rangos.manana, promedio: Math.round(rangos.manana / totalDias), dias: totalDias },
      tarde: { total: rangos.tarde, promedio: Math.round(rangos.tarde / totalDias), dias: totalDias },
      noche: { total: rangos.noche, promedio: Math.round(rangos.noche / totalDias), dias: totalDias },
    }

    res.json(promedios)
  } catch (error) {
    console.error('Error al calcular promedios:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}



