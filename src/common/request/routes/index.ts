import { Router } from 'express';
import authRouter from '@/modules/auth/presentation/routes';
import accountRouter from '@/modules/auth/presentation/routes/account';

const router = Router();

router.use('/auth', authRouter);
router.use('/account', accountRouter);

export default router;
