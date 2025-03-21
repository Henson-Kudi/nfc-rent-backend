import { Inject, Service } from 'typedi';
import {
  FeaturesRepositoryToken,
  type CarFeatureRepository,
} from '../../infrastrucure/feature.repository';
import { SerializerService } from '@/common/services/serializer.service';
import {
  AppError,
  IReturnValue,
  IReturnValueWithPagination,
} from '@/common/utils';
import { FeatureCategory, ResponseCodes } from '@/common/enums';
import { CreateFeatureUseCase } from '../use-cases/features/create';
import { FeatureTranslationsRepository } from '../../infrastrucure/feature-translation.repository';
import { MessageBrokerToken } from '@/common/message-broker';
import { UpdateCarFeatureUseCase } from '../use-cases/features/update';
import { User } from '@/common/entities';
import { DeleteCarFeatureUseCase } from '../use-cases/features/delete';
import slugify from '@/common/utils/slugify';
import { CarFeatureDto } from '@/common/dtos';

// services/car-Feature.service.ts
@Service()
export class CarFeatureService {
  constructor(
    @Inject(FeaturesRepositoryToken)
    private featureRepository: CarFeatureRepository,

    @Inject()
    private translationsRepo: FeatureTranslationsRepository,

    @Inject()
    private serializer: SerializerService,

    @Inject(MessageBrokerToken)
    private messageBroker: IMessageBroker
  ) {}

  async getFeature(
    id: string,
    locale: SupportedLocales
  ): Promise<IReturnValue<CarFeatureDto>> {
    const feature = await this.featureRepository.getFeature(id, locale);

    if (!feature)
      throw new AppError({
        statusCode: ResponseCodes.NotFound,
        message: 'Feature not found',
      });

    const serialised = this.serializer.serialize(
      CarFeatureDto,
      feature,
      locale
    );

    return new IReturnValue({
      success: true,
      message: 'Feature fetched successfully',
      data: serialised,
    });
  }

  async getFeatureBySlug(
    slug: string,
    locale: SupportedLocales
  ): Promise<IReturnValue<CarFeatureDto>> {
    const feature = await this.featureRepository.getFeatureBySlug(slug, locale);

    if (!feature)
      throw new AppError({
        statusCode: ResponseCodes.NotFound,
        message: 'Feature not found',
      });

    const serialised = this.serializer.serialize(
      CarFeatureDto,
      feature,
      locale
    );

    return new IReturnValue({
      success: true,
      message: 'Feature fetched successfully',
      data: serialised,
    });
  }

  async validateSlug(name: string) {
    const found = await this.featureRepository.getFeatureBySlug(
      slugify(name),
      'en'
    );

    return new IReturnValue({
      success: true,
      data: { exists: !!found },
      message: 'Success',
    });
  }

  async listFeatures(
    params?: GetFeaturesFilter
  ): Promise<IReturnValueWithPagination<CarFeatureDto>> {
    const {
      id,
      search,
      slug,
      page: Page,
      limit: Limit,
      category,
      isHighlighted,
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

    const [features, count] = await this.featureRepository.getFeatures(
      {
        id,
        search,
        slug,
        category: category as FeatureCategory[] | undefined,
        isHighlighted,
      },
      {
        skip,
        limit,
        ...rest,
      }
    );

    const serialised = this.serializer.serialize(
      CarFeatureDto,
      features,
      rest?.locale || 'en'
    );

    return new IReturnValueWithPagination({
      success: true,
      data: serialised as unknown as CarFeatureDto[],
      limit,
      page,
      total: count,
      message: 'Features fetched successfully',
    });
  }

  createFeature(data: CreateFeatureDTO) {
    return new CreateFeatureUseCase(
      this.featureRepository,
      this.translationsRepo,
      this.serializer,
      this.messageBroker
    ).execute(data);
  }

  updateFeature(id: string, data: UpdateFeatureDTO, actor: User) {
    return new UpdateCarFeatureUseCase(
      this.featureRepository,
      this.messageBroker,
      this.serializer
    ).execute(id, data, actor);
  }

  deleteFeatures(
    id: string | string[],
    actor: User,
    hardDelete: boolean = false
  ) {
    return new DeleteCarFeatureUseCase(
      this.featureRepository,
      this.messageBroker
    ).execute(id, actor, hardDelete);
  }
}
