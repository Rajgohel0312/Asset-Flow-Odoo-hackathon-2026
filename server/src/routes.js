import { Router } from 'express';
import authRouter from './modules/auth/auth.routes.js';
import departmentRouter from './modules/departments/department.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/departments', departmentRouter);

export default router;
