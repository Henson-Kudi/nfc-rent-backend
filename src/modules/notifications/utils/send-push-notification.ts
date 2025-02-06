import admin from 'firebase-admin';
import { Message } from 'firebase-admin/lib/messaging/messaging-api';

export const sendPushNotification = async (params: Message) => {
  await admin.messaging().send(params);
};
