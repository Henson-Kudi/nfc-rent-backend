import { AppError, IReturnValue } from '@/common/utils';
import slugify from '@/common/utils/slugify';
import { FeatureCategory, ResponseCodes } from '@/common/enums';
import { type CarFeatureRepository } from '@/modules/cars/infrastrucure/feature.repository';
import { CarFeatureDto, CreateFeatureDto } from '@/common/dtos';
import { FeatureTranslationsRepository } from '@/modules/cars/infrastrucure/feature-translation.repository';
import { SerializerService } from '@/common/services/serializer.service';
import { featureCreated } from '../../../utils/messages.json'
import logger from '@/common/utils/logger';

export class CreateFeatureUseCase implements IUseCase<[CreateFeatureDTO], IReturnValue<CarFeatureDto>> {

  constructor(
    private readonly featureRepository: CarFeatureRepository,
    private readonly translationsRepo: FeatureTranslationsRepository,
    private readonly serializer: SerializerService,
    private readonly messageBroker: IMessageBroker

  ) { }

  async execute(data: CreateFeatureDTO): Promise<IReturnValue<CarFeatureDto>> {
    // Validate the data
    const validData = await new CreateFeatureDto(data).validate()

    const { translations, ...featureData } = validData

    const enTranslation = validData.translations.find(trns => trns.locale === 'en')

    if (!enTranslation) {
      throw new AppError({
        statusCode: ResponseCodes.ValidationError,
        message: "Please provide translation with en locale."
      })
    }

    // Check if a Feature with the same slug (derived from the en translation) already exists
    const slug = slugify(enTranslation.name);
    const existingFeature = await this.featureRepository.findOne({
      where: { slug },
    });

    if (existingFeature) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: `Feature with name ${enTranslation.name} already exists. Please use another name!`
      })
    }

    const savedFeature = await this.featureRepository.manager.transaction(async (manager) => {
      // Retrieve repositories from the transactional manager. To ensure transactions are atomic

      const featureRepo = manager.getRepository(this.featureRepository.target);

      const translationRepo = manager.getRepository(this.translationsRepo.target);

      // Create and save the Feature entity
      const feature = featureRepo.create({
        code: enTranslation.name.toLowerCase(),
        slug,
        ...featureData,
        category: validData.category as FeatureCategory
      });
      const newFeature = await featureRepo.save(feature);

      // Create translation entities for each translation in the request
      const translationEntities = translations.map(trn =>
        translationRepo.create({
          ...trn,
          parent: newFeature,
          parentId: newFeature.id,
        })
      );
      const savedTranslations = await translationRepo.save(translationEntities);
      newFeature.translations = savedTranslations;

      return newFeature;
    });

    const serialisedFeature = this.serializer.serialize(CarFeatureDto, savedFeature, enTranslation.locale)

    try {
      this.messageBroker.publishMessage(featureCreated, { data: serialisedFeature })
    } catch (error) {
      logger.error(`Failed to pubish message ${featureCreated}`, error)
    }

    return new IReturnValue({
      success: true,
      message: 'Feature created successfully',
      data: serialisedFeature,
    });
  }
}
