import { CreateBookingDto } from '@/common/dtos/booking.dto';
import { differenceInDays, isAfter } from 'date-fns';
import Joi, { AsyncValidationOptions } from 'joi';
import { CreateDriverSchema } from './driver.validation';

// Main Joi schema for CreateBookingDto
export const NewBookingSchema = Joi.object<CreateBookingDto>({
  locale: Joi.string()
    .valid('en', 'ar', 'fr', 'it', 'ru', 'zh', 'es')
    .optional(), // Adjust based on SupportedLocales
  userId: Joi.string().required(), // Assuming UUID format for userId
  driver: CreateDriverSchema.required(),
  carId: Joi.string().required(),
  pickupDate: Joi.date()
    .iso()
    .required()
    .custom((value, helpers) => {
      if (!value) {
        return helpers.error('any.invalidPickupDate', {
          message: 'Pckup date must be in the future or today',
        });
      }
      const today = new Date();
      const pickup = new Date(value);

      if (!isAfter(pickup, today)) {
        return helpers.error('date.pickupInFuture', {
          message: 'Pickup date must be in the future',
        });
      }
      return value;
    })
    .messages({
      'date.pickupInFuture': 'Pickup date must be in the future',
      'date.invalidPickupDate': 'Invalid pickup date',
    }),
  returnDate: Joi.date()
    .iso()
    .required()
    .custom((value, helpers) => {
      const { pickupDate } = helpers.state.ancestors[0]; // Get pickupDate from the object
      if (!pickupDate) {
        return helpers.error('any.invalidPickupDate', {
          message: 'Invalid pickup date',
        });
      }

      const pickup = new Date(pickupDate);
      const returnD = new Date(value);

      if (!(differenceInDays(returnD, pickup) >= 1)) {
        return helpers.error('any.invalidDuration', {
          message: 'Booking duration must be at least 1 day.',
        });
      }
      return value;
    })
    .messages({
      'any.invalidPickupDate': 'Invalid pickup date',
      'any.invalidDuration': 'Booking duration must be at least 1 day.',
    }),
  pickupLocation: Joi.string().optional().allow('').allow(null),
  returnLocation: Joi.string().optional().allow('').allow(null),
  pricing: Joi.string().required(), // jwt token from pricing service. We'll decode this token and use its price data
  plateNumber: Joi.string().required(), // jwt token from pricing service. We'll decode this token and use its price data
  selectedAddons: Joi.array()
    .items(
      Joi.object({
        addonId: Joi.string().uuid().required(),
        priceOptionIndex: Joi.number().integer().min(0).required(),
        quantity: Joi.number().integer().min(1).optional(),
      })
    )
    .optional()
    .allow(null),
}).unknown();

export const validateBookingSchema = (
  dto: CreateBookingDto,
  options?: AsyncValidationOptions
) =>
  NewBookingSchema.validateAsync(dto, {
    abortEarly: false,
    ...(options || {}),
  });
