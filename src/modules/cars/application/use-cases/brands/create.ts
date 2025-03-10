import { AppError, IReturnValue } from '@/common/utils';
import slugify from '@/common/utils/slugify';
import { ResponseCodes } from '@/common/enums';
import { type CarBrandRepository } from '@/modules/cars/infrastrucure/brand.repository';
import { CarBrandDto, CreateBrandDto } from '@/common/dtos';
import { BrandTranslationsRepository } from '@/modules/cars/infrastrucure/brand-translation.repository';
import { SerializerService } from '@/common/services/serializer.service';
import { brandCreated } from '../../../utils/messages.json'
import logger from '@/common/utils/logger';

export class CreateBrandUseCase implements IUseCase<[CreateBrandDTO], IReturnValue<CarBrandDto>> {

  constructor(
    private readonly brandRepository: CarBrandRepository,
    private readonly translationsRepo: BrandTranslationsRepository,
    private readonly serializer: SerializerService,
    private readonly messageBroker: IMessageBroker

  ) { }

  async execute(data: CreateBrandDTO): Promise<IReturnValue<CarBrandDto>> {
    // Validate the data
    const validData = await new CreateBrandDto(data).validate()

    const { translations, ...brandData } = validData

    const enTranslation = validData.translations.find(trns => trns.locale === 'en')

    if (!enTranslation) {
      throw new AppError({
        statusCode: ResponseCodes.ValidationError,
        message: "Please provide translation with en locale."
      })
    }

    // Check if a brand with the same slug (derived from the en translation) already exists
    const slug = slugify(enTranslation.name);
    const existingBrand = await this.brandRepository.findOne({
      where: { slug },
    });

    if (existingBrand) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: `Brand with name ${enTranslation.name} already exists. Please use another name!`
      })
    }

    const savedBrand = await this.brandRepository.manager.transaction(async (manager) => {
      // Retrieve repositories from the transactional manager. To ensure transactions are atomic

      const brandRepo = manager.getRepository(this.brandRepository.target);

      const translationRepo = manager.getRepository(this.translationsRepo.target);

      // Create and save the brand entity
      const brand = brandRepo.create({
        code: enTranslation.name.toLowerCase(),
        slug,
        ...brandData,
      });
      const newBrand = await brandRepo.save(brand);

      // Create translation entities for each translation in the request
      const translationEntities = translations.map(trn =>
        translationRepo.create({
          ...trn,
          parent: newBrand,
          parentId: newBrand.id,
        })
      );
      const savedTranslations = await translationRepo.save(translationEntities);
      newBrand.translations = savedTranslations;

      return newBrand;
    });

    const serialisedBrand = this.serializer.serialize(CarBrandDto, savedBrand, enTranslation.locale)

    try {
      this.messageBroker.publishMessage(brandCreated, { data: serialisedBrand })
    } catch (error) {
      logger.error(`Failed to pubish message ${brandCreated}`, error)
    }

    return new IReturnValue({
      success: true,
      message: 'Brand created successfully',
      data: serialisedBrand,
    });
  }
}
