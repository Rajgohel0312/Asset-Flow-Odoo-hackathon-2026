import { Router } from 'express';
import * as bookingController from './booking.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { createBookingSchema } from '../../validators/booking.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', bookingController.getAll);
router.get('/:id', bookingController.getById);

router.post('/', validate(createBookingSchema), bookingController.create);
router.patch('/:id/cancel', bookingController.cancel);

export default router;
