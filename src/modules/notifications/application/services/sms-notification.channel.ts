import envConf from '@/config/env.conf';
import twilio from 'twilio';
import { BaseNotificationChannel } from './base-notification.channel';

export class SMSNotificationChannel extends BaseNotificationChannel<
  { from?: string; to: string; body: string },
  Promise<boolean>
> {
  private readonly client: twilio.Twilio;
  private readonly smsConf = envConf.notification.sms;

  constructor() {
    super();
    this.client = twilio(this.smsConf.sid, this.smsConf.authToken);
  }

  async send(args: SendSMSNotification): Promise<boolean> {
    await this.client.messages.create({
      to: args.to,
      from: args.from || this.smsConf.defaultSender,
      body: args.body,
    });

    return true;
  }
}
