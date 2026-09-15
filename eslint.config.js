import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  // ─── Ignore generated / third-party / framework files ───────────────────
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "drizzle/migrations/**",
      "eslint.config.js",
      "vite.config.ts",
      "drizzle.config.ts",
      "vitest.config.ts",
      "patches/**",
      // shadcn/ui generated components
      "client/src/components/ui/**",
      // Manus framework plumbing — do not lint
      "server/_core/**",
      "client/public/**",
      "client/src/components/DashboardLayout.tsx",
      "client/src/components/DashboardLayoutSkeleton.tsx",
      "client/src/components/AIChatBox.tsx",
      "client/src/components/Map.tsx",
      "client/src/components/ManusDialog.tsx",
      "client/src/contexts/AuthContext.tsx",
      "client/src/hooks/usePersistFn.ts",
      "client/src/lib/trpc.ts",
      "client/src/const.ts",
      "client/src/_core/**",
      // Test files
      "**/*.test.ts",
      "**/*.mjs",
    ],
  },

  // ─── Base JS recommended ─────────────────────────────────────────────────
  js.configs.recommended,

  // ─── TypeScript recommended ──────────────────────────────────────────────
  ...tseslint.configs.recommended,

  // ─── React Hooks ─────────────────────────────────────────────────────────
  {
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },

  // ─── Client (browser) files ──────────────────────────────────────────────
  {
    files: ["client/src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // ─── Server (Node) files ─────────────────────────────────────────────────
  {
    files: ["server/**/*.ts", "shared/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-require-imports": "warn",
      // Allow `this` aliasing in legacy patterns
      "@typescript-eslint/no-this-alias": "warn",
    },
  }
);
