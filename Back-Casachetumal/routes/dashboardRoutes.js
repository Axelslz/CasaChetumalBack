import { Router } from 'express';
import { getDashboardStats, getPaymentMethodSummary, getAllPaidReservations, getFullDashboardStats } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
router.get('/dashboard/stats',  authMiddleware, getDashboardStats);
router.get('/payment-summary',  authMiddleware, getPaymentMethodSummary);
router.get('/paid-reservations', authMiddleware, getAllPaidReservations);
router.get('/dashboard/full-stats', authMiddleware, getFullDashboardStats);

export default router;