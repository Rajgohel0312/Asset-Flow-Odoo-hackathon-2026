import { Router } from 'express';
import authRouter from './modules/auth/auth.routes.js';
import departmentRouter from './modules/departments/department.routes.js';
import assetsRouter from './modules/assets/asset.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/departments', departmentRouter);
router.use('/assets', assetsRouter);

export default router;
