import { Router } from 'express';
import {
    getPagosPorDNI,
    getTodosLosPagos,
    getPagosPorMes,
    addPago,
    getFacturacionPorMes,
    getFacturacionPorMetodo,
    getFacturacionPorMetodoYMes,
    updatePago,
    deletePago,
    getPagosPorFechaYTurno,
    getPagosFiltrados,
    getFacturacionPorTipoYMes,
    getFacturacionAnual,
    getPagosUltimaSemana,
    getPagos,
} from '../controllers/pagos.controller.js';

const router = Router();

router.get('/', getPagos);
router.get('/mes/:numeroMes', getPagosPorMes);
router.get('/:dni', getPagosPorDNI); // 
router.get('/facturacion/mes/:numeroMes', getFacturacionPorMes);
router.get('/facturacion/metodo', getFacturacionPorMetodo);
router.get('/facturacion/metodo/mes/:numeroMes', getFacturacionPorMetodoYMes);
router.get('/fecha/:dia-:mes-:anio/:turno', getPagosPorFechaYTurno);
router.get('/facturacion/tipo/:mes/:anio', getFacturacionPorTipoYMes);
router.get('/facturacion/anual', getFacturacionAnual)
router.get("/ultima-semana", getPagosUltimaSemana);

router.post('/', addPago);
router.put('/:id', updatePago);
router.delete('/:id', deletePago);

export default router;
