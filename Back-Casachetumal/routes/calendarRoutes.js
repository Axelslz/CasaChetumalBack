import { Router } from 'express';
import { getEventsForMonth } from '../controllers/calendarController.js';
import { authRequired } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/calendar/events', authRequired, getEventsForMonth);

export default router;