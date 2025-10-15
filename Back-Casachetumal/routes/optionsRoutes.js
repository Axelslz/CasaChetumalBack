import express from 'express';
import { getOptions, getCarouselImages } from '../controllers/optionsController.js';

const router = express.Router();

router.get('/options', getOptions);
router.get('/carousel-images', getCarouselImages);

export default router;