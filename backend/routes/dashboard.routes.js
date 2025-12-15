import express from 'express'
import { getDashboardCompleto } from '../controllers/dashboard.controller.js'
import { getAlumnosFromSheet, getClasesDiariasFromSheet, getEgresosByMesYAnio, getPlanesFromSheet, getTurnosFromSheet } from '../services/googleSheets.js';
import dayjs from 'dayjs';
import supabase from '../db/supabase.js';

const router = express.Router()

router.get('/', getDashboardCompleto)

router.get('/datosBase', async (req, res) => {
  try {
    const fechaParam = req.query.fecha || dayjs().format("DD/MM/YYYY");
    const anio = dayjs(fechaParam, "DD/MM/YYYY").year();
    const mes = dayjs(fechaParam, "DD/MM/YYYY").month() + 1;

    const [
      alumnos,
      planes,
      turnos,
      asistencias,
      egresos
    ] = await Promise.all([
      getAlumnosFromSheet(),
      getPlanesFromSheet(),
      getTurnosFromSheet(fechaParam),
      getClasesDiariasFromSheet(),
      getEgresosByMesYAnio(anio, mes)
    ]);

    res.json({
      alumnos,
      planes,
      turnos,
      asistencias,
      egresos
    });
  } catch (err) {
    console.error("❌ Error interno en /datosBase:", err)
    res.status(500).json({ message: 'Error cargando dashboard', error: err });
  }
});

router.get('/rpc', async (req, res) => {
  try {
    const hoy = dayjs()
    const fecha = req.query.fecha ? dayjs(req.query.fecha) : hoy

    const params = {
      _fecha: fecha.format('YYYY-MM-DD'),
      _mes_cajas: Number(req.query.mesCajas ?? fecha.month() + 1),
      _anio_cajas: Number(req.query.anioCajas ?? fecha.year()),
      _mes_pers: Number(req.query.mesPersonalizados ?? fecha.month() + 1),
      _anio_pers: Number(req.query.anioPersonalizados ?? fecha.year()),
    }

    const { data, error } = await supabase.rpc('rpc_dashboard_gymspace', params)
    if (error) throw error

    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

    return res.json(data)
  } catch (e) {
    console.error('rpc_dashboard_gymspace error:', e)
    return res.status(500).json({ error: 'No se pudo obtener el dashboard (RPC)' })
  }
})

router.get('/facturacion', async (req, res) => {
  try {
    const anio = Number(req.query.anio ?? dayjs().year())

    const { data, error } = await supabase.rpc('rpc_dashboard_gymspace_by_year', {
      selected_year: anio
    })

    if (error) throw error

    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return res.json({ anio, facturacion: data })
  } catch (e) {
    console.error('rpc_dashboard_gymspace_by_year error:', e)
    return res.status(500).json({ error: 'No se pudo obtener la facturación' })
  }
})

router.get("/edades/distribucion", async (req, res) => {
  try {
    const fecha = req.query.fecha ?? new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase.rpc(
      "rpc_edades_por_tipo_plan",
      { _fecha: fecha }
    );

    if (error) {
      console.error("RPC ERROR:", error);
      throw error;
    }

    return res.json(data);

  } catch (err) {
    console.error("Error edades distribucion:", err);
    return res
      .status(500)
      .json({ error: "No se pudo obtener la distribución de edades" });
  }
});

router.get("/asistencias/distribucion", async (req, res) => {
  try {
    const fecha =
      typeof req.query.fecha === "string"
        ? req.query.fecha
        : new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase.rpc(
      "rpc_horarios_por_tipo_plan",
      { _fecha: fecha }
    );

    if (error) {
      console.error("RPC ERROR:", error);
      throw error;
    }

    return res.json(data);
  } catch (e) {
    console.error("Error asistencias distribucion:", e);
    return res
      .status(500)
      .json({ error: "No se pudo obtener la distribución de asistencias" });
  }
});

router.get("/altas-bajas", async (req, res) => {
  try {
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes);

    if (!anio || !mes) {
      return res.status(400).json({
        error: "Debe enviar anio y mes",
      });
    }

    const { data, error } = await supabase.rpc(
      "rpc_altas_bajas_alumnos",
      {
        _anio: anio,
        _mes: mes,
      }
    );

    if (error) {
      console.error("RPC error:", error);
      throw error;
    }

    return res.json(data);
  } catch (e) {
    console.error("Error altas-bajas:", e);
    return res.status(500).json({
      error: "No se pudieron obtener las altas y bajas",
    });
  }
});

router.get("/promedios-asistencias", async (req, res) => {
  try {
    const fecha = req.query.fecha;
    const periodo = (req.query.periodo) || "30d";

    if (!fecha) {
      return res.status(400).json({
        error: "Debe enviar la fecha (YYYY-MM-DD)",
      });
    }

    if (!["30d", "anual"].includes(periodo)) {
      return res.status(400).json({
        error: "Periodo inválido. Use '30d' o 'anual'",
      });
    }

    const { data, error } = await supabase.rpc(
      "rpc_promedio_asistencias_por_plan",
      {
        _fecha: fecha,
        _periodo: periodo,
      }
    );

    if (error) {
      console.error("RPC error promedios:", error);
      throw error;
    }

    return res.json(data);
  } catch (e) {
    console.error("Error promedios asistencias:", e);
    return res.status(500).json({
      error: "No se pudieron obtener los promedios de asistencias",
    });
  }
});

router.get("/ingresos-mensuales", async (req, res) => {
  try {
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes);

    if (!anio || !mes) {
      return res.status(400).json({
        error: "Debe enviar anio y mes",
      });
    }

    const { data, error } = await supabase.rpc(
      "rpc_ingresos_mensuales_desglosados",
      {
        _anio: anio,
        _mes: mes,
      }
    );

    if (error) {
      console.error("RPC ingresos mensuales error:", error);
      throw error;
    }

    return res.json(data ?? []);
  } catch (e) {
    console.error("Error ingresos mensuales:", e);
    return res.status(500).json({
      error: "No se pudieron obtener los ingresos del mes",
    });
  }
});

export default router