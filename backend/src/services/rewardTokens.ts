import { randomUUID } from "node:crypto";
import Redis from "ioredis";
import { env } from "../config/env.js";

const redis = new Redis(env.REDIS_URL);

const TOKEN_TTL_SECONDS = 10 * 60; // kullanıcının reklamı izlemesi için makul süre
const TRANSACTION_TTL_SECONDS = 60 * 60 * 24 * 2; // aynı transaction_id'nin iki kere ödüllendirmemesi için

/**
 * Mobil uygulama ödüllü reklamı yüklemeden hemen önce çağırır.
 * Dönen token, AdMob SDK'sına customData olarak verilir; AdMob bunu SSV callback'inde
 * aynen geri gönderir, böylece callback hangi cihazı ödüllendireceğini öğrenir.
 */
export async function issueRewardToken(deviceId: string): Promise<string> {
  const token = randomUUID();
  await redis.set(`iav:reward-token:${token}`, deviceId, "EX", TOKEN_TTL_SECONDS);
  return token;
}

export async function resolveRewardToken(token: string): Promise<string | null> {
  return redis.get(`iav:reward-token:${token}`);
}

/**
 * true dönerse bu transaction_id ilk kez görülüyor demektir (ödül verilebilir).
 * false dönerse daha önce işlenmiş — AdMob aynı callback'i tekrar denemiş olabilir, ödül tekrar verilmemeli.
 */
export async function markTransactionOnce(transactionId: string): Promise<boolean> {
  const key = `iav:reward-tx:${transactionId}`;
  const result = await redis.set(key, "1", "EX", TRANSACTION_TTL_SECONDS, "NX");
  return result === "OK";
}
