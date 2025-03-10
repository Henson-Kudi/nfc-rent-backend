import { CreateModelSchema } from "../../modules/cars/utils/validations/models.validations";
import { CarBrandDto } from './car-brand.dto';
import { BaseDto } from './base.dto';
import { Expose, Transform } from 'class-transformer';
import { getBestTranslation } from "@/common/utils/getBestTranslation";
import { CarModelTranslation } from "@/common/entities";

export class CarModelDto extends BaseDto {
    @Expose()
    code!: string;
    @Expose()
    slug!: string
    @Expose()
    brand?: CarBrandDto;

    // Translation fields
    @Expose()
    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarModelTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
        return best?.name || 'No name';
    })
    name?: string;

    @Expose()
    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarModelTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
        return best?.shortDescription || '';
    })
    shortDescription?: string;

    @Expose()
    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarModelTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
        return best?.description || '';
    })
    description?: string;

    @Expose()
    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarModelTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
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
}


export class CreateModelDto implements CreateModelDTO {
    constructor(data: CreateModelDTO) {
        Object.assign(this, data)
    }
    brandId!: string;
    translations!: NonEmptyArray<CarModelTranslationDTO>

    validate() {
        return CreateModelSchema.validateAsync(this, {
            abortEarly: false
        })
    }
}

export class UpdateModelDto implements UpdateModelDTO {
    constructor(data: UpdateModelDTO) {
        Object.assign(this, data)
    }
    brandId?: string;
    translations?: NonEmptyArray<CarModelTranslationDTO>

    validate() {
        return CreateModelSchema.validateAsync(this, {
            abortEarly: false
        })
    }
}
