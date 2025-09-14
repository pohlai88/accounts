import baseConfig from '../../eslint.config.base.mjs';

export default [
    ...baseConfig,
    {
        rules: {
            // Realtime package specific rules
            '@typescript-eslint/no-explicit-any': ['warn', { fixToUnknown: true }],
        },
    },
];
