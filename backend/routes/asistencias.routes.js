import { Router } from 'express';
import { getAsistenciasPorDNI, getAsistenciasPorHora, getPromedios, getPromediosRangosHorarios, registrarAsistencia, verificarAlumno } from '../controllers/asistencias.controller.js';

const router = Router();

router.post('/', registrarAsistencia);
router.post("/verificar-alumno", verificarAlumno);
router.get('/promedios', getPromedios);
router.get('/por-hora/:dia/:mes/:anio', getAsistenciasPorHora);
router.get('/promedios-rangos/:dia/:mes/:anio', getPromediosRangosHorarios);

router.get('/:dni', getAsistenciasPorDNI);

export default router;
