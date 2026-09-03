import { GoogleAuth } from "google-auth-library";
import { verifyAttestation, verifyAssertion } from "node-app-attest";
import { env } from "../config/env.js";

/**
 * ANDROID — Play Integrity API
 * İstemci (mobil uygulama) her hassas istekte (arama hakkı tüketme, ödül talebi)
 * kısa ömürlü bir integrity token üretir; biz bunu Google'a gönderip çözümlüyoruz.
 * Cihaz manipülasyonu (root, emulator, tekrar-paketleme) burada yakalanır.
 *
 * Kurulum: Google Cloud Console > Play Integrity API'yi etkinleştir, bir servis
 * hesabı oluştur ve JSON anahtarını PLAY_INTEGRITY_SERVICE_ACCOUNT_JSON_PATH'e koy.
 */
let googleAuthClient: GoogleAuth | null = null;

function getGoogleAuth(): GoogleAuth {
  if (!googleAuthClient) {
    googleAuthClient = new GoogleAuth({
      keyFile: env.PLAY_INTEGRITY_SERVICE_ACCOUNT_JSON_PATH || undefined,
      scopes: ["https://www.googleapis.com/auth/playintegrity"],
    });
  }
  return googleAuthClient;
}

export interface PlayIntegrityVerdict {
  verified: boolean;
  reason?: string;
}

export async function verifyPlayIntegrityToken(
  integrityToken: string,
  packageName: string
): Promise<PlayIntegrityVerdict> {
  if (!env.GOOGLE_CLOUD_PROJECT_NUMBER || !env.PLAY_INTEGRITY_SERVICE_ACCOUNT_JSON_PATH) {
    // Kimlik bilgileri henüz tanımlanmamış (yerel geliştirme ortamı) — geliştirmeyi
    // bloklamamak için geçici olarak izin ver, ama production'da bu asla olmamalı.
    if (env.NODE_ENV !== "production") {
      return { verified: true, reason: "dev-mode-bypass" };
    }
    return { verified: false, reason: "play-integrity-not-configured" };
  }

  const auth = getGoogleAuth();
  const client = await auth.getClient();
  const url = `https://playintegrity.googleapis.com/v1/${encodeURIComponent(
    packageName
  )}:decodeIntegrityToken`;

  const response = await client.request<{
    tokenPayloadExternal?: {
      appIntegrity?: { appRecognitionVerdict?: string };
      deviceIntegrity?: { deviceRecognitionVerdict?: string[] };
    };
  }>({
    url,
    method: "POST",
    data: { integrity_token: integrityToken },
  });

  const appVerdict = response.data.tokenPayloadExternal?.appIntegrity?.appRecognitionVerdict;
  const deviceVerdicts =
    response.data.tokenPayloadExternal?.deviceIntegrity?.deviceRecognitionVerdict ?? [];

  const verified =
    appVerdict === "PLAY_RECOGNIZED" && deviceVerdicts.includes("MEETS_DEVICE_INTEGRITY");

  return { verified, reason: verified ? undefined : `app=${appVerdict} device=${deviceVerdicts}` };
}

/**
 * iOS — App Attest
 * İlk kurulumda uygulama bir anahtar çifti üretir ve Apple'dan "attestation" alır;
 * biz bunu bir kere doğrulayıp public key'i kaydederiz. Sonraki her istekte
 * uygulama o anahtarla imzalanmış hafif bir "assertion" gönderir, biz onu doğrularız.
 * Public key + signCount saklama işini burada basitleştirmek için imzalayan tarafa bırakıyoruz;
 * production'da bunları Postgres'te cihaz başına saklamalısın (bkz. README).
 */
export function verifyAppAttestAttestation(params: {
  attestation: Buffer;
  challenge: Buffer;
  keyId: string;
  bundleIdentifier: string;
}): { keyId: string; publicKey: string } {
  return verifyAttestation({
    attestation: params.attestation,
    challenge: params.challenge,
    keyId: params.keyId,
    bundleIdentifier: params.bundleIdentifier,
    teamIdentifier: env.APPLE_TEAM_ID,
    allowDevelopmentEnvironment: env.APPLE_APP_ATTEST_ENV === "development",
  });
}

export function verifyAppAttestAssertion(params: {
  assertion: Buffer;
  payload: Buffer;
  publicKey: string;
  bundleIdentifier: string;
  signCount: number;
}): { signCount: number } {
  return verifyAssertion({
    assertion: params.assertion,
    payload: params.payload,
    publicKey: params.publicKey,
    bundleIdentifier: params.bundleIdentifier,
    teamIdentifier: env.APPLE_TEAM_ID,
    signCount: params.signCount,
  });
}
