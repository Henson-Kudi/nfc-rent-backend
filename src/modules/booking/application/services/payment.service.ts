import { Booking, Payment } from "@/common/entities";
import { PaymentStatus } from "@/common/enums";
import { Inject, Service } from "typedi";
import { Repository } from "typeorm";
import { CurrencyService } from "./currency.service";
import { CreatePaymentDto } from "@/common/dtos";
import Stripe from "stripe";
import { StripeService } from "../../../../common/services/stripe.service";
import envConf from "@/config/env.conf";

@Service()
export class PaymentService {

    constructor(
        @Inject()
        private currencyService: CurrencyService,
        @Inject()
        private stripe: StripeService,
        @Inject()
        private configService: any,
        @Inject()
        private paymentRepository: Repository<Payment>,
    ) { }

    async createPayment(payload: CreatePaymentDto, booking: Booking) {
        if (payload.currency === 'USDT') {
            return this.handleCryptoPayment(payload, booking);
        }

        // Convert to USD equivalent for Stripe
        const usdAmount = await this.currencyService.convert(
            payload.amount,
            payload.currency,
            'USD'
        );

        const product = booking?.car?.translations?.find(itm => itm.locale == 'en')

        // Existing Stripe handling
        const paymentSession = await this.stripe.createCheckoutSession({
            lineItems: [{ productName: product?.name || '', unitPrice: usdAmount, productDescription: product?.shortDescription, quantity: 1 }],
            bookingId: booking.id || payload.bookingId,
            cancelUrl: `${envConf.FRONTEND_URL}/booking/${booking.id || payload.bookingId}`,
            successUrl: `${envConf.FRONTEND_URL}/booking/${booking.id || payload.bookingId}/success`,
            clientEmail: booking?.user?.email,
            clientId: booking?.user?.id
        },);

        const payment = await this.paymentRepository.save(this.paymentRepository.create({
            booking: { id: payload.bookingId },
            amount: payload.amount,
            transactionId: typeof paymentSession?.payment_intent === 'string' ? paymentSession?.payment_intent : paymentSession?.payment_intent?.id,
            paymentMethod: payload.paymentMethod,
            status: PaymentStatus.PENDING,
        }));

        return {
            paymentSession,
            payment
        };
    }

    private async handleCryptoPayment(payload: CreatePaymentDto, booking: Booking) {
        // Integrate with your crypto payment gateway
        const cryptoAmount = await this.currencyService.convert(
            payload.amount,
            payload.currency,
            'USD'
        );

        // Create crypto payment request
        const paymentRecord = this.paymentRepository.create({
            booking,
            amount: cryptoAmount,
            currency: 'USDT',
            status: PaymentStatus.PENDING,
            paymentMethod: 'crypto'
        });

        await this.paymentRepository.save(paymentRecord);

        return {
            cryptoAddress: this.configService.get('CRYPTO_WALLET_ADDRESS'),
            amount: cryptoAmount,
            currency: 'USDT',
            paymentId: paymentRecord.id
        };
    }

    async confirmPayment(paymentIntentId: string) {
        const paymentIntent = await this.stripe.capturePayment(paymentIntentId);

        await this.paymentRepository.update(
            { transactionId: paymentIntentId },
            {
                status: PaymentStatus.PAID,
                paidAt: new Date(),
                // paymentMetadata: JSON.stringify(paymentIntent.metadata),
            }
        );

        return paymentIntent;
    }

    async processRefund(paymentIntentId: string) {
        const refund = await this.stripe.processRefund(paymentIntentId);

        await this.paymentRepository.update(
            { transactionId: paymentIntentId },
            { status: PaymentStatus.REFUNDED }
        );

        return refund;
    }
}