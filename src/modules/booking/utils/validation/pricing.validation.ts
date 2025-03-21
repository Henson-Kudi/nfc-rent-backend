import {
  SupportedCryptoCurrencies,
  SupportedCurrencies,
  SupportedFiatCurrencies,
} from '@/common/enums';
import { differenceInDays, isAfter } from 'date-fns';
import Joi from 'joi';

export const estimatePriceSchema = Joi.object<{
  carId: string;
  startDate: string;
  endDate: string;
  currency: SupportedCurrencies;
}>({
  carId: Joi.string().required(),
  startDate: Joi.date()
    .iso()
    .required()
    .custom((val, helpers) => {
      const valid = isAfter(new Date(val), new Date()); // pickup date must be in the future of now

      if (!valid) {
        return helpers.error('date.invalid', {
          message: 'Start date must be in the future',
        });
      }
      // ust be in future
      return val;
    })
    .messages({
      'date.invalid': 'Start date must be in the future',
    }),
  endDate: Joi.date()
    .iso()
    .required()
    .custom((value, helpers) => {
      const { startDate } = helpers.state.ancestors[0];

      if (!(differenceInDays(new Date(value), new Date(startDate)) >= 1)) {
        return helpers.error('date.invalid', {
          message: 'Booking duration must be at least 1 day',
        });
      }
      return value;
    })
    .messages({
      'date.invalid': 'Booking duration must be at least 1 day',
    }),
  currency: Joi.string().valid(
    SupportedCryptoCurrencies.ERC20,
    ...Object.values(SupportedCryptoCurrencies),
    ...Object.values(SupportedFiatCurrencies)
  ),
});

export function validatePriceEstimator(
  data: unknown,
  optional: boolean = false
) {
  const options: Joi.ValidationOptions = {
    abortEarly: false,
  };
  if (optional) {
    options.presence = 'optional';
  }
  return estimatePriceSchema.validateAsync(data, options);
}
