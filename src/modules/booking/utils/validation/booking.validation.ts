import { CreateBookingDto } from "@/common/dtos/booking.dto";
import { addHours, isAfter, isSameDay, set } from "date-fns";
import Joi, { AsyncValidationOptions } from "joi";
import { CreateDriverSchema } from "./driver.validation";
import { CreatePaymentSchema } from "./payment.validation";
import { SupportedCryptoCurrencies, SupportedFiatCurrencies } from "@/common/enums";

const PricingSchema = Joi.object<CreateBookingDto['pricing']>({
    breakdown: Joi.object<CreateBookingDto['pricing']['breakdown']>({
        base: Joi.object<CreateBookingDto['pricing']['breakdown']['base']>({
            amount: Joi.number().positive().min(0).required(),
            breakdown: Joi.array().items(Joi.object().unknown()).optional().allow(null),
            currency: Joi.string().valid(SupportedCryptoCurrencies.ERC20, ...Object.values(SupportedCryptoCurrencies), ...Object.values(SupportedFiatCurrencies)).required()
        }).required()
    }).required(),
    total: Joi.number().min(0).required()
})

// Main Joi schema for CreateBookingDto
export const NewBookingSchema = Joi.object<CreateBookingDto>({
    locale: Joi.string().valid("en", "ar", "fr", 'it', 'ru', 'zh', 'es').optional(), // Adjust based on SupportedLocales
    userId: Joi.string().required(), // Assuming UUID format for userId
    driver: Joi.alternatives().try(
        Joi.string(),
        CreateDriverSchema // If it's a nested object
    ).required(),
    carId: Joi.string().required(),
    pickupDate: Joi.date().required().custom((value, helpers) => {
        if (!value) {
            return helpers.error("any.invalid", { message: 'Pckup date must be in the future or today' });
        }
        const today = new Date()
        const pickup = new Date(value)

        if (!isAfter(pickup, set(today, { hours: 0, milliseconds: 0, minutes: 0, seconds: 0 })) && !isSameDay(pickup, set(today, { hours: 0, milliseconds: 0, minutes: 0, seconds: 0 }))) {
            return helpers.error("date.invalid", { message: "Pickup date must be in the future" });
        }
        return value;
    }),
    returnDate: Joi.date().required().custom((value, helpers) => {
        const { pickupDate } = helpers.state.ancestors[0]; // Get pickupDate from the object
        if (!pickupDate) {
            return helpers.error("any.invalid", { message: "pickupDate is required before returnDate validation" });
        }

        const pickup = new Date(pickupDate);
        const returnD = new Date(value);

        if (!isAfter(returnD, addHours(pickup, 24))) {
            return helpers.error("date.invalid", { message: "returnDate must be at least 24 hours after pickupDate" });
        }
        return value;
    }),
    pricing: PricingSchema.required(),
    paymentData: CreatePaymentSchema.required(),
    selectedAddons: Joi.array()
        .items(
            Joi.object({
                addonId: Joi.string().uuid().required(),
                priceOptionIndex: Joi.number().integer().min(0).required(),
                quantity: Joi.number().integer().min(1).optional(),
            })
        )
        .optional().allow(null),
});

export const validateBookingSchema = (dto: CreateBookingDto, options?: AsyncValidationOptions) => NewBookingSchema.validateAsync(dto, {
    abortEarly: false,
    ...(options || {}),
}) 