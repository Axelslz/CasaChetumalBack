import { Router } from 'express';
import { getOptions } from '../controllers/optionsController.js';

const router = Router();

router.get('/options', getOptions);

export default router;