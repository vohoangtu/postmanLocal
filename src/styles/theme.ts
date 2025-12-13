export const theme = {
  colors: {
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb", // WCAG AA compliant với white text
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
    // Accessibility: Đảm bảo contrast ratios đạt WCAG AA (4.5:1 cho text nhỏ, 3:1 cho text lớn)
    accessibility: {
      // Focus ring colors với high contrast
      focusRing: "#2563eb", // blue-600
      focusRingOffset: "#ffffff",
      // Text colors với sufficient contrast
      text: {
        primary: "#111827", // gray-900 - 16.5:1 với white
        secondary: "#374151", // gray-700 - 8.2:1 với white
        muted: "#6b7280", // gray-500 - 4.6:1 với white (WCAG AA)
      },
      // Background colors
      background: {
        default: "#ffffff",
        secondary: "#f9fafb", // gray-50
        dark: "#111827", // gray-900
      },
    },
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
    },
    error: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
    },
    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
    },
  },
  spacing: {
    // Spacing scale: 4px, 8px, 12px, 16px, 24px, 32px
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "0.75rem", // 12px
    lg: "1rem", // 16px
    xl: "1.5rem", // 24px
    "2xl": "2rem", // 32px
    "3xl": "3rem", // 48px
    "4xl": "4rem", // 64px
  },
  borderRadius: {
    // Border radius scale: 4px, 6px, 8px, 12px
    none: "0",
    sm: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px
    full: "9999px",
  },
  shadows: {
    none: "none",
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  },
  // Component heights
  heights: {
    input: "2.5rem", // 40px
    button: {
      sm: "2rem", // 32px
      md: "2.5rem", // 40px
      lg: "3rem", // 48px
    },
    tab: "2.5rem", // 40px (h-10)
    tabCompact: "2rem", // 32px (h-8)
  },
  transitions: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
  },
};

export type Theme = typeof theme;

