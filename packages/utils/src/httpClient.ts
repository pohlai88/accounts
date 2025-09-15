import { z } from "zod";

/**
 * Schema-first HTTP client that eliminates unknown types
 * Provides type-safe API calls with automatic validation
 */
export class HttpClient {
    constructor(private readonly fetchImpl: typeof fetch = fetch) { }

    async get<S extends z.ZodTypeAny>(url: string, schema: S, init?: RequestInit): Promise<z.infer<S>> {
        const res = await this.fetchImpl(url, { ...init, method: "GET" });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const json = await res.json();
        return schema.parse(json);
    }

    async post<S extends z.ZodTypeAny, B = unknown>(url: string, body: B, schema: S, init?: RequestInit): Promise<z.infer<S>> {
        const res = await this.fetchImpl(url, {
            ...init,
            method: "POST",
            headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const json = await res.json();
        return schema.parse(json);
    }

    async put<S extends z.ZodTypeAny, B = unknown>(url: string, body: B, schema: S, init?: RequestInit): Promise<z.infer<S>> {
        const res = await this.fetchImpl(url, {
            ...init,
            method: "PUT",
            headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const json = await res.json();
        return schema.parse(json);
    }

    async delete<S extends z.ZodTypeAny>(url: string, schema: S, init?: RequestInit): Promise<z.infer<S>> {
        const res = await this.fetchImpl(url, { ...init, method: "DELETE" });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const json = await res.json();
        return schema.parse(json);
    }
}

// Export a default instance
export const httpClient = new HttpClient();
