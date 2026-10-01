import { Router } from 'express';
import { registrarAsistencia, verificarAlumno } from '../controllers/asistencias.controller.js';

const router = Router();

router.post('/', registrarAsistencia);
router.post("/verificar-alumno", verificarAlumno);


export default router;
