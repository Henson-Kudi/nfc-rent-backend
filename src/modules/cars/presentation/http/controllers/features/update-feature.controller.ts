import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarFeatureService } from '@/modules/cars/application/services/car-feature.service';
import { CarFeatureDto } from '@/common/dtos';
import { Request } from 'express';
import Container from 'typedi';

export class UpdateCarFeatureController
    implements IController<Promise<IReturnValue<CarFeatureDto>>> {
    handle(request: Request): Promise<IReturnValue<CarFeatureDto>> {
        const id = request.params.id
        if (!id) {
            throw new AppError({
                message: 'Invalid identifier',
                statusCode: ResponseCodes.BadRequest
            })
        }
        if (!request.user) {
            throw new AppError({
                message: 'Unauthenticated user',
                statusCode: ResponseCodes.UnAuthorised
            })
        }

        const carFeaturesService = Container.get(CarFeatureService);
        return carFeaturesService.updateFeature(id, request.body, request.user);
    }
}
