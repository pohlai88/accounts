/**
 * @aibos/web-api ESLint Configuration
 *
 * Web API specific ESLint configuration with relaxed rules for API development
 * Follows SSOT principles while being practical for API route development
 */

import base from "../../packages/config/eslint-config/index.mjs";

export default [
    ...base,
    {
        files: ["**/*.{js,ts,tsx}"],
        ignores: [
            "node_modules/**",
            ".next/**",
            "dist/**",
            "build/**",
            "**/*.d.ts",
        ],
        rules: {
            // Relaxed rules for API development
            "@typescript-eslint/no-explicit-any": "warn", // Allow 'any' with warnings
            "@typescript-eslint/no-unsafe-assignment": "warn",
            "@typescript-eslint/no-unsafe-member-access": "warn",
            "@typescript-eslint/no-unsafe-call": "warn",
            "@typescript-eslint/no-unsafe-return": "warn",
            "no-console": "warn", // Allow console logs in API routes
            "curly": "off", // Allow single-line if statements in API routes
            "no-case-declarations": "off", // Allow declarations in case blocks
        },
    },
];
