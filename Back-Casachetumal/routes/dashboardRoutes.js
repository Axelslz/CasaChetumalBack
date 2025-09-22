import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authRequired } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/dashboard/stats', authRequired, getDashboardStats);

export default router;