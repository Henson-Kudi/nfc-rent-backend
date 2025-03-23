import { BookingDto } from "@/common/dtos";
import { ResponseCodes } from "@/common/enums";
import { AppError, IReturnValue } from "@/common/utils";
import { BookingService } from "@/modules/booking/application/services/booking.service";
import { Request } from "express";
import Container from "typedi";

export default class DeleteMyBookingController implements IController<Promise<IReturnValue<BookingDto>>> {
    handle(request: Request): Promise<IReturnValue<BookingDto>> {
        if (!request.user) {
            throw new AppError({
                message: "Not authnticated",
                statusCode: ResponseCodes.UnAuthorised
            })
        }

        const bookingService = Container.get(BookingService)

        return bookingService.deleteBooking(request.params.id, request.user)

    }
}