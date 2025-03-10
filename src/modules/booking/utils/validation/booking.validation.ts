import { CreateBookingDto } from "@/common/dtos/booking.dto";
import Joi, { AsyncValidationOptions } from "joi";

export const NewBookingSchema = Joi.object<CreateBookingDto>({
    carId: Joi.string().required()
})

export const validateBookingSchema = (dto: CreateBookingDto, options?: AsyncValidationOptions) => NewBookingSchema.validateAsync(dto, {
    abortEarly: false,
    ...(options || {}),
}) 