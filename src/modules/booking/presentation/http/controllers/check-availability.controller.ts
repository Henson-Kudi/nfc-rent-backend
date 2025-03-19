import { ResponseCodes } from "@/common/enums";
import { AppError, IReturnValue } from "@/common/utils";
import { BookingService } from "@/modules/booking/application/services/booking.service";
import { Request } from "express";
import Container from "typedi";

export class CheckCarAvailabilityController implements IController<Promise<IReturnValue<boolean>>> {
    async handle(request: Request): Promise<IReturnValue<boolean>> {
        if (!request.user) {
            throw new AppError({
                message: "Unauthorised",
                statusCode: ResponseCodes.UnAuthorised
            })
        }
        const service = Container.get(BookingService)
        const isCarAvailable = await service.isCarAvailable(request.params.carId, request.body.startDate, request.body.endDate)

        return new IReturnValue({
            success: true,
            message: 'Success',
            data: isCarAvailable
        })
    }

}