import { Router } from 'express';
import {
  crearCaja,
  editarCaja,
  eliminarCaja,
  obtenerCaja,
  obtenerCajaPorID
} from '../controllers/caja.controller.js';

const router = Router();

router.post('/', crearCaja);
router.put('/:id', editarCaja);
router.delete('/:id', eliminarCaja);
router.get('/', obtenerCaja);           
router.get('/:id', obtenerCajaPorID);  

export default router;
