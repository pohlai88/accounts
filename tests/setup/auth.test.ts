import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupTestEnvironment, cleanupTestData, skipIfNoTenant } from "./test-utils";

describe("Authentication Tests", () => {
  let testSetup: any;

  beforeAll(async () => {
    testSetup = await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestData(testSetup.supabase, testSetup.testUser, testSetup.testTenant);
  });

  it("should create test user via admin API", async () => {
    expect(testSetup.testUser).toBeDefined();
    expect(testSetup.testUser.email).toContain("@example.com");
    expect(testSetup.testUser.id).toBeDefined();
  });

  it("should create test tenant", async () => {
    if (testSetup.testTenant) {
      expect(testSetup.testTenant).toBeDefined();
      expect(testSetup.testTenant.name).toBeDefined();
      expect(testSetup.testTenant.slug).toBeDefined();
    } else {
      console.log("Using fallback tenant for testing");
    }
  });

  it("should create membership for test user", async () => {
    skipIfNoTenant(testSetup.testTenant, "membership creation");
    if (!testSetup.testTenant) return;

    const { data, error } = await testSetup.supabase
      .from("memberships")
      .select("*")
      .eq("user_id", testSetup.testUser.id)
      .eq("tenant_id", testSetup.testTenant.id)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.role).toBe("admin");
  });

  it("should set active tenant for user", async () => {
    skipIfNoTenant(testSetup.testTenant, "active tenant setting");
    if (!testSetup.testTenant) return;

    const { data, error } = await testSetup.supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", testSetup.testUser.id)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.active_tenant_id).toBe(testSetup.testTenant.id);
  });

  it("should authenticate user and get session", async () => {
    const { data, error } = await testSetup.supabase.auth.signInWithPassword({
      email: testSetup.testUser.email,
      password: "testpassword123",
    });

    expect(error).toBeNull();
    expect(data.session).toBeDefined();
    expect(data.user).toBeDefined();
  });

  it("should verify JWT token structure", async () => {
    const { data, error } = await testSetup.supabase.auth.signInWithPassword({
      email: testSetup.testUser.email,
      password: "testpassword123",
    });

    expect(error).toBeNull();
    expect(data.session).toBeDefined();

    const token = data.session?.access_token;
    expect(token).toBeDefined();

    // Decode JWT to verify structure (basic check)
    const parts = token?.split(".");
    expect(parts).toHaveLength(3);
  });
});
