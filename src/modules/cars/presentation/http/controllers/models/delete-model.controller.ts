import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarModelService } from '@/modules/cars/application/services/car-model.service';
import { Request } from 'express';
import Container from 'typedi';

export class DeleteCarModelController
  implements IController<Promise<IReturnValue<{ affected: number }>>>
{
  handle(request: Request): Promise<IReturnValue<{ affected: number }>> {
    const id = request.params.id;
    if (!id) {
      throw new AppError({
        message: 'Invalid model identifier',
        statusCode: ResponseCodes.BadRequest,
      });
    }
    if (!request.user) {
      throw new AppError({
        message: 'Unauthenticated user',
        statusCode: ResponseCodes.UnAuthorised,
      });
    }

    const ModelsService = Container.get(CarModelService);
    return ModelsService.deleteModels(
      id,
      request.user,
      request?.query?.hardDelete === 'true'
    );
  }
}
