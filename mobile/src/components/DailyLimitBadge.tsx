import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme/colors";

export function DailyLimitBadge({ remaining, limit }: { remaining: number; limit: number }) {
  const empty = remaining <= 0;
  return (
    <View style={[styles.wrapper, empty && styles.wrapperEmpty]}>
      <Text style={[styles.text, empty && styles.textEmpty]}>
        Bugünkü hakkın: {remaining}/{limit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  wrapperEmpty: {
    backgroundColor: "rgba(226, 104, 91, 0.15)",
  },
  text: {
    ...typography.label,
    color: colors.textSecondary,
  },
  textEmpty: {
    color: colors.danger,
  },
});
