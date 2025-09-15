import base from "@aibos/eslint-config";

export default [
    ...base,
    {
        ignores: ["src/**/*.js", "dist/**/*", "test-results/**/*", "node_modules/**/*"],
    },
];
