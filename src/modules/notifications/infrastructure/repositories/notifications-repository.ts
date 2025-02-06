import { Prisma, Notification } from '@prisma/client';
import INotificationRepository from '../../application/repositories/notifications-repository';
import { getDefaultPrismaClient } from '@/common/database';

class NotificationsRepository implements INotificationRepository {
  private readonly db = getDefaultPrismaClient();

  create(data: Prisma.NotificationCreateArgs): Promise<Notification> {
    throw new Error('Method not implemented.');
  }
}

const notificationsRepository = new NotificationsRepository();

export default notificationsRepository;
