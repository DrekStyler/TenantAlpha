export const theme = {
  colors: {
    navy: {
      50: "#f7f7f5",
      100: "#e8e8e4",
      200: "#d1d1cc",
      300: "#a8a8a2",
      400: "#7d7d77",
      500: "#5c5c56",
      600: "#4a4a44",
      700: "#3d3d38",
      800: "#333333",
      900: "#1a1a1a",
    },
    gold: {
      300: "#d4b87a",
      400: "#c4a55a",
      500: "#A4863D",
      600: "#8a6f2e",
    },
    lavender: {
      50: "#f5f5fd",
      100: "#E6E6FA",
      200: "#d0d0f0",
    },
    forest: {
      800: "#1a4a1a",
      900: "#0E300E",
    },
  },
} as const;

// Chart colors for each lease option
export const OPTION_COLORS = [
  "#1a1a1a", // Charcoal (Option A)
  "#A4863D", // Brass (Option B)
  "#0E300E", // Forest (Option C)
  "#c4a55a", // Light Brass (Option D)
  "#7d7d77", // Mid Gray (Option E)
] as const;
