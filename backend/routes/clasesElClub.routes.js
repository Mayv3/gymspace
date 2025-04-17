import { Router } from 'express'
import { obtenerClasesElClub, updateClaseTableroByID } from '../controllers/clasesElClub.controller.js'

const router = Router()

router.get('/', obtenerClasesElClub)
router.put('/:id', updateClaseTableroByID)

export default router
