import INotificationRepository from '../../application/repositories/notifications-repository';

class NotificationsRepository implements INotificationRepository {

  create(data: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
}

const notificationsRepository = new NotificationsRepository();

export default notificationsRepository;
