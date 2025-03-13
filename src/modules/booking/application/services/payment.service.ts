import { Booking } from "@/common/entities";
import { PaymentStatus, ResponseCodes, SupportedCryptoCurrencies, SupportedCurrencies } from "@/common/enums";
import { Inject, Service } from "typedi";
import { CreatePaymentDto } from "@/common/dtos";
import { StripeService } from "../../../../common/services/stripe.service";
import envConf from "@/config/env.conf";
import { PaymentRepository } from "../repository/payment.repository";
import { CryptoPaymentFactory } from "@/common/services/crypto-payment.service";
import { MessageBrokerToken } from "@/common/message-broker";
import { paymentCreated, paymentConfirmed, paymentRefunded } from '../../utils/messages.json'
import { AppError } from "@/common/utils";
import Stripe from "stripe";

@Service()
export class PaymentService {

    constructor(
        @Inject()
        private stripe: StripeService,
        @Inject()
        private cryptoFactory: CryptoPaymentFactory,
        @Inject()
        private paymentRepository: PaymentRepository,
        @Inject(MessageBrokerToken)
        private messageBroker: IMessageBroker,

    ) { }

    async createPayment(payload: CreatePaymentDto, booking: Booking) {

        let payment = await this.paymentRepository.save(this.paymentRepository.create({
            booking,
            amount: payload.amount,
            paymentMethod: payload.paymentMethod,
            status: PaymentStatus.PENDING,
            isCrypto: false
        }))

        let paymentSession: Stripe.Response<Stripe.Checkout.Session> | {
            address: string;
            amount: string;
            currency: SupportedCurrencies;
            instructions: string;
        } | null = null

        let paymentMethod: 'FIAT' | 'CRYPTO' = 'FIAT'


        if (!this.cryptoFactory.isCryptoCurrency(payload.currency as SupportedCurrencies)) {
            const product = booking?.car?.translations?.find(itm => itm.locale == 'en')

            // Existing Stripe handling
            paymentSession = await this.stripe.createCheckoutSession({
                lineItems: [{ productName: product?.name || '', unitPrice: payload.amount, productDescription: product?.shortDescription, quantity: 1 }],
                bookingId: booking.id || payload.bookingId,
                cancelUrl: `${envConf.FRONTEND_URL}/booking/${booking.id || payload.bookingId}`,
                successUrl: `${envConf.FRONTEND_URL}/booking/${booking.id || payload.bookingId}/success`,
                clientEmail: booking?.user?.email,
                clientId: booking?.user?.id,
                currency: payload.currency as SupportedCurrencies
            });

            // save payment
            payment = await this.paymentRepository.save(this.paymentRepository.merge(payment, { transactionId: typeof paymentSession.payment_intent === 'string' ? paymentSession.payment_intent : paymentSession.payment_intent?.id }))
        } else {
            const cryptoNetwork = this.cryptoFactory.getNetworkFromCurrency(payload.currency as SupportedCryptoCurrencies)

            const paymentProcessor = this.cryptoFactory.getProcessor(cryptoNetwork)

            paymentSession = await paymentProcessor.generatePaymentWallet(payment)

            paymentMethod = 'CRYPTO'
        }

        this.messageBroker.publishMessage(paymentCreated, { data: { payment } })

        return {
            session: paymentSession,
            paymentMethod: paymentMethod,
            payment
        };
    }

    async confirmPayment(paymentIntentId: string) {
        let payment = await this.paymentRepository.findOneBy({ transactionId: paymentIntentId })

        if (!payment) {
            throw new AppError({
                message: `Payment not found for specified transaction id`,
                statusCode: ResponseCodes.BadRequest
            })
        }

        const paymentIntent = await this.stripe.capturePayment(paymentIntentId);

        payment = await this.paymentRepository.save(
            this.paymentRepository.merge(payment, {
                status: PaymentStatus.PAID,
                paidAt: new Date(),
            })
        );

        this.messageBroker.publishMessage(paymentConfirmed, { data: { payment } })

        return paymentIntent;
    }

    async processRefund(paymentIntentId: string) {
        let payment = await this.paymentRepository.findOneBy({ transactionId: paymentIntentId })

        if (!payment) {
            throw new AppError({
                message: `Payment not found for specified transaction id`,
                statusCode: ResponseCodes.BadRequest
            })
        }

        const refund = await this.stripe.processRefund(paymentIntentId);

        payment = await this.paymentRepository.save(
            this.paymentRepository.merge(payment, {
                status: PaymentStatus.REFUNDED
            })
        );

        this.messageBroker.publishMessage(paymentRefunded, { data: { payment } })

        return refund;
    }
}