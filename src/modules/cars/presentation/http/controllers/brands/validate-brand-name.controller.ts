import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarBrandService } from '@/modules/cars/application/services/car-brand.service';
import { Request } from 'express';
import Container from 'typedi';

export class ValidateBrandNameController
  implements IController<Promise<IReturnValue<{ exists: boolean }>>>
{
  handle(request: Request): Promise<IReturnValue<{ exists: boolean }>> {
    if (!request?.query?.name || typeof request?.query?.name !== 'string') {
      throw new AppError({
        message: 'please add valid brand name',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    const brandsService = Container.get(CarBrandService);
    return brandsService.validateSlug(request.query?.name);
  }
}
