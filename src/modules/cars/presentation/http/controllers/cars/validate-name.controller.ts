import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarService } from '@/modules/cars/application/services/car.service';
import { Request } from 'express';
import Container from 'typedi';

export class ValidateCarNameController
  implements IController<Promise<IReturnValue<{ exists: boolean }>>>
{
  handle(request: Request): Promise<IReturnValue<{ exists: boolean }>> {
    if (!request?.query?.name || typeof request?.query?.name !== 'string') {
      throw new AppError({
        message: 'please add valid car name',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    const CarsService = Container.get(CarService);
    return CarsService.validateSlug(request.query?.name);
  }
}
