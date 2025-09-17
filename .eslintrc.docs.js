/**
 * ESLint configuration for documentation quality
 * Enforces TSDoc standards and JSDoc completeness
 */

module.exports = {
  extends: [
    '@aibos/eslint-config',
    'plugin:jsdoc/recommended'
  ],
  plugins: [
    'jsdoc',
    'tsdoc'
  ],
  rules: {
    // JSDoc rules
    'jsdoc/require-jsdoc': [
      'error',
      {
        publicOnly: true,
        require: {
          FunctionDeclaration: true,
          ClassDeclaration: true,
          MethodDefinition: true,
          ArrowFunctionExpression: false,
          FunctionExpression: false
        },
        contexts: [
          'ExportNamedDeclaration[declaration.type="FunctionDeclaration"]',
          'ExportNamedDeclaration[declaration.type="ClassDeclaration"]',
          'ExportDefaultDeclaration[declaration.type="FunctionDeclaration"]',
          'ExportDefaultDeclaration[declaration.type="ClassDeclaration"]'
        ]
      }
    ],
    'jsdoc/require-description': 'error',
    'jsdoc/require-param': 'error',
    'jsdoc/require-param-description': 'error',
    'jsdoc/require-param-type': 'off', // TypeScript handles this
    'jsdoc/require-returns': 'error',
    'jsdoc/require-returns-description': 'error',
    'jsdoc/require-returns-type': 'off', // TypeScript handles this
    'jsdoc/require-throws': 'warn',
    'jsdoc/require-example': 'warn',
    'jsdoc/require-returns-check': 'error',
    'jsdoc/check-param-names': 'error',
    'jsdoc/check-tag-names': 'error',
    'jsdoc/check-types': 'off', // TypeScript handles this
    'jsdoc/empty-tags': 'error',
    'jsdoc/no-undefined-types': 'off', // TypeScript handles this
    'jsdoc/valid-types': 'off', // TypeScript handles this
    
    // TSDoc rules
    'tsdoc/syntax': 'error',
    
    // Custom rules for our standards
    'jsdoc/tag-lines': [
      'error',
      'never',
      {
        startLines: 'never',
        endLines: 'never'
      }
    ],
    'jsdoc/check-indentation': 'error',
    'jsdoc/check-line-alignment': 'error',
    'jsdoc/multiline-blocks': 'error',
    'jsdoc/no-bad-blocks': 'error',
    'jsdoc/no-defaults': 'error',
    'jsdoc/require-asterisk-prefix': 'error',
    'jsdoc/require-description-complete-sentence': 'error',
    'jsdoc/require-file-overview': 'off', // Too verbose for our use case
    'jsdoc/require-hyphen-before-param-description': 'error',
    'jsdoc/require-jsdoc-ignore': 'off',
    'jsdoc/require-multiline-block': 'off',
    'jsdoc/require-property': 'error',
    'jsdoc/require-property-description': 'error',
    'jsdoc/require-property-name': 'error',
    'jsdoc/require-property-type': 'off', // TypeScript handles this
    'jsdoc/require-yields': 'off',
    'jsdoc/require-yields-check': 'off',
    'jsdoc/sort-tags': 'error',
    'jsdoc/tag-lines': 'error',
    'jsdoc/valid-types': 'off' // TypeScript handles this
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        'jsdoc/require-jsdoc': [
          'error',
          {
            publicOnly: true,
            require: {
              FunctionDeclaration: true,
              ClassDeclaration: true,
              MethodDefinition: true,
              ArrowFunctionExpression: false,
              FunctionExpression: false
            }
          }
        ]
      }
    },
    {
      files: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*', '**/tests/**/*'],
      rules: {
        'jsdoc/require-jsdoc': 'off',
        'jsdoc/require-example': 'off'
      }
    }
  ],
  settings: {
    jsdoc: {
      mode: 'typescript',
      tagNamePreference: {
        'returns': 'returns',
        'param': 'param',
        'throws': 'throws',
        'example': 'example',
        'since': 'since',
        'deprecated': 'deprecated',
        'beta': 'beta',
        'alpha': 'alpha',
        'internal': 'internal',
        'public': 'public',
        'remarks': 'remarks'
      },
      preferredTypes: {
        'object': 'Object',
        'function': 'Function',
        'array': 'Array',
        'string': 'String',
        'number': 'Number',
        'boolean': 'Boolean',
        'undefined': 'undefined',
        'null': 'null'
      }
    }
  }
};
