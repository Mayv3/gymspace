import { insertAlumno, updateAlumnoByDNI, removeAlumnoByDNI, reiniciarPuntosAlumnos, findAlumnoByDNI, listAlumnosParaRanking, mapAlumno } from '../services/alumnos.service.js';
import { listPlanes } from '../services/planes.service.js';
import { listPagosByDNI } from '../services/pagos.service.js';
import supabase from '../db/supabase.js';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js'
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(isSameOrAfter)
dayjs.extend(utc)
dayjs.extend(timezone)

const ARG_TZ = 'America/Argentina/Buenos_Aires';
const PAGE_SIZE_MAX = 100;

// Texto libre para .ilike / .or() de PostgREST: sacar lo que rompe la sintaxis
const limpiarBusqueda = (texto) => (texto || '').replace(/[,()*%\\]/g, ' ').trim();
// Comparación exacta sin distinguir mayúsculas (escapa los comodines de LIKE)
const escaparLike = (texto) => texto.replace(/[\\%_]/g, (c) => `\\${c}`);

// GET /api/alumnos → una página de socios: { data, total, page, pageSize, totalGeneral? }
// Filtros: q (nombre, email, DNI o plan), nombre, profe, sexo, plan, edadMin, edadMax
export const getAlumnos = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), PAGE_SIZE_MAX);
    const q = limpiarBusqueda(req.query.q);
    const nombre = limpiarBusqueda(req.query.nombre);
    const profe = limpiarBusqueda(req.query.profe);
    const sexo = req.query.sexo || null;
    const plan = req.query.plan && req.query.plan !== 'todos' ? req.query.plan : null;
    const edadMin = parseInt(req.query.edadMin, 10);
    const edadMax = parseInt(req.query.edadMax, 10);
    const hoy = dayjs().tz(ARG_TZ).startOf('day');

    const gruposOr = [];
    if (q) gruposOr.push(`nombre.ilike.%${q}%,email.ilike.%${q}%,dni.ilike.%${q}%,plan.ilike.%${q}%`);
    // Sin fecha de nacimiento cuenta como edad 0 (igual que antes en el navegador): entra en "edad máxima"
    if (!isNaN(edadMax)) {
      const limite = hoy.subtract(edadMax + 1, 'year').format('YYYY-MM-DD');
      gruposOr.push(`fecha_nacimiento.is.null,fecha_nacimiento.gt.${limite}`);
    }

    const consulta = (opciones) => {
      let query = supabase.from('alumnos').select('*', opciones).is('deleted_at', null);
      if (nombre) query = query.ilike('nombre', `%${nombre}%`);
      if (profe) query = query.ilike('profesor_asignado', `%${profe}%`);
      if (sexo) query = query.eq('sexo', sexo);
      if (plan) query = query.ilike('plan', escaparLike(plan));
      // ... y sin fecha de nacimiento no entra en "edad mínima" (> 0)
      if (!isNaN(edadMin) && edadMin > 0) {
        query = query.lte('fecha_nacimiento', hoy.subtract(edadMin, 'year').format('YYYY-MM-DD'));
      }
      if (gruposOr.length === 1) query = query.or(gruposOr[0]);
      if (gruposOr.length > 1) query = query.or(`and(${gruposOr.map(g => `or(${g})`).join(',')})`);
      return query;
    };

    const from = (page - 1) * pageSize;
    const [pagina, general] = await Promise.all([
      consulta({ count: 'exact' }).order('nombre').order('id').range(from, from + pageSize - 1),
      req.query.conTotalGeneral
        ? supabase.from('alumnos').select('id', { count: 'exact', head: true }).is('deleted_at', null)
        : Promise.resolve(null),
    ]);

    let { data, count, error } = pagina;
    // Página fuera de rango: devolver vacía con el total real
    if (error?.code === 'PGRST103') {
      ({ count, error } = await consulta({ count: 'exact', head: true }));
      data = [];
    }
    if (error) throw error;
    if (general?.error) throw general.error;

    res.json({
      data: data.map(mapAlumno),
      total: count ?? 0,
      page,
      pageSize,
      ...(general ? { totalGeneral: general.count ?? 0 } : {}),
    });
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    res.status(500).json({ message: 'Error al obtener los alumnos' });
  }
};

export const addAlumno = async (req, res) => {
  try {
    const alumno = req.body;
    if (!alumno.DNI || !alumno['Nombre'] || !alumno.Plan) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    await insertAlumno(alumno);
    res.status(201).json(alumno);
  } catch (error) {
    console.error('Error al agregar alumno:', error);
    res.status(500).json({ message: error.message || 'Error al agregar el alumno' });
  }
};

