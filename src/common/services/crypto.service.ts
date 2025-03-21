import envConf from '@/config/env.conf';
import { Inject, Service } from 'typedi';
import { HttpService } from './http.service';
import {
  ResponseCodes,
  SupportedCryptoCurrencies,
  SupportedCurrencies,
} from '../enums';
import { Client } from 'coinbase-commerce-node';
import { AppError } from '../utils';

@Service()
export class CryptoPaymentService {
  private readonly API = envConf.bitPay;
  private readonly COINBASEAPI = envConf.coinbase;
  private readonly merchant = {
    name: 'HK Solutions',
    email: 'amahkudi@gmail.com',
  };
  private readonly webhookBaseUrl = `${envConf.apiBaseUrl}/bookings/webhook/crypto`;

  constructor(@Inject() private readonly httpService: HttpService) {
    Client.init(this.COINBASEAPI.apiKey);
  }

  async createCheckoutSession(payload: {
    bookingId?: string;
    successUrl?: string;
    cancelUrl?: string;
    clientId: string;
    clientEmail: string;
    clientName: string;
    clientPhone: string;
    currency: SupportedCurrencies;
    totalAmount: number;
    lineItems: {
      productName: string;
      productDescription?: string;
      unitPrice: number;
      quantity?: number;
    }[];
  }) {
    const currency = [
      SupportedCryptoCurrencies.ERC20,
      SupportedCryptoCurrencies.TRC20,
    ].includes(payload.currency as SupportedCryptoCurrencies)
      ? 'USDT'
      : payload.currency;

    const options = {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Accept-Version': '2.0.0',
      },
      body: JSON.stringify({
        itemizedDetails: {
          isFee: false,
          amount: payload.totalAmount,
          description: `Car rental of car: ${payload.lineItems[0]?.productName}`,
        },
        buyer: {
          name: payload.clientName,
          // address1: 'No need',
          // locality: 'UAe',
          email: payload.clientEmail,
          phone: payload.clientPhone,
          notify: true,
        },
        token: this.API.apiKey,
        price: payload.totalAmount,
        currency,
        // merchantName: this.merchant.name,
        orderId: payload.bookingId,
        itemDesc: `Car rental of car: ${payload.lineItems[0]?.productName}`,
        notificationEmail: this.merchant.email,
        notificationURL: `${this.webhookBaseUrl}/invoices`, //add a route to handle invoice webhooks
        redirectURL: `${envConf.FRONTEND_URL}/bookings/${payload.bookingId}/success`,
        closeURL: `${envConf.FRONTEND_URL}/bookings/${payload.bookingId}/failure`,
        autoRedirect: true,
        posData: JSON.stringify(payload),
        transactionSpeed: 'medium',
        extendedNotifications: true,
        buyerSms: payload.clientPhone,
        acceptanceWindow: 900000, // Clients have 15mins max to complete payment
      }),
    };

    return (
      await this.httpService.post(`${this.API.baseUrl}/invoices`, options)
    )?.data;

    // // OPTION 2: USING COINBASE COMMERCE
    // const charge: CreateCharge = {
    //     description: payload.lineItems[0]?.productDescription || '',
    //     local_price: {
    //         amount: payload.totalAmount.toString(),
    //         currency
    //     },
    //     name: payload.lineItems[0]?.productName,
    //     pricing_type: "fixed_price",
    //     cancel_url: payload.cancelUrl,
    //     redirect_url: payload.successUrl,
    //     metadata: {
    //         bookingId: payload.bookingId,
    //         userId: payload.clientId,
    //         userEmail: payload.clientEmail,
    //         userPhone: payload.clientPhone || '',
    //     }
    // }

