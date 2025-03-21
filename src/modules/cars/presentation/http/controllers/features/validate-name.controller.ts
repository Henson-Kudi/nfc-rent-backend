import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarFeatureService } from '@/modules/cars/application/services/car-feature.service';
import { Request } from 'express';
import Container from 'typedi';

export class ValidateFeatureNameController
  implements IController<Promise<IReturnValue<{ exists: boolean }>>>
{
  handle(request: Request): Promise<IReturnValue<{ exists: boolean }>> {
    if (!request?.query?.name || typeof request?.query?.name !== 'string') {
      throw new AppError({
        message: 'please add valid feature name',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    const FeaturesService = Container.get(CarFeatureService);
    return FeaturesService.validateSlug(request.query?.name);
  }
}
