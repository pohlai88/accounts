module.exports = {
    env: {
        node: true,
        browser: true,
        es2022: true,
    },
    rules: {
        'no-console': 'off', // Allow console in build scripts
        'no-undef': 'off', // Allow global variables like __dirname
    },
};
