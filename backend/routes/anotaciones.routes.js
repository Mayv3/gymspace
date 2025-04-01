import { Router } from 'express';
import {
  getAnotaciones,
  createAnotacion,
  updateAnotacionByID,
  deleteAnotacionByID
} from '../controllers/anotaciones.controller.js';

const router = Router();

router.get('/', getAnotaciones);
router.post('/', createAnotacion);
router.put('/:id', updateAnotacionByID);
router.delete('/:id', deleteAnotacionByID);

export default router;
