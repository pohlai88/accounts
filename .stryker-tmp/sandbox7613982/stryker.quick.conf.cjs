// @ts-nocheck
module.exports = {
  // Test only a single, simple function to verify setup
  mutate: [
    "packages/accounting/src/ap/payment-processing.ts"
  ],

  // Use command test runner with a focused test
  testRunner: "command",
  commandRunner: {
    command: "pnpm test:unit --reporter=basic --run packages/accounting"
  },

  // Minimal configuration for quick test
  reporters: ["progress"],
  coverageAnalysis: "off", // Skip coverage for speed

  // Very short timeout
  timeoutMS: 30000, // 30 seconds max

  // Minimal logging
  logLevel: "error",

  // Ignore everything except our target
  ignorePatterns: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
    "**/coverage/**",
    "**/*.d.ts",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.html",
    "**/.accountsignore_legacy/**",
    "**/docs/**",
    "**/apps/**",
    "**/services/**",
    "**/packages/db/**",
    "**/packages/auth/**",
    "**/packages/ui/**",
    "**/packages/web/**",
    "**/packages/web-api/**",
    "**/packages/worker/**",
    "**/packages/monitoring/**",
    "**/packages/realtime/**",
    "**/packages/cache/**",
    "**/packages/security/**",
    "**/packages/contracts/**",
    "**/packages/tokens/**",
    "**/packages/utils/**",
    "**/packages/vitest-config/**",
    "**/packages/eslint-config/**",
    "**/packages/prettier-config/**",
    "**/packages/deployment/**",
    "**/packages/docs/**",
    "**/packages/api-gateway/**"
  ],

  // Only test arithmetic mutations (fastest)
  excludedMutations: [
    "StringLiteral",
    "TemplateLiteral",
    "ArrayDeclaration",
    "ObjectLiteral",
    "BlockStatement",
    "IfStatement",
    "ConditionalExpression",
    "LogicalExpression",
    "UnaryExpression",
    "UpdateExpression",
    "CallExpression",
    "MemberExpression",
    "NewExpression",
    "ArrowFunction",
    "FunctionExpression",
    "FunctionDeclaration",
    "ClassDeclaration",
    "ClassMethod",
    "ClassProperty",
    "ImportDeclaration",
    "ExportDeclaration",
    "VariableDeclaration",
    "VariableDeclarator",
    "AssignmentExpression",
    "BinaryExpression",
    "ReturnStatement",
    "ThrowStatement",
    "TryStatement",
    "CatchClause",
    "SwitchStatement",
    "SwitchCase",
    "ForStatement",
    "ForInStatement",
    "ForOfStatement",
    "WhileStatement",
    "DoWhileStatement",
    "BreakStatement",
    "ContinueStatement",
    "LabeledStatement",
    "WithStatement",
    "DebuggerStatement",
    "ExpressionStatement",
    "EmptyStatement"
  ],

  // Single thread for simplicity
  concurrency: 1
};
