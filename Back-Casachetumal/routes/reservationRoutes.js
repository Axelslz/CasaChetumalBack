import { Router } from 'express';
import express from 'express';
import { createReservation, getReservations, getReservationById, updateReservationStatus, confirmPayment, calculateTotal, getOccupiedDates } from '../controllers/reservationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; 
import upload from '../middlewares/uploadMiddleware.js';

const router = Router();

router.post('/calculate-total', express.json(), calculateTotal);
router.get('/occupied-dates', getOccupiedDates);
router.post('/', upload.fields([ { name: 'idPhoto', maxCount: 1 }, { name: 'receipt', maxCount: 1 } ]), createReservation);
router.get('/:id', getReservationById);

router.get('/', authMiddleware, getReservations); 
router.put('/:id/status', authMiddleware, express.json(), updateReservationStatus); 
router.put('/:id/confirm-payment', authMiddleware, express.json(), confirmPayment); 
 
export default router;
