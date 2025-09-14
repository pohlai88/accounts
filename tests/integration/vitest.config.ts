import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env .local') });

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        testTimeout: 10000,
        hookTimeout: 10000,
        teardownTimeout: 10000,
    },
});
