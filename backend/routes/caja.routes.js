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

router.get("/mes", getCajasPorMes);
router.get("/abierta/:turno", obtenerCajaAbiertaPorTurno);

router.get("/:id", obtenerCajaPorID);

router.get("/", obtenerCaja);

router.post("/", crearCaja);
router.put("/:id", editarCaja);
router.delete("/:id", eliminarCaja);

export default router;
