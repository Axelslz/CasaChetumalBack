import { Router } from 'express';
import express from 'express';
import { createReservation, getReservations, getReservationById, updateReservationStatus, confirmPayment, calculateTotal, getOccupiedDates } from '../controllers/reservationController.js';
import { authRequired } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = Router();

router.post('/calculate-total', express.json(), calculateTotal);
router.get('/occupied-dates', getOccupiedDates);
router.post('/', upload.fields([ { name: 'idPhoto', maxCount: 1 }, { name: 'receipt', maxCount: 1 } ]), createReservation);
router.get('/:id', getReservationById);

router.get('/', authRequired, getReservations); 
router.put('/:id/status', authRequired, express.json(), updateReservationStatus); 
router.put('/:id/confirm-payment', authRequired, express.json(), confirmPayment); 
 
export default router;
