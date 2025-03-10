import { IReturnValue } from '@/common/utils';
import { CarService } from '@/modules/cars/application/services/car.service';
import { CarDto } from '@/common/dtos';
import { Request } from 'express';
import Container from 'typedi';

export class GetCarController
    implements IController<Promise<IReturnValue<CarDto>>> {
    handle(request: Request): Promise<IReturnValue<CarDto>> {
        const carsService = Container.get(CarService);
        return carsService.getCar(request.params.id, (request?.query as unknown as CarFilterOptions));
    }
}
