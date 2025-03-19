import { Router } from 'express';
import authRouter from '@/modules/auth/presentation/routes';
import accountRouter from '@/modules/auth/presentation/routes/account';
import carsRouter from '@/modules/cars/presentation/http/routes';
import bookingsRouter from '@/modules/booking/presentation/http/routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/account', accountRouter);

router.use('/cars', carsRouter);
router.use('/bookings', bookingsRouter);

export default router;
