import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    const url = process.env.PLATFORM_REDIS_URL;
    this.client = url ? new Redis(url) : null;

    if (this.client) {
      this.client.on("connect", () => this.logger.log("Redis connected"));
      this.client.on("error", (err) => this.logger.error("Redis error", err));
    } else {
      this.logger.warn("Redis is not configured (PLATFORM_REDIS_URL not set)");
    }
  }

  get isEnabled() {
    return !!this.client;
  }

  /**
   * Expose the underlying client for helper services (locks, queues).
   * Returns null when Redis is not configured so callers can noop gracefully.
   */
  getClient() {
    return this.client;
  }

  async ping(): Promise<string | null> {
    if (!this.client) return null;
    return this.client.ping();
  }

  /**
   * Get a value from cache
   */
  async get<T = string>(key: string): Promise<T | null> {
    if (!this.client) return null;
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  /**
   * Set a value in cache with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client) return;
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Set expiration time on a key (in seconds)
   */
  async expire(key: string, ttl: number): Promise<void> {
    if (!this.client) return;
    await this.client.expire(key, ttl);
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number | null> {
    if (!this.client) return null;
    return this.client.incr(key);
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number | null> {
    if (!this.client) return null;
    return this.client.decr(key);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log("Redis connection closed");
    }
  }
}
