import { CarModelTranslation, User } from '@/common/entities';
import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import slugify from '@/common/utils/slugify';
import { CarModelDto, UpdateModelDto } from '@/common/dtos';
import { CarModelRepository } from '@/modules/cars/infrastrucure/model.repository';
import { Not } from 'typeorm';
import { SerializerService } from '@/common/services/serializer.service';
import logger from '@/common/utils/logger';
import { FleetEvents } from '@/common/message-broker/events/fleet.events';
import { CarBrandRepository } from '@/modules/cars/infrastrucure/brand.repository';

export class UpdateCarModelUseCase
  implements IUseCase<[string, UpdateModelDTO, User], IReturnValue<CarModelDto>>
{
  constructor(
    private readonly modelRepository: CarModelRepository,
    private readonly brandRepository: CarBrandRepository,
    private readonly messageBus: IMessageBroker,
    private readonly serializer: SerializerService
  ) {}
  async execute(
    id: string,
    data: UpdateModelDTO,
    actor: User
  ): Promise<IReturnValue<CarModelDto>> {
    const validData = await new UpdateModelDto(data).validate();

    const { translations, brandId, ...modelData } = validData;

    const enTranslation = validData.translations.find(
      (trns) => trns.locale === 'en'
    );

    // Ensure Model exists
    const foundModel = await this.modelRepository.findOne({
      where: { id },
      relations: ['brand', 'translations'],
    }); // we want to load all the existing translations

    if (!foundModel) {
      throw new AppError({
        message: 'Model does not exist',
        statusCode: ResponseCodes.NotFound,
      });
    }

    // Ensure that en translation to be updated is not already used by another Model
    if (enTranslation) {
      const found = await this.modelRepository.findOneBy({
        id: Not(id),
        slug: slugify(enTranslation.name),
      });

      if (found) {
        throw new AppError({
          message: `Model name ${enTranslation?.name} already exists!`,
          statusCode: ResponseCodes.BadRequest,
        });
      }
    }

    // If updating brand, ensure that the brand exists
    if (brandId && brandId !== foundModel?.brand?.id) {
      const brand = await this.brandRepository.findOne({
        where: { id: brandId },
      });

      if (!brand) {
        throw new AppError({
          message: 'Selected brand identifier does not exist',
          statusCode: ResponseCodes.BadRequest,
        });
      }

      foundModel.brand = brand;
    }

    const updatedModel = await this.modelRepository.manager.transaction(
      async (manager) => {
        // Retrieve repositories from the transactional manager. To ensure transactions are atomic

        const modelRepo = manager.getRepository(this.modelRepository.target);

        const translationRepo = manager.getRepository(CarModelTranslation);

        // Create and save the Model entity
        const model = modelRepo.merge(foundModel, {
          code: enTranslation?.name?.toLowerCase(),
          slug: enTranslation ? slugify(enTranslation?.name) : undefined,
          ...modelData,
        });
        const updatedModel = await modelRepo.save(model);

        // Update translations (if any)
        if (translations && translations?.length) {
          const existingTranslationsMap = new Map(
            foundModel?.translations?.map((itm) => [itm.locale, itm])
          );

          const translationEntities = translations.map((trn) => {
            const existing = existingTranslationsMap.get(trn.locale);

            return existing
              ? translationRepo.merge(existing, trn)
              : translationRepo.create({
                  ...trn,
                  parent: updatedModel,
                  parentId: updatedModel.id,
                });
          });
          const savedTranslations =
            await translationRepo.save(translationEntities);
          updatedModel.translations = savedTranslations;
        }

        return updatedModel;
      }
    );

    const serialisedModel = this.serializer.serialize(
      CarModelDto,
      updatedModel,
      enTranslation?.locale
    );

    try {
      this.messageBus.publishMessage(FleetEvents.model.updated, {
        data: {
          data: serialisedModel,
          actor,
        },
      });
    } catch (error) {
      logger.error(
        `Failed to pubish message ${FleetEvents.model.updated}`,
        error
      );
    }

    return new IReturnValue({
      success: true,
      message: 'Model updated successfully',
      data: serialisedModel,
    });
  }
}
