import { Router } from 'express';
import { getAlumnos, addAlumno, updateAlumno, deleteAlumno, getAlumnoByDNI } from '../controllers/alumnos.controller.js';

const router = Router();

router.get('/', getAlumnos);
router.post('/', addAlumno);
router.put('/:dni', updateAlumno);
router.delete('/:dni', deleteAlumno);
router.get('/:dni', getAlumnoByDNI);

export default router;
