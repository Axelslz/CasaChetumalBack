import { Router } from 'express';
import { getDashboardStats, getPaymentMethodSummary, getAllPaidReservations, getFullDashboardStats } from '../controllers/dashboardController.js';
import { authRequired } from '../middlewares/authMiddleware.js';

const router = Router();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
router.get('/dashboard/stats', authRequired, getDashboardStats);
router.get('/payment-summary', authRequired, getPaymentMethodSummary);
router.get('/paid-reservations', authRequired, getAllPaidReservations);
router.get('/dashboard/full-stats', authRequired, getFullDashboardStats);

export default router;