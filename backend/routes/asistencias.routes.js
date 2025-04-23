import { Router } from 'express';
import { getAsistenciasPorDNI, getAsistenciasPorHora, getPromediosRangosHorarios, registrarAsistencia } from '../controllers/asistencias.controller.js';

const router = Router();

router.post('/', registrarAsistencia);
router.get('/:dni', getAsistenciasPorDNI);
router.get('/por-hora/:dia/:mes/:anio', getAsistenciasPorHora);
router.get('/promedios-rangos/:dia/:mes/:anio', getPromediosRangosHorarios);

export default router;
