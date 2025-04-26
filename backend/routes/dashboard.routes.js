import express from 'express'
import { getDashboardCompleto } from '../controllers/dashboard.controller.js'

const router = express.Router()

router.get('/', getDashboardCompleto)

export default router