import { Router } from 'express';
import {
  getPlanes,
  createPlan,
  updatePlanByID,
  deletePlanByID
} from '../controllers/planes.controller.js';

const router = Router();

router.get('/', getPlanes);
router.post('/', createPlan);
router.patch('/:id', updatePlanByID);
router.delete('/:id', deletePlanByID);

export default router;
