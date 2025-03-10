import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarService } from '@/modules/cars/application/services/car.service';
import { Request } from 'express';
import Container from 'typedi';

export class DeleteCarController
    implements IController<Promise<IReturnValue<{ affected: number }>>> {
    handle(request: Request): Promise<IReturnValue<{ affected: number }>> {
        const id = request.params.id
        if (!id) {
            throw new AppError({
                message: 'Invalid car identifier',
                statusCode: ResponseCodes.BadRequest
            })
        }
        if (!request.user) {
            throw new AppError({
                message: 'Unauthenticated user',
                statusCode: ResponseCodes.UnAuthorised
            })
        }

        const carsService = Container.get(CarService);
        return carsService.deleteCars(id, request.user, request?.query?.hardDelete === 'true');
    }
}
