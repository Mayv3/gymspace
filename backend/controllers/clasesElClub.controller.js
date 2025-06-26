import dayjs from 'dayjs';
import {
  getClasesElClubFromSheet,
  updateClaseElClubInSheet,
  getAlumnosFromSheet,
  updateAlumnoByDNI,
  appendToRegistrosClasesSheet,
  eliminarRegistroDeClase
} from '../services/googleSheets.js';

import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);
dayjs.extend(utc)
dayjs.extend(timezone)

const RESPONSES = {
  requiredDni: { status: 400, message: 'DNI requerido' },
  classNotFound: { status: 404, message: 'Clase no encontrada' },
  alumnoNotFound: { status: 404, message: 'Alumno no encontrado' },
  classDone: { status: 400, message: 'La clase ya se ha realizado' },
  subscribeLate: { status: 400, message: 'Solo se puede inscribir hasta media hora antes del horario de la clase' },
  alreadySubscribed: { status: 409, message: 'El DNI ya está inscripto en esta clase' },
  fullCapacity: { status: 400, message: 'La clase ya alcanzó el cupo máximo' },
  notSubscribed: { status: 400, message: 'El DNI no está inscripto en esta clase' },
  unsubscribeTooLate: { status: 400, message: 'Solo podés desuscribirte hasta una hora después del inicio de la clase' },
  fetchClasesError: { status: 500, message: 'Error al obtener clases' },
  processError: { status: 500, message: 'Error al procesar la solicitud' }
};

const sendError = (res, { status, message }) => res.status(status).json({ message });
const sendSuccess = (res, payload) => res.status(200).json(payload);
const parseList = raw => raw ? raw.split(',').map(s => s.trim()) : [];
const PLANES_ILIMITADOS = ['Pase libre', 'Personalizado premium', 'Libre', 'Personalizado gold'];

const DIA_SEMANA_MAP = {
  'Domingo': 0,
  'Lunes': 1,
  'Martes': 2,
  'Miercoles': 3,
  'Jueves': 4,
  'Viernes': 5,
  'Sábado': 6
}

const ARG_TIMEZONE = 'America/Argentina/Buenos_Aires';

function calcularProximaFecha(diaSemana) {
  const hoy = dayjs()
  const diaObjetivo = DIA_SEMANA_MAP[diaSemana]

  if (diaObjetivo === undefined) return null

  let proxima = hoy.day(diaObjetivo)
  if (proxima.isBefore(hoy, 'day')) {
    proxima = proxima.add(1, 'week')
  }

  return proxima.format('D/M/YYYY')
}

async function findClase(id) {
  const clases = await getClasesElClubFromSheet();
  return clases.find(c => c.ID === id);
}

async function findAlumno(dni) {
  const alumnos = await getAlumnosFromSheet();
  return alumnos.find(a => a.DNI === dni);
}

const ARG_TZ = 'America/Argentina/Cordoba'

const limpiarInscriptosPasados = async () => {
  const clases = await getClasesElClubFromSheet();
  const ahora = dayjs().tz(ARG_TZ);

  for (const clase of clases) {
    const proximaFecha = calcularProximaFecha(clase.Dia);
    if (!proximaFecha) {
      console.log(`❌ Clase ${clase.ID}: no se pudo calcular la próxima fecha`);
      continue;
    }

    const fechaHoraClase = dayjs.tz(
      `${proximaFecha} ${clase.Hora}`,
      'D/M/YYYY HH:mm',
      ARG_TZ
    )

    if (fechaHoraClase.isBefore(ahora)) {
      if (clase.Inscriptos?.trim()) {
        await updateClaseElClubInSheet(clase.ID, { Inscriptos: '' });
      }
    }
  }
};

export const obtenerClasesElClub = async (req, res) => {
  limpiarInscriptosPasados()
  try {
    const clasesRaw = await getClasesElClubFromSheet();

    const ARG_TZ = "America/Argentina/Buenos_Aires";
    const hoy = dayjs().tz(ARG_TZ).startOf("day");

    const hayPasadas = clasesRaw.some(clase => {
      const prox = calcularProximaFecha(clase.Dia);
      if (!prox) return false;
      const fechaClase = dayjs(prox, "D/M/YYYY").tz(ARG_TZ).startOf("day");
      return fechaClase.isBefore(hoy);
    });

    const clases = await getClasesElClubFromSheet();
    const clasesConFecha = clases.map(clase => {
      const proximaFecha = calcularProximaFecha(clase.Dia);
      return { ...clase, ProximaFecha: proximaFecha };
    });

    clasesConFecha.sort((a, b) => {
      const fa = dayjs(`${a.ProximaFecha} ${a.Hora}`, "D/M/YYYY HH:mm");
      const fb = dayjs(`${b.ProximaFecha} ${b.Hora}`, "D/M/YYYY HH:mm");
      return fa.diff(fb);
    });

    return sendSuccess(res, clasesConFecha);
  } catch (error) {
    console.error("Error al obtener clases del club:", error);
    return sendError(res, RESPONSES.fetchClasesError);
  }
};

