import { Booking, Payment } from "@/common/entities";
import { PaymentStatus, ResponseCodes, SupportedCryptoCurrencies, SupportedCurrencies } from "@/common/enums";
import { Inject, Service } from "typedi";
import { StripeService } from "../../../../common/services/stripe.service";
import envConf from "@/config/env.conf";
import { PaymentRepository } from "../repository/payment.repository";
import { CryptoPaymentFactory } from "@/common/services/crypto-payment.service";
import { MessageBrokerToken } from "@/common/message-broker";
import { PaymentEvents } from "@/common/message-broker/events/payment.events";
import { AppError } from "@/common/utils";
import Stripe from "stripe";
import Coinbase, { Client, CreateCharge, Webhook, EventResource } from 'coinbase-commerce-node'
import { CryptoPaymentService } from "@/common/services/crypto.service";
import logger from "@/common/utils/logger";

type Payload = {
    bookingId?: string
    successUrl?: string
    cancelUrl?: string
    clientId: string
    clientEmail: string
    clientName: string
    clientPhone: string
    currency: SupportedCurrencies
    totalAmount: number
    lineItems: { productName: string, productDescription?: string, unitPrice: number, quantity?: number }[]
}
@Service()
export class PaymentService {

    constructor(
        @Inject()
        private stripe: StripeService,
        @Inject()
        private cryptoPaymentService: CryptoPaymentService,
        @Inject()
        private paymentRepository: PaymentRepository,
        @Inject(MessageBrokerToken)
        private messageBroker: IMessageBroker,

    ) { }

