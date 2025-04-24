import {
  getAlumnosFromSheet,
  getAsistenciasFromSheet,
  appendAsistenciaToSheet,
  updateAlumnoByDNI,
} from '../services/googleSheets.js';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween.js'
dayjs.extend(isBetween)

const PLANES_ILIMITADOS = ['Pase libre', 'Personalizado premium', 'Libre', 'Personalizado gold'];

export const registrarAsistencia = async (req, res) => {
  try {
    const { dni } = req.body;
    if (!dni) return res.status(400).json({ message: 'DNI es requerido' });

    const alumnos = await getAlumnosFromSheet();
    const alumno = alumnos.find(a => a.DNI === dni);

    if (!alumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }

    const vencimiento = dayjs(alumno['Fecha_vencimiento'], ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']);
    const hoyDate = dayjs();

    if (hoyDate.isAfter(vencimiento, 'day')) {
      return res.status(403).json({
        message: `El plan de ${alumno.Nombre || alumno['Nombre']} venció el ${vencimiento.format('DD/MM/YYYY')}`,
        fechaVencimiento: vencimiento.format('DD/MM/YYYY'),
      });
    }


    const hoy = dayjs().format('DD-MM-YYYY');
    const asistencias = await getAsistenciasFromSheet();

    const asistenciasFormateadas = asistencias.map(a => {
      const fecha = dayjs(a.Fecha, ['D/M/YYYY', 'DD/MM/YYYY']);
      return { ...a, Fecha: fecha.format('DD-MM-YYYY') };
    });

    const yaAsistioHoy = asistenciasFormateadas.some(a => a.DNI === dni && a.Fecha === hoy);

    if (yaAsistioHoy) {
      return res.status(409).json({
        message: `El alumno ${alumno.Nombre || alumno['Nombre']} ya registró asistencia hoy`
      });
    }

    const nuevaAsistencia = {
      Fecha: hoy,
      Hora: dayjs().format('HH:mm'),
      DNI: alumno.DNI,
      Nombre: alumno.Nombre || alumno['Nombre'],
      Plan: alumno.Plan,
      Responsable: ''
    };

    await appendAsistenciaToSheet(nuevaAsistencia);

    // Emite el evento de asistencia registrada a través de Socket.IO
    const io = req.app.get('socketio');
    io.emit('asistencia-registrada', { dni, nuevaAsistencia });

    const plan = alumno.Plan;
    const esIlimitado = PLANES_ILIMITADOS.includes(plan);

    if (esIlimitado) {
      return res.status(201).json({
        message: 'Asistencia registrada correctamente',
        plan,
        fechaVencimiento: alumno['Fecha_vencimiento']
      });
    }

    const pagadas = parseInt(alumno['Clases_pagadas'] || '0', 10);
    const realizadasActual = parseInt(alumno['Clases_realizadas'] || '0', 10);

    if (realizadasActual >= pagadas) {
      return res.status(409).json({
        message: `El alumno ${alumno.Nombre || alumno['Nombre']} ya agotó sus clases pagadas`,
        plan,
        clasesPagadas: pagadas,
        clasesRealizadas: realizadasActual,
        fechaVencimiento: alumno['Fecha_vencimiento']
      });
    }

    const realizadas = realizadasActual + 1;

    await updateAlumnoByDNI(dni, {
      'Clases_realizadas': String(realizadas),
    });

    io.emit('asistencia-actualizada', { dni, clasesRealizadas: realizadas });

    res.status(201).json({
      message: 'Asistencia registrada correctamente',
      plan,
      clasesPagadas: pagadas,
      clasesRealizadas: realizadas,
      fechaVencimiento: alumno['Fecha_vencimiento']
    });
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({ message: 'Error al registrar la asistencia' });
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
    const fechaFormateada = `${dia}/${mes}/${anio}`;

    const asistencias = await getAsistenciasFromSheet();
    const conteoHoras = {};

    for (let h = 7; h <= 22; h++) {
      const hora = `${h.toString().padStart(2, "0")}:00`;
      conteoHoras[hora] = 0;
    }

    for (const asistencia of asistencias) {
      const fecha = dayjs(asistencia.Fecha, ['D/M/YYYY', 'DD/MM/YYYY'], true);
      if (fecha.isValid() && fecha.format("DD/MM/YYYY") === fechaFormateada) {
        const [h, _] = asistencia.Hora.split(":");
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

