import Joi from 'joi';
import is639 from 'iso-639-1';

export const localeValidator = Joi.string()
  .custom((val, helpers) => {
    if (!is639.validate(val)) {
      return helpers.error('string.refine', { value: val });
    }
    return val;
  })
  .messages({
    'string.refine': '"{{#label}}" must be a valid ISO 639-1 code',
  });
