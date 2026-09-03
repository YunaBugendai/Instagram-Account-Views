import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing, typography } from "../theme/colors";
import { PrimaryButton } from "../components/PrimaryButton";
import { NumberField } from "../components/NumberField";
import { Disclaimer } from "../components/Disclaimer";
import { DailyLimitBadge } from "../components/DailyLimitBadge";
import { ApiError, calculateEstimate, fetchDailyStatus } from "../services/api";
import { bootstrapDeviceAttestation } from "../services/deviceAttestation";
import { showRewardedAd } from "../services/ads";
import type { DailyStatus, RootStackParamList } from "../types";

const BANNER_AD_UNIT_ID = __DEV__ ? TestIds.BANNER : "ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface FormState {
  username: string;
  followers: string;
  following: string;
  posts: string;
}

interface FormErrors {
  username?: string;
  followers?: string;
  following?: string;
  posts?: string;
}

const USERNAME_REGEX = /^[a-zA-Z0-9._]{1,30}$/;

export default function HomeScreen({ navigation }: Props) {
  const [form, setForm] = useState<FormState>({
    username: "",
    followers: "",
    following: "",
    posts: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await fetchDailyStatus();
      setStatus(s);
    } catch {
      // Sessizce geç - ekranın açılışını bloklayacak kritik bir bilgi değil,
      // "Hesapla" basıldığında zaten tekrar kontrol edilecek.
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await bootstrapDeviceAttestation();
      } catch (err) {
        console.warn("Cihaz doğrulama hazırlığı başarısız", err);
      }
      await refreshStatus();
    })();
  }, [refreshStatus]);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.username.trim()) {
      next.username = "Kullanıcı adı boş olamaz";
    } else if (!USERNAME_REGEX.test(form.username.trim())) {
      next.username = "Geçersiz kullanıcı adı";
    }
    if (!form.followers) next.followers = "Takipçi sayısını gir";
    if (!form.following) next.following = "Takip edilen sayısını gir";
    if (!form.posts) next.posts = "Gönderi sayısını gir";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleCalculate() {
    setBanner(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await calculateEstimate({
        username: form.username.trim(),
        followers: Number(form.followers),
        following: Number(form.following),
        posts: Number(form.posts),
      });
      navigation.navigate("Result", { username: form.username.trim(), result });
      await refreshStatus();
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setStatus((prev) => ({ remaining: 0, limit: prev?.limit ?? 3 }));
        setBanner("Günlük arama hakkın bitti. Reklam izleyerek +1 hak kazanabilirsin.");
      } else if (err instanceof ApiError && err.status === 400) {
        setBanner("Girdiğin bilgiler geçersiz görünüyor, tekrar kontrol et.");
      } else {
        setBanner("Bir şeyler ters gitti. İnternet bağlantını kontrol edip tekrar dene.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleWatchAd() {
    setAdLoading(true);
    await showRewardedAd({
      onEarned: () => {
        setBanner("Reklam tamamlandı, hakkın birazdan güncellenecek.");
        setTimeout(refreshStatus, 4000);
      },
      onFailed: (reason) => {
        setAdLoading(false);
        Alert.alert("Reklam yüklenemedi", reason);
      },
      onClosed: () => {
        setAdLoading(false);
      },
    });
  }

  const outOfSearches = status !== null && status.remaining <= 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Instagram profil ziyaretlerini tahmin et</Text>
        <Text style={styles.subtitle}>
          Instagram'da profilinde gördüğün sayıları gir, sana eğlenceli bir tahmin çıkaralım.
        </Text>

        {status && <DailyLimitBadge remaining={status.remaining} limit={status.limit} />}

        <View style={styles.form}>
          <NumberField
            label="Kullanıcı adı"
            value={form.username}
            onChangeText={(text) => setForm((f) => ({ ...f, username: text }))}
            placeholder="kullaniciadi"
            error={errors.username}
          />
          <NumberField
            label="Takipçi sayısı"
            value={form.followers}
            onChangeText={(text) => setForm((f) => ({ ...f, followers: text }))}
            placeholder="Örn. 4200"
            error={errors.followers}
          />
          <NumberField
            label="Takip edilen sayısı"
            value={form.following}
            onChangeText={(text) => setForm((f) => ({ ...f, following: text }))}
            placeholder="Örn. 380"
            error={errors.following}
          />
          <NumberField
            label="Gönderi sayısı"
            value={form.posts}
            onChangeText={(text) => setForm((f) => ({ ...f, posts: text }))}
            placeholder="Örn. 120"
            error={errors.posts}
          />
        </View>

        {banner && (
          <View style={styles.bannerBox}>
            <Text style={styles.bannerText}>{banner}</Text>
          </View>
        )}

        {outOfSearches ? (
          <PrimaryButton
            label="Reklam izle → +1 hak kazan"
            onPress={handleWatchAd}
            loading={adLoading}
          />
        ) : (
          <PrimaryButton label="Hesapla" onPress={handleCalculate} loading={loading} />
        )}

        <Disclaimer />
      </ScrollView>

      <View style={styles.bannerAdWrapper}>
        <BannerAd unitId={BANNER_AD_UNIT_ID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.md,
  },
  bannerBox: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    padding: spacing.md,
  },
  bannerText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  bannerAdWrapper: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
});
