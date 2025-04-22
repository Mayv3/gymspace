import { Router } from 'express';
import { getTurnos, createTurno, updateTurno, deleteTurno } from '../controllers/turnos.controller.js';

const router = Router();

router.get('/', getTurnos);
router.post('/', createTurno);
router.put('/:id', updateTurno);
router.delete('/:id', deleteTurno);

export default router;
