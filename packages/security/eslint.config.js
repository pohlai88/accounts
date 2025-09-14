import baseConfig from '../../eslint.config.base.mjs';

export default [
    ...baseConfig,
    {
        rules: {
            // Security package specific rules - stricter enforcement
            '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true }], // Stricter for security
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
];
