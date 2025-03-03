import { LRUCache } from 'lru-cache';
import { Service } from 'typedi';

const DEFAULT_MAX_SIZE = 500;
const DEFAULT_TTL = 1000 * 60 * 5; // 5 minutes

@Service()
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export class MemoryCache<K extends {}, V extends {}, FC = unknown> {
  private cache: LRUCache<K, V, FC>;

  constructor(options?: LRUCache.Options<K, V, FC>) {
    this.cache = new LRUCache({
      max: DEFAULT_MAX_SIZE,
      ttl: DEFAULT_TTL,
      ...options,
    });
  }

  set(key: K, value: V, ttl?: number): void {
    this.cache.set(key, value, { ttl });
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): K[] {
    const k: K[] = [];
    this.cache.forEach((_, key) => k.push(key));

    return k;
  }

  values(): V[] {
    const v: V[] = [];
    this.cache.forEach((value) => v.push(value));

    return v;
  }
}
