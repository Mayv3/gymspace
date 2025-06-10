import {
  getAlumnosFromSheet,
  appendAlumnoToSheet,
  updateAlumnoByDNI,
  deleteAlumnoByDNI,
  getPlanesFromSheet,
  getPagosFromSheet,
  reiniciarPuntosAlumnos,

} from '../services/googleSheets.js';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js'
dayjs.extend(isSameOrAfter)

let cachedAlumnos = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 1000;

export const getAlumnos = async (req, res) => {
  const ahora = Date.now();
  if (cachedAlumnos && ahora - lastFetchTime < CACHE_DURATION_MS) {
    console.log("🧠 Alumnos desde caché");
    return res.json(cachedAlumnos);
  }
  try {
    console.log("📥 Alumnos desde Google Sheets");
    const alumnos = await getAlumnosFromSheet();
    cachedAlumnos = alumnos;
    lastFetchTime = ahora;
    res.json(alumnos);
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

    await appendAlumnoToSheet(alumno);
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

    const eliminado = await deleteAlumnoByDNI(dni);

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

    const alumnos = await getAlumnosFromSheet();
    const alumno = alumnos.find(a => a.DNI === dni);

    if (!alumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }

    const planes = await getPlanesFromSheet();
    const plan = planes.find(p => p["Plan o Producto"].toUpperCase() === alumno.Plan.toUpperCase());

    const pagos = await getPagosFromSheet();
    const pagosDelAlumno = pagos.filter(pago => pago["Socio DNI"] === dni);

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

export const getEstadisticasAlumnos = async (req, res) => {
  try {
    const alumnos = await getAlumnosFromSheet();
    const { sexo, profe, plan, edadMin, edadMax } = req.query;

    const hoy = dayjs();

    const filtrados = alumnos.filter(alumno => {
      const cumpleSexo = !sexo || alumno.Sexo?.toLowerCase() === sexo.toLowerCase();
      const cumpleProfe = !profe || alumno.Profesor_asignado?.toLowerCase() === profe.toLowerCase();
      const cumplePlan = !plan || alumno.Plan?.toLowerCase() === plan.toLowerCase();

      let cumpleEdad = true;
      if (edadMin || edadMax) {
        const fechaNac = dayjs(alumno.Fecha_nacimiento, ['D/M/YYYY', 'DD/MM/YYYY'], true);
        if (fechaNac.isValid()) {
          const edad = hoy.diff(fechaNac, 'year');
          cumpleEdad = (!edadMin || edad >= parseInt(edadMin)) && (!edadMax || edad <= parseInt(edadMax));
        } else {
          cumpleEdad = false;
        }
      }

      return cumpleSexo && cumpleProfe && cumplePlan && cumpleEdad;
    });

    res.json({
      cantidad_total: alumnos.length,
      cantidad_filtrada: filtrados.length,
      alumnos: filtrados,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de alumnos:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

export const getAlumnosEstado = async (req, res) => {
  try {
    const alumnos = await getAlumnosFromSheet();
    const hoy = dayjs();

    let activos = 0;
    let vencidos = 0;

    for (const alumno of alumnos) {
      const fechaStr = (alumno.Fecha_vencimiento || "").trim();
      const fechaVenc = dayjs(fechaStr, ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);

      const clasesPagadas = Number(alumno.Clases_pagadas || 0);
      const clasesRealizadas = Number(alumno.Clases_realizadas || 0);

      const vencidoPorFecha = !fechaVenc.isValid() || fechaVenc.isSameOrBefore(hoy, 'day');
      const vencidoPorClases = clasesPagadas > 0 && clasesRealizadas >= clasesPagadas;

      if (vencidoPorFecha || vencidoPorClases) {
        vencidos++;
      } else {
        activos++;
      }
    }

    res.json({ activos, vencidos });
  } catch (error) {
    console.error('Error al calcular alumnos activos/vencidos:', error);
    res.status(500).json({ message: 'Error al calcular alumnos activos/vencidos' });
  }
};

export const getAlumnosPorEdad = async (req, res) => {
  try {
    const alumnos = await getAlumnosFromSheet();
    const hoy = dayjs();
    const edades = {};

    for (const alumno of alumnos) {
      const fechaNac = dayjs(alumno.Fecha_nacimiento, ['D/M/YYYY', 'DD/MM/YYYY'], true);
      if (!fechaNac.isValid()) continue;

      const edad = hoy.diff(fechaNac, 'year');

      if (edades[edad]) {
        edades[edad]++;
      } else {
        edades[edad] = 1;
      }
    }

    res.json(edades);
  } catch (error) {
    console.error('Error al calcular distribución por edad:', error);
    res.status(500).json({ message: 'Error al calcular distribución por edad' });
  }
};

export const getDistribucionPlanes = async (req, res) => {
  try {
    const alumnos = await getAlumnosFromSheet();
    const conteoPlanes = {};

    for (const alumno of alumnos) {
      const plan = alumno.Plan?.trim();
      if (!plan) continue;

      if (!conteoPlanes[plan]) {
        conteoPlanes[plan] = 1;
      } else {
        conteoPlanes[plan]++;
      }
    }

    res.json(conteoPlanes);
  } catch (error) {
    console.error("Error al obtener distribución de planes:", error);
    res.status(500).json({ message: "Error al obtener distribución de planes" });
  }
};

export const getDashboardAlumnos = async (req, res) => {
  try {
    const alumnos = await getAlumnosFromSheet()
    const planesBD = await getPlanesFromSheet()
    const hoy = dayjs()

    let activos = 0
    let vencidos = 0
    let abandonos = 0
    const edades = {}
    const planesConteo = {}

    const planesBDMap = {}
    for (const p of planesBD) {
      const nombre = (p["Plan o Producto"] || "").trim().toUpperCase()
      planesBDMap[nombre] = p.Tipo?.trim().toUpperCase() || "OTRO"
    }

    for (const alumno of alumnos) {
      const fechaStr = (alumno.Fecha_vencimiento || "").trim()
      const fechaVenc = dayjs(fechaStr, ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true)
      const clasesPagadas = Number(alumno.Clases_pagadas || 0)
      const clasesRealizadas = Number(alumno.Clases_realizadas || 0)

      const tieneVencimiento = fechaVenc.isValid()
      const vencidoPorFecha = tieneVencimiento && fechaVenc.isBefore(hoy, 'day')
      const vencidoPorClases = clasesPagadas > 0 && clasesRealizadas >= clasesPagadas
      const diasDesdeVencimiento = tieneVencimiento ? hoy.diff(fechaVenc, 'day') : 0

      if (vencidoPorFecha || vencidoPorClases) {
        if (diasDesdeVencimiento > 30) {
          abandonos++
        } else {
          vencidos++
        }
      } else {
        activos++
      }

      const fechaNac = dayjs(alumno.Fecha_nacimiento, ['D/M/YYYY', 'DD/MM/YYYY'], true)
      if (fechaNac.isValid()) {
        const edad = hoy.diff(fechaNac, 'year')
        edades[edad] = (edades[edad] || 0) + 1
      }

      const planNombre = (alumno.Plan || "").trim().toUpperCase()
      const tipo = planesBDMap[planNombre] || "OTRO"
      const key = `${planNombre}__${tipo}`

      planesConteo[key] = (planesConteo[key] || 0) + 1
    }

    const planes = Object.entries(planesConteo).map(([key, cantidad]) => {
      const [plan, tipo] = key.split("__")
      return { plan, tipo, cantidad }
    })

    res.json({
      estado: { activos, vencidos, abandonos },
      edades,
      planes
    })
  } catch (error) {
    console.error('Error en dashboard alumnos:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const getTopAlumnos = async (req, res) => {
  try {
    const alumnos = await getAlumnosFromSheet();
    const planes = await getPlanesFromSheet();

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
  const alumnos = await getAlumnosFromSheet();
  const planes = await getPlanesFromSheet();

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