/**
 * @aibos/web ESLint Configuration
 *
 * Next.js app with custom rules and ignored build files
 */
// @ts-nocheck


import base from "@aibos/eslint-config";

export default [
    ...base,
    {
        ignores: [".next/**", "out/**", "build/**"],
    },
];
