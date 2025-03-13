export type NotificationType = 'SMS' | 'EMAIL' | 'PUSH';

export type NotificationPayload = Partial<any> & {
  receipient: string;
  receipientId: string;
  content: string;
  metaData?: Record<string, unknown>;
};
