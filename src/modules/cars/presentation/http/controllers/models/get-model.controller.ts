import { IReturnValue } from '@/common/utils';
import { CarModelService } from '@/modules/cars/application/services/car-model.service';
import { CarModelDto } from '@/common/dtos';
import { Request } from 'express';
import Container from 'typedi';

export class GetModelController
    implements IController<Promise<IReturnValue<CarModelDto>>> {
    handle(request: Request): Promise<IReturnValue<CarModelDto>> {
        const modelsService = Container.get(CarModelService);
        return modelsService.getModel(request.params.id, (request?.query?.locale?.toString() as SupportedLocales | undefined) || 'en');
    }
}
