import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarFeatureService } from '@/modules/cars/application/services/car-feature.service';
import { Request } from 'express';
import Container from 'typedi';

export class DeleteCarFeatureController
    implements IController<Promise<IReturnValue<{ affected: number }>>> {
    handle(request: Request): Promise<IReturnValue<{ affected: number }>> {
        const id = request.params.id
        if (!id) {
            throw new AppError({
                message: 'Invalid feature identifier',
                statusCode: ResponseCodes.BadRequest
            })
        }
        if (!request.user) {
            throw new AppError({
                message: 'Unauthenticated user',
                statusCode: ResponseCodes.UnAuthorised
            })
        }

        const featuresService = Container.get(CarFeatureService);
        return featuresService.deleteFeatures(id, request.user, request?.query?.hardDelete === 'true');
    }
}
