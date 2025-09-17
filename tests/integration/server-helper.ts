/**
 * Bulletproof Integration Server Helper
 *
 * Provides robust server startup for integration tests with:
 * - Loopback + ephemeral port binding
 * - Dynamic baseURL derivation
 * - Proper cleanup and error handling
 */

import { Server } from "http";
import { AddressInfo } from "net";

export interface TestServer {
  server: Server;
  baseURL: string;
  port: number;
  close: () => Promise<void>;
}

/**
 * Start a test server on loopback + ephemeral port
 * This prevents EADDRNOTAVAIL errors and ensures consistent behavior
 */
export function startTestServer(
  app: any, // Express app or similar
  options: {
    host?: string;
    timeout?: number;
  } = {}
): Promise<TestServer> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, options.host || "127.0.0.1", (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      const address = server.address() as AddressInfo;
      const baseURL = `http://${address.address}:${address.port}`;

      resolve({
        server,
        baseURL,
        port: address.port,
        close: () => new Promise<void>((resolveClose, rejectClose) => {
          server.close((error) => {
            if (error) {
              rejectClose(error);
            } else {
              resolveClose();
            }
          });
        })
      });
    });

    // Timeout protection
    const timeout = options.timeout || 10000;
    setTimeout(() => {
      server.close();
      reject(new Error(`Server startup timeout after ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Create a test server with automatic cleanup
 * Use this in test setup/teardown
 */
export async function withTestServer<T>(
  app: any,
  testFn: (server: TestServer) => Promise<T>,
  options?: { host?: string; timeout?: number }
): Promise<T> {
  const server = await startTestServer(app, options);

  try {
    return await testFn(server);
  } finally {
    await server.close();
  }
}

/**
 * Wait for server to be ready
 * Useful for ensuring server is fully started before tests
 */
export async function waitForServer(baseURL: string, timeout = 5000): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(`${baseURL}/health`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Server not ready yet, continue waiting
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Server not ready after ${timeout}ms`);
}
