import { SupportedFiatCurrencies } from '@/common/enums';
import { IReturnValue } from '@/common/utils';
import { PricingService } from '@/modules/booking/application/services/pricing.service';
import { Request } from 'express';
import Container from 'typedi';

export class GetBookingPriceController
  implements
    IController<Promise<IReturnValue<CalculatedPrice & { token: string }>>>
{
  handle(
    request: Request
  ): Promise<IReturnValue<CalculatedPrice & { token: string }>> {
    const service = Container.get(PricingService);

    return service.calculateTotalPrice(
      request.body.carId,
      new Date(request.body.startDate),
      new Date(request.body.endDate),
      request?.body?.currency || SupportedFiatCurrencies.USD
    );
  }
}
