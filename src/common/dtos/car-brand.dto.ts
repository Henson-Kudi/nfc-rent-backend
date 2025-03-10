import { getBestTranslation } from "@/common/utils/getBestTranslation";
import { Expose, Transform } from 'class-transformer';
import { CarBrandTranslation } from "@/common/entities";
import { BaseDto } from "@/common/dtos/base.dto";
import { CreateBrandSchema } from "@/modules/cars/utils/validations/bands.validations";

export class CarBrandDto extends BaseDto {
    @Expose()
    code!: string;
    @Expose()
    logo?: string;
    @Expose()
    slug!: string;

    // Translation fields (to be added by serializer)
    @Expose()
    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarBrandTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
        return best?.name || 'No name';
    })
    name?: string;

    @Expose()
    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarBrandTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
        return best?.shortDescription || '';
    })
    shortDescription?: string;

    @Expose()
    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarBrandTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
        return best?.description || '';
    })
    description?: string;

    @Expose()
    @Transform(({ options, obj }) => {
        const best = getBestTranslation<CarBrandTranslation>(obj?.translations || [], options?.locale || 'en', options.defaultLocale);
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


export class CreateBrandDto implements CreateBrandDTO {
    constructor(data: CreateBrandDTO) {
        Object.assign(this, data)
    }

    code!: string
    logo?: string
    coverImage?: string
    translations!: NonEmptyArray<CarBrandTranslationDTO>

    validate() {
        return CreateBrandSchema.validateAsync(this, {
            abortEarly: false
        })
    }
}

export class UpdateBrandDto implements UpdateBrandDTO {
    constructor(data: UpdateBrandDTO) {
        Object.assign(this, data)
    }

    logo?: string
    coverImage?: string
    translations?: NonEmptyArray<CarBrandTranslationDTO>

    validate() {
        return CreateBrandSchema.validateAsync(this, {
            abortEarly: false,
            presence: 'optional' // since the datastructure is same, makes the fields optional since we want to pass only the fields that require an update
        })
    }
}
