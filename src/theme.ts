import { DefaultTheme } from "react-native-paper"

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#45A19D", // Teal color to match bottom navigation
    secondary: "#FFA500", // Orange for action
    background: "#FFFFFF",
    surface: "#FFFFFF",
    text: "#000000",
    error: "#FF0000",
    pending: "#FFD700", // Yellow for pending
    completed: "#008000", // Green for completed
    cancelled: "#FF0000", // Red for cancelled
    disabled: "#CCCCCC",
    placeholder: "#888888",
    backdrop: "rgba(0, 0, 0, 0.5)",
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: "Roboto-Regular",
      fontWeight: "normal",
    },
    medium: {
      fontFamily: "Roboto-Medium",
      fontWeight: "normal",
    },
    bold: {
      fontFamily: "Roboto-Bold",
      fontWeight: "normal",
    },
  },
  roundness: 8,
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
}
