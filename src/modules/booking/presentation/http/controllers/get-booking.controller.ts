import { BookingDto } from '@/common/dtos';
import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { BookingService } from '@/modules/booking/application/services/booking.service';
import { Request } from 'express';
import Container from 'typedi';

export class GetBookingController
  implements IController<Promise<IReturnValue<BookingDto>>>
{
  handle(request: Request): Promise<IReturnValue<BookingDto>> {
    if (!request.user) {
      throw new AppError({
        message: 'Unauthorised',
        statusCode: ResponseCodes.UnAuthorised,
      });
    }
    const service = Container.get(BookingService);

    return service.getBooking(
      request.params.id,
      request.query?.locale as string as SupportedLocales
    );
  }
}