    // return await Coinbase.resources.Charge.create(charge)
  }

  async confirmPayment(transactionId: string) {
    const invoice = await this.httpService.get(
      `${this.API.baseUrl}/invoices/${transactionId}?token=${this.API.apiKey}`,
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Accept-Version': '2.0.0',
        },
      }
    );

    if (!invoice || !invoice.data) {
      throw new AppError({
        message: 'Invalid payment identifier',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    // if status is not confirmed, throw error
    if (invoice?.data?.status !== 'confirmed') {
      throw new AppError({
        message: 'Payment not received',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    return invoice.data;

    // // OPTION 2: USING COINBASE COMMERCE

    // const charge = await Coinbase.resources.Charge.retrieve(transactionId)

    // if (!charge.id) {
    //     throw new AppError({
    //         message: "Invalid payment identifier",
    //         statusCode: ResponseCodes.BadRequest
    //     })
    // }

    // if (!charge.timeline.length) {
    //     throw new AppError({
    //         message: "Invalid payment charge",
    //         statusCode: ResponseCodes.BadRequest
    //     })
    // }

    // const lastTimeline = charge.timeline[charge.timeline?.length - 1]

    // if (!['COMPLETED', 'RESOLVED'].includes(lastTimeline.status)) {
    //     throw new AppError({
    //         message: `Please complete payment first`,
    //         statusCode: ResponseCodes.BadRequest
    //     })
    // }

    // return charge
  }

  async cancelPayment(transactionId: string) {
    const invoice = await this.httpService.get(
      `${this.API.baseUrl}/invoices/${transactionId}?token=${this.API.apiKey}`,
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Accept-Version': '2.0.0',
        },
      }
    );

    if (!invoice || !invoice.data) {
      throw new AppError({
        message: 'Invalid payment identifier',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    // if status is not new, throw error
    if (invoice?.data?.status === 'new') {
      throw new AppError({
        message: `Cannot cancel payment with status: ${invoice?.data?.status}`,
        statusCode: ResponseCodes.BadRequest,
      });
    }

    const cancelledInvoice = await this.httpService.delete(
      `${this.API.baseUrl}/invoices/${transactionId}?token=${this.API.apiKey}`,
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Accept-Version': '2.0.0',
        },
      }
    );

    return cancelledInvoice?.data;

    // // OPTION 2: USING COINBASE COMMERCE

    // const charge = await Coinbase.resources.Charge.retrieve(transactionId)

    // if (!charge.id) {
    //     throw new AppError({
    //         message: "Invalid payment identifier",
    //         statusCode: ResponseCodes.BadRequest
    //     })
    // }

    // const lastTimeline = charge.timeline[charge.timeline?.length - 1]

    // if (!['NEW', 'PENDING', 'UNRESOLVED'].includes(lastTimeline.status)) {
    //     throw new AppError({
    //         message: `Cannot cancel payment with status: ${lastTimeline.status}`,
    //         statusCode: ResponseCodes.BadRequest
    //     })
    // }

    // // Cancel charge
    // charge.expires_at = new Date().toString()
    // charge.timeline.push({
    //     status: 'CANCELED',
    //     time: Date.now().toString(),
    // })

    // await charge.save()

    // return charge
  }

  async processRefund(transactionId: string) {
    const invoice = await this.httpService.get(
      `${this.API.baseUrl}/invoices/${transactionId}?token=${this.API.apiKey}`,
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Accept-Version': '2.0.0',
        },
      }
    );

    if (!invoice || !invoice.data) {
      throw new AppError({
        message: 'Invalid payment identifier',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    // if status is not confirmed, throw error
    if (invoice?.data?.status !== 'confirmed') {
      throw new AppError({
        message: 'Payment not received',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    // Request refund
    const body = JSON.stringify({
      preview: false,
      immediate: false,
      buyerPaysRefundFee: false,
      amount: invoice?.data?.price,
      invoiceId: transactionId,
      token: this.API.apiKey,
      reference: invoice?.data?.orderId,
    });

    const refunded = await this.httpService.post(
      `${this.API.baseUrl}/refunds`,
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Accept-Version': '2.0.0',
        },
        body,
      }
    );

    return refunded?.data;

    // // OPTION 2: USING COINBASE COMMERCE

    // return {
    //     message: "Coinbase does not support refunds.Please handle refund manually",
    //     statusCode: ResponseCodes.BadRequest,
    //     transactionId
    // }
  }

  async retrievePayment(transactionId: string) {
    const invoice = await this.httpService.get(
      `${this.API.baseUrl}/invoices/${transactionId}?token=${this.API.apiKey}`,
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Accept-Version': '2.0.0',
        },
      }
    );

    if (!invoice || !invoice?.data) {
      throw new AppError({
        message: 'Payment not found',
        statusCode: ResponseCodes.NotFound,
      });
    }

    return invoice?.data;

    // // OPTIONS 2 - USING COINBASE API
    // const charge = await Coinbase.resources.Charge.retrieve(transactionId)

    // if (!charge || !charge.id) {
    //     throw new AppError({
    //         message: "Cannot find charge with given identifier",
    //         statusCode: ResponseCodes.NotFound
    //     })
    // }

    // return charge
  }
}
