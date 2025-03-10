import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import { CarModelService } from '@/modules/cars/application/services/car-model.service';
import { CarModelDto } from '@/common/dtos';
import { Request } from 'express';
import Container from 'typedi';

export class UpdateCarModelController
    implements IController<Promise<IReturnValue<CarModelDto>>> {
    handle(request: Request): Promise<IReturnValue<CarModelDto>> {
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

        const carModelsService = Container.get(CarModelService);
        return carModelsService.updateModel(id, request.body, request.user);
    }
}