    async createPayment(booking: Booking, currency: SupportedCurrencies) {
        const isCrypto = Object.values(SupportedCryptoCurrencies).includes(currency as SupportedCryptoCurrencies)

        const selctedCurrency = [SupportedCryptoCurrencies.ERC20, SupportedCryptoCurrencies.TRC20].includes(currency as SupportedCryptoCurrencies) ? 'USDT' : currency

        const product = booking?.car?.translations?.find(itm => itm.locale == 'en')

        const payload: Payload = {
            lineItems: [{ productName: product?.name || '', unitPrice: booking.totalAmount, productDescription: product?.shortDescription, quantity: 1 }],
            bookingId: booking.id,
            cancelUrl: `${envConf.FRONTEND_URL}/booking/${booking.id}`,
            successUrl: `${envConf.FRONTEND_URL}/booking/${booking.id}/success`,
            clientEmail: booking?.user?.email,
            clientId: booking?.user?.id,
            currency: selctedCurrency as SupportedCurrencies,
            clientName: booking.user.fullName,
            clientPhone: booking.user.phone!,
            totalAmount: booking.totalAmount
        }


        let session: any = null
        let paymentMethod: 'FIAT' | 'CRYPTO' = 'FIAT'
        let transactionId: string = ''

        if (isCrypto) {
            session = await this.cryptoPaymentService.createCheckoutSession(payload)
            transactionId = session?.id
            paymentMethod = 'CRYPTO'
        } else {
            session = await this.stripe.createCheckoutSession(payload);

            transactionId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
            paymentMethod = 'FIAT'
        }

        const paymentData = this.paymentRepository.create({
            booking,
            amount: booking.totalAmount,
            status: PaymentStatus.PENDING,
            isCrypto: false,
            currency,
            transactionId,
            paymentMethod
        })

        const payment = await this.paymentRepository.save(paymentData)



        // if (!this.cryptoFactory.isCryptoCurrency(currency)) {
        //     const product = booking?.car?.translations?.find(itm => itm.locale == 'en')

        //     // Existing Stripe handling
        //     paymentSession = await this.stripe.createCheckoutSession({
        //         lineItems: [{ productName: product?.name || '', unitPrice: booking.totalAmount, productDescription: product?.shortDescription, quantity: 1 }],
        //         bookingId: booking.id,
        //         cancelUrl: `${envConf.FRONTEND_URL}/booking/${booking.id}`,
        //         successUrl: `${envConf.FRONTEND_URL}/booking/${booking.id}/success`,
        //         clientEmail: booking?.user?.email,
        //         clientId: booking?.user?.id,
        //         currency: currency
        //     });

        //     // save payment
        //     payment = await this.paymentRepository.save(this.paymentRepository.merge(payment, { transactionId: typeof paymentSession.payment_intent === 'string' ? paymentSession.payment_intent : paymentSession.payment_intent?.id, paymentMethod }))
        // } else {
        //     const cryptoNetwork = this.cryptoFactory.getNetworkFromCurrency(currency as SupportedCryptoCurrencies)

        //     const paymentProcessor = this.cryptoFactory.getProcessor(cryptoNetwork)

        //     paymentSession = await paymentProcessor.generatePaymentWallet(payment)

        //     paymentMethod = 'CRYPTO'

        //     payment = await this.paymentRepository.save(this.paymentRepository.merge(payment, { paymentMethod, isCrypto: true }))
        // }

        this.messageBroker.publishMessage(PaymentEvents.paymentCreated, { data: { payment } })

        return {
            session,
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

        this.messageBroker.publishMessage(PaymentEvents.paymentConfirmed, { data: { payment } })

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

        this.messageBroker.publishMessage(PaymentEvents.paymentRefunded, { data: { payment } })

        return refund;
    }

    async cancelPayment(paymentIntentId: string) {
        const payment = await this.paymentRepository.findOne({
            where: { transactionId: paymentIntentId }
        })

        if (!payment) {
            throw new AppError({
                statusCode: ResponseCodes.NotFound,
                message: 'Cannot find payment with given identifier'
            })
        }

        if (payment.status !== PaymentStatus.PENDING_CAPTURE) {
            throw new AppError({
                statusCode: ResponseCodes.BadRequest,
                message: `Cannot cancel payment in status: ${payment.status}`
            })
        }

        const cancelled = await this.stripe.cancelPayment(paymentIntentId)

        this.messageBroker.publishMessage(PaymentEvents.paymentCancelled, { data: { payment } })

        // Cancel payment.
        // Note: Only stripe payments can be cancelled since they have pending capture status.
        return cancelled
    }

    async handleCryptoPaymentWebhookEvents(event: EventResource) {
        // const paymentIntent = await this.cryptoPaymentService.retrievePayment(event?.data?.id)

        // const payment = await this.paymentRepository.findOne({
        //     where: { transactionId: paymentIntent.id }
        // })

        // if (!payment) {
        //     throw new AppError({
        //         message: "Payment not found",
        //         statusCode: ResponseCodes.BadRequest
        //     })
        // }

        // let publishEvent: string | undefined = undefined

        // switch (event?.event) {
        //     case 'invoice_paidInFull':
        //     case 'invoice_confirmed':
        //     case 'invoice_completed':
        //         payment.status = PaymentStatus.PAID
        //         publishEvent = PamentEvents.paymentConfirmed
        //         break;
        //     case 'invoice_expired':
        //     case 'invoice_failedToConfirm':
        //     case 'invoice_declined':
        //         payment.status = PaymentStatus.FAILED
        //         publishEvent = PamentEvents.paymentFailed
        //         break;
        //     case 'invoice_refundComplete':
        //         payment.status = PaymentStatus.REFUNDED
        //         publishEvent = PamentEvents.paymentRefunded
        //         break;

        //     default:
        //         logger.warn(`Unhandled event: ${event.event}`)
        //         break;
        // }

        // await this.paymentRepository.save(payment)

        // if (publishEvent) {
        //     this.messageBroker.publishMessage(publishEvent, { data: payment })
        // }

        // OPTION 2 - USING COINBASE
        const payment = await this.paymentRepository.findOne({
            where: { transactionId: event.id }
        })

        if (!payment) {
            throw new AppError({
                message: "Payment not found",
                statusCode: ResponseCodes.BadRequest
            })
        }

        let publishEvent: string | undefined = undefined

        switch (event.type) {
            case 'charge:confirmed':
            case 'charge:resolved':
                payment.status = PaymentStatus.PAID
                publishEvent = PaymentEvents.paymentConfirmed
                break;
            case 'charge:failed':
                payment.status = PaymentStatus.FAILED
                publishEvent = PaymentEvents.paymentFailed
                break;
            case 'charge:pending':
                payment.status = PaymentStatus.PENDING
                break;

            default:
                break;
        }

        await this.paymentRepository.save(payment)

        if (publishEvent) {
            this.messageBroker.publishMessage(publishEvent, { data: payment })
        }

        return payment

    }

    async handleFiatPaymentWebhookEvents(event: Stripe.Event) {

        const checkPayement = async (paymentIntent: Stripe.PaymentIntent) => {

            const payment = await this.paymentRepository.findOne({ where: [{ booking: { id: paymentIntent.metadata.bookingId } }, { transactionId: paymentIntent.id }] })

            if (!payment) {
                throw new AppError({
                    message: "Invalid payment data. Payment not found",
                    statusCode: ResponseCodes.NotFound
                })
            }
            return payment
        }

        let publishEvent: string | undefined

        let payment: Payment | null = null

        switch (event.type) {
            case 'payment_intent.created':
                payment = await checkPayement(event.data.object)
                payment.transactionId = event.data.object.id
                break;
            case 'payment_intent.canceled':
            case 'payment_intent.payment_failed':
                payment = await checkPayement(event.data.object)
                payment.transactionId = event.data.object.id
                payment.status = PaymentStatus.FAILED
                publishEvent = PaymentEvents.paymentFailed
                break;
            case 'payment_intent.amount_capturable_updated':
                payment = await checkPayement(event.data.object)
                payment.transactionId = event.data.object.id
                payment.status = PaymentStatus.PENDING_CAPTURE
                publishEvent = PaymentEvents.paymentPendingCapture
                break;
            case 'payment_intent.succeeded':
                payment = await checkPayement(event.data.object)
                payment.transactionId = event.data.object.id
                payment.status = PaymentStatus.PAID
                publishEvent = PaymentEvents.paymentConfirmed
                break;
            case 'checkout.session.completed':
                const paymentIntent = typeof event.data.object.payment_intent === 'string' ? await this.stripe.getPaymentIntent(event.data.object.payment_intent) : event.data.object.payment_intent
                if (!paymentIntent) {
                    throw new AppError({
                        message: 'Invalid payment intent',
                        statusCode: ResponseCodes.BadRequest
                    })
                }
                payment = await checkPayement(paymentIntent)
                payment.transactionId = paymentIntent.id
                payment.status = PaymentStatus.PENDING_CAPTURE
                publishEvent = PaymentEvents.paymentPendingCapture
                break;
            case 'checkout.session.async_payment_failed':
            case 'checkout.session.expired':
                const paymentIntentFailed = typeof event.data.object.payment_intent === 'string' ? await this.stripe.getPaymentIntent(event.data.object.payment_intent) : event.data.object.payment_intent
                if (!paymentIntentFailed) {
                    throw new AppError({
                        message: 'Invalid payment intent',
                        statusCode: ResponseCodes.BadRequest
                    })
                }
                payment = await checkPayement(paymentIntentFailed)
                payment.transactionId = paymentIntentFailed.id
                payment.status = PaymentStatus.FAILED
                publishEvent = PaymentEvents.paymentFailed
                break;

            default:
                logger.warn(`Unhandled event: ${event.type}`)
                break;
        }

        if (!payment) {
            throw new AppError({
                message: "Invalid payment identifier",
                statusCode: ResponseCodes.BadRequest
            })
        }

        await this.paymentRepository.save(payment)

        if (publishEvent) {
            this.messageBroker.publishMessage(publishEvent, { data: payment })
        }
        return payment
    }
}