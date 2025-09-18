/**
 * @aibos/logger/bind - Context-Bound Logger
 *
 * SSOT implementation for automatic request context binding
 * This provides the ONLY way to get context-aware logging
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { createLogger, AibosLogger } from './index';

/**
 * SSOT: Request context interface
 * This defines the ONLY context structure allowed
 */
export interface RequestContext {
    reqId: string;
    tenantId?: string;
    userId?: string;
    route?: string;
    traceId?: string;
    spanId?: string;
    correlationId?: string;
    userAgent?: string;
    ip?: string;
    method?: string;
    statusCode?: number;
    duration?: number;
}

/**
 * SSOT: Context storage
 * This is the ONLY way to store and retrieve request context
 */
const contextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * SSOT: Run function with request context
 * This is the ONLY way to set request context
 */
export function withRequestContext<T>(context: RequestContext, fn: () => T): T {
    return contextStorage.run(context, fn);
}

/**
 * SSOT: Get current request context
 * This is the ONLY way to retrieve request context
 */
export function getRequestContext(): RequestContext | undefined {
    return contextStorage.getStore();
}

/**
 * SSOT: Context-bound logger
 * This automatically includes request context in all log entries
 */
export class ContextBoundLogger implements AibosLogger {
    private baseLogger: AibosLogger;

    constructor(baseLogger: AibosLogger) {
        this.baseLogger = baseLogger;
    }

    private enrichMetadata(metadata?: Record<string, any>): Record<string, any> {
        const context = getRequestContext();
        return {
            ...metadata,
            ...context,
        };
    }

    trace(message: string, metadata?: Record<string, any>): void {
        this.baseLogger.trace(message, this.enrichMetadata(metadata));
    }

    debug(message: string, metadata?: Record<string, any>): void {
        this.baseLogger.debug(message, this.enrichMetadata(metadata));
    }

    info(message: string, metadata?: Record<string, any>): void {
        this.baseLogger.info(message, this.enrichMetadata(metadata));
    }

    warn(message: string, metadata?: Record<string, any>): void {
        this.baseLogger.warn(message, this.enrichMetadata(metadata));
    }

    error(message: string, error?: Error, metadata?: Record<string, any>): void {
        this.baseLogger.error(message, error, this.enrichMetadata(metadata));
    }

    fatal(message: string, error?: Error, metadata?: Record<string, any>): void {
        this.baseLogger.fatal(message, error, this.enrichMetadata(metadata));
    }

    metric(event: string, value: number, unit: string, metadata?: Record<string, any>): void {
        this.baseLogger.metric(event, value, unit, this.enrichMetadata(metadata));
    }

    performance(operation: string, duration: number, metadata?: Record<string, any>): void {
        this.baseLogger.performance(operation, duration, this.enrichMetadata(metadata));
    }

    security(event: string, metadata?: Record<string, any>): void {
        this.baseLogger.security(event, this.enrichMetadata(metadata));
    }
}

/**
 * SSOT: Create context-bound logger
 * This is the ONLY way to create context-aware loggers
 */
export function createContextBoundLogger(baseLogger: AibosLogger): ContextBoundLogger {
    return new ContextBoundLogger(baseLogger);
}

/**
 * SSOT: Default context-bound loggers
 * These are the ONLY context-bound loggers that should be used
 */
import { logger as baseLogger, apiLogger as baseApiLogger } from './index';

export const logger = createContextBoundLogger(baseLogger);
export const apiLogger = createContextBoundLogger(baseApiLogger);

/**
 * SSOT: Middleware helper for Next.js App Router
 * This is the ONLY way to integrate with Next.js middleware
 */
export function withLoggingContext<T extends (...args: any[]) => any>(
    handler: T,
    contextExtractor?: (req: Request) => Partial<RequestContext>
): T {
    return (async (...args: any[]) => {
        const req = args[0] as Request;

        // Extract context from request
        const context: RequestContext = {
            reqId: req.headers.get('x-request-id') ||
                req.headers.get('x-correlation-id') ||
                crypto.randomUUID(),
            tenantId: req.headers.get('x-tenant-id') || undefined,
            userId: req.headers.get('x-user-id') || undefined,
            route: new URL(req.url).pathname,
            traceId: req.headers.get('x-trace-id') || undefined,
            spanId: req.headers.get('x-span-id') || undefined,
            correlationId: req.headers.get('x-correlation-id') || undefined,
            userAgent: req.headers.get('user-agent') || undefined,
            ip: req.headers.get('x-forwarded-for') ||
                req.headers.get('x-real-ip') ||
                'unknown',
            method: req.method,
            ...(contextExtractor ? contextExtractor(req) : {}),
        };

        // Run handler with context
        return withRequestContext(context, () => handler(...args));
    }) as T;
}

/**
 * SSOT: Express middleware helper
 * This is the ONLY way to integrate with Express.js
 */
export function expressLoggingMiddleware(req: any, res: any, next: any) {
    const startTime = Date.now();

    const context: RequestContext = {
        reqId: req.headers['x-request-id'] ||
            req.headers['x-correlation-id'] ||
            crypto.randomUUID(),
        tenantId: req.headers['x-tenant-id'],
        userId: req.headers['x-user-id'],
        route: req.path,
        traceId: req.headers['x-trace-id'],
        spanId: req.headers['x-span-id'],
        correlationId: req.headers['x-correlation-id'],
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        method: req.method,
    };

    // Set context
    withRequestContext(context, () => {
        // Log request start
        logger.info('Request started', {
            method: req.method,
            url: req.url,
            userAgent: req.userAgent,
        });

        // Override res.end to log response
        const originalEnd = res.end;
        res.end = function (...args: any[]) {
            const duration = Date.now() - startTime;

            logger.info('Request completed', {
                statusCode: res.statusCode,
                duration,
            });

            originalEnd.apply(this, args);
        };

        next();
    });
}

/**
 * SSOT: React error boundary helper
 * This is the ONLY way to integrate with React error boundaries
 */
export function createLoggingErrorBoundary(Component: React.ComponentType<any>) {
    return class LoggingErrorBoundary extends React.Component {
        constructor(props: any) {
            super(props);
        }

        static getDerivedStateFromError(error: Error) {
            logger.error('React error boundary caught error', error, {
                component: Component.name,
                errorBoundary: 'LoggingErrorBoundary',
            });

            return { hasError: true };
        }

        componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
            logger.error('React error boundary componentDidCatch', error, {
                component: Component.name,
                errorBoundary: 'LoggingErrorBoundary',
                errorInfo: errorInfo.componentStack,
            });
        }

        render() {
            if ((this.state as any).hasError) {
                return <div>Something went wrong.< /div>;
            }

            return <Component { ...this.props } />;
        }
    };
}

/**
 * SSOT: Export everything
 */
export { withRequestContext, getRequestContext };
export type { RequestContext };
