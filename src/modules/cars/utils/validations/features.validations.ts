import Joi from "joi";
import { localeValidator } from ".";
import { FeatureCategory } from "@/common/enums";

const featureItem = Joi.object<CarFeatureTranslationDTO>({
    locale: localeValidator.required(),
    name: Joi.string().required().min(2).max(100).messages({
        'string.min': 'Feature name must be at least 2 characters',
        'string.max': 'Feature name cannot be more than 100 characters',
    }),
    description: Joi.string().optional().allow('').allow(null),
    shortDescription: Joi.string().optional().allow('').allow(null)
})

export const CreateFeatureSchema = Joi.object<CreateFeatureDTO>({
    category: Joi.string().valid(...Object.values(FeatureCategory)).required(),
    isHighlighted: Joi.boolean().optional().allow(null),
    translations: Joi.array().required().items(featureItem).min(1).has(Joi.object({ locale: Joi.string().valid('en').required() }).unknown(true)).required().messages({
        'array.hasUnknown': 'At least one translation must have the locale set to "en"',
    }),
}).unknown()