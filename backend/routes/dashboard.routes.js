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

export default router