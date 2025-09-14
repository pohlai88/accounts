import { beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Global test setup
beforeAll(async () => {
  console.log("🧪 Setting up test environment...");

  // Verify environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing required environment variables for testing");
  }

  console.log("✅ Environment variables loaded");
  console.log("🔗 Supabase URL:", supabaseUrl);
  console.log("🔑 Service role key configured");
});

afterAll(async () => {
  console.log("🧹 Cleaning up test environment...");
  // Any global cleanup can go here
  console.log("✅ Test cleanup completed");
});
