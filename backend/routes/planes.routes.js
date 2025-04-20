import { Router } from 'express';
import {
  getPlanes,
  createPlan,
  updatePlanByID,
  deletePlanByID,
  getAumentosPlanes
} from '../controllers/planes.controller.js';

const router = Router();

router.get('/aumentos', getAumentosPlanes)
router.get('/', getPlanes);
router.post('/', createPlan);
router.patch('/:id', updatePlanByID);
router.delete('/:id', deletePlanByID);

export default router;
