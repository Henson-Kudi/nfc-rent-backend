import { BookingDto } from "@/common/dtos";
import { ResponseCodes } from "@/common/enums";
import { AppError, IReturnValueWithPagination } from "@/common/utils";
import { BookingService } from "@/modules/booking/application/services/booking.service";
import { Request } from "express";
import Container from "typedi";

export default class GetMyBookingsController implements IController<Promise<IReturnValueWithPagination<BookingDto>>> {
    handle(request: Request): Promise<IReturnValueWithPagination<BookingDto>> {
        if (!request.user) {
            throw new AppError({
                message: "Not authnticated",
                statusCode: ResponseCodes.UnAuthorised
            })
        }

        const bookingService = Container.get(BookingService)

        return bookingService.getUserBookings(request.user.id, request.query)

    }
}