import { Router } from "express";
import { getHistorialPuntos } from "../controllers/puntos.controller.js";

const router = Router();

router.get("/:dni", getHistorialPuntos);

export default router;