import Joi from "joi";
import { localeValidator } from ".";

const modelItem = Joi.object<CarModelTranslationDTO>({
    locale: localeValidator.required(),
    name: Joi.string().required().min(2).max(100).messages({
        'string.min': 'Model name must be at least 2 characters',
        'string.max': 'Model name cannot be more than 100 characters',
    }),
    description: Joi.string().optional().allow('').allow(null),
    metaDescription: Joi.string().optional().allow('').allow(null),
    metaTags: Joi.string().optional().allow('').allow(null),
    metaTitle: Joi.string().optional().allow('').allow(null),
    shortDescription: Joi.string().optional().allow('').allow(null)
})

export const CreateModelSchema = Joi.object<CreateModelDTO>({
    brandId: Joi.string().required(),
    translations: Joi.array().required().items(modelItem).min(1).has(Joi.object({ locale: Joi.string().valid('en').required() }).unknown(true)).required().messages({
        'array.hasUnknown': 'At least one translation must have the locale set to "en"',
    }),
}).unknown()