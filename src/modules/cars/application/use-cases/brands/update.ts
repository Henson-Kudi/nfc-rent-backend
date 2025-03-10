import { CarBrandTranslation, User } from '@/common/entities';
import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import slugify from '@/common/utils/slugify';
import { CarBrandDto, UpdateBrandDto } from '@/common/dtos';
import { CarBrandRepository } from '@/modules/cars/infrastrucure/brand.repository';
import { Not } from 'typeorm';
import { SerializerService } from '@/common/services/serializer.service';
import logger from '@/common/utils/logger';
import { brandUpdated } from '../../../utils/messages.json'

export class UpdateCarBrandUseCase implements IUseCase<[string, UpdateBrandDTO, User], IReturnValue<CarBrandDto>> {

  constructor(
    private readonly brandRepository: CarBrandRepository,
    private readonly messageBus: IMessageBroker,
    private readonly serializer: SerializerService,
  ) { }
  async execute(
    id: string,
    data: UpdateBrandDTO,
    actor: User
  ): Promise<IReturnValue<CarBrandDto>> {
    const validData = await new UpdateBrandDto(data).validate()

    const { translations, ...brandData } = validData

    const enTranslation = validData.translations.find(trns => trns.locale === 'en')

    // Ensure brand exists
    const foundBrand = await this.brandRepository.findOne({
      where: { id },
      relations: ['translations']
    }) //this populates with translations

    if (!foundBrand) {
      throw new AppError({
        message: "Brand does not exist",
        statusCode: ResponseCodes.NotFound
      })
    }

    // Ensure that en translation to be updated is not already used by another brand
    if (enTranslation) {
      const found = await this.brandRepository.findOneBy({ id: Not(id), slug: slugify(enTranslation.name) })

      if (found) {
        throw new AppError({
          message: `Brand name ${enTranslation?.name} already exists!`,
          statusCode: ResponseCodes.BadRequest
        })
      }
    }

    const updatedBrand = await this.brandRepository.manager.transaction(async (manager) => {
      // Retrieve repositories from the transactional manager. To ensure transactions are atomic

      const brandRepo = manager.getRepository(this.brandRepository.target);

      const translationRepo = manager.getRepository(CarBrandTranslation);

      // Create and save the brand entity
      const brand = brandRepo.merge(foundBrand, {
        code: enTranslation?.name?.toLowerCase(),
        slug: enTranslation ? slugify(enTranslation?.name) : undefined,
        ...brandData,
      });
      const updatedBrand = await brandRepo.save(brand);

      // Update translations (if any)
      if (translations && translations?.length) {
        const existingTranslationsMap = new Map(foundBrand?.translations?.map(itm => [itm.locale, itm]))

        const translationEntities = translations.map(trn => {
          const existing = existingTranslationsMap.get(trn.locale)

          return existing ? translationRepo.merge(existing, {
            ...trn,
          }) : translationRepo.create({
            ...trn,
            parent: updatedBrand,
            parentId: updatedBrand.id,
          })
        });
        const savedTranslations = await translationRepo.save(translationEntities);
        updatedBrand.translations = savedTranslations;
      }

      return updatedBrand;
    });

    const serialisedBrand = this.serializer.serialize(CarBrandDto, updatedBrand, enTranslation?.locale)

    try {
      this.messageBus.publishMessage(brandUpdated, {
        data: {
          data: serialisedBrand,
          actor
        }
      })
    } catch (error) {
      logger.error(`Failed to pubish message ${brandUpdated}`, error)
    }

    return new IReturnValue({
      success: true,
      message: 'Brand updated successfully',
      data: serialisedBrand,
    });
  }
}
