import { createVerify } from "node:crypto";
import { env } from "../config/env.js";

interface VerifierKey {
  keyId: number;
  pem: string;
}

interface VerifierKeysResponse {
  keys: VerifierKey[];
}

let cachedKeys: { keys: VerifierKey[]; fetchedAt: number } | null = null;
const KEY_CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000; // Google 24 saatte bir rotasyon öneriyor, ihtiyatlı olmak için 12 saatte bir yeniliyoruz

async function getVerifierKeys(): Promise<VerifierKey[]> {
  if (cachedKeys && Date.now() - cachedKeys.fetchedAt < KEY_CACHE_MAX_AGE_MS) {
    return cachedKeys.keys;
  }
  const res = await fetch(env.ADMOB_SSV_PUBLIC_KEYS_URL);
  if (!res.ok) {
    throw new Error(`AdMob doğrulama anahtarları alınamadı: ${res.status}`);
  }
  const body = (await res.json()) as VerifierKeysResponse;
  cachedKeys = { keys: body.keys, fetchedAt: Date.now() };
  return body.keys;
}

export interface SsvCallbackParams {
  adNetwork: string;
  adUnit: string;
  rewardAmount: string;
  rewardItem: string;
  timestamp: string;
  transactionId: string;
  customData?: string;
  keyId: string;
  signature: string;
}

/**
 * rawQuery: Fastify request.raw.url'den alınan, hiç dokunulmamış ham query string
 * (query parse edilip yeniden serialize edilirse imza tutmaz — Google bunu açıkça uyarıyor).
 */
export async function verifySsvCallback(
  rawQuery: string,
  params: SsvCallbackParams
): Promise<{ valid: boolean; reason?: string }> {
  if (
    env.ADMOB_SSV_ALLOWED_AD_UNIT_IDS.length > 0 &&
    !env.ADMOB_SSV_ALLOWED_AD_UNIT_IDS.includes(params.adUnit)
  ) {
    return { valid: false, reason: "bilinmeyen ad_unit" };
  }

  const signatureIndex = rawQuery.indexOf("&signature=");
  if (signatureIndex === -1) {
    return { valid: false, reason: "signature parametresi bulunamadı" };
  }
  // Doğrulanacak içerik: "?" işaretinden sonrası, "&signature=..." öncesi — sıralama korunmalı
  const queryStart = rawQuery.indexOf("?");
  const content = rawQuery.slice(queryStart + 1, signatureIndex);

  const keys = await getVerifierKeys();
  const matchingKey = keys.find((k) => String(k.keyId) === params.keyId);
  if (!matchingKey) {
    return { valid: false, reason: "eşleşen key_id yok (anahtar rotasyonu olabilir)" };
  }

  const signatureBuffer = Buffer.from(
    params.signature.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );

  const verifier = createVerify("SHA256");
  verifier.update(content);
  verifier.end();

  const valid = verifier.verify(matchingKey.pem, signatureBuffer);
  return { valid, reason: valid ? undefined : "imza doğrulanamadı" };
}
