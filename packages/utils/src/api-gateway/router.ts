// API Gateway Router
import { ApiRequest, GatewayResponse, RouteConfig, RouteMatch, Middleware } from "./types.js";

export class ApiRouter {
  private routes: RouteConfig[] = [];

  /**
   * Register a new route
   */
  addRoute(route: RouteConfig): void {
    this.routes.push(route);
  }

  /**
   * Register multiple routes
   */
  addRoutes(routes: RouteConfig[]): void {
    this.routes.push(...routes);
  }

  /**
   * Find matching route for request
   */
  findRoute(method: string, path: string): RouteMatch | null {
    for (const route of this.routes) {
      if (route.method !== method) {continue;}

      const match = this.matchPath(route.path, path);
      if (match) {
        return {
          route,
          params: match.params,
          query: this.parseQuery(path.split("?")[1] || ""),
        };
      }
    }

    return null;
  }

  /**
   * Match path pattern with actual path
   */
  private matchPath(pattern: string, path: string): { params: Record<string, string> } | null {
    const patternParts = pattern.split("/");
    const pathParts = path.split("/");

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart && patternPart.startsWith(":")) {
        // Dynamic parameter
        const paramName = patternPart.substring(1);
        if (pathPart) {
          params[paramName] = pathPart;
        }
      } else if (patternPart !== pathPart) {
        // Static part doesn't match
        return null;
      }
    }

    return { params };
  }

  /**
   * Parse query string
   */
  private parseQuery(queryString: string): Record<string, string> {
    const query: Record<string, string> = {};

    if (!queryString) {return query;}

    const pairs = queryString.split("&");
    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key) {
        query[decodeURIComponent(key)] = decodeURIComponent(value || "");
      }
    }

    return query;
  }

  /**
   * Get all registered routes
   */
  getRoutes(): RouteConfig[] {
    return [...this.routes];
  }

  /**
   * Clear all routes
   */
  clear(): void {
    this.routes = [];
  }
}

/**
 * Route builder for fluent API
 */
export class RouteBuilder {
  private route: Partial<RouteConfig> = {};

  constructor(private router: ApiRouter) {}

  path(path: string): RouteBuilder {
    this.route.path = path;
    return this;
  }

  method(method: string): RouteBuilder {
    this.route.method = method;
    return this;
  }

  handler(handler: (req: ApiRequest) => Promise<GatewayResponse>): RouteBuilder {
    this.route.handler = handler;
    return this;
  }

  middleware(middleware: Middleware[]): RouteBuilder {
    this.route.middleware = middleware;
    return this;
  }

  rateLimit(windowMs: number, max: number): RouteBuilder {
    this.route.rateLimit = { windowMs, max };
    return this;
  }

  cache(ttl: number, key?: string): RouteBuilder {
    this.route.cache = { ttl, key };
    return this;
  }

  build(): void {
    if (!this.route.path || !this.route.method || !this.route.handler) {
      throw new Error("Route must have path, method, and handler");
    }

    this.router.addRoute(this.route as RouteConfig);
  }
}

/**
 * Create a new route builder
 */
export function createRoute(router: ApiRouter): RouteBuilder {
  return new RouteBuilder(router);
}
