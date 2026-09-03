import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "iav_device_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Var olan çerezi okur, yoksa yenisini üretip set eder.
 * httpOnly olduğu için istemci tarafı JS ile silinemez/değiştirilemez —
 * yalnızca tarayıcı çerezleri manuel temizlenirse ya da gizli sekme kapanırsa sıfırlanır.
 * Bu, hiçbir hesap gerektirmeyen bir anonim sistemin kabul edilebilir sınırıdır.
 */
export function getOrCreateDeviceId(): string {
  const store = cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const fresh = randomUUID();
  store.set(COOKIE_NAME, fresh, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
  return fresh;
}

export function getClientIp(headers: Headers): string {
  // Vercel gibi platformlar arkasında gerçek istemci IP'si bu header'da gelir.
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
