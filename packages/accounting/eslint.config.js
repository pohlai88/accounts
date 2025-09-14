import baseConfig from '../../eslint.config.base.mjs';

export default [
  ...baseConfig,
  {
    rules: {
      // Accounting package specific rules
      '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true }], // Stricter for accounting
    },
  },
];