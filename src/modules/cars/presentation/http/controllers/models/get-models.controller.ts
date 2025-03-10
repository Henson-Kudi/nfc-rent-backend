import { IReturnValueWithPagination } from '@/common/utils';
import { CarModelService } from '@/modules/cars/application/services/car-model.service';
import { CarModelDto } from '@/common/dtos';
import { Request } from 'express';
import Container from 'typedi';

export class GetModelsController
  implements IController<Promise<IReturnValueWithPagination<CarModelDto>>> {
  handle(request: Request): Promise<IReturnValueWithPagination<CarModelDto>> {
    const modelsService = Container.get(CarModelService);
    return modelsService.listModels(request.query);
  }
}
