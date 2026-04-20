import { Redis } from "ioredis";
import { env } from "../../config/env.js";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 1000,
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
});

export const redisPublisher = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 1000,
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
});

export const redisSubscriber = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 1000,
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
});
