import { AppError, IReturnValue } from '@/common/utils';
import slugify from '@/common/utils/slugify';
import { ResponseCodes } from '@/common/enums';
import { type CarModelRepository } from '@/modules/cars/infrastrucure/model.repository';
import { CarModelDto, CreateModelDto } from '@/common/dtos';
import { ModelTranslationsRepository } from '@/modules/cars/infrastrucure/model-translation.repository';
import { SerializerService } from '@/common/services/serializer.service';
import { modelCreated } from '../../../utils/messages.json'
import logger from '@/common/utils/logger';
import { type CarBrandRepository } from '@/modules/cars/infrastrucure/brand.repository';

export class CreateModelUseCase implements IUseCase<[CreateModelDTO], IReturnValue<CarModelDto>> {

  constructor(
    private readonly modelRepository: CarModelRepository,
    private readonly translationsRepo: ModelTranslationsRepository,
    private readonly brandsRepository: CarBrandRepository,
    private readonly serializer: SerializerService,
    private readonly messageBroker: IMessageBroker

  ) { }

  async execute(data: CreateModelDTO): Promise<IReturnValue<CarModelDto>> {
    // Validate the data
    const validData = await new CreateModelDto(data).validate()

    const { translations, brandId, ...modelData } = validData

    const enTranslation = validData.translations.find(trns => trns.locale === 'en')

    if (!enTranslation) {
      throw new AppError({
        statusCode: ResponseCodes.ValidationError,
        message: "Please provide translation with en locale."
      })
    }

    // Ensure brand exists
    const foundBrand = await this.brandsRepository.findOneBy({ id: brandId })

    if (!foundBrand) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: 'Brand does not exist with select id'
      })
    }

    // Check if a Model with the same slug (derived from the en translation) already exists
    const slug = slugify(enTranslation.name);
    const existingModel = await this.modelRepository.findOne({
      where: { slug, brand: foundBrand },
    });

    if (existingModel) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: `Model with name ${enTranslation.name} already exists. Please use another name!`
      })
    }

    const savedModel = await this.modelRepository.manager.transaction(async (manager) => {
      // Retrieve repositories from the transactional manager. To ensure transactions are atomic

      const modelRepo = manager.getRepository(this.modelRepository.target);

      const translationRepo = manager.getRepository(this.translationsRepo.target);

      // Create and save the Model entity
      const model = modelRepo.create({
        code: enTranslation.name.toLowerCase(),
        slug,
        brand: foundBrand,
        ...modelData,
      });

      const newModel = await modelRepo.save(model);

      // Create translation entities for each translation in the request
      const translationEntities = translations.map(trn =>
        translationRepo.create({
          ...trn,
          parent: newModel,
          parentId: newModel.id,
        })
      );
      const savedTranslations = await translationRepo.save(translationEntities);
      newModel.translations = savedTranslations;

      return newModel;
    });

    const serializedModel = this.serializer.serialize(CarModelDto, savedModel, enTranslation.locale)

    try {
      this.messageBroker.publishMessage(modelCreated, { data: serializedModel })
    } catch (error) {
      logger.error(`Failed to pubish message ${modelCreated}`, error)
    }

    return new IReturnValue({
      success: true,
      message: 'Model created successfully',
      data: serializedModel,
    });
  }
}
