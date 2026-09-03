import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const DAILY_FREE_SEARCHES = Number(process.env.DAILY_FREE_SEARCHES ?? 3);
// Aynı IP'nin arkasında çerezleri temizleyerek çoğaltılan "yeni" cihazları makul ölçüde
// sınırlamak için, tek cihaz limitinden kasıtlı olarak daha yüksek bir IP tavanı.
const IP_DAILY_CAP = DAILY_FREE_SEARCHES * 10;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function secondsUntilNextUtcMidnight(): number {
  const now = new Date();
  const nextMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0
  );
  return Math.ceil((nextMidnight - now.getTime()) / 1000);
}

export interface LimitStatus {
  remaining: number;
  limit: number;
}

export async function getStatus(deviceId: string): Promise<LimitStatus> {
  const used = Number((await redis.get(`iav:d:${deviceId}:${todayKey()}`)) ?? 0);
  return { remaining: Math.max(0, DAILY_FREE_SEARCHES - used), limit: DAILY_FREE_SEARCHES };
}

export async function tryConsumeSearch(
  deviceId: string,
  ip: string
): Promise<{ allowed: boolean; status: LimitStatus }> {
  const status = await getStatus(deviceId);
  const ipUsed = Number((await redis.get(`iav:ip:${ip}:${todayKey()}`)) ?? 0);

  if (status.remaining <= 0 || ipUsed >= IP_DAILY_CAP) {
    return { allowed: false, status };
  }

  const ttl = secondsUntilNextUtcMidnight();
  const deviceKey = `iav:d:${deviceId}:${todayKey()}`;
  const ipKey = `iav:ip:${ip}:${todayKey()}`;

  const pipeline = redis.pipeline();
  pipeline.incr(deviceKey);
  pipeline.expire(deviceKey, ttl);
  pipeline.incr(ipKey);
  pipeline.expire(ipKey, ttl);
  await pipeline.exec();

  return { allowed: true, status: { remaining: status.remaining - 1, limit: status.limit } };
}
