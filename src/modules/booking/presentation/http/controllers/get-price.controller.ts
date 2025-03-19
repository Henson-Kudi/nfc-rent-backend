import { BookingDto } from "@/common/dtos";
import { ResponseCodes, SupportedCurrencies, SupportedFiatCurrencies } from "@/common/enums";
import { AppError, IReturnValue } from "@/common/utils";
import { BookingService } from "@/modules/booking/application/services/booking.service";
import { PricingService } from "@/modules/booking/application/services/pricing.service";
import { Request } from "express";
import Container from "typedi";

export class GetBookingPriceController implements IController<Promise<IReturnValue<{
    total: number;
    breakdown: {
        base: {
            amount: number;
            currency: SupportedCurrencies;
            breakdown: {
                amount: number;
                unit: string;
                duration: number;
                count: number;
            }[];
        };
    };
}>>> {
    handle(request: Request): Promise<IReturnValue<{
        total: number;
        breakdown: {
            base: {
                amount: number;
                currency: SupportedCurrencies;
                breakdown: {
                    amount: number;
                    unit: string;
                    duration: number;
                    count: number;
                }[];
            };
        };
    }>> {
        
        const service = Container.get(PricingService)

        return service.calculateTotalPrice(request.body.carId, new Date(request.body.startDate), new Date(request.body.endDate), request?.body?.currency || SupportedFiatCurrencies.USD)
    }

}