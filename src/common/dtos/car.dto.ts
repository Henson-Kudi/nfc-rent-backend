import { BaseDto } from './base.dto';
import { CarCategory, CarCondition, CarInspectionStatus, CarListingType, CarStatus, FuelType, MediaType, TransmissionType } from '@/common/enums';
import { CarBrandDto, CarModelDto, CarFeatureDto, CarMediaDto, RentalPricingDto, CarDocumentDto, CarOwnershipDetailDto, CarHistoryRecordDto } from '.';
import { Expose, Transform, Type } from 'class-transformer';
import { getBestTranslation } from "@/common/utils/getBestTranslation";
import { CarTranslation } from "@/common/entities";
import { LocalizedEnum } from "@/common/utils/localized-enum.decorator";
import { carCategoryTranslations } from "@/common/utils/translations/car/car-category.translation";
import { carFuelTypeTranslations } from "@/common/utils/translations/car/car-fuel-type.translation";
import { carTransmissionTypeTranslations } from "@/common/utils/translations/car/car-transmission-type.translation";
import { carStatusTranslations } from "@/common/utils/translations/car/car-status.translation";
import { carListingTypeTranslations } from "@/common/utils/translations/car/car-listing-type.translation";
import { carConditionTranslations } from "@/common/utils/translations/car/car-condition.translation";
import { carInspectionStatusTranslations } from "@/common/utils/translations/car/car-inspection-status.translation";
import { CreateCarSchema } from '@/modules/cars/utils/validations/cars.validations';

export class CarDto extends BaseDto {
    @Expose() slug!: string;
    @Expose() vin!: string;
    @Expose() blockchainId?: string;
    @Expose() year!: number;
    @Expose()
    @LocalizedEnum(carCategoryTranslations)
    category!: CarCategory;
    @Expose()
    @LocalizedEnum(carFuelTypeTranslations)
    fuelType!: FuelType;
    @Expose()
    @LocalizedEnum(carTransmissionTypeTranslations)
    transmission!: TransmissionType;
    @Expose() doors!: number;
    @Expose() seats!: number;

    // Instead of separate relations, we assume the Car entity has a media array.
    // We define getters using @Transform to filter media by type.
    @Expose()
    @Type(() => CarMediaDto)
    images!: CarMediaDto[];

    @Expose()
    @Type(() => CarMediaDto)
    videos!: CarMediaDto[];

    @Expose()
    @Type(() => CarMediaDto)
    virtualTourMedia!: CarMediaDto[];

    @Expose() metaverseAssetId?: string;
    @Expose()
    @LocalizedEnum(carStatusTranslations)
    currentStatus!: CarStatus;
    @Expose()
    @LocalizedEnum(carListingTypeTranslations)
    listingType!: CarListingType[];
    @Expose() acquisitionDate?: string | Date;
    @Expose() mileage!: number;
    @Expose()
    @LocalizedEnum(carConditionTranslations)
    condition!: CarCondition;
    @Expose()
    @LocalizedEnum(carInspectionStatusTranslations)
    inspectionStatus!: CarInspectionStatus;
    @Expose() lastInspectionDate?: Date | string;
    @Expose() nextInspectionDueDate?: string;

    // Nested objects are automatically transformed using the provided DTOs.
    @Expose()
    @Type(() => CarBrandDto)
    brand?: CarBrandDto;

    @Expose()
    @Type(() => CarModelDto)
    model?: CarModelDto;

    @Expose()
    @Type(() => CarFeatureDto)
    features?: CarFeatureDto[];

    @Expose()
    @Type(() => RentalPricingDto)
    rentalPricings!: RentalPricingDto[];

    @Expose()
    @Type(() => CarDocumentDto)
    documents!: CarDocumentDto[];

    @Expose()
    @Type(() => CarOwnershipDetailDto)
    ownershipDetails!: CarOwnershipDetailDto[];

    @Expose()
    @Type(() => CarHistoryRecordDto)
    history!: CarHistoryRecordDto[];

    @Expose()
    engineSpecs!: {
        type: string;
        horsepower: number;
        torque: number;
        displacement?: number;
        batteryCapacity?: number;
        range?: number;
        acceleration: number;
        topSpeed: number;
    };

