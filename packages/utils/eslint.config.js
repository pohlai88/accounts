import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  // Base JavaScript config
  js.configs.recommended,
  
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Node.js globals
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
        // Browser globals that might be used
        crypto: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        // TypeScript globals
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': ['warn', { fixToUnknown: true, ignoreRestArgs: false }],
      
      // General rules
      'no-console': 'off', // Allow console in utility packages
      'prefer-const': 'error',
      'no-unused-vars': 'off', // Use TypeScript version instead
    },
  },
  
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.config.js',
      '*.config.mjs',
    ],
  },
]
