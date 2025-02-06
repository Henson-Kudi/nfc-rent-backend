import { MemoryCache } from '@/common/cache/memory-cache';
import { NotificationTemplate } from '@prisma/client';

export class NotificationMemoryCache extends MemoryCache<
  string,
  NotificationTemplate
> {}

const notificationMemoryCache = new NotificationMemoryCache();

export default notificationMemoryCache;
