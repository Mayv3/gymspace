import { Router } from 'express';
import {
    getAlumnos,
    addAlumno,
    updateAlumno,
    deleteAlumno,
    getAlumnoByDNI,
    getTopAlumnos,
    getPosicionAlumno,
    resetPuntosController
} from '../controllers/alumnos.controller.js';

const router = Router();


router.get('/', getAlumnos);
router.post('/', addAlumno);
router.post('/reiniciar-puntos', resetPuntosController);
router.get('/posicion/:dni', getPosicionAlumno);
router.get('/topAlumnosCoins', getTopAlumnos);


router.put('/:dni', updateAlumno);
router.delete('/:dni', deleteAlumno);
router.get('/:dni', getAlumnoByDNI);


export default router;
