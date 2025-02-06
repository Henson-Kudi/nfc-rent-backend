import { Notification, Prisma } from '@prisma/client';

export default interface NotificationRepository {
  create(data: Prisma.NotificationCreateArgs): Promise<Notification>;
}
