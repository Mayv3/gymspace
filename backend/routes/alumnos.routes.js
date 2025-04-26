import { Router } from 'express';
import {
    getAlumnos,
    addAlumno,
    updateAlumno,
    deleteAlumno,
    getAlumnoByDNI,
    getEstadisticasAlumnos,
    getAlumnosEstado,
    getAlumnosPorEdad,
    getDistribucionPlanes,
    getDashboardAlumnos
} from '../controllers/alumnos.controller.js';

const router = Router();
router.get('/estado', getAlumnosEstado);
router.get('/estadisticas/filtros', getEstadisticasAlumnos);
router.get('/estadisticas/edades', getAlumnosPorEdad);
router.get('/planes/distribucion', getDistribucionPlanes);
router.get('/dashboard', getDashboardAlumnos);
router.get('/', getAlumnos);
router.post('/', addAlumno);
router.put('/:dni', updateAlumno);
router.delete('/:dni', deleteAlumno);
router.get('/:dni', getAlumnoByDNI);


export default router;
