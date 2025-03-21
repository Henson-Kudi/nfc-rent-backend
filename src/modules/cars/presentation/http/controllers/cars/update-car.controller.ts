import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarService } from '@/modules/cars/application/services/car.service';
import { CarDto } from '@/common/dtos';
import { Request } from 'express';
import Container from 'typedi';

export class UpdateCarController
  implements IController<Promise<IReturnValue<CarDto>>>
{
  handle(request: Request): Promise<IReturnValue<CarDto>> {
    const id = request.params.id;
    if (!id) {
      throw new AppError({
        message: 'Invalid car identifier',
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
    return carsService.updateCar(id, request.body, request.user);
  }
}
