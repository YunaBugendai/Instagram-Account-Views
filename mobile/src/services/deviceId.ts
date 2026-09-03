import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "iav_device_id";

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  const existing = await SecureStore.getItemAsync(STORAGE_KEY);
  if (existing) {
    cachedDeviceId = existing;
    return existing;
  }

  const fresh = Crypto.randomUUID();
  await SecureStore.setItemAsync(STORAGE_KEY, fresh);
  cachedDeviceId = fresh;
  return fresh;
}
