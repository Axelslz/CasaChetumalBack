import { Router } from 'express';
import { createReservation, getReservations, getReservationById, updateReservationStatus, confirmPayment, calculateTotal, getOccupiedDates } from '../controllers/reservationController.js';
import { authRequired } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = Router();

router.post('/calculate-total', calculateTotal);

router.post('/', upload.single('idPhoto'), createReservation); 
router.get('/:id', getReservationById);

// --- Rutas Admin ---
router.get('/', authRequired, getReservations); 
router.put('/:id/status', authRequired, updateReservationStatus); 
router.put('/:id/confirm-payment', authRequired, confirmPayment); 
router.get('/occupied-dates', getOccupiedDates);

export default router;

