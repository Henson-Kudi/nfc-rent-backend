import { Notification } from '@prisma/client';

export type NotificationType = 'SMS' | 'EMAIL' | 'PUSH';

export type NotificationPayload = Partial<Notification> & {
  receipient: string;
  receipientId: string;
  content: string;
  metaData?: Record<string, unknown>;
};
