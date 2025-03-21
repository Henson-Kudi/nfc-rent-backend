import { IReturnValue } from '@/common/utils';
import { CarModelService } from '@/modules/cars/application/services/car-model.service';
import { CarModelDto } from '@/common/dtos';
import { Request } from 'express';
import Container from 'typedi';

export class CreateModelsController
  implements IController<Promise<IReturnValue<CarModelDto>>>
{
  handle(request: Request): Promise<IReturnValue<CarModelDto>> {
    const modelsService = Container.get(CarModelService);
    return modelsService.createModel(request.body);
  }
}
