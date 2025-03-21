import notificationMemoryCache, {
  NotificationMemoryCache,
} from '../../config/memory-cache';
import notificationsRepository from '../../infrastructure/repositories/notifications-repository';
import templatesRepository from '../../infrastructure/repositories/templates-repository';
import { NotificationType } from '../../types';
import NotificationRepository from '../repositories/notifications-repository';
import ITemplatesRepository from '../repositories/templates-repository';
import { SendNotification } from '../use-cases/send-notification';
import { NotificationChannelsFactory } from './index.channel';

class NotificationService {
  private readonly repo: NotificationRepository;
  private readonly factory: NotificationChannelsFactory = new NotificationChannelsFactory();
  private readonly templatesRepo: ITemplatesRepository;
  private readonly cache: NotificationMemoryCache;

  constructor(init: {
    repo: NotificationRepository;
    templatesRepo: ITemplatesRepository;
    cache: NotificationMemoryCache;
  }) {
    this.repo = init.repo;
    this.templatesRepo = init.templatesRepo;
    this.cache = init.cache;
  }

  send(type: "EMAIL", payload: SendEmailNotiication): Promise<boolean>
  send(type: "SMS", payload: SendSMSNotification): Promise<boolean>
  send(type: "PUSH", payload: SendPushNotification): Promise<boolean>
  send(type: NotificationType, payload: SendEmailNotiication | SendSMSNotification | SendPushNotification): Promise<boolean> {
    throw new Error('not implemented')
  }
}

const notificationsService = new NotificationService({
  repo: notificationsRepository,
  cache: notificationMemoryCache,
  templatesRepo: templatesRepository,
});

export default notificationsService;
