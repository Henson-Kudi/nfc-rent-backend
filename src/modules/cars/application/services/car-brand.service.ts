import { Inject, Service } from 'typedi';
import {
    BrandsRepositoryToken,
    type CarBrandRepository,
} from '../../infrastrucure/brand.repository';
import { SerializerService } from '@/common/services/serializer.service';
import {
    AppError,
    IReturnValue,
    IReturnValueWithPagination,
} from '@/common/utils';
import { ResponseCodes } from '@/common/enums';
import { CreateBrandUseCase } from '../use-cases/brands/create';
import { BrandTranslationsRepository } from '../../infrastrucure/brand-translation.repository';
import { MessageBrokerToken } from '@/common/message-broker';
import { UpdateCarBrandUseCase } from '../use-cases/brands/update';
import { User } from '@/common/entities';
import { DeleteCarBrandUseCase } from '../use-cases/brands/delete';
import slugify from '@/common/utils/slugify';
import { CarBrandDto } from '@/common/dtos';

// services/car-brand.service.ts
@Service()
export class CarBrandService {
    constructor(
        @Inject(BrandsRepositoryToken)
        private brandRepository: CarBrandRepository,

        @Inject()
        private translationsRepo: BrandTranslationsRepository,

        @Inject()
        private serializer: SerializerService,

        @Inject(MessageBrokerToken)
        private messageBroker: IMessageBroker
    ) { }

    async getBrand(
        id: string,
        locale: SupportedLocales
    ): Promise<IReturnValue<CarBrandDto>> {
        const brand = await this.brandRepository.getBrand(id, locale);

        if (!brand)
            throw new AppError({
                statusCode: ResponseCodes.NotFound,
                message: 'Brand not found',
            });

        const serialised = this.serializer.serialize(CarBrandDto, brand, locale);

        return new IReturnValue({
            success: true,
            message: 'Brand fetched successfully',
            data: serialised,
        });
    }

    async getBrandBySlug(
        slug: string,
        locale: SupportedLocales
    ): Promise<IReturnValue<CarBrandDto>> {
        const brand = await this.brandRepository.getBrandBySlug(slug, locale);

        if (!brand)
            throw new AppError({
                statusCode: ResponseCodes.NotFound,
                message: 'Brand not found',
            });

        const serialised = this.serializer.serialize(CarBrandDto, brand, locale);

        return new IReturnValue({
            success: true,
            message: 'Brand fetched successfully',
            data: serialised,
        });
    }

    async validateSlug(name: string) {
        const found = await this.brandRepository.getBrandBySlug(slugify(name), 'en')

        return new IReturnValue({
            success: true,
            data: { exists: !!found },
            message: 'Success'
        })
    }

    async listBrands(
        params?: GetBrandsFilter
    ): Promise<IReturnValueWithPagination<CarBrandDto>> {
        const parsedPage = parseInt(params?.page?.toString() || '1');
        const parsedLimit = parseInt(params?.limit?.toString() || '10');
        const {
            id,
            search,
            slug,
            page: Page,
            limit: Limit,
            ...rest
        } = params || {};

        const page =
            isNaN(parsedPage) || parsedPage < 1 || parsedPage > 100 ? 1 : parsedPage;
        const limit =
            isNaN(parsedLimit) || parsedLimit < 0
                ? 10
                : parsedLimit >= 100
                    ? 100
                    : parsedLimit;
        const skip = (page - 1) * limit;

        const [brands, count] = await this.brandRepository.getBrands(
            {
                id,
                search,
                slug,
            },
            {
                skip,
                limit,
                ...rest,
            }
        );

        const serialised = this.serializer.serialize(CarBrandDto,
            brands,
            rest?.locale || 'en'
        );

        return new IReturnValueWithPagination({
            success: true,
            data: serialised as unknown as CarBrandDto[],
            limit,
            page,
            total: count,
            message: 'Brands fetched successfully',
        });
    }

    createBrand(data: CreateBrandDTO) {
        return new CreateBrandUseCase(this.brandRepository, this.translationsRepo, this.serializer, this.messageBroker).execute(data)
    }

    updateBrand(id: string, data: UpdateBrandDTO, actor: User) {
        return new UpdateCarBrandUseCase(this.brandRepository, this.messageBroker, this.serializer).execute(id, data, actor)
    }

    deleteBrands(id: string | string[], actor: User, hardDelete?: boolean) {
        return new DeleteCarBrandUseCase(this.brandRepository, this.messageBroker).execute(id, actor, hardDelete)
    }
}
