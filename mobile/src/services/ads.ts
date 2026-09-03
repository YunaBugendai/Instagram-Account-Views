import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import { requestRewardToken } from "./api";

// __DEV__'de her zaman Google'ın test reklam birimini kullan - kendi reklam birimini
// geliştirme sırasında kullanmak AdMob hesabını "geçersiz trafik" nedeniyle askıya aldırabilir.
const AD_UNIT_ID = __DEV__ ? TestIds.REWARDED : "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY";

export interface RewardedAdCallbacks {
  onEarned: () => void;
  onFailed: (reason: string) => void;
  onClosed: () => void;
}

export async function showRewardedAd(callbacks: RewardedAdCallbacks): Promise<void> {
  let customData: string;
  try {
    const tokenResponse = await requestRewardToken();
    customData = tokenResponse.customData;
  } catch {
    callbacks.onFailed("Reklam başlatılamadı, internet bağlantını kontrol et.");
    return;
  }

  const rewarded = RewardedAd.createForAdRequest(AD_UNIT_ID, {
    serverSideVerificationOptions: { customData },
  });

  const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewarded.show();
  });

  const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    // Bu, AdMob'un istemci tarafı "izlendi" sinyali. Gerçek hak artışı backend'in
    // AdMob'dan aldığı imzalı SSV callback'iyle olur (birkaç saniye gecikebilir).
    callbacks.onEarned();
  });

  const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
    callbacks.onFailed(error?.message ?? "Reklam yüklenemedi.");
  });

  const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
    callbacks.onClosed();
    unsubscribeLoaded();
    unsubscribeEarned();
    unsubscribeError();
    unsubscribeClosed();
  });

  rewarded.load();
}
