import { Inject, Service } from 'typedi';
import {
    ModelsRepositoryToken,
    type CarModelRepository,
} from '../../infrastrucure/model.repository';
import {
    AppError,
    IReturnValue,
    IReturnValueWithPagination,
} from '@/common/utils';
import { ResponseCodes } from '@/common/enums';
import { CreateModelUseCase } from '../use-cases/models/create';
import { ModelTranslationsRepository } from '../../infrastrucure/model-translation.repository';
import { MessageBrokerToken } from '@/common/message-broker';
import { BrandsRepositoryToken, type CarBrandRepository } from '../../infrastrucure/brand.repository';
import { UpdateCarModelUseCase } from '../use-cases/models/update';
import { User } from '@/common/entities';
import { DeleteCarModelUseCase } from '../use-cases/models/delete';
import slugify from '@/common/utils/slugify';
import { SerializerService } from '@/common/services/serializer.service';
import { CarModelDto } from '@/common/dtos';

@Service()
export class CarModelService {
    constructor(
        @Inject(ModelsRepositoryToken)
        private modelRepository: CarModelRepository,

        @Inject()
        private translationsRepo: ModelTranslationsRepository,

        @Inject(BrandsRepositoryToken)
        private brandsRepository: CarBrandRepository,

        @Inject()
        private serializer: SerializerService,

        @Inject(MessageBrokerToken)
        private messageBroker: IMessageBroker
    ) { }

    async getModel(
        id: string,
        locale: SupportedLocales
    ): Promise<IReturnValue<CarModelDto>> {
        const model = await this.modelRepository.getModel(id, locale);

        if (!model)
            throw new AppError({
                statusCode: ResponseCodes.NotFound,
                message: 'Model not found',
            });

        const serialised = this.serializer.serialize(CarModelDto, model, locale);

        return new IReturnValue({
            success: true,
            message: 'Model fetched successfully',
            data: serialised,
        });
    }

    async getModelBySlug(
        slug: string,
        locale: SupportedLocales
    ): Promise<IReturnValue<CarModelDto>> {
        const model = await this.modelRepository.getModelBySlug(slug, locale);

        if (!model)
            throw new AppError({
                statusCode: ResponseCodes.NotFound,
                message: 'Model not found',
            });

        const serialised = this.serializer.serialize(CarModelDto, model, locale);

        return new IReturnValue({
            success: true,
            message: 'Model fetched successfully',
            data: serialised,
        });
    }

    async validateSlug(name: string) {
        const found = await this.modelRepository.getModelBySlug(slugify(name), 'en')

        return new IReturnValue({
            success: true,
            data: { exists: !!found },
            message: 'Success'
        })
    }

    async listModels(
        params?: GetModelsFilter
    ): Promise<IReturnValueWithPagination<CarModelDto>> {
        const {
            id,
            search,
            slug,
            page: Page,
            limit: Limit,
            ...rest
        } = params || {};

        const parsedPage = parseInt(Page?.toString() || '1');
        const parsedLimit = parseInt(Limit?.toString() || '10');

        const page =
            isNaN(parsedPage) || parsedPage < 1 || parsedPage > 100 ? 1 : parsedPage;
        const limit =
            isNaN(parsedLimit) || parsedLimit < 0
                ? 10
                : parsedLimit >= 100
                    ? 100
                    : parsedLimit;
        const skip = (page - 1) * limit;

        const [models, count] = await this.modelRepository.getModels(
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

        const serialised = this.serializer.serialize(CarModelDto,
            models,
            rest?.locale || 'en'
        );

        return new IReturnValueWithPagination({
            success: true,
            data: serialised as unknown as CarModelDto[],
            limit,
            page,
            total: count,
            message: 'Models fetched successfully',
        });
    }

    createModel(data: CreateModelDTO) {
        return new CreateModelUseCase(this.modelRepository, this.translationsRepo, this.brandsRepository, this.serializer, this.messageBroker).execute(data)
    }

    updateModel(id: string, data: UpdateModelDTO, actor: User) {
        return new UpdateCarModelUseCase(this.modelRepository, this.brandsRepository, this.messageBroker, this.serializer,).execute(id, data, actor)
    }

    deleteModels(id: string | string[], actor: User, hardDelete?: boolean) {
        return new DeleteCarModelUseCase(this.modelRepository, this.messageBroker).execute(id, actor, hardDelete)
    }
}
