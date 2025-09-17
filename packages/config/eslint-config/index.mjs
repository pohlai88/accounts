// @aibos/eslint-config
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,ts,tsx}"],
    ignores: [
      "**/*.config.*",
      "**/vitest.config.*",
      "**/jest.config.*",
      "**/playwright.config.*",
      "scripts/**/*.js" // Exclude plain Node.js scripts from TypeScript parsing
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json", // Required for type-aware rules
      },
      globals: {
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        crypto: "readonly",
        atob: "readonly",
        btoa: "readonly",
        NodeJS: "readonly",
        globalThis: "readonly",
        URL: "readonly",
        AbortController: "readonly",
        fetch: "readonly",
        Blob: "readonly",
        Headers: "readonly",
        FormData: "readonly",
        // Browser globals
        window: "readonly",
        document: "readonly",
        Response: "readonly",
        Request: "readonly",
        URLSearchParams: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        navigator: "readonly",
        location: "readonly",
        history: "readonly",
        screen: "readonly",
        alert: "readonly",
        confirm: "readonly",
        prompt: "readonly",
        performance: "readonly",
        File: "readonly",
        // React globals
        React: "readonly",
        JSX: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // TypeScript rules - strict for production
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error", // STRICT: No 'any' types allowed
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",

      // General rules - production ready
      "no-console": "error", // STRICT: No console logs in production
      "no-debugger": "error", // STRICT: No debugger statements
      "prefer-const": "error",
      "no-unused-vars": "off", // Use TypeScript version instead
      "no-var": "error", // Force let/const usage
      eqeqeq: ["error", "always"], // Force strict equality
      curly: ["error", "all"], // Force curly braces
    },
  },
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "*.config.js",
      "*.config.cjs",
      "*.config.ts",
      "*.config.mjs",
      "vitest.config.ts",
      "jest.config.ts",
      "playwright.config.ts",
      "**/*.d.ts", // Ignore TypeScript declaration files
      "**/dist/**", // Ignore all dist directories

      // Test-related files - not part of production build
      "**/*.test.*",
      "**/*.spec.*",
      "**/test/**",
      "**/tests/**",
      "**/testing/**",
      "**/__tests__/**",
      "**/test-results/**",
      "**/coverage/**",
      "**/*.test.ts",
      "**/*.test.js",
      "**/*.test.tsx",
      "**/*.test.jsx",
      "**/*.spec.ts",
      "**/*.spec.js",
      "**/*.spec.tsx",
      "**/*.spec.jsx",
    ],
  },
];
