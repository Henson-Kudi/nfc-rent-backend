import admin from 'firebase-admin';
import { BaseNotificationChannel } from './base-notification.channel';
import { Message } from 'firebase-admin/lib/messaging/messaging-api';
import { validatePushNotification } from '../../utils/validations';

export class PushNotificationChannel extends BaseNotificationChannel<
    SendPushNotification,
    Promise<boolean>
> {
    send(payload: SendPushNotificationCondition): Promise<boolean>
    send(payload: SendPushNotificationToken): Promise<boolean>
    send(payload: SendPushNotificationTopic): Promise<boolean>
    async send(payload: SendPushNotification): Promise<boolean> {
        await this.validate(payload)

        console.log(JSON.stringify(payload), 'payload push')

        await admin.messaging().send(payload as Message);

        return true;
    }

    validate(data: unknown) {
        return validatePushNotification(data)
    }
}
