import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarBrandService } from '@/modules/cars/application/services/car-brand.service';
import { Request } from 'express';
import Container from 'typedi';

export class DeleteCarBrandController
  implements IController<Promise<IReturnValue<{ affected: number }>>> {
  handle(request: Request): Promise<IReturnValue<{ affected: number }>> {
    const id = request.params.id
    if (!id) {
      throw new AppError({
        message: 'Invalid brand identifier',
        statusCode: ResponseCodes.BadRequest
      })
    }
    if (!request.user) {
      throw new AppError({
        message: 'Unauthenticated user',
        statusCode: ResponseCodes.UnAuthorised
      })
    }

    const carBrandsService = Container.get(CarBrandService);
    return carBrandsService.deleteBrands(id, request.user, request?.query?.hardDelete === 'true');
  }
}
