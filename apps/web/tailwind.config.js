/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Primary */
        primary: "#003d9b",
        "primary-container": "#0052cc",
        "on-primary": "#ffffff",
        "on-primary-container": "#c4d2ff",
        "primary-fixed": "#dae2ff",
        "primary-fixed-dim": "#b2c5ff",
        "on-primary-fixed": "#001848",
        "on-primary-fixed-variant": "#0040a2",
        "inverse-primary": "#b2c5ff",

        /* Secondary */
        secondary: "#5c5f60",
        "secondary-container": "#dee0e2",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#606365",
        "secondary-fixed": "#e1e2e4",
        "secondary-fixed-dim": "#c5c6c8",
        "on-secondary-fixed": "#191c1e",
        "on-secondary-fixed-variant": "#444749",

        /* Tertiary */
        tertiary: "#004b59",
        "tertiary-container": "#006477",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#76e2ff",
        "tertiary-fixed": "#afecff",
        "tertiary-fixed-dim": "#48d7f9",
        "on-tertiary-fixed": "#001f27",
        "on-tertiary-fixed-variant": "#004e5d",

        /* Surface and background */
        surface: "#f9f9ff",
        "surface-dim": "#cadaff",
        "surface-bright": "#f9f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f1f3ff",
        "surface-container": "#e8edff",
        "surface-container-high": "#e0e8ff",
        "surface-container-highest": "#d7e2ff",
        "surface-variant": "#d7e2ff",
        "surface-tint": "#0c56d0",
        background: "#f9f9ff",
        "on-surface": "#041b3c",
        "on-surface-variant": "#434654",
        "on-background": "#041b3c",
        "inverse-surface": "#1d3052",
        "inverse-on-surface": "#edf0ff",

        /* Outline */
        outline: "#737685",
        "outline-variant": "#c3c6d6",

        /* Error */
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        /* Functional and semantic */
        success: "#00875a",
        "success-light": "#e3fcef",
        warning: "#ff991f",
        "warning-light": "#fffae6",
        info: "#0065ff",
        "info-light": "#deebff",
      },
      fontFamily: {
        headline: ["var(--font-manrope)", "Manrope", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        "display-lg": ["32px", { lineHeight: "40px", letterSpacing: "0", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "headline-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "label-md": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "label-bold": ["12px", { lineHeight: "16px", fontWeight: "700" }],
        code: ["13px", { lineHeight: "18px", fontWeight: "400" }],
      },
      spacing: {
        "sidebar-width": "260px",
        gutter: "16px",
        "container-padding": "24px",
        "widget-gap": "20px",
        unit: "4px",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.125rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.5rem",
        "2xl": "0.5rem",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0,0,0,0.04)",
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        elevated: "0 4px 12px rgba(0,0,0,0.08)",
        float: "0 8px 24px rgba(0,0,0,0.12)",
      },
      keyframes: {
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [],
};
