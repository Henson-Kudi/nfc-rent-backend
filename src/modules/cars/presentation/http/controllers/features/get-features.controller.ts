import { IReturnValueWithPagination } from '@/common/utils';
import { CarFeatureService } from '@/modules/cars/application/services/car-feature.service';
import { CarFeatureDto } from '@/common/dtos';
import { Request } from 'express';
import Container from 'typedi';

export class GetFeaturesController
  implements IController<Promise<IReturnValueWithPagination<CarFeatureDto>>>
{
  handle(request: Request): Promise<IReturnValueWithPagination<CarFeatureDto>> {
    const featuresService = Container.get(CarFeatureService);
    return featuresService.listFeatures(request.query);
  }
}
