import { IReturnValue } from '@/common/utils';
import { CarBrandService } from '@/modules/cars/application/services/car-brand.service';
import { CarBrandDto } from '@/common/dtos';
import { Request } from 'express';
import Container from 'typedi';

export class CreateBrandsController
  implements IController<Promise<IReturnValue<CarBrandDto>>>
{
  handle(request: Request): Promise<IReturnValue<CarBrandDto>> {
    const brandsService = Container.get(CarBrandService);
    return brandsService.createBrand(request.body);
  }
}
