import envConf from "@/config/env.conf";
import Stripe from "stripe";
import { Service } from "typedi";
import { AppError } from "../utils";
import { ResponseCodes, SupportedCurrencies } from "../enums";

@Service()
export class StripeService {
    private readonly stripe: Stripe = new Stripe(envConf.STRIPE_SECRET_KEY, {
        apiVersion: '2025-02-24.acacia'
    })

    private readonly webhookSecret = envConf.STRIPE_WEBHOOK_SECRET

    creatPaymentIntent(payload: {
        bookingId: string;
        amount: number;
        currency: string;
        paymentMethod?: string;
        metadata?: Record<string, string>;
    }, isManualCapture: boolean = true) {
        return this.stripe.paymentIntents.create({
            amount: payload.amount * 100,
            currency: payload.currency.toLowerCase(),
            capture_method: isManualCapture ? 'manual' : 'automatic',
            metadata: payload.metadata,
            payment_method: payload.paymentMethod
        })
    }

    getPaymentIntent(id: string) {
        return this.stripe.paymentIntents.retrieve(id)
    }

    createCheckoutSession(payload: {
        bookingId?: string
        successUrl?: string
        cancelUrl?: string
        clientId?: string
        clientEmail?: string
        currency: SupportedCurrencies
        lineItems: { productName: string, productDescription?: string, unitPrice: number, quantity?: number }[]
    }, isManualCapture: boolean = true) {

        const sessionConf: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: isManualCapture ? ['card'] : ['card', 'link', 'samsung_pay'],
            mode: 'payment',
            line_items: this.createLineItems(payload.lineItems, payload.currency),
            success_url: `${payload.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: payload.cancelUrl,
            customer_email: payload.clientEmail,
            metadata: {
                bookingId: payload?.bookingId || '',
                userId: payload?.clientId || ''
            },
            payment_intent_data: {
                metadata: {
                    bookingId: payload?.bookingId || '',
                    userId: payload?.clientId || ''
                },
            }
        }

        if (isManualCapture) {
            sessionConf.payment_intent_data = {
                ...(sessionConf.payment_intent_data || {}),
                capture_method: 'manual',

            };
        }


        return this.stripe.checkout.sessions.create(sessionConf);
    }

    async capturePayment(paymentIntentId: string) {
        // ensure payment intent is still valid and in available to capture status
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId)

        if (!paymentIntent) {
            throw new AppError({
                statusCode: ResponseCodes.BadRequest,
                message: "Invalid payment intend identifier"
            })
        }
        // ensure status is still available for capture
        if (paymentIntent.status !== 'requires_capture') {
            throw new AppError({
                message: `Cannot capture payment in status: ${paymentIntent.status}`,
                statusCode: ResponseCodes.BadRequest
            })
        }
        return await this.stripe.paymentIntents.capture(paymentIntentId, {
            expand: ['charges']
        });
    }

    confirmPayment(paymentIntentId: string) {
        return this.stripe.paymentIntents.capture(paymentIntentId);
    }

    processRefund(paymentIntentId: string) {

        return this.stripe.refunds.create({
            payment_intent: paymentIntentId,
        });
    }

    async cancelPayment(paymentIntentId: string) {
        // Retrieve checkout session by payment intent id
        const sessions = await this.stripe.checkout.sessions.list({
            payment_intent: paymentIntentId
        })

        if (!sessions.data.length) {
            throw new AppError({
                message: "Session with payment not found",
                statusCode: ResponseCodes.BadRequest
            })
        }

        const sessionId = sessions.data[0]?.id

        return await this.stripe.checkout.sessions.expire(sessionId)
    }

    constructWebhookEvent(body: string, sig: string) {
        return this.stripe.webhooks.constructEvent(body, sig as string, this.webhookSecret);
    }


    private createLineItems(payload: { productName: string, productDescription?: string, unitPrice: number, quantity?: number }[], currency: string = 'aed'): Stripe.Checkout.SessionCreateParams.LineItem[] {

        return payload.map(itm => ({
            price_data: {
                currency: currency.toLowerCase(),
                product_data: {
                    name: itm.productName,
                    description: itm?.productDescription || '',
                },
                unit_amount: itm.unitPrice * 100, // AED in fils
            },
            quantity: itm?.quantity || 1,
        }))
    }
}