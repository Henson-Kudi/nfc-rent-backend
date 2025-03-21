import Joi from 'joi';
import { localeValidator } from '.';

const brandItem = Joi.object<CarBrandTranslationDTO>({
  locale: localeValidator.required(),
  name: Joi.string().required().min(2).max(100).messages({
    'string.min': 'Brand name must be at least 2 characters',
    'string.max': 'Brand name cannot be more than 100 characters',
  }),
  description: Joi.string().optional().allow('').allow(null),
  metaDescription: Joi.string().optional().allow('').allow(null),
  metaTags: Joi.string().optional().allow('').allow(null),
  metaTitle: Joi.string().optional().allow('').allow(null),
  shortDescription: Joi.string().optional().allow('').allow(null),
});

export const CreateBrandSchema = Joi.object<CreateBrandDTO>({
  coverImage: Joi.string().optional().allow('').allow(null),
  logo: Joi.string().optional().allow('').allow(null),
  translations: Joi.array()
    .required()
    .items(brandItem)
    .min(1)
    .has(
      Joi.object({ locale: Joi.string().valid('en').required() }).unknown(true)
    )
    .required()
    .messages({
      'array.hasUnknown':
        'At least one translation must have the locale set to "en"',
    }),
}).unknown();
