/**
 * Test Setup
 *
 * Global test configuration and utilities
 */

import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { ApiServer } from "../server.js";
import { ApiClient } from "../client.js";

// Global test variables
export let testServer: ApiServer;
export let testClient: ApiClient;
export let baseUrl: string;

beforeAll(async () => {
  // Create test server
  testServer = new ApiServer({
    port: 0, // Let the system assign a free port
    host: "127.0.0.1",
    corsOrigins: ["http://localhost:3000"],
    enableLogging: false, // Disable logging in tests
    enableSecurity: true,
    maxRequestSize: 1024 * 1024, // 1MB for tests
  });

  // Start server
  await testServer.start();

  // Get the actual port
  const server = testServer.getApp().listen();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 3001;
  baseUrl = `http://127.0.0.1:${port}`;

  // Create test client
  testClient = new ApiClient({
    baseUrl,
    timeout: 5000,
    retries: 1,
  });
});

afterAll(async () => {
  // Cleanup
  if (testServer) {
    // Server cleanup is handled by the server itself
  }
});

beforeEach(() => {
  // Reset client state if needed
  testClient.setHeader("X-Request-ID", "");
  testClient.setHeader("Authorization", "");
  testClient.setHeader("X-API-Key", "");
});

afterEach(() => {
  // Cleanup after each test
});
