import { IReturnValueWithPagination } from '@/common/utils';
import { CarBrandService } from '@/modules/cars/application/services/car-brand.service';
import { CarBrandDto } from '@/common/dtos';
import { Request } from 'express';
import Container from 'typedi';

export class GetBrandsController
  implements IController<Promise<IReturnValueWithPagination<CarBrandDto>>> {
  handle(request: Request): Promise<IReturnValueWithPagination<CarBrandDto>> {
    const brandsService = Container.get(CarBrandService);
    return brandsService.listBrands(request.query);
  }
}
