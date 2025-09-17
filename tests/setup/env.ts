/**
 * Deterministic Environment Loading
 *
 * Ensures test environment variables are loaded consistently
 * and prevents flaky CI due to environment inconsistencies.
 */

import { config } from "dotenv";
import dns from "node:dns";

// Lock Node DNS preference (avoids IPv6 surprises)
dns.setDefaultResultOrder?.("ipv4first");

// Load test environment variables with override
// This ensures .env.test takes precedence over any ambient .env
config({ path: ".env.test", override: true });

// Environment gate - fail fast if required vars missing
const requiredVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
  "SUPABASE_DB_URL"
];

const missingVars = requiredVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
}

// Ensure test environment
process.env.NODE_ENV = "test";

export { };
