import { AppError, IReturnValue } from '@/common/utils';
import slugify from '@/common/utils/slugify';
import {
  CarCategory,
  CarCondition,
  CarDocumentType,
  CarInspectionStatus,
  CarListingType,
  CarStatus,
  FuelType,
  ResponseCodes,
  TransmissionType,
} from '@/common/enums';
import { type CarRepository } from '@/modules/cars/infrastrucure/car.repository';
import { CarDto, CreateCarDto } from '@/common/dtos';
import { CarTranslationsRepository } from '@/modules/cars/infrastrucure/car-translation.repository';
import { SerializerService } from '@/common/services/serializer.service';
import { FleetEvents } from '@/common/message-broker/events/fleet.events';
import logger from '@/common/utils/logger';
import {
  Car,
  CarDocument,
  CarFeature,
  CarMedia,
  CarModel,
  CarOwnershipDetail,
  RentalPricing,
  User,
} from '@/common/entities';
import { In } from 'typeorm';

export class CreateCarUseCase
  implements IUseCase<[CreateCarDTO], IReturnValue<CarDto>>
{
  constructor(
    private readonly carRepository: CarRepository,
    private readonly translationsRepo: CarTranslationsRepository,
    private readonly serializer: SerializerService,
    private readonly messageBroker: IMessageBroker
  ) {}

  async execute(data: CreateCarDTO): Promise<IReturnValue<CarDto>> {
    // Validate the data
    const validData = await new CreateCarDto(data).validate();

    const {
      translations,
      features,
      model,
      media,
      owner,
      documents,
      rentalPricings,
      ...carData
    } = validData;

    const enTranslation = validData.translations.find(
      (trns) => trns.locale === 'en'
    );

    if (!enTranslation) {
      throw new AppError({
        statusCode: ResponseCodes.ValidationError,
        message: 'Please provide translation with en locale.',
      });
    }

    // Check if a car with the same slug (derived from the en translation) already exists
    const slug = slugify(enTranslation.name);
    const existingCar = await this.carRepository.findOne({
      where: [{ slug }, { vin: carData.vin }],
    });

    if (existingCar) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message:
          existingCar?.slug === slug
            ? `Car with name ${enTranslation.name} already exists. Please use another name!`
            : `Car with vin ${carData.vin} already exists!`,
      });
    }

    const savedCar = await this.carRepository.manager.transaction(
      async (manager) => {
        // Retrieve repositories from the transactional manager. To ensure transactions are atomic

        const carRepo = manager.getRepository(this.carRepository.target);

        const translationRepo = manager.getRepository(
          this.translationsRepo.target
        );
        const featuresRepo = manager.getRepository(CarFeature);
        const modelsRepo = manager.getRepository(CarModel);
        const mediaRepo = manager.getRepository(CarMedia);
        const rentalPricingsRepo = manager.getRepository(RentalPricing);
        const documentsRepo = manager.getRepository(CarDocument);
        const ownershipDetailsRepo = manager.getRepository(CarOwnershipDetail);
        const userRepo = manager.getRepository(User);

        const carFeatures = features
          ? await featuresRepo.findBy({
              id: In(features),
            })
          : [];

        const carModel = await modelsRepo.findOne({
          where: { id: model },
          relations: ['brand'],
        });

        if (!carModel || !carModel.brand) {
          throw new AppError({
            statusCode: ResponseCodes.BadRequest,
            message: `Could not find model with id ${model}`,
          });
        }

        // Create and save the car entity
        const car = carRepo.create({
          ...carData,
          slug,
          acquisitionDate: new Date(carData.acquisitionDate || Date.now()),
          category: carData.category as CarCategory,
          currentStatus: carData.currentStatus as CarStatus,
          fuelType: carData.fuelType as FuelType,
          condition: carData.condition as CarCondition,
          inspectionStatus: carData?.inspectionStatus as CarInspectionStatus,
          lastInspectionDate: carData?.lastInspectionDate
            ? new Date(carData.lastInspectionDate)
            : undefined,
          nextInspectionDueDate: carData.nextInspectionDueDate
            ? new Date(carData.nextInspectionDueDate)
            : undefined,
          features: carFeatures,
          brand: carModel.brand,
          model: carModel,
          listingType: carData.listingType as CarListingType[],
          transmission: carData.transmission as TransmissionType,
        } as Partial<Car>);
        const newCar = await carRepo.save(car);

        // Create translation entities for each translation in the request
        const translationEntities = translations.map((trn) =>
          translationRepo.create({
            ...trn,
            parent: newCar,
            parentId: newCar.id,
          })
        );
        const savedTranslations =
          await translationRepo.save(translationEntities);
        newCar.translations = savedTranslations;

        if (media?.length) {
          newCar.media = await mediaRepo.save(
            mediaRepo.create(
              media.map((itm) => ({
                ...itm,
                car: newCar,
              }))
            )
          );
        }

        if (rentalPricings?.length) {
          newCar.rentalPricings = await rentalPricingsRepo.save(
            rentalPricingsRepo.create(
              rentalPricings.map((itm) => ({
                ...(itm as RentalPricing),
                car: newCar,
              }))
            )
          );
        }

        if (documents?.length) {
          newCar.documents = await documentsRepo.save(
            documentsRepo.create(
              documents.map((itm) => ({
                ...itm,
                type: itm.type as CarDocumentType,
                issueDate: itm?.issueDate ? new Date(itm.issueDate) : undefined,
                expiryDate: itm?.expiryDate
                  ? new Date(itm.expiryDate)
                  : undefined,
                verificationDate: itm?.verificationDate
                  ? new Date(itm.verificationDate)
                  : undefined,
                car: newCar,
              }))
            )
          );
        }

        if (owner) {
          const ownerData = await userRepo.findOneBy({
            id: owner?.ownerId,
          });

          if (!ownerData) {
            throw new AppError({
              message: 'User with selected id as owner not found',
              statusCode: ResponseCodes.BadRequest,
            });
          }

          newCar.ownershipDetails = [
            await ownershipDetailsRepo.save(
              ownershipDetailsRepo.create({
                owner: ownerData,
                ownerType: owner.ownerType,
                percentage: owner.percentage,
                nftId: owner.nftId,
                acquiredDate: owner?.acquiredDate
                  ? new Date(owner.acquiredDate)
                  : undefined,
                transferDate: owner?.transferDate
                  ? new Date(owner.transferDate)
                  : undefined,
                status: owner?.status,
                car: newCar,
              })
            ),
          ];
        }

        return newCar;
      }
    );

    const serialisedCar = this.serializer.serialize(
      CarDto,
      savedCar,
      enTranslation.locale
    );

    try {
      this.messageBroker.publishMessage(FleetEvents.car.created, {
        data: serialisedCar,
      });
    } catch (error) {
      logger.error(
        `Failed to pubish message ${FleetEvents.car.created}`,
        error
      );
    }

    return new IReturnValue({
      success: true,
      message: 'Car created successfully',
      data: serialisedCar,
    });
  }
}
