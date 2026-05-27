import { Redis } from "@upstash/redis";
import { createInitialSnapshot, normalizeSnapshot } from "./snapshot-normalize";
import type { AppSnapshot } from "./snapshot-types";
import type { StorageBackend } from "./storage-backend";

const SNAPSHOT_KEY = "custom-furniture-dispatch:snapshot";

function createRedisClient(): Redis {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) {
    throw new Error("未配置 Upstash Redis（UPSTASH_REDIS_REST_URL / TOKEN）");
  }
  return new Redis({ url, token });
}

export const kvStorageBackend: StorageBackend = {
  id: "kv",
  async readSnapshot() {
    const redis = createRedisClient();
    const raw = await redis.get<AppSnapshot>(SNAPSHOT_KEY);
    if (!raw) {
      const initial = createInitialSnapshot();
      await redis.set(SNAPSHOT_KEY, initial);
      return initial;
    }
    return normalizeSnapshot(raw);
  },
  async writeSnapshot(next) {
    const redis = createRedisClient();
    await redis.set(SNAPSHOT_KEY, next);
  },
};
