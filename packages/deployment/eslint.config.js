import baseConfig from '../../eslint.config.base.mjs';

export default [
    ...baseConfig,
    {
        rules: {
            // Deployment package specific rules
            '@typescript-eslint/no-explicit-any': ['warn', { fixToUnknown: true }],
            'no-console': 'off', // Allow console for deployment scripts
        },
    },
];
