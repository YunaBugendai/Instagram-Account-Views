import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme/colors";

export function Disclaimer({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      <Text style={styles.text}>
        Bu değer Instagram tarafından sağlanan gerçek bir veri değildir. Girdiğin sayılardan
        hesaplanan, eğlence amaçlı bir tahmindir.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wrapperCompact: {
    padding: spacing.sm,
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
