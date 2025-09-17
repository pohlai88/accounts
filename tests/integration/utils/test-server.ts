/**
 * Test Server Helper
 *
 * Robust test server that avoids EADDRNOTAVAIL errors by:
 * - Binding to real loopback (127.0.0.1) instead of ambiguous addresses
 * - Using ephemeral ports (port 0) to avoid collisions
 * - Properly handling Node.js HTTP to WHATWG Request/Response conversion
 */

import http from "node:http";
import { IncomingMessage, ServerResponse } from "node:http";

export type Handler = (req: Request) => Promise<Response> | Response;

export interface TestServer {
  baseURL: string;
  close: () => Promise<void>;
}

export async function startTestServer(handle: Handler): Promise<TestServer> {
  const server = http.createServer(async (nodeReq: IncomingMessage, nodeRes: ServerResponse) => {
    try {
      // Build a WHATWG Request from Node's req
      const url = `http://127.0.0.1${nodeReq.url}`;
      const body = nodeReq.method === "GET" || nodeReq.method === "HEAD" ? undefined : nodeReq;

      const req = new Request(url, {
        method: nodeReq.method!,
        headers: nodeReq.headers as any,
        body: body as any,
        // duplex is required for streaming bodies in Node fetch
        ...(body ? { duplex: "half" as any } : {}),
      });

      const res = await handle(req);

      // Copy status, headers, body back to Node
      nodeRes.statusCode = res.status;
      res.headers.forEach((v, k) => nodeRes.setHeader(k, v));

      if (res.body) {
        // Stream the response body
        for await (const chunk of res.body as any) {
          nodeRes.write(chunk);
        }
      }
      nodeRes.end();
    } catch (err: any) {
      nodeRes.statusCode = 500;
      nodeRes.setHeader("content-type", "application/json");
      nodeRes.end(JSON.stringify({
        success: false,
        status: 500,
        error: {
          code: "INTERNAL_ERROR",
          message: err?.message || "Internal error"
        }
      }));
    }
  });

  // Bind to loopback only; port 0 = ephemeral (avoids collisions)
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const addr = server.address();
  if (!addr || typeof addr === "string") {
    throw new Error("Failed to bind test server");
  }

  const baseURL = `http://127.0.0.1:${addr.port}`;

  return {
    baseURL,
    close: () => new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve()))
    ),
  };
}

/**
 * Helper function to make HTTP requests to the test server
 */
export async function hit(baseURL: string, method: string, path: string, body?: unknown) {
  const res = await fetch(`${baseURL}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  return {
    status: res.status,
    headers: res.headers,
    body: json
  };
}
