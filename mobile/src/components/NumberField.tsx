import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme/colors";

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
}

export function NumberField({ label, value, onChangeText, placeholder, error }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, !!error && styles.inputError]}
        maxLength={12}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 17,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
