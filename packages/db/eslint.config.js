import baseConfig from '../../eslint.config.base.mjs';

export default [
  ...baseConfig,
  // DB package uses base config (warn for any types)
];