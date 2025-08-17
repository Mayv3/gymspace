import express from 'express'
import { getDashboardCompleto } from '../controllers/dashboard.controller.js'
import { getAlumnosFromSheet, getClasesDiariasFromSheet, getEgresosByMesYAnio, getPlanesFromSheet, getTurnosFromSheet } from '../services/googleSheets.js';
import dayjs from 'dayjs';

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

export default router