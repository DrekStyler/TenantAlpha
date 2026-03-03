export const theme = {
  colors: {
    navy: {
      50: "#f0f4f8",
      100: "#d9e2ec",
      200: "#bcccdc",
      300: "#9fb3c8",
      400: "#829ab1",
      500: "#627d98",
      600: "#486581",
      700: "#334e68",
      800: "#243b53",
      900: "#102a43",
    },
    gold: {
      300: "#f7d070",
      400: "#f0c040",
      500: "#d4a017",
      600: "#b8860b",
    },
  },
} as const;

// Chart colors for each lease option
export const OPTION_COLORS = [
  "#102a43", // Navy (Option A)
  "#d4a017", // Gold (Option B)
  "#486581", // Mid Navy (Option C)
  "#f0c040", // Light Gold (Option D)
  "#829ab1", // Light Navy (Option E)
] as const;
