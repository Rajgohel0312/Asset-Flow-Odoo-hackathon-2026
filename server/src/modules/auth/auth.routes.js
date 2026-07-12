import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../../validators/auth.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

router.use(authenticate);

router.get('/me', authController.me);
router.patch('/change-password', validate(changePasswordSchema), authController.changePassword);

export default router;
