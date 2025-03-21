import INotificationRepository from '../../application/repositories/notifications-repository';

class NotificationsRepository implements INotificationRepository {
  create(_: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
}

const notificationsRepository = new NotificationsRepository();

export default notificationsRepository;
