import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiBaseUrl?: string;
  androidCloudProjectNumber?: string;
};

export const API_BASE_URL = extra.apiBaseUrl ?? "http://localhost:3000";
export const ANDROID_CLOUD_PROJECT_NUMBER = extra.androidCloudProjectNumber ?? "";

export const DAILY_FREE_SEARCHES_FALLBACK = 3;
