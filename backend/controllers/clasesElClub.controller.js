import dayjs from 'dayjs';
import {
  getClasesElClubFromSheet,
  updateClaseElClubInSheet,
  getAlumnosFromSheet,
  updateAlumnoByDNI
} from '../services/googleSheets.js';

const RESPONSES = {
  requiredDni: { status: 400, message: 'DNI requerido' },
  classNotFound: { status: 404, message: 'Clase no encontrada' },
  alumnoNotFound: { status: 404, message: 'Alumno no encontrado' },
  classDone: { status: 400, message: 'La clase ya se ha realizado' },
  subscribeLate: { status: 400, message: 'Solo se puede inscribir hasta una hora antes del horario de la clase' },
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

async function findClase(id) {
  const clases = await getClasesElClubFromSheet();
  return clases.find(c => c.ID === id);
}

async function findAlumno(dni) {
  const alumnos = await getAlumnosFromSheet();
  return alumnos.find(a => a.DNI === dni);
}

export const obtenerClasesElClub = async (req, res) => {
  try {
    const clases = await getClasesElClubFromSheet();
    return sendSuccess(res, clases);
  } catch (error) {
    console.error('Error al obtener clases del club:', error);
    return sendError(res, RESPONSES.fetchClasesError);
  }
};

export const updateClaseTableroByID = async (req, res) => {
  try {
    const { id } = req.params;
    const { dni, desuscribir } = req.body;

    if (!dni) return sendError(res, { status: 400, message: RESPONSES.requiredDni });

    const [clase, alumno] = await Promise.all([
      findClase(id),
      findAlumno(dni)
    ]);

    if (!clase) return sendError(res, { status: 404, message: RESPONSES.classNotFound });
    if (!alumno) return sendError(res, { status: 404, message: RESPONSES.alumnoNotFound });

    const inscritos = clase.Inscriptos ? clase.Inscriptos.split(',').map(d => d.trim()) : [];
    const now = dayjs();
    const classDateStart = dayjs(clase.Dia, ['D/M/YYYY', 'DD/MM/YYYY']).startOf('day');
    const todayStart = now.startOf('day');

    if (classDateStart.isBefore(todayStart)) {
      return sendError(res, { status: 400, message: RESPONSES.classDone });
    }

    const classTime = dayjs(`${classDateStart.format('YYYY-MM-DD')}T${clase.Hora.padStart(5, '0')}`);

    if (!desuscribir) {
      // ✅ Verifica vencimiento
      const vencimiento = dayjs(alumno['Fecha_vencimiento'], ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']);
      if (now.isSame(vencimiento, 'day') || now.isAfter(vencimiento, 'day')) {
        return sendError(res, {
          status: 403,
          message: `El plan de ${alumno.Nombre} está vencido desde el ${vencimiento.format('DD/MM/YYYY')}`,
        });
      }

      // ✅ Verifica clases pagadas si el plan no es ilimitado
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

      // ✅ Validaciones adicionales
      if (classTime.diff(now, 'minute') < 60) {
        return sendError(res, { status: 403, message: RESPONSES.subscribeLate });
      }

      if (inscritos.includes(dni)) {
        return sendError(res, { status: 409, message: RESPONSES.alreadySubscribed });
      }

      if (inscritos.length >= Number(clase['Cupo maximo'])) {
        return sendError(res, { status: 409, message: RESPONSES.fullCapacity });
      }

      inscritos.push(dni);
      await updateClaseElClubInSheet(id, { Inscriptos: inscritos.join(', ') });

      return sendSuccess(res, {
        message: `Inscripción exitosa a la clase de ${clase['Nombre de clase']}. Podés desuscribirte hasta una hora después de haberte inscripto. De lo contrario, perderás una clase pagada.`,
        clase: clase['Nombre de clase'],
        inscripto: alumno.Nombre,
        timestamp: now.format('YYYY-MM-DD HH:mm:ss')
      });
    }

    // ✅ DESUSCRIPCIÓN
    if (!inscritos.includes(dni)) {
      return sendError(res, { status: 400, message: RESPONSES.notSubscribed });
    }

    const minutesSinceClassStart = now.diff(classTime, 'minute');
    if (minutesSinceClassStart > 60) {
      return sendError(res, { status: 403, message: RESPONSES.unsubscribeTooLate });
    }

    const updatedInscritos = inscritos.filter(d => d !== dni);
    await updateClaseElClubInSheet(id, { Inscriptos: updatedInscritos.join(', ') });

    await updateAlumnoByDNI(dni, {
      Clases_realizadas: String(Math.max(0, Number(alumno.Clases_realizadas || 0) - 1))
    });

    return sendSuccess(res, {
      message: `Te desuscribiste correctamente de la clase de ${clase['Nombre de clase']}`,
      clase: clase['Nombre de clase'],
      alumno: alumno.Nombre
    });
  } catch (error) {
    console.error('Error en updateClaseTableroByID:', error);
    return sendError(res, { status: 500, message: RESPONSES.processError });
  }
};


