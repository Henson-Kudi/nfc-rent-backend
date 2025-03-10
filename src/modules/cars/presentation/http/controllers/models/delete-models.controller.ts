import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarModelService } from '@/modules/cars/application/services/car-model.service';
import { Request } from 'express';
import Container from 'typedi';

export class DeleteCarModelsController
    implements IController<Promise<IReturnValue<{ affected: number }>>> {
    handle(request: Request): Promise<IReturnValue<{ affected: number }>> {
        const id = request.query.id
        if (!id) {
            throw new AppError({
                message: 'Please provide model identifier',
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

        const carModelsService = Container.get(CarModelService);
        return carModelsService.deleteModels(id as string | string[], request.user, request?.query?.hardDelete === 'true');
    }
}
