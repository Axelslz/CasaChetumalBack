import { Router } from 'express';
import { getEventsForMonth } from '../controllers/calendarController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/calendar/events',  authMiddleware, getEventsForMonth);

export default router;