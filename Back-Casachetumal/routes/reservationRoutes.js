import { Router } from 'express';
import { createReservation, getReservations, getReservationById,updateReservationStatus, confirmPayment } from '../controllers/reservationController.js';
import { authRequired } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = Router();

router.post('/reservations', upload.single('idPhoto'), createReservation);
router.get('/reservations/:id', getReservationById);

// --- Rutas Admin ---
router.get('/reservations', authRequired, getReservations);
router.put('/reservations/:id/status', authRequired, updateReservationStatus);

router.put('/reservations/:id/confirm-payment', authRequired, confirmPayment);

export default router;