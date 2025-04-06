import { Router } from 'express';
import { getAsistenciasPorDNI, registrarAsistencia } from '../controllers/asistencias.controller.js';

const router = Router();

router.post('/', registrarAsistencia);
router.get('/:dni', getAsistenciasPorDNI);

export default router;
