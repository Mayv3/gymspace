import express from "express";
import {
    getClases,
    getClasesConEstado,
    updateClaseElClubByID,
} from "../controllers/clasesElClub.controller.js";



const router = express.Router();
router.get("/", getClases);
router.get("/estado/:dni", getClasesConEstado);
router.put("/:id", updateClaseElClubByID);

export default router;
