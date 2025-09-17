/**
 * ESLint Configuration for Scripts Directory
 *
 * Plain Node.js scripts don't need TypeScript parsing
 */

module.exports = {
    env: {
        node: true,
        es2022: true,
    },
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'script', // Use 'script' for .js files with require()
    },
    rules: {
        // Allow console.log in scripts
        'no-console': 'off',
        // Allow require() in Node.js scripts
        '@typescript-eslint/no-var-requires': 'off',
        // Allow any types in scripts (they're not part of the main codebase)
        '@typescript-eslint/no-explicit-any': 'off',
        // Allow unused vars in scripts
        '@typescript-eslint/no-unused-vars': 'off',
        'no-unused-vars': 'off',
    },
    overrides: [
        {
            // If there are any TypeScript files in scripts, parse them normally
            files: ['**/*.ts'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                project: '../tsconfig.json',
            },
            plugins: ['@typescript-eslint'],
            rules: {
                '@typescript-eslint/no-explicit-any': 'warn',
                '@typescript-eslint/no-unused-vars': 'warn',
            },
        },
    ],
};
