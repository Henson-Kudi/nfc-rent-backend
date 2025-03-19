import { BookingDto } from "@/common/dtos";
import { ResponseCodes } from "@/common/enums";
import { AppError, IReturnValueWithPagination } from "@/common/utils";
import { BookingService } from "@/modules/booking/application/services/booking.service";
import { Request } from "express";
import Container from "typedi";

export class GetUserBookingsController implements IController<Promise<IReturnValueWithPagination<BookingDto>>> {
    handle(request: Request): Promise<IReturnValueWithPagination<BookingDto>> {
        if (!request.user) {
            throw new AppError({
                message: "Unauthorised",
                statusCode: ResponseCodes.UnAuthorised
            })
        }
        const service = Container.get(BookingService)

        return service.getUserBookings(request.user.id, request.query)
    }

}