/**
 * @aibos/prettier-config
 *
 * Centralized Prettier configuration for the AI-BOS monorepo.
 * Provides consistent code formatting across all packages and applications.
 */
// @ts-nocheck


module.exports = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  endOfLine: "lf",
  arrowParens: "avoid",
  bracketSpacing: true,
  bracketSameLine: false,
  quoteProps: "as-needed",
  jsxSingleQuote: false,
  proseWrap: "preserve",
  htmlWhitespaceSensitivity: "css",
  vueIndentScriptAndStyle: false,
  embeddedLanguageFormatting: "auto",
  singleAttributePerLine: false,
};
