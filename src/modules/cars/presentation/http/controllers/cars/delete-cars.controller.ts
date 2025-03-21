import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarService } from '@/modules/cars/application/services/car.service';
import { Request } from 'express';
import Container from 'typedi';

export class DeleteCarsController
  implements IController<Promise<IReturnValue<{ affected: number }>>>
{
  handle(request: Request): Promise<IReturnValue<{ affected: number }>> {
    const id = request.query.id;
    if (!id) {
      throw new AppError({
        message: 'Please provide car identifiers',
        statusCode: ResponseCodes.BadRequest,
      });
    }
    if ((!Array.isArray(id) && typeof id !== 'string') || !id?.length) {
      throw new AppError({
        message: 'Invalid brand identifier',
        statusCode: ResponseCodes.BadRequest,
      });
    }
    if (!request.user) {
      throw new AppError({
        message: 'Unauthenticated user',
        statusCode: ResponseCodes.UnAuthorised,
      });
    }

    const carsService = Container.get(CarService);
    return carsService.deleteCars(
      id as string | string[],
      request.user,
      request?.query?.hardDelete === 'true'
    );
  }
}
