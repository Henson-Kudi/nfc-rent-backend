import { Inject, Service } from 'typedi';
import {
    CarsRepositoryToken,
    type CarRepository,
} from '../../infrastrucure/car.repository';
import {
    AppError,
    IReturnValue,
    IReturnValueWithPagination,
} from '@/common/utils';
import { ResponseCodes } from '@/common/enums';
import { CreateCarUseCase } from '../use-cases/cars/create';
import { CarTranslationsRepository } from '../../infrastrucure/car-translation.repository';
import { MessageBrokerToken } from '@/common/message-broker';
import { UpdateCarUseCase } from '../use-cases/cars/update';
import { User } from '@/common/entities';
import { DeleteCarUseCase } from '../use-cases/cars/delete';
import slugify from '@/common/utils/slugify';
import { SerializerService } from '@/common/services/serializer.service';
import { CarDto } from '@/common/dtos';

// services/car-brand.service.ts
@Service()
export class CarService {
    constructor(
        @Inject(CarsRepositoryToken)
        private carsRepository: CarRepository,

        @Inject()
        private translationsRepo: CarTranslationsRepository,

        @Inject()
        private serializer: SerializerService,

        @Inject(MessageBrokerToken)
        private messageBroker: IMessageBroker
    ) { }

    async getCar(
        id: string,
        options?: Partial<CarFilterOptions>
    ): Promise<IReturnValue<CarDto>> {
        const car = await this.carsRepository.getCar(id, options);

        if (!car)
            throw new AppError({
                statusCode: ResponseCodes.NotFound,
                message: 'Car not found',
            });

        const serialised = this.serializer.serialize(CarDto, car, options?.locale);


        return new IReturnValue({
            success: true,
            message: 'Car fetched successfully',
            data: serialised,
        });
    }

    async getCarBySlug(
        slug: string,
        options?: Partial<CarFilterOptions>
    ): Promise<IReturnValue<CarDto>> {
        const car = await this.carsRepository.getCarBySlug(slug, options);

        if (!car)
            throw new AppError({
                statusCode: ResponseCodes.NotFound,
                message: 'Car not found',
            });

        const serialised = this.serializer.serialize(CarDto, car, options?.locale);

        return new IReturnValue({
            success: true,
            message: 'Car fetched successfully',
            data: serialised,
        });
    }

    async validateSlug(name: string) {
        const found = await this.carsRepository.getCarBySlug(slugify(name), {locale: 'en'})

        return new IReturnValue({
            success: true,
            data: { exists: !!found },
            message: 'Success'
        })
    }

    async listCars(
        params?: GetCarsFilter
    ): Promise<IReturnValueWithPagination<CarDto>> {
        const parsedPage = parseInt(params?.page?.toString() || '1');
        const parsedLimit = parseInt(params?.limit?.toString() || '10');
        const {
            id,
            search,
            slug,
            page: Page,
            limit: Limit,
            ...rest
        } = params || {} as GetCarsFilter;

        const page =
            isNaN(parsedPage) || parsedPage < 1 || parsedPage > 100 ? 1 : parsedPage;
        const limit =
            isNaN(parsedLimit) || parsedLimit < 0
                ? 10
                : parsedLimit >= 100
                    ? 100
                    : parsedLimit;
        const skip = (page - 1) * limit;

        const [cars, count] = await this.carsRepository.getCars(
            {
                ...params as any
            },
            {
                skip,
                limit,
                ...rest,
            }
        );

        const serialised = this.serializer.serialize(CarDto, cars, params?.locale)


        return new IReturnValueWithPagination({
            success: true,
            data: serialised as unknown as CarDto[],
            limit,
            page,
            total: count,
            message: 'Cars fetched successfully',
        });
    }

    createCar(data: CreateCarDTO) {
        return new CreateCarUseCase(this.carsRepository, this.translationsRepo, this.serializer, this.messageBroker).execute(data)
    }

    updateCar(carId: string, data: UpdateCarDTO, actor: User): Promise<IReturnValue<CarDto>> {
        return new UpdateCarUseCase(this.carsRepository, this.messageBroker, this.serializer).execute(carId, data, actor)
    }

    deleteCars(carId: string | string[], actor: User, hardDelete?: boolean) {
        return new DeleteCarUseCase(this.carsRepository, this.messageBroker).execute(carId, actor, hardDelete)
    }
}
