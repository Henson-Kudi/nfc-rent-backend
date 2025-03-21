import { getBestTranslation } from '@/common/utils/getBestTranslation';
import { BaseDto } from '@/common/dtos/base.dto';
import { Expose, Transform } from 'class-transformer';
import { CarFeatureTranslation } from '@/common/entities';
import { carFeatreCategoryTranslations } from '@/common/utils/translations/car/car-feature-category.translation';
import { LocalizedEnum } from '@/common/utils/localized-enum.decorator';
import { CreateFeatureSchema } from '@/modules/cars/utils/validations/features.validations';

export class CarFeatureDto extends BaseDto {
  @Expose()
  code!: string;
  @Expose()
  slug!: string;
  @Expose()
  @LocalizedEnum(carFeatreCategoryTranslations)
  category!: string;
  @Expose()
  isHighlighted!: boolean;

  // Translation fields - to be added by serializer
  @Expose()
  @Transform(({ options, obj }) => {
    const best = getBestTranslation<CarFeatureTranslation>(
      obj?.translations || [],
      options?.locale || 'en',
      options.defaultLocale
    );
    return best?.name || 'No name';
  })
  name?: string;

  @Expose()
  @Transform(({ options, obj }) => {
    const best = getBestTranslation<CarFeatureTranslation>(
      obj?.translations || [],
      options?.locale || 'en',
      options.defaultLocale
    );
    return best?.shortDescription || '';
  })
  shortDescription?: string;

  @Expose()
  @Transform(({ options, obj }) => {
    const best = getBestTranslation<CarFeatureTranslation>(
      obj?.translations || [],
      options?.locale || 'en',
      options.defaultLocale
    );
    return best?.description || '';
  })
  description?: string;
}

export class CreateFeatureDto implements CreateFeatureDTO {
  constructor(data: CreateFeatureDTO) {
    Object.assign(this, data);
  }

  category!: string;
  isHighlighted!: boolean;
  translations!: NonEmptyArray<CarFeatureTranslationDTO>;

  validate() {
    return CreateFeatureSchema.validateAsync(this, {
      abortEarly: false,
    });
  }
}

export class UpdateFeatureDto implements UpdateFeatureDTO {
  constructor(data: UpdateFeatureDTO) {
    Object.assign(this, data);
  }

  category?: string;
  isHighlighted?: boolean;
  translations?: NonEmptyArray<CarFeatureTranslationDTO>;

  validate() {
    return CreateFeatureSchema.validateAsync(this, {
      abortEarly: false,
      presence: 'optional',
    });
  }
}
