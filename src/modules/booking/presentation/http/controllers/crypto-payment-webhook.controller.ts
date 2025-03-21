import { Payment } from '@/common/entities';
// import { ResponseCodes } from '@/common/enums';
// import { AppError } from '@/common/utils';
// import envConf from '@/config/env.conf';
import { PaymentService } from '@/modules/booking/application/services/payment.service';
// import { Webhook } from 'coinbase-commerce-node';
import { Request } from 'express';
import Container from 'typedi';

export class CryptoPaymentWebhookController
  implements IController<Promise<Payment>>
{
  handle(request: Request): Promise<Payment> {
    const service = Container.get(PaymentService);
    return service.handleCryptoPaymentWebhookEvents(request.body);

    // OPTION 2 - USING COINBASE API
    // const service = Container.get(PaymentService)
    // const signature = request.headers?.["x-cc-webhook-signature"] as string; // Coinbase signature
    // const payload = request.body.toString("utf8"); // Convert Buffer to string

    // const event = Webhook.verifyEventBody(payload, envConf.coinbase.webhookKey, signature)

    // return service.handleCryptoPaymentWebhookEvents(event)
  }
}
