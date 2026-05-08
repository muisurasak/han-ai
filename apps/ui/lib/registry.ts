import { Redis } from 'ioredis';
import type { MachineInfo } from './types';

const REGISTRY_KEY = 'han:registry';
const OFFLINE_THRESHOLD_MS = 120_000;

export async function getMachines(redisUrl: string): Promise<MachineInfo[]> {
  const redis = new Redis(redisUrl, { lazyConnect: true, enableOfflineQueue: false });
  try {
    await redis.connect();
    const all = await redis.hgetall(REGISTRY_KEY);
    const now = Date.now();
    return Object.values(all).map((raw) => {
      const info = JSON.parse(raw) as MachineInfo;
      info.status = now - info.last_seen > OFFLINE_THRESHOLD_MS ? 'offline' : 'online';
      return info;
    });
  } catch {
    return [];
  } finally {
    redis.disconnect();
  }
}
