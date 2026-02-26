import express from "express";
import {
    getClases,
    getClasesConEstado,
    updateClaseElClubByID,
    createClase,
    updateClaseProperties,
    deleteClase,
} from "../controllers/clasesElClub.controller.js";



const router = express.Router();
router.get("/", getClases);
router.get("/estado/:dni", getClasesConEstado);
router.post("/", createClase);
router.put("/:id", updateClaseElClubByID);
router.patch("/:id", updateClaseProperties);
router.delete("/:id", deleteClase);

export default router;