export const updateClaseTableroByID = async (req, res) => {
  try {
    const { id } = req.params;
    const { dni, desuscribir } = req.body;

    if (!dni) return sendError(res, RESPONSES.requiredDni);

    const [clase, alumno] = await Promise.all([
      findClase(id),
      findAlumno(dni)
    ]);

    if (!clase) return sendError(res, RESPONSES.classNotFound);
    if (!alumno) return sendError(res, RESPONSES.alumnoNotFound);

    const inscritos = clase.Inscriptos ? clase.Inscriptos.split(',').map(d => d.trim()) : [];

    const now = dayjs().tz(ARG_TIMEZONE);
    const proximaFecha = calcularProximaFecha(clase.Dia);

    const proximaFechaStr = dayjs(proximaFecha, 'D/M/YYYY').format('YYYY-MM-DD');
    const classTime = dayjs.tz(`${proximaFechaStr}T${clase.Hora.padStart(5, '0')}`, ARG_TIMEZONE);

    if (!desuscribir) {
      const vencimiento = dayjs(alumno['Fecha_vencimiento'], ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']);

      if (now.isAfter(vencimiento.endOf('day'))) {
        return sendError(res, {
          status: 403,
          message: `El plan de ${alumno.Nombre} está vencido desde el ${vencimiento.format('DD/MM/YYYY')}`,
        });
      }

      const esIlimitado = PLANES_ILIMITADOS.includes(alumno.Plan);
      if (!esIlimitado) {
        const pagadas = parseInt(alumno['Clases_pagadas'] || '0', 10);
        const realizadas = parseInt(alumno['Clases_realizadas'] || '0', 10);
        if (realizadas >= pagadas) {
          return sendError(res, {
            status: 403,
            message: `El alumno ${alumno.Nombre} ya usó todas sus clases pagadas`,
          });
        }
      }

      if (classTime.diff(now, 'minute') < 30) {
        console.log("Hora Ahora:", now)
        console.log("Hora clase:", classTime)
        return sendError(res, RESPONSES.subscribeLate);
      }

      if (inscritos.includes(dni)) {
        return sendError(res, RESPONSES.alreadySubscribed);
      }

      if (inscritos.length >= Number(clase['Cupo maximo'])) {
        return sendError(res, RESPONSES.fullCapacity);
      }

      inscritos.push(dni);
      await updateClaseElClubInSheet(id, { Inscriptos: inscritos.join(', ') });

      await appendToRegistrosClasesSheet({
        IDClase: clase.ID,
        'Nombre de clase': clase['Nombre de clase'],
        Fecha: proximaFecha,
        Hora: clase.Hora.toString(),
        'DNI Alumno': alumno.DNI,
        'Nombre Alumno': alumno.Nombre,
        Acción: 'Inscripción',
        Timestamp: now.format('YYYY-MM-DD HH:mm:ss')
      });

      return sendSuccess(res, {
        message: `Inscripción exitosa a la clase de ${clase['Nombre de clase']}. Podés desuscribirte hasta una hora después de haberte inscripto.`,
        clase: clase['Nombre de clase'],
        inscripto: alumno.Nombre,
        timestamp: now.format('YYYY-MM-DD HH:mm:ss')
      });
    }

    // DESUSCRIPCIÓN
    if (!inscritos.includes(dni)) {
      return sendError(res, RESPONSES.notSubscribed);
    }

    const minutesSinceClassStart = now.diff(classTime, 'minute');
    if (minutesSinceClassStart > 60) {
      return sendError(res, RESPONSES.unsubscribeTooLate);
    }

    await eliminarRegistroDeClase({
      IDClase: clase.ID,
      DNI: alumno.DNI,
      Fecha: proximaFecha
    });

    const updatedInscritos = inscritos.filter(d => d !== dni);
    await updateClaseElClubInSheet(id, { Inscriptos: updatedInscritos.join(', ') });

    await updateAlumnoByDNI(dni, {
      Clases_realizadas: String(Math.max(0, Number(alumno.Clases_realizadas || 0) - 1))
    });

    return sendSuccess(res, {
      message: `Te desuscribiste correctamente de la clase de ${clase['Nombre de clase']}.`,
      clase: clase['Nombre de clase'],
      alumno: alumno.Nombre
    });
  } catch (error) {
    console.error('Error en updateClaseTableroByID:', error);
    return sendError(res, RESPONSES.processError);
  }
};


