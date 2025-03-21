import { IReturnValueWithPagination } from '@/common/utils';
import { CarService } from '@/modules/cars/application/services/car.service';
import { CarDto } from '@/common/dtos';
import { Request } from 'express';
import Container from 'typedi';

export class GetCarsController
  implements IController<Promise<IReturnValueWithPagination<CarDto>>>
{
  handle(request: Request): Promise<IReturnValueWithPagination<CarDto>> {
    const carsService = Container.get(CarService);
    return carsService.listCars(request.query as GetCarsFilter);
  }
}
