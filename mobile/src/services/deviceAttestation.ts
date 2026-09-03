import * as AppIntegrity from "@expo/app-integrity";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_BASE_URL, ANDROID_CLOUD_PROJECT_NUMBER } from "../config";
import { getDeviceId } from "./deviceId";

const IOS_KEY_ID_STORAGE = "iav_app_attest_key_id";

// Bilinçli olarak api.ts'i import etmiyoruz: api.ts hassas isteklerde bu dosyadaki
// getAttestationHeaders'ı kullanıyor, döngüsel bağımlılığı önlemek için bootstrap
// sırasında gereken iki "kimliksiz" endpoint çağrısını burada, ayrıca tanımlıyoruz.
async function postJsonUnauthenticated<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} başarısız: ${res.status}`);
  return res.json() as Promise<T>;
}

let androidProviderReady = false;

/**
 * Uygulama açılışında bir kere çağrılır.
 * Android: token sağlayıcıyı hazırlar.
 * iOS: cihazda daha önce üretilmiş bir anahtar yoksa, anahtar üretip Apple'a attest ettirir
 *      ve backend'e kaydeder. Zaten kayıtlıysa hiçbir şey yapmaz.
 */
export async function bootstrapDeviceAttestation(): Promise<void> {
  if (Platform.OS === "android") {
    if (!ANDROID_CLOUD_PROJECT_NUMBER) {
      console.warn("androidCloudProjectNumber tanımlı değil - app.json > extra alanını doldur");
      return;
    }
    await AppIntegrity.prepareIntegrityTokenProviderAsync(ANDROID_CLOUD_PROJECT_NUMBER);
    androidProviderReady = true;
    return;
  }

  if (Platform.OS === "ios") {
    if (!AppIntegrity.isSupported) return; // simülatör veya desteklenmeyen cihaz

    const existingKeyId = await SecureStore.getItemAsync(IOS_KEY_ID_STORAGE);
    if (existingKeyId) return; // zaten kayıtlı

    const keyId = await AppIntegrity.generateKeyAsync();
    const deviceId = await getDeviceId();
    const { challenge } = await postJsonUnauthenticated<{ challenge: string }>(
      "/devices/challenge",
      {}
    );
    // NOT: attestKeyAsync/generateAssertionAsync'in döndürdüğü string'lerin base64 olduğu
    // varsayılıyor (bu tip native modüllerde yaygın kural); gerçek cihazda test ederken
    // backend tarafındaki Buffer.from(..., "base64") ile uyuşmazlık görürsen burada
    // encoding'i doğrulaman gerekir.
    const attestation = await AppIntegrity.attestKeyAsync(keyId, challenge);

    await postJsonUnauthenticated("/devices/register-attestation", {
      deviceId,
      keyId,
      attestation,
      challenge,
      bundleIdentifier: "com.enes.instagramaccountviews",
    });

    await SecureStore.setItemAsync(IOS_KEY_ID_STORAGE, keyId);
  }
}

async function hashBody(body: unknown): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, JSON.stringify(body ?? {}));
}

/**
 * Hassas her istekte (hesapla, ödül talebi) çağrılır; o isteğe özel, tek seferlik
 * bir doğrulama kanıtı üretip gereken header'ları döner.
 */
export async function getAttestationHeaders(body: unknown): Promise<Record<string, string>> {
  const deviceId = await getDeviceId();

  if (Platform.OS === "android") {
    if (!androidProviderReady) await bootstrapDeviceAttestation();
    const requestHash = await hashBody(body);
    const integrityToken = await AppIntegrity.requestIntegrityCheckAsync(requestHash);
    return {
      "x-device-id": deviceId,
      "x-platform": "android",
      "x-play-integrity-token": integrityToken,
    };
  }

  if (Platform.OS === "ios") {
    const keyId = await SecureStore.getItemAsync(IOS_KEY_ID_STORAGE);
    if (!keyId) {
      throw new Error("iOS cihazı henüz attest edilmedi - bootstrapDeviceAttestation() çağrılmalı");
    }
    const assertion = await AppIntegrity.generateAssertionAsync(keyId, JSON.stringify(body ?? {}));
    return {
      "x-device-id": deviceId,
      "x-platform": "ios",
      "x-app-attest-assertion": assertion,
    };
  }

  throw new Error("Desteklenmeyen platform");
}
