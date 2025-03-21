import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarBrandService } from '@/modules/cars/application/services/car-brand.service';
import { Request } from 'express';
import Container from 'typedi';

export class DeleteCarBrandsController
  implements IController<Promise<IReturnValue<{ affected: number }>>>
{
  handle(request: Request): Promise<IReturnValue<{ affected: number }>> {
    const id = request.query.id;
    if (!id) {
      throw new AppError({
        message: 'Invalid brand identifier',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    if ((!Array.isArray(id) && typeof id !== 'string') || !id?.length) {
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

    const carBrandsService = Container.get(CarBrandService);
    return carBrandsService.deleteBrands(
      id as string | string[],
      request.user,
      request?.query?.hardDelete === 'true'
    );
  }
}
