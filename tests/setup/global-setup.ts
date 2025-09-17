/**
 * Global Test Setup
 *
 * Configures the testing environment for all tests across the monorepo.
 * This runs once before all tests and sets up global configurations.
 */

import { beforeAll } from "vitest";
import { config } from "dotenv";

// Load test environment variables
config({ path: ".env.test" });

beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://test:test@localhost:5432/test";

  // Configure test-specific settings
  process.env.SUPABASE_URL = process.env.TEST_SUPABASE_URL || "http://localhost:54321";
  process.env.SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || "test-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || "test-service-key";

  // Disable external services in tests
  process.env.DISABLE_EXTERNAL_SERVICES = "true";
  process.env.DISABLE_EMAIL_SENDING = "true";
  process.env.DISABLE_WEBHOOKS = "true";

  // Set test timeouts
  process.env.TEST_TIMEOUT = "10000";

  console.log("🧪 Test environment configured");
});
