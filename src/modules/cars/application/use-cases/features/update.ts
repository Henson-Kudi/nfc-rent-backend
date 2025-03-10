import { CarFeatureTranslation, User } from '@/common/entities';
import { FeatureCategory, ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import slugify from '@/common/utils/slugify';
import { CarFeatureDto, UpdateFeatureDto } from '@/common/dtos';
import { CarFeatureRepository } from '@/modules/cars/infrastrucure/feature.repository';
import { Not } from 'typeorm';
import { SerializerService } from '@/common/services/serializer.service';
import logger from '@/common/utils/logger';
import { featureUpdated } from '../../../utils/messages.json'

export class UpdateCarFeatureUseCase implements IUseCase<[string, UpdateFeatureDTO, User], IReturnValue<CarFeatureDto>> {

  constructor(
    private readonly featureRepository: CarFeatureRepository,
    private readonly messageBus: IMessageBroker,
    private readonly serializer: SerializerService,
  ) { }
  async execute(
    id: string,
    data: UpdateFeatureDTO,
    actor: User
  ): Promise<IReturnValue<CarFeatureDto>> {
    const validData = await new UpdateFeatureDto(data).validate()

    const { translations, ...featureData } = validData

    const enTranslation = validData.translations.find(trns => trns.locale === 'en')

    // Ensure Feature exists
    const foundFeature = await this.featureRepository.findOne({
      where: { id },
      relations: ['translations']
    })

    if (!foundFeature) {
      throw new AppError({
        message: "Feature does not exist",
        statusCode: ResponseCodes.NotFound
      })
    }

    // Ensure that en translation to be updated is not already used by another Feature
    if (enTranslation) {
      const found = await this.featureRepository.findOneBy({ id: Not(id), slug: slugify(enTranslation.name) })

      if (found) {
        throw new AppError({
          message: `Feature name ${enTranslation?.name} already exists!`,
          statusCode: ResponseCodes.BadRequest
        })
      }
    }

    const updatedFeature = await this.featureRepository.manager.transaction(async (manager) => {
      // Retrieve repositories from the transactional manager. To ensure transactions are atomic

      const featureRepo = manager.getRepository(this.featureRepository.target);

      const translationRepo = manager.getRepository(CarFeatureTranslation);

      // Create and save the Feature entity
      const feature = featureRepo.merge(foundFeature, {
        code: enTranslation?.name?.toLowerCase(),
        slug: enTranslation ? slugify(enTranslation?.name) : undefined,
        category: featureData?.category as FeatureCategory || undefined,
        isHighlighted: featureData?.isHighlighted
      });
      const updatedFeature = await featureRepo.save(feature);

      // Update translations (if any)
      if (translations && translations?.length) {
        const existingTranslationsMap = new Map(foundFeature?.translations?.map(itm => [itm.locale, itm]))

        const translationEntities = translations.map(trn => {
          const existing = existingTranslationsMap.get(trn.locale)

          return existing ? translationRepo.merge(existing, trn) : translationRepo.create({
            ...trn,
            parent: updatedFeature,
            parentId: updatedFeature.id,
          })
        });
        const savedTranslations = await translationRepo.save(translationEntities);
        updatedFeature.translations = savedTranslations;
      }

      return updatedFeature;
    });

    const serialisedFeature = this.serializer.serialize(CarFeatureDto, updatedFeature, enTranslation?.locale)

    try {
      this.messageBus.publishMessage(featureUpdated, {
        data: {
          data: serialisedFeature,
          actor
        }
      })
    } catch (error) {
      logger.error(`Failed to pubish message ${featureUpdated}`, error)
    }

    return new IReturnValue({
      success: true,
      message: 'Feature updated successfully',
      data: serialisedFeature,
    });
  }
}
