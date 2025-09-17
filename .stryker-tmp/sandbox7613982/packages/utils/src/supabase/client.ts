// @ts-nocheck
import { createBrowserClient } from "@supabase/ssr";

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time or when env vars are missing, return defaults
    if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
      throw new Error("Missing Supabase environment variables in production");
    }
    return {
      supabaseUrl: "http://localhost:54321",
      supabaseAnonKey: "test-key",
    };
  }

  return { supabaseUrl, supabaseAnonKey };
}

export const createClient = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
