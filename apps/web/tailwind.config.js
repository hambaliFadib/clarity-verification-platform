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
        /* ── Semantic tokens (from CSS variables) ── */
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        border: { DEFAULT: "var(--border)", strong: "var(--border-strong)" },
        ring: "var(--ring)",
        "muted-foreground": "var(--muted-foreground)",

        success: { DEFAULT: "var(--success)", foreground: "var(--success-foreground)", muted: "var(--success-muted)" },
        warning: { DEFAULT: "var(--warning)", foreground: "var(--warning-foreground)", muted: "var(--warning-muted)" },
        danger: { DEFAULT: "var(--danger)", foreground: "var(--danger-foreground)", muted: "var(--danger-muted)" },
        info: { DEFAULT: "var(--info)", foreground: "var(--info-foreground)", muted: "var(--info-muted)" },

        /* ── Existing Material-inspired palette (preserved) ── */
        "surface-container-highest": "#e2e2e6",
        "on-background": "#1a1c1f",
        "on-surface": "#1a1c1f",
        "surface-variant": "#e2e2e6",
        "primary": "#00375e",
        "on-error-container": "#93000a",
        "secondary": "#0061a4",
        "on-tertiary": "#ffffff",
        "on-secondary-fixed": "#001d36",
        "inverse-on-surface": "#f0f0f4",
        "tertiary": "#4c2e00",
        "surface-bright": "#f9f9fd",
        "surface-container-high": "#e8e8ec",
        "on-secondary": "#ffffff",
        "on-tertiary-container": "#e9b268",
        "on-primary-fixed": "#001d35",
        "primary-container": "#1f4e79",
        "on-tertiary-fixed": "#2a1800",
        "on-secondary-fixed-variant": "#00497d",
        "on-error": "#ffffff",
        "primary-fixed-dim": "#a0cafc",
        "on-surface-variant": "#42474f",
        "surface-tint": "#35618d",
        "tertiary-container": "#6a4300",
        "on-tertiary-fixed-variant": "#643f00",
        "error": "#ba1a1a",
        "on-primary-fixed-variant": "#184974",
        "inverse-primary": "#a0cafc",
        "surface": "#f9f9fd",
        "on-primary": "#ffffff",
        "tertiary-fixed-dim": "#f5bc72",
        "primary-fixed": "#d1e4ff",
        "surface-container": "#ededf2",
        "on-secondary-container": "#00355c",
        "outline-variant": "#c2c7d0",
        "inverse-surface": "#2f3034",
        "outline": "#72777f",
        "secondary-fixed-dim": "#9ecaff",
        "on-primary-container": "#95bff1",
        "surface-container-lowest": "#ffffff",
        "secondary-container": "#33a0fd",
        "surface-dim": "#d9dade",
        "secondary-fixed": "#d1e4ff",
        "surface-container-low": "#f3f3f7",
        "error-container": "#ffdad6",
        "tertiary-fixed": "#ffddb5"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        headline: ["var(--font-manrope)", "Manrope", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
        brand: ["var(--font-manrope)", "Manrope", "sans-serif"],
      },
      fontSize: {
        /* ── Typography scale ── */
        "display": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "headline-sm": ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        "title-lg": ["20px", { lineHeight: "1.3", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "1.4", fontWeight: "400" }],
        "label-lg": ["14px", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "500" }],
        "label-md": ["13px", { lineHeight: "1.4", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        "label-bold": ["12px", { lineHeight: "1.4", fontWeight: "700" }],
        "caption": ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        code: ["13px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      spacing: {
        "sidebar-width": "260px",
        "sidebar-collapsed": "72px",
        "header-height": "64px",
        "container-padding": "24px",
        "widget-gap": "20px",
        unit: "4px",
        "margin-mobile": "16px",
        "xs": "4px",
        "lg": "24px",
        "xl": "32px",
        "margin-desktop": "32px",
        "gutter": "24px",
        "sm": "8px",
        "container-max": "1440px",
        "md": "16px",
        "2xl": "48px",
        "base": "4px"
      },
      maxWidth: {
        "page": "80rem",       /* 1280px — default page */
        "page-wide": "96rem",  /* 1536px — wide variant */
      },
      borderRadius: {
        DEFAULT: "0.375rem",    /* 6px — small controls */
        sm: "0.375rem",         /* 6px */
        md: "0.5rem",           /* 8px — buttons, inputs */
        lg: "0.75rem",          /* 12px — cards, panels */
        xl: "1rem",             /* 16px — modals, large containers */
        "2xl": "1rem",          /* 16px */
        "card": "12px",
        "full": "9999px"
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0,0,0,0.04)",
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        elevated: "0 4px 12px rgba(0,0,0,0.08)",
        float: "0 8px 24px rgba(0,0,0,0.12)",
        "level-2": "0px 4px 12px rgba(0, 0, 0, 0.05)",
        "level-3": "0px 8px 24px rgba(0, 0, 0, 0.08)"
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
  plugins: [
    require("@tailwindcss/container-queries")
  ],
};
