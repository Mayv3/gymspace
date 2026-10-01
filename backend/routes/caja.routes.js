import { Router } from 'express';
import {
  crearCaja,
  editarCaja,
  eliminarCaja,
  obtenerCaja,
  obtenerCajaAbiertaPorTurno,
} from '../controllers/caja.controller.js';

const router = Router();

router.get("/abierta/:turno", obtenerCajaAbiertaPorTurno);


router.get("/", obtenerCaja);

router.post("/", crearCaja);
router.put("/:id", editarCaja);
router.delete("/:id", eliminarCaja);

export default router;
