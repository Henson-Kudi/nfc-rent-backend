import envConf from '@/config/env.conf';
import twilio from 'twilio';
import { BaseNotificationChannel } from './base-notification.channel';
import { validateSMSNotification } from '../../utils/validations';
import { AppError } from '@/common/utils';
import { ResponseCodes } from '@/common/enums';

export class SMSNotificationChannel extends BaseNotificationChannel<
  SendSMSNotification,
  Promise<boolean>
> {
  private readonly client: twilio.Twilio;
  private readonly smsConf = envConf.notification.sms;

  constructor() {
    super();
    this.client = twilio(this.smsConf.sid, this.smsConf.authToken);
  }

  async send(payload: SendSMSNotification): Promise<boolean> {
    await this.validate(payload)

    console.log(JSON.stringify(payload), 'payload sms')

    const instance = await this.client.messages.create({
      ...payload,
      to: payload.to!
    });

    if (instance.status === 'failed') {
      throw new AppError({
        message: instance?.errorMessage || 'Failed to send message',
        statusCode: ResponseCodes.ServerError
      })
    }

    return true;
  }

  validate(data: unknown) {
    return validateSMSNotification(data)
  }
}
