import { NotificationPayload } from '../../types';

interface INotificationProvider {
  send(payload: NotificationPayload): Promise<boolean>;
}

export default INotificationProvider;
