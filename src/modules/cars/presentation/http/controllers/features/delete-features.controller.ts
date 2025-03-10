import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarFeatureService } from '@/modules/cars/application/services/car-feature.service';
import { Request } from 'express';
import Container from 'typedi';

export class DeleteCarFeaturesController
    implements IController<Promise<IReturnValue<{ affected: number }>>> {
    handle(request: Request): Promise<IReturnValue<{ affected: number }>> {
        const id = request.query.id
        if (!id) {
            throw new AppError({
                message: 'Please provide feature identifier',
                statusCode: ResponseCodes.BadRequest
            })
        }
        if ((!Array.isArray(id) && typeof id !== 'string') || !id?.length) {
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
        return carFeaturesService.deleteFeatures(id as string | string[], request.user, request?.query?.hardDelete === 'true');
    }
}
