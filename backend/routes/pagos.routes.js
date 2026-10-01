import { Router } from 'express';
import {
    addPago,
    updatePago,
    deletePago,
    getPagos,
    getResumenPagos,
} from '../controllers/pagos.controller.js';

const router = Router();

router.get('/', getPagos);
router.get('/resumen', getResumenPagos);

router.post('/', addPago);
router.put('/:id', updatePago);
router.delete('/:id', deletePago);

export default router;
