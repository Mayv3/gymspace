import { Router } from 'express';
import {
  crearCaja,
  editarCaja,
  eliminarCaja,
  obtenerCaja,
  obtenerCajaPorID,
  obtenerCajaAbiertaPorTurno,
  getCajasPorMes
} from '../controllers/caja.controller.js';

const router = Router();

router.post('/', crearCaja);
router.put('/:id', editarCaja);
router.delete('/:id', eliminarCaja);
router.get('/', obtenerCaja);           
router.get('/:id', obtenerCajaPorID);  
router.get('/abierta/:turno', obtenerCajaAbiertaPorTurno);
router.get("/mes", getCajasPorMes);

export default router;
