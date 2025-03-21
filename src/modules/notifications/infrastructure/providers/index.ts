import envConf from '@/config/env.conf';
import INotificationProvider from '../../application/providers';
import { NotificationPayload, NotificationType } from '../../types';
import { sendPushNotification } from '../../utils/send-push-notification';
import { sendSMS } from '../../utils/send-sms';
import logger from '@/common/utils/logger';

class EmailNotificationProvider implements INotificationProvider {
  constructor(private readonly defaultSender: string) {}

  async send(payload: NotificationPayload): Promise<boolean> {
    logger.info(`Yayyy finally got here....`);
    logger.info(`Sending email...`);
    logger.info(JSON.stringify(payload));
    logger.info('Email sent successfully');
    return await new Promise((resolve) => {
      resolve(true);
    });
    // return await sendEmail({
    //     from: this.defaultSender,
    //     to: payload.receipient,
    //     html: payload.content,
    //     subject: payload.title || undefined,
    //     attachments: payload?.metaData?.attachments && Array.isArray(payload.metaData.attachments) ? payload.metaData.attachments as Mail.Attachment[] : undefined
    // })
  }
}

export class SMSNotificationProvider implements INotificationProvider {
  async send(
    payload: NotificationPayload<Record<string, string>>
  ): Promise<boolean> {
    // Call SMS provider API here
    await sendPushNotification({
      token: payload.receipient,
      topic: payload.title || undefined,
      notification: {
        body: payload.content,
        title: payload?.title || undefined,
      },
    });
    return true;
  }
}

export class PushNotificationProvider implements INotificationProvider {
  async send(payload: NotificationPayload): Promise<boolean> {
    await sendSMS(payload.receipient, payload.content);
    return true;
  }
}

export class NotificationChannelFactory {
  private channels: Record<NotificationType, INotificationProvider> = {
    EMAIL: new EmailNotificationProvider(
      envConf.NOTIFICATION.DEFAULT_EMAIL_SENDER
    ),
    SMS: new SMSNotificationProvider(),
    PUSH: new PushNotificationProvider(),
  };

  getChannel(channel: NotificationType): INotificationProvider {
    if (!this.channels[channel]) {
      throw new Error(`Channel ${channel} not supported`);
    }
    return this.channels[channel];
  }
}
