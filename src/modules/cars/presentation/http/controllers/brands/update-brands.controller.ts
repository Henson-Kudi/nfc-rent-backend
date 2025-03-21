import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarBrandService } from '@/modules/cars/application/services/car-brand.service';
import { CarBrandDto } from '@/common/dtos';
import { Request } from 'express';
import Container from 'typedi';

export class UpdateCarBrandsController
  implements IController<Promise<IReturnValue<CarBrandDto>>>
{
  handle(request: Request): Promise<IReturnValue<CarBrandDto>> {
    const id = request.params.id;
    if (!id) {
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

    const brandsService = Container.get(CarBrandService);

    return brandsService.updateBrand(id, request.body, request.user);
  }
}
