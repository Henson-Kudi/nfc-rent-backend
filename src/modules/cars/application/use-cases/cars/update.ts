import {
  Car,
  CarDocument,
  CarFeature,
  CarMedia,
  CarModel,
  CarOwnershipDetail,
  CarTranslation,
  RentalPricing,
  User,
} from '@/common/entities';
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
import { AppError, IReturnValue } from '@/common/utils';
import logger from '@/common/utils/logger';
import { CarDto, UpdateCarDto } from '@/common/dtos';
import { CarRepository } from '@/modules/cars/infrastrucure/car.repository';
import slugify from 'slugify';
import { DeepPartial, FindOptionsWhere, In, Not } from 'typeorm';
import { SerializerService } from '@/common/services/serializer.service';
import { FleetEvents } from '@/common/message-broker/events/fleet.events';

export class UpdateCarUseCase
  implements IUseCase<[string, UpdateCarDTO, User], IReturnValue<CarDto>>
{
  constructor(
    private readonly carRepo: CarRepository,
    private readonly messageBroker: IMessageBroker,
    private readonly serializer: SerializerService
  ) {}

  async execute(
    carId: string,
    data: UpdateCarDTO,
    actor: User
  ): Promise<IReturnValue<CarDto>> {
    // Validate the data
    const valid = await new UpdateCarDto(data).validate();

    // Ensure existence of car
    const foundCar = await this.carRepo.findOne({
      where: { id: carId },
      relations: ['translations', 'media', 'rentalPricings', 'documents'],
    }); // we need all translations

    if (!foundCar) {
      throw new AppError({
        statusCode: ResponseCodes.NotFound,
        message: 'Could not find selected car',
      });
    }

    // Check validation for unique fields (vin and slug (name in en translation))
    const filterQuery: FindOptionsWhere<Car>[] = [];

    // if updating translation in english, ensure that there is not already a car in the db with specific name
    const enTranslation = valid?.translations?.find(
      (itm) => itm?.locale === 'en'
    );

    if (enTranslation && enTranslation?.name) {
      filterQuery.push({ slug: slugify(enTranslation.name), id: Not(carId) });
    }

    // Check vin duplication
    if (valid?.vin) {
      filterQuery.push({ vin: valid?.vin, id: Not(carId) });
    }

    if (filterQuery.length) {
      const foundOther = await this.carRepo.findOne({
        where: filterQuery,
      });

      if (foundOther) {
        throw new AppError({
          message: `Car with the same ${valid?.vin === foundOther?.vin ? 'VIN number' : 'name'} already exists`,
          statusCode: ResponseCodes.BadRequest,
        });
      }
    }

    // Save to perform updates
    const {
      category,
      fuelType,
      transmission,
      currentStatus,
      listingType,
      acquisitionDate,
      condition,
      inspectionStatus,
      lastInspectionDate,
      nextInspectionDueDate,
      media,
      model,
      features,
      rentalPricings,
      documents,
      owner,
      translations,
      ...rest
    } = valid;

    const updatedCar = await this.carRepo.manager.transaction(
      async (manager) => {
        const repo = manager.getRepository(this.carRepo.target);

        // check model
        if (model) {
          const repo = manager.getRepository(CarModel);

          const found = await repo.findOne({
            where: { id: model },
            relations: ['brand'],
          });

          if (!found || !found.brand) {
            throw new AppError({
              message: 'Invalid car model or brand selected',
              statusCode: ResponseCodes.BadRequest,
            });
          }

          foundCar.model = found;
          foundCar.brand = found.brand;
        }

        if (features && features?.length) {
          const repo = manager.getRepository(CarFeature);
          foundCar.features = await repo.find({ where: { id: In(features) } });
        }

        if (media && media?.length) {
          const repo = manager.getRepository(CarMedia);
          // Delete any exisiting media (Since they would not be able to lookup again)
          await repo.delete(foundCar.media.map((itm) => itm.id));

          // save media
          const newMedia = await repo.save(
            media.map((itm) =>
              repo.create({
                ...itm,
                car: foundCar,
              })
            )
          );

          foundCar.media = newMedia;
        }

        if (rentalPricings && rentalPricings?.length) {
          const repo = manager.getRepository(RentalPricing);
          // Delete any exisiting prices (Since they would not be able to lookup again)
          await repo.delete(foundCar.rentalPricings.map((itm) => itm.id));

          // save prices
          const saved = await repo.save(
            rentalPricings.map((itm) =>
              repo.create({
                ...(itm as RentalPricing),
                car: foundCar,
              })
            )
          );

          foundCar.rentalPricings = saved;
        }

        if (documents && documents?.length) {
          const repo = manager.getRepository(CarDocument);
          // Delete any exisiting documents (Since they would not be able to lookup again)
          await repo.delete(foundCar.documents.map((itm) => itm.id));

          // save documents
          const saved = await repo.save(
            documents.map((itm) =>
              repo.create({
                ...itm,
                type: itm.type as CarDocumentType,
                car: foundCar,
              })
            )
          );

          foundCar.documents = saved;
        }

        if (owner) {
          const userRepo = manager.getRepository(User);
          const foundUser = await userRepo.findOneBy({ id: owner.ownerId });
          if (!foundUser) {
            throw new AppError({
              statusCode: ResponseCodes.BadRequest,
              message: `Owner with provided details could not be found`,
            });
          }

          const ownersRepo = manager.getRepository(CarOwnershipDetail);
          let existingOwner = await ownersRepo.findOne({
            where: {
              car: foundCar,
              owner: foundUser,
            },
          });

          if (existingOwner) {
            existingOwner = await ownersRepo.save(
              ownersRepo.merge(existingOwner, {
                ...owner,
                acquiredDate: owner?.acquiredDate
                  ? new Date(owner.acquiredDate)
                  : existingOwner?.acquiredDate || undefined,
                transferDate: owner?.transferDate
                  ? new Date(owner.transferDate)
                  : existingOwner?.transferDate || undefined,
              })
            );
          } else {
            existingOwner = await ownersRepo.save(
              ownersRepo.create({
                ...owner,
                owner: foundUser,
                car: foundCar,
              })
            );
          }
        }

        if (translations && translations?.length) {
          const repo = manager.getRepository(CarTranslation);

          const existingTranslationMap = new Map(
            (foundCar?.translations || [])?.map((item) => [item.locale, item])
          );

          const trans = translations.map((itm) => {
            const existingTranslation = existingTranslationMap.get(itm.locale);
            return existingTranslation
              ? repo.merge(existingTranslation, itm)
              : repo.create({
                  ...itm,
                  parent: foundCar,
                  parentId: foundCar.id,
                });
          });

          await repo.save(trans);

          foundCar.translations = trans;
        }

        const listingTypes: CarListingType[] = listingType
          ? ([
              ...new Set(...[...foundCar.listingType, listingType]).values(),
            ] as CarListingType[])
          : foundCar.listingType;

        const mergedCar = repo.merge(foundCar, {
          ...rest,
          category: (category as CarCategory | undefined) || undefined,
          fuelType: (fuelType as FuelType) || undefined,
          transmission: (transmission as TransmissionType) || undefined,
          currentStatus: (currentStatus as CarStatus) || undefined,
          listingType: listingTypes,
          acquisitionDate: acquisitionDate
            ? new Date(acquisitionDate)
            : undefined,
          condition: (condition as CarCondition) || undefined,
          inspectionStatus:
            (inspectionStatus as CarInspectionStatus) || undefined,
          lastInspectionDate: lastInspectionDate
            ? new Date(lastInspectionDate)
            : undefined,
          nextInspectionDueDate: nextInspectionDueDate
            ? new Date(nextInspectionDueDate).toString()
            : undefined,
        } as DeepPartial<Car>);

        const saved = await repo.save(mergedCar);

        return saved;
      }
    );

    try {
      await this.messageBroker.publishMessage(FleetEvents.car.updated, {
        data: { data: updatedCar, actor },
      });
    } catch (err) {
      logger.error(`Failed to publish ${FleetEvents.car.updated} event`, err);
    }

    const serialised = this.serializer.serialize(CarDto, updatedCar);

    return new IReturnValue({
      success: true,
      message: ' Car updated successfully',
      data: serialised,
    });
  }
}
