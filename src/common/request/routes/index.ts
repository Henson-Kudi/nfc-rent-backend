import { Router } from 'express';
import authRouter from '@/modules/auth/presentation/routes';
import accountRouter from '@/modules/auth/presentation/routes/account';
import organistionRouter from '@/modules/organisation/presentation/http/routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/account', accountRouter);

router.use('/organisation', organistionRouter)

export default router;
