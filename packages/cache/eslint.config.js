import baseConfig from '../../eslint.config.base.mjs';

export default [
    ...baseConfig,
    {
        rules: {
            // Cache package specific rules
            '@typescript-eslint/no-explicit-any': ['warn', { fixToUnknown: true }],
        },
    },
];