    @Expose()
    dimensions!: {
        length: number;
        width: number;
        height: number;
        weight: number;
        cargoCapacity: number;
    };

    // Translation Fields
    @Expose()
    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
        return best?.name || 'No name';
    })
    name!: string;

    @Expose()
    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
        return best?.shortDescription || '';
    })
    shortDescription?: string;

    @Expose()
    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
        return best?.description || '';
    })
    description?: string;

    // Combine meta fields from translation into a meta object.
    @Expose()
    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
        return {
            title: best?.metaTitle,
            description: best?.metaDescription,
            tags: best?.metaTags?.split(',')
        };
    })
    metadata?: {
        title?: string;
        description?: string;
        tags?: string[];
    };

    @Expose()
    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
        return best?.color;
    })
    color?: { name: string; code?: string };

    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
        return best?.interiorColor;
    })
    interiorColor?: { name: string; code?: string };
}


export class CreateCarDto implements CreateCarDTO {
    constructor(data: CreateCarDTO) {
        Object.assign(this, data)
    }
    vin!: string;
    blockchainId?: string | undefined;
    year!: number;
    category!: string;
    fuelType!: string;
    transmission!: string;
    doors!: number;
    seats!: number;
    metaverseAssetId?: string | undefined;
    currentStatus!: string;
    listingType!: string[];
    acquisitionDate?: DateInputType | undefined;
    mileage!: number;
    condition!: string;
    inspectionStatus!: string;
    lastInspectionDate?: DateInputType | undefined;
    nextInspectionDueDate?: DateInputType | undefined;
    engineSpecs!: { type: string; horsepower: number; torque: number; displacement?: number; batteryCapacity?: number; range?: number; acceleration: number; topSpeed: number; };
    dimensions!: { length: number; width: number; height: number; weight: number; cargoCapacity: number; };
    media!: globalThis.CarMedia[];
    model!: string;
    features?: string[] | undefined;
    rentalPricings?: globalThis.RentalPricing[] | undefined;
    documents?: globalThis.CarDocument[] | undefined;
    owner?: { ownerId: string; ownerType: 'User' | 'Company'; percentage: number; nftId?: string; acquiredDate: DateInputType; transferDate?: DateInputType; status: 'Active' | 'Pending' | 'Transferred'; } | undefined;
    translations!: NonEmptyArray<CarTranslationDTO>;

    validate() {
        return CreateCarSchema.validateAsync(this, {
            abortEarly: true
        })
    }
}

export class UpdateCarDto implements UpdateCarDTO {
    constructor(data: UpdateCarDTO) {
        Object.assign(this, data)
    }

    vin?: string;
    blockchainId?: string | undefined;
    year?: number;
    category?: string;
    fuelType?: string;
    transmission?: string;
    doors?: number;
    seats?: number;
    metaverseAssetId?: string | undefined;
    currentStatus?: string;
    listingType?: string[];
    acquisitionDate?: DateInputType | undefined;
    mileage?: number;
    condition?: string;
    inspectionStatus?: string;
    lastInspectionDate?: DateInputType | undefined;
    nextInspectionDueDate?: DateInputType | undefined;
    engineSpecs?: { type: string; horsepower: number; torque: number; displacement?: number; batteryCapacity?: number; range?: number; acceleration: number; topSpeed: number; };
    dimensions?: { length: number; width: number; height: number; weight: number; cargoCapacity: number; };
    media?: globalThis.CarMedia[];
    model?: string;
    features?: string[] | undefined;
    rentalPricings?: globalThis.RentalPricing[] | undefined;
    documents?: globalThis.CarDocument[] | undefined;
    owner?: { ownerId: string; ownerType: 'User' | 'Company'; percentage: number; nftId?: string; acquiredDate: DateInputType; transferDate?: DateInputType; status: 'Active' | 'Pending' | 'Transferred'; } | undefined;
    translations?: NonEmptyArray<CarTranslationDTO>;




    validate() {
        return CreateCarSchema.validateAsync(this, {
            abortEarly: true,
            presence: 'optional' // this makes all fields optional. No need to create a new schema for update since the fields and validations are thesame, just that they're optional
        })
    }
}
