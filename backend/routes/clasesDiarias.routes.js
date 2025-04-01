import { Router } from 'express';
import { registrarClaseDiaria, editarClaseDiaria, eliminarClaseDiaria, filtrarClasesDiarias } from '../controllers/clasesDiarias.controller.js';

const router = Router();

router.post('/', registrarClaseDiaria);
router.put('/:id', editarClaseDiaria);
router.delete('/:id', eliminarClaseDiaria);
router.get('/', filtrarClasesDiarias);

export default router;
