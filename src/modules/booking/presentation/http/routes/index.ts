import authenticateRequest from '@/common/middleware/authenticate-request';
import requestHandler from '@/common/request/adapter';
import { Router } from 'express';
import { CreateBookingController } from '../controllers/create-booking.controller';
import { GetBookingsController } from '../controllers/list-bookings.controller';
import { GetBookingController } from '../controllers/get-booking.controller';
import { CancelBookingController } from '../controllers/cancel-booking.controller';
import { ConfirmBookingController } from '../controllers/confirm-booking.controller';
import { CheckCarAvailabilityController } from '../controllers/check-availability.controller';
import { GetBookingPriceController } from '../controllers/get-price.controller';
import { GetUserBookingsController } from '../controllers/get-user-bookings.controller';
import { GetCarBookingsController } from '../controllers/get-car-bookings.controller';
import { CryptoPaymentWebhookController } from '../controllers/crypto-payment-webhook.controller';
import { FiatPaymentWebhookController } from '../controllers/fiat-pyment-webhook.controller';

const bookingsRouter = Router();

// This route should not be authenticated since website would use it to calculate prices as well
bookingsRouter.post(
  '/estimate-price',
  requestHandler(new GetBookingPriceController())
);

bookingsRouter.use(authenticateRequest());

bookingsRouter
  .route('/')
  .post(requestHandler(new CreateBookingController()))
  .get(requestHandler(new GetBookingsController())); // this get request should be used by admin site only. Need to add guard for permissions

// Webhook Routes
bookingsRouter.post(
  '/webhooks/crypo',
  requestHandler(new CryptoPaymentWebhookController())
);
bookingsRouter.post(
  '/webhooks/fiat',
  requestHandler(new FiatPaymentWebhookController())
);

bookingsRouter
  .route('/user')
  .get(requestHandler(new GetUserBookingsController())); // only gets user booking
bookingsRouter
  .route('/car/:id')
  .get(requestHandler(new GetCarBookingsController())); // only gets car booking. Add permissions guard here

bookingsRouter
  .route('/availability/:carId')
  .get(requestHandler(new CheckCarAvailabilityController()));

bookingsRouter
  .route('/:id/confirm')
  .get(requestHandler(new ConfirmBookingController()));
bookingsRouter
  .route('/:id/cancel')
  .get(requestHandler(new CancelBookingController()));
bookingsRouter.route('/:id').get(requestHandler(new GetBookingController()));

export default bookingsRouter;
