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
    getDashboardAlumnos,
    getTopAlumnos,
    getPosicionAlumno,
    resetPuntosController
} from '../controllers/alumnos.controller.js';

const router = Router();

router.get('/estado', getAlumnosEstado);
router.get('/estadisticas/filtros', getEstadisticasAlumnos);
router.get('/estadisticas/edades', getAlumnosPorEdad);
router.get('/planes/distribucion', getDistribucionPlanes);
router.get('/dashboard', getDashboardAlumnos);

router.get('/', getAlumnos);
router.post('/', addAlumno);
router.post('/reiniciar-puntos', resetPuntosController);
router.get('/posicion/:dni', getPosicionAlumno);
router.get('/topAlumnosCoins', getTopAlumnos);


router.put('/:dni', updateAlumno);
router.delete('/:dni', deleteAlumno);
router.get('/:dni', getAlumnoByDNI);


export default router;
