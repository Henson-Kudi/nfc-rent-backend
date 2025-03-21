import admin from 'firebase-admin';
import { BaseNotificationChannel } from './base-notification.channel';

export class PushNotificationChannel extends BaseNotificationChannel<
    SendPushNotification,
    Promise<boolean>
> {
    send(payload: SendPushNotificationCondition): Promise<boolean>
    send(payload: SendPushNotificationToken): Promise<boolean>
    send(payload: SendPushNotificationTopic): Promise<boolean>
    async send(payload: SendPushNotification): Promise<boolean> {
        await admin.messaging().send(payload);

        return true;
    }
}
