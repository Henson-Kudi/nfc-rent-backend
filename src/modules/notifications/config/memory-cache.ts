import { MemoryCache } from '@/common/cache/memory-cache';

export class NotificationMemoryCache extends MemoryCache<string, any> {}

const notificationMemoryCache = new NotificationMemoryCache();

export default notificationMemoryCache;
