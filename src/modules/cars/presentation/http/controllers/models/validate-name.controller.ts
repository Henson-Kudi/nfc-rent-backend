import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarModelService } from '@/modules/cars/application/services/car-model.service';
import { Request } from 'express';
import Container from 'typedi';

export class ValidateModelNameController
  implements IController<Promise<IReturnValue<{ exists: boolean }>>>
{
  handle(request: Request): Promise<IReturnValue<{ exists: boolean }>> {
    if (!request?.query?.name || typeof request?.query?.name !== 'string') {
      throw new AppError({
        message: 'please add valid model name',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    const ModelsService = Container.get(CarModelService);
    return ModelsService.validateSlug(request.query?.name);
  }
}
