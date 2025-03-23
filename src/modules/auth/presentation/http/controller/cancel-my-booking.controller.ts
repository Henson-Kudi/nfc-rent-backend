import { BookingDto } from "@/common/dtos";
import { ResponseCodes } from "@/common/enums";
import { AppError, IReturnValue } from "@/common/utils";
import { BookingService } from "@/modules/booking/application/services/booking.service";
import { Request } from "express";
import Container from "typedi";

export default class CancelMyBookingController implements IController<Promise<IReturnValue<BookingDto>>> {
    handle(request: Request): Promise<IReturnValue<BookingDto>> {
        if (!request.user) {
            throw new AppError({
                message: "Not authnticated",
                statusCode: ResponseCodes.UnAuthorised
            })
        }

        const bookingService = Container.get(BookingService)

        return bookingService.cancelBooking({
            actor: request.user,
            bookingId: request.params.id,
            locale: request?.body?.locale || request?.query?.locale,
            reason: request?.body?.reason
        })

    }
}