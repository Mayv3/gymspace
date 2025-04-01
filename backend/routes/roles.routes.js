import { Router } from 'express';
import { getRolPorDNI } from '../controllers/roles.controller.js';

const router = Router();

router.get('/:dni', getRolPorDNI);

export default router;
