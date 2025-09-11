import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        crypto: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        NodeJS: 'readonly',
        React: 'readonly', // React global
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': ['warn', { fixToUnknown: true, ignoreRestArgs: false }],
      'no-console': 'off',
      'prefer-const': 'error',
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**', 'build/**', '*.config.js'],
  },
]