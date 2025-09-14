import baseConfig from '../../eslint.config.base.mjs';

export default [
  ...baseConfig,
  {
    rules: {
      // Worker package specific rules
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in I/O boundary workflows
    },
  },
];