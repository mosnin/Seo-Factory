import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: IORedis | undefined };

// Use lazyConnect to prevent immediate connection during build
export const redis =
  globalForRedis.redis ??
  new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
