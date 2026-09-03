import Redis from "ioredis";
import { env } from "../config/env.js";

const redis = new Redis(env.REDIS_URL);

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

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // sunucu tarafı UTC tarih - cihaz saatinden bağımsız
}

function deviceKey(deviceId: string): string {
  return `iav:searches:device:${deviceId}:${todayKey()}`;
}

function ipKey(ip: string): string {
  return `iav:searches:ip:${ip}:${todayKey()}`;
}

// Bir IP'nin arkasında makul aile/ofis kullanımını aşan, çok sayıda "yeni cihaz"
// üretilerek limit aşılmasını zorlaştırmak için üst sınır. Tek cihaz limitinden
// kasıtlı olarak daha yüksek tutulur.
const IP_DAILY_CAP = env.DAILY_FREE_SEARCHES * 8;

export interface LimitStatus {
  remaining: number;
  limit: number;
}

export async function getStatus(deviceId: string): Promise<LimitStatus> {
  const used = Number((await redis.get(deviceKey(deviceId))) ?? 0);
  const bonus = Number((await redis.get(`${deviceKey(deviceId)}:bonus`)) ?? 0);
  const limit = env.DAILY_FREE_SEARCHES + bonus;
  return { remaining: Math.max(0, limit - used), limit };
}

/**
 * Bir arama hakkını düşürmeyi dener. Cihaz VEYA IP günlük tavanı doluysa false döner.
 * Atomik olması için Redis pipeline kullanılır; yarış koşullarında en kötü ihtimalle
 * bir kullanıcı 1 fazladan hak kullanabilir, kritik olmayan bir sınır olduğu için kabul edilebilir.
 */
export async function tryConsumeSearch(
  deviceId: string,
  ip: string
): Promise<{ allowed: boolean; status: LimitStatus }> {
  const status = await getStatus(deviceId);
  const ipUsed = Number((await redis.get(ipKey(ip))) ?? 0);

  if (status.remaining <= 0 || ipUsed >= IP_DAILY_CAP) {
    return { allowed: false, status };
  }

  const ttl = secondsUntilNextUtcMidnight();
  const pipeline = redis.pipeline();
  pipeline.incr(deviceKey(deviceId));
  pipeline.expire(deviceKey(deviceId), ttl);
  pipeline.incr(ipKey(ip));
  pipeline.expire(ipKey(ip), ttl);
  await pipeline.exec();

  return {
    allowed: true,
    status: { remaining: status.remaining - 1, limit: status.limit },
  };
}

/**
 * Doğrulanmış (SSV geçmiş) bir ödüllü reklam sonrası +1 hak tanır.
 * Bilinçli olarak sadece rewardCallback route'undan çağrılmalı, client'tan asla doğrudan değil.
 */
export async function grantBonusSearch(deviceId: string): Promise<void> {
  const key = `${deviceKey(deviceId)}:bonus`;
  const ttl = secondsUntilNextUtcMidnight();
  await redis.incr(key);
  await redis.expire(key, ttl);
}

export async function closeRateLimiter(): Promise<void> {
  await redis.quit();
}
