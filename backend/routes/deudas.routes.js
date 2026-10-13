import express from "express"
import {
  getDeudas,
  createDeuda,
  updateDeuda,
  deleteDeuda,
  getDeudaAlumno,
  getDeudasPorMes,
  searchDeudas,
} from "../controllers/deudas.controller.js"

const router = express.Router()

router.get("/", getDeudas)
router.post("/", createDeuda)
router.put("/:id", updateDeuda)
router.delete("/:id", deleteDeuda)

router.get("/search", searchDeudas)
router.get("/mes", getDeudasPorMes)
router.get("/alumno/:dni", getDeudaAlumno)

export default router