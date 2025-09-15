/**
 * @aibos/web ESLint Configuration
 *
 * Next.js app with custom rules and ignored build files
 */

import base from "@aibos/eslint-config";

export default [
    ...base,
    {
        ignores: [".next/**", "out/**", "build/**"],
    },
];