export const updateAlumno = async (req, res) => {
  try {
    const dni = req.params.dni;
    const alumnoData = req.body;

    const actualizado = await updateAlumnoByDNI(dni, alumnoData);

    if (actualizado) {
      res.json({ message: 'Alumno actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Alumno no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar alumno:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const deleteAlumno = async (req, res) => {
  try {
    const dni = req.params.dni;

    const eliminado = await removeAlumnoByDNI(dni);

    if (eliminado) {
      res.json({ message: 'Alumno eliminado correctamente' });
    } else {
      res.status(404).json({ message: 'Alumno no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar alumno:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getAlumnoByDNI = async (req, res) => {
  try {
    const dni = req.params.dni;

    const [alumno, planes, pagosDelAlumno] = await Promise.all([
      findAlumnoByDNI(dni),
      listPlanes(),
      listPagosByDNI(dni),
    ]);

    if (!alumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }

    const plan = planes.find(p => p["Plan o Producto"].toUpperCase() === alumno.Plan.toUpperCase());

    pagosDelAlumno.sort((a, b) => {
      return new Date(b["Fecha_de_Pago"].split('/').reverse().join('/')) -
        new Date(a["Fecha_de_Pago"].split('/').reverse().join('/'));
    });

    const alumnoCompleto = {
      ...alumno,
      Precio: plan?.Precio || null,
      Tipo_de_plan: plan?.Tipo || null,
      Pagos: pagosDelAlumno || []
    };

    res.json(alumnoCompleto);
  } catch (error) {
    console.error("Error en getAlumnoByDNI:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


// estadisticas


export const getTopAlumnos = async (req, res) => {
  try {
    const [alumnos, planes] = await Promise.all([listAlumnosParaRanking(), listPlanes()]);

    const planesGimnasio = planes.filter(plan => plan.Tipo == "GIMNASIO");
    const planesClases = planes.filter(plan => plan.Tipo == "CLASE");

    const alumnosConPlanGimnasio = alumnos.filter(alumno => {
      if (!alumno.Plan || typeof alumno.Plan !== 'string') {
        return false;
      }
      return planesGimnasio.some(plan => {
        return plan['Plan o Producto'] === alumno.Plan;
      });
    });

    const alumnosConPlanClases = alumnos.filter(alumno => {
      if (!alumno.Plan || typeof alumno.Plan !== 'string') {
        return false;
      }
      return planesClases.some(plan => {
        return plan['Plan o Producto'] === alumno.Plan;
      });
    });

    const alumnosConPuntosGimnasio = alumnosConPlanGimnasio.map(alumno => ({
      Nombre: alumno.Nombre,
      Plan: alumno.Plan,
      GymCoins: parseInt(alumno.GymCoins || '0', 10),
      DNI: alumno.DNI
    }));

    const alumnosConPuntosClases = alumnosConPlanClases.map(alumno => ({
      Nombre: alumno.Nombre,
      Plan: alumno.Plan,
      GymCoins: parseInt(alumno.GymCoins || '0', 10),
      DNI: alumno.DNI
    }));

    alumnosConPuntosClases.sort((a, b) => b.GymCoins - a.GymCoins);
    alumnosConPuntosGimnasio.sort((a, b) => b.GymCoins - a.GymCoins);

    const top10Gimnasio = alumnosConPuntosGimnasio.slice(0, 10);
    const top10Clases = alumnosConPuntosClases.slice(0, 10);

    res.json({ top10Gimnasio, top10Clases });
  } catch (error) {
    console.error('Error al obtener top alumnos:', error);
    res.status(500).json({ message: 'Error al obtener los mejores alumnos' });
  }
}

export const getPosicionAlumno = async (req, res) => {
  const dni = req.params.dni;
  const [alumnos, planes] = await Promise.all([listAlumnosParaRanking(), listPlanes()]);

  const planesGimnasio = planes.filter(plan => plan.Tipo == "GIMNASIO");
  const planesClases = planes.filter(plan => plan.Tipo == "CLASE");

  const alumnosConPlanGimnasio = alumnos.filter(alumno => {
    if (!alumno.Plan || typeof alumno.Plan !== 'string') {
      return false;
    }
    return planesGimnasio.some(plan => {
      return plan['Plan o Producto'] === alumno.Plan;
    });
  });

  const alumnosConPlanClases = alumnos.filter(alumno => {
    if (!alumno.Plan || typeof alumno.Plan !== 'string') {
      return false;
    }
    return planesClases.some(plan => {
      return plan['Plan o Producto'] === alumno.Plan;
    });
  });

  alumnosConPlanGimnasio.sort((a, b) => (parseInt(b.GymCoins || '0') - parseInt(a.GymCoins || '0')));
  alumnosConPlanClases.sort((a, b) => (parseInt(b.GymCoins || '0') - parseInt(a.GymCoins || '0')));

  const alumno = alumnos.find(al => al.DNI === dni);
  const nombreDelPlan = alumno.Plan;
  
  let posicion;

  if (planesGimnasio.some(planGimnasio => planGimnasio['Plan o Producto'] === nombreDelPlan)) {
    posicion = alumnosConPlanGimnasio.findIndex(al => al.DNI === dni);
  } else {
    posicion = alumnosConPlanClases.findIndex(al => al.DNI === dni);
  }

  res.json({posicion: posicion + 1});
};

export const resetPuntosController = async (req, res) => {
  try {
    await reiniciarPuntosAlumnos();
    res.status(200).json({ message: 'Puntos reiniciados correctamente' });
  } catch (error) {
    console.error('Error en resetPuntosController:', error);
    res.status(500).json({ message: 'Error al reiniciar puntos' });
  }
};