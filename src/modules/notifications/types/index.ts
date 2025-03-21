export type NotificationType = 'SMS' | 'EMAIL' | 'PUSH';

export type NotificationPayload<T extends object = Record<string, unknown>> =
  Partial<T> & {
    receipient: string;
    receipientId: string;
    content: string;
    metaData?: Record<string, unknown>;
  };
