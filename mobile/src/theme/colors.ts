export const colors = {
  background: "#14161F",
  surface: "#1D202C",
  surfaceRaised: "#242838",
  border: "#2A2D3A",
  textPrimary: "#F2F1ED",
  textSecondary: "#8B8D9C",
  textMuted: "#5B5D6B",
  accent: "#E8B04B",
  accentPressed: "#CC9636",
  danger: "#E2685B",
  success: "#6FBF8B",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 56, fontWeight: "700" as const, letterSpacing: -1 },
  title: { fontSize: 22, fontWeight: "600" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  label: { fontSize: 14, fontWeight: "500" as const },
  caption: { fontSize: 12, fontWeight: "400" as const },
};
