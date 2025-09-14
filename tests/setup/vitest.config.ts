import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig(async ({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        test: {
            globals: true,
            environment: 'node',
            setupFiles: ['./tests/setup/setup.ts'],
            testTimeout: 30000,
            hookTimeout: 30000,
            env: {
                NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
                SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
                API_BASE_URL: env.API_BASE_URL || 'http://localhost:3000'
            }
        }
    };
});
