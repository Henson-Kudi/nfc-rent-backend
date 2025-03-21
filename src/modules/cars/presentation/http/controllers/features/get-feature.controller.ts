import { IReturnValue } from '@/common/utils';
import { CarFeatureService } from '@/modules/cars/application/services/car-feature.service';
import { CarFeatureDto } from '@/common/dtos';
import { Request } from 'express';
import Container from 'typedi';

export class GetFeatureController
  implements IController<Promise<IReturnValue<CarFeatureDto>>>
{
  handle(request: Request): Promise<IReturnValue<CarFeatureDto>> {
    const featuresService = Container.get(CarFeatureService);
    return featuresService.getFeature(
      request.params.id,
      (request?.query?.locale?.toString() as SupportedLocales | undefined) ||
        'en'
    );
  }
}
