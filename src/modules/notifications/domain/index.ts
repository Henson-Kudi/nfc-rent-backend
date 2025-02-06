import { SupportedLocales } from '@/types/global';
import { NotificationType } from '../types';

export class SendNotificationDTO {
  constructor(
    public channel: NotificationType,
    public recipient: string,
    public recipientId: string,
    public templateName: string,
    public priority: string,
    public persist?: boolean,
    public sender?: string,
    public locale?: SupportedLocales
  ) {}

  validate() {
    return this;
  }
}
