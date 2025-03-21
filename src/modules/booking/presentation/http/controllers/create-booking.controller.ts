import { BookingDto, PaymentDto } from '@/common/dtos';
import { ResponseCodes, SupportedCurrencies } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { BookingService } from '@/modules/booking/application/services/booking.service';
import { Request } from 'express';
import Stripe from 'stripe';
import Container from 'typedi';

export class CreateBookingController
  implements
    IController<
      Promise<
        IReturnValue<{
          booking: BookingDto;
          payment: PaymentDto;
          session:
            | Stripe.Response<Stripe.Checkout.Session>
            | {
                address: string;
                amount: string;
                currency: SupportedCurrencies;
                instructions: string;
              };
          paymentMethod: 'FIAT' | 'CRYPTO';
        }>
      >
    >
{
  handle(request: Request): Promise<
    IReturnValue<{
      booking: BookingDto;
      payment: PaymentDto;
      session:
        | Stripe.Response<Stripe.Checkout.Session>
        | {
            address: string;
            amount: string;
            currency: SupportedCurrencies;
            instructions: string;
          };
      paymentMethod: 'FIAT' | 'CRYPTO';
    }>
  > {
    if (!request.user) {
      throw new AppError({
        message: 'Unauthorised',
        statusCode: ResponseCodes.UnAuthorised,
      });
    }
    const service = Container.get(BookingService);

    return service.createBooking(request.body, request.user);
  }
}
