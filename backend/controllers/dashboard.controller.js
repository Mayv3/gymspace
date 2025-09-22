import dayjs from 'dayjs';
import {
  getAlumnosFromSheet,
  getPlanesFromSheet,
  getAsistenciasFromSheet,
  getPagosFromSheet,
  getCajasFromSheet,
  getEgresosFromSheet
} from '../services/googleSheets.js';

let cachedDashboard = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 1000;

export const getDashboardCompleto = async (req, res) => {
  try {
    const ahora = Date.now();

    if (cachedDashboard && ahora - lastFetchTime < CACHE_DURATION_MS) {
      console.log("➡️ Sirviendo dashboard desde caché");
      return res.json(cachedDashboard);
    }

    console.log("♻️ Generando nuevo dashboard desde Google Sheets");

    const hoy = dayjs();
    const { fecha, mesPersonalizados } = req.query;

    const [alumnos, planesBD, asistencias, pagos, egresos] = await Promise.all([
      getAlumnosFromSheet(),
      getPlanesFromSheet(),
      getAsistenciasFromSheet(),
      getPagosFromSheet(),
      getEgresosFromSheet()
    ]);

    const cajas = await getCajasFromSheet();

    const mesConsultado = parseInt(req.query.mesCajas || hoy.month() + 1);
    const anioConsultado = parseInt(req.query.anioCajas || hoy.year());

    const cajasFiltradas = cajas.filter(caja => {
      const fechaCaja = dayjs(caja.Fecha, ['D/M/YYYY', 'DD/MM/YYYY'], true);
      return fechaCaja.isValid() &&
        fechaCaja.month() + 1 === mesConsultado &&
        fechaCaja.year() === anioConsultado;
    });

    const cajasAgrupadas = {};

    for (const caja of cajasFiltradas) {
      const fecha = caja.Fecha; // Formato 'D/M/YYYY'
      const turno = (caja.Turno || "").toLowerCase().trim();
      const monto = parseFloat(caja["Total Final"] || "0");

      if (!cajasAgrupadas[fecha]) {
        cajasAgrupadas[fecha] = { fecha };
      }

      cajasAgrupadas[fecha][turno] = monto;
    }

    const cajasDelMes = Object.values(cajasAgrupadas).map(({ fecha, mañana = 0, tarde = 0 }) => ({
      fecha,
      mañana,
      tarde
    }));

    let activos = 0, vencidos = 0, abandonos = 0;
    const edades = {};
    const planesConteo = {};

    const planesBDMap = {};
    for (const p of planesBD) {
      const nombre = (p['Plan o Producto'] || '').trim().toUpperCase();
      planesBDMap[nombre] = p.Tipo?.trim().toUpperCase() || 'OTRO';
    }

    for (const alumno of alumnos) {
      const fechaStr = (alumno.Fecha_vencimiento || '').trim();
      const fechaVenc = dayjs(fechaStr, ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);
      const clasesPagadas = Number(alumno.Clases_pagadas || 0);
      const clasesRealizadas = Number(alumno.Clases_realizadas || 0);

      const tieneVencimiento = fechaVenc.isValid();
      const vencidoPorFecha = tieneVencimiento && fechaVenc.isBefore(hoy, 'day');
      const vencidoPorClases = clasesPagadas > 0 && clasesRealizadas >= clasesPagadas;
      const diasDesdeVencimiento = tieneVencimiento ? hoy.diff(fechaVenc, 'day') : 0;

      if (vencidoPorFecha || vencidoPorClases) {
        if (diasDesdeVencimiento > 30) abandonos++;
        else vencidos++;
      } else {
        activos++;
      }

      const fechaNac = dayjs(alumno.Fecha_nacimiento, ['D/M/YYYY', 'DD/MM/YYYY'], true);
      if (fechaNac.isValid()) {
        const edad = hoy.diff(fechaNac, 'year');
        edades[edad] = (edades[edad] || 0) + 1;
      }

      const planNombre = (alumno.Plan || '').trim().toUpperCase();
      const tipo = planesBDMap[planNombre] || 'OTRO';
      const key = `${planNombre}__${tipo}`;

      planesConteo[key] = (planesConteo[key] || 0) + 1;
    }

    const planes = Object.entries(planesConteo).map(([key, cantidad]) => {
      const [plan, tipo] = key.split('__');
      return { plan, tipo, cantidad };
    });

    const fechaBase = fecha ? dayjs(fecha, ['YYYY-MM-DD', 'D/M/YYYY', 'DD/MM/YYYY'], true) : hoy;

    const asistenciasPorHora = {};
    for (let i = 7; i <= 22; i++) {
      const hora = `${i.toString().padStart(2, '0')}:00`;
      asistenciasPorHora[hora] = 0;
    }

    for (const a of asistencias) {
      const fechaAsistencia = dayjs(a.Fecha, ['D/M/YYYY', 'DD/MM/YYYY']);
      if (fechaAsistencia.isSame(fechaBase, 'day')) {
        const hora = dayjs(a.Hora, 'H:mm').format('HH:00');
        if (asistenciasPorHora[hora] !== undefined) asistenciasPorHora[hora]++;
      }
    }

    const desde = fechaBase.subtract(30, 'day');
    const rangos = { manana: 0, tarde: 0, noche: 0 };

    for (const a of asistencias) {
      const fechaAsistencia = dayjs(a.Fecha, ['D/M/YYYY', 'DD/MM/YYYY']);
      if (fechaAsistencia.isAfter(desde) && fechaAsistencia.isSameOrBefore(fechaBase)) {
        const hora = dayjs(a.Hora, 'H:mm').hour();
        if (hora >= 7 && hora < 12) rangos.manana++;
        else if (hora >= 15 && hora < 18) rangos.tarde++;
        else if (hora >= 18 && hora <= 22) rangos.noche++;
      }
    }

    const promedios = {
      manana: { total: rangos.manana, promedio: +(rangos.manana / 31).toFixed(2) },
      tarde: { total: rangos.tarde, promedio: +(rangos.tarde / 31).toFixed(2) },
      noche: { total: rangos.noche, promedio: +(rangos.noche / 31).toFixed(2) }
    };

    const anioActual = hoy.year();

    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: dayjs().month(i).locale('es').format('MMMM'),
      gimnasio: 0,
      clase: 0,
      servicio: 0,
      producto: 0,
      egresosGimnasio: 0,
      egresosClase: 0,
      netoGimnasio: 0,
      netoClase: 0,
      tarjeta: 0,
      efectivo: 0
    }));

    for (const e of egresos) {
      const fechaEgreso = dayjs(e.Fecha, ['D/M/YYYY', 'DD/MM/YYYY'], true);
      if (!fechaEgreso.isValid()) continue;

      if (fechaEgreso.year() === anioActual) {
        const mesIndex = fechaEgreso.month();
        const tipo = (e.Tipo || "").trim().toUpperCase();
        const monto = parseFloat(e.Monto || "0");

        if (tipo === "GIMNASIO") meses[mesIndex].egresosGimnasio += monto;
        else if (tipo === "CLASE") meses[mesIndex].egresosClase += monto;
      }
    }

    for (const p of pagos) {
      const fechaPagoStr = p.Fecha_pago || p.Fecha_de_Pago || p["Fecha de Pago"] || "";
      const fechaPago = dayjs(fechaPagoStr, ['D/M/YYYY', 'DD/MM/YYYY'], true);

      if (!fechaPago.isValid()) {
        console.warn("Pago con fecha inválida:", p);
        continue;
      }

      if (fechaPago.year() === anioActual) {
        const mesIndex = fechaPago.month();
        const tipo = (p.Tipo || "").trim().toUpperCase();
        const monto = parseFloat(p.Monto || "0");
        const metodo = (p.Metodo_de_Pago || "").trim().toUpperCase();

        if (metodo === "TARJETA") {
          meses[mesIndex].tarjeta += monto;
        } else if (metodo === "EFECTIVO") {
          meses[mesIndex].efectivo += monto;
        }

        if (["GIMNASIO", "DEUDA GIMNASIO"].includes(tipo)) {
          meses[mesIndex].gimnasio += monto;
        } else if (["CLASE", "DEUDA CLASES"].includes(tipo)) {
          meses[mesIndex].clase += monto;
        } else if (tipo === "SERVICIO") {
          meses[mesIndex].servicio += monto;
        } else if (tipo === "PRODUCTO") {
          meses[mesIndex].producto += monto;
        }
      }
    }

    for (const mes of meses) {
      mes.netoGimnasio = mes.gimnasio - mes.egresosGimnasio;
      mes.netoClase = mes.clase - mes.egresosClase;
    }

    const mesFiltrado = mesPersonalizados ? parseInt(mesPersonalizados, 10) : hoy.month() + 1;

    const dniPagosMes = new Set();

    for (const pago of pagos) {
      const fechaPagoStr = pago.Fecha_pago || pago.Fecha_de_Pago || pago["Fecha de Pago"] || "";
      const fechaPago = dayjs(fechaPagoStr, ['D/M/YYYY', 'DD/MM/YYYY'], true);

      if (!fechaPago.isValid()) continue;

      if (fechaPago.month() + 1 === mesFiltrado && (pago.Tipo || "").trim().toUpperCase() === "GIMNASIO") {
        dniPagosMes.add(String(pago["Socio DNI"])); // <--- AHORA GUARDA COMO STRING
      }
    }

    const personalizadosPorProfesorMap = {};

    for (const alumno of alumnos) {
      const plan = (alumno.Plan || "").toUpperCase();
      const profesor = (alumno.Profesor_asignado || "").trim();
      const dni = String(alumno.DNI);

      const esPersonalizado = plan.includes("PERSONALIZADO");

      if (!esPersonalizado || !profesor || !dniPagosMes.has(dni)) continue;

      if (!personalizadosPorProfesorMap[profesor]) {
        personalizadosPorProfesorMap[profesor] = [];
      }
      personalizadosPorProfesorMap[profesor].push(alumno.Nombre || `DNI ${dni}`);
    }

    const personalizadosPorProfesor = Object.entries(personalizadosPorProfesorMap).map(([profesor, alumnos]) => ({
      profesor,
      cantidad: alumnos.length,
      alumnos,
    }));

    const dashboardData = {
      estado: { activos, vencidos, abandonos },
      edades,
      planes,
      asistenciasPorHora,
      promedios,
      facturacion: meses,
      personalizadosPorProfesor,
      cajasDelMes
    };

    cachedDashboard = dashboardData;
    lastFetchTime = ahora;

    res.json(dashboardData);

  } catch (error) {
    console.error('Error en getDashboardCompleto:', error);
    res.status(500).json({ message: 'Error al obtener el dashboard completo' });
  }
};
