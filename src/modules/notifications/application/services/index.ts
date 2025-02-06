import notificationMemoryCache, {
  NotificationMemoryCache,
} from '../../config/memory-cache';
import { NotificationChannelFactory } from '../../infrastructure/providers';
import notificationsRepository from '../../infrastructure/repositories/notifications-repository';
import templatesRepository from '../../infrastructure/repositories/templates-repository';
import NotificationRepository from '../repositories/notifications-repository';
import ITemplatesRepository from '../repositories/templates-repository';
import { SendNotification } from '../use-cases/send-notification';

class NotificationService {
  private readonly repo: NotificationRepository;
  private readonly channels: NotificationChannelFactory;
  private readonly templatesRepo: ITemplatesRepository;
  private readonly cache: NotificationMemoryCache;

  constructor(init: {
    repo: NotificationRepository;
    channels: NotificationChannelFactory;
    templatesRepo: ITemplatesRepository;
    cache: NotificationMemoryCache;
  }) {
    this.repo = init.repo;
    this.channels = init.channels;
    this.templatesRepo = init.templatesRepo;
    this.cache = init.cache;

    this.sendNotification = new SendNotification(
      this.repo,
      this.channels,
      this.templatesRepo,
      this.cache
    );
  }

  sendNotification: SendNotification;
}

const notificationsService = new NotificationService({
  repo: notificationsRepository,
  cache: notificationMemoryCache,
  channels: new NotificationChannelFactory(),
  templatesRepo: templatesRepository,
});

export default notificationsService;
