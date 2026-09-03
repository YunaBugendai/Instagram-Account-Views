import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing, typography } from "../theme/colors";
import { PrimaryButton } from "../components/PrimaryButton";
import { Disclaimer } from "../components/Disclaimer";
import type { RootStackParamList } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

export default function ResultScreen({ route, navigation }: Props) {
  const { username, result } = route.params;
  const { estimatedViews, breakdown } = result;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.username}>@{username}</Text>
      <Text style={styles.label}>Tahmini profil ziyaretleri</Text>
      <Text style={styles.value}>{estimatedViews.toLocaleString("tr-TR")}</Text>

      <View style={styles.breakdownBox}>
        <Text style={styles.breakdownTitle}>Nasıl hesaplandı</Text>
        <BreakdownRow label="Taban değer (takipçi ÷ 25)" value={breakdown.base.toLocaleString("tr-TR")} />
        <BreakdownRow label="Aktiflik katsayısı" value={breakdown.activityFactor.toFixed(2)} />
        <BreakdownRow label="Popülerlik katsayısı" value={breakdown.popularityFactor.toFixed(2)} />
        <BreakdownRow
          label="Günlük varyasyon"
          value={`${breakdown.dailyVariationPercent > 0 ? "+" : ""}${breakdown.dailyVariationPercent}%`}
        />
      </View>

      <Disclaimer />

      <PrimaryButton label="Başka bir hesap dene" variant="secondary" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: "center",
  },
  username: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  value: {
    ...typography.display,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  breakdownBox: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  breakdownTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
  },
});
