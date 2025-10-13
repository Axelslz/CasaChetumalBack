import { Router } from 'express';
import { createReservation, getReservations, getReservationById, updateReservationStatus, confirmPayment, calculateTotal, getOccupiedDates } from '../controllers/reservationController.js';
import { authRequired } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = Router();

router.post('/calculate-total', calculateTotal);
router.get('/occupied-dates', getOccupiedDates);
router.post('/', upload.single('idPhoto'), createReservation); -
router.get('/:id', getReservationById);

router.get('/', authRequired, getReservations); 
router.put('/:id/status', authRequired, updateReservationStatus); 
router.put('/:id/confirm-payment', authRequired, confirmPayment); 

export default router;
