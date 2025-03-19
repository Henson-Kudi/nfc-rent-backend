import { Payment } from "@/common/entities";
import { StripeService } from "@/common/services/stripe.service";
import { PaymentService } from "@/modules/booking/application/services/payment.service";
import { Request } from "express";
import Container from "typedi";

export class FiatPaymentWebhookController implements IController<Promise<Payment>> {
    handle(request: Request): Promise<Payment> {
        const service = Container.get(PaymentService)
        const sig = request.headers["stripe-signature"];
        const stripe = Container.get(StripeService)

        const event = stripe.constructWebhookEvent(request.body, sig as string);

        return service.handleFiatPaymentWebhookEvents(event)
    }

}