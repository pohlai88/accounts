import { NextRequest, NextResponse } from "next/server";
import { checkIdempotency, storeIdempotencyResult, type Scope } from "@aibos/db";

export interface IdempotencyOptions {
  /**
   * TTL for idempotency keys in seconds (default: 24 hours)
   */
  ttlSeconds?: number;
  
  /**
   * Whether to require idempotency key for this endpoint
   */
  required?: boolean;
  
  /**
   * Custom header name (default: X-Idempotency-Key)
   */
  headerName?: string;
}

export interface IdempotencyResult {
  /**
   * Whether this is a duplicate request
   */
  isDuplicate: boolean;
  
  /**
   * The idempotency key used
   */
  key?: string;
  
  /**
   * Existing response if duplicate
   */
  existingResponse?: {
    status: number;
    body: any;
    headers?: Record<string, string>;
  };
}

/**
 * Idempotency middleware for Next.js API routes
 * Handles X-Idempotency-Key headers and prevents duplicate processing
 */
export class IdempotencyMiddleware {
  private options: Required<IdempotencyOptions>;

  constructor(options: IdempotencyOptions = {}) {
    this.options = {
      ttlSeconds: options.ttlSeconds ?? 24 * 60 * 60, // 24 hours
      required: options.required ?? false,
      headerName: options.headerName ?? 'X-Idempotency-Key'
    };
  }

  /**
   * Check for idempotency before processing request
   */
  async checkRequest(
    request: NextRequest, 
    scope: Scope
  ): Promise<IdempotencyResult> {
    const idempotencyKey = request.headers.get(this.options.headerName);

    // If no key provided
    if (!idempotencyKey) {
      if (this.options.required) {
        throw new IdempotencyError(
          `${this.options.headerName} header is required`,
          'IDEMPOTENCY_KEY_REQUIRED'
        );
      }
      return { isDuplicate: false };
    }

    // Validate key format (should be UUID or similar)
    if (!this.isValidIdempotencyKey(idempotencyKey)) {
      throw new IdempotencyError(
        `Invalid ${this.options.headerName} format. Must be a UUID or alphanumeric string.`,
        'INVALID_IDEMPOTENCY_KEY',
        { key: idempotencyKey }
      );
    }

    try {
      // Check if we've seen this key before
      const existing = await checkIdempotency(scope, idempotencyKey);
      
      if (existing) {
        // Return existing response
        return {
          isDuplicate: true,
          key: idempotencyKey,
          existingResponse: {
            status: existing.status === 'posted' ? 201 : 
                   existing.status === 'draft' ? 202 : 200,
            body: existing.response,
            headers: {
              'X-Idempotency-Hit': 'true',
              'X-Idempotency-Key': idempotencyKey
            }
          }
        };
      }

      // New request - create processing record
      await this.createProcessingRecord(scope, idempotencyKey, request);

      return {
        isDuplicate: false,
        key: idempotencyKey
      };

    } catch (error) {
      if (error instanceof IdempotencyError) {
        throw error;
      }
      
      throw new IdempotencyError(
        'Failed to check idempotency',
        'IDEMPOTENCY_CHECK_FAILED',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Store the result of processing for future idempotency checks
   */
  async storeResult(
    scope: Scope,
    idempotencyKey: string,
    response: any,
    status: 'draft' | 'posted' | 'failed'
  ): Promise<void> {
    try {
      await storeIdempotencyResult(scope, idempotencyKey, response, status);
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to store idempotency result:', error);
    }
  }

  /**
   * Create a NextResponse from an existing idempotent result
   */
  createIdempotentResponse(result: IdempotencyResult): NextResponse {
    if (!result.existingResponse) {
      throw new Error('No existing response to create from');
    }

    const response = NextResponse.json(
      result.existingResponse.body,
      { status: result.existingResponse.status }
    );

    // Add idempotency headers
    if (result.existingResponse.headers) {
      Object.entries(result.existingResponse.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  }

  /**
   * Validate idempotency key format
   */
  private isValidIdempotencyKey(key: string): boolean {
    // UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // Alphanumeric with hyphens (min 8, max 64 chars)
    const alphanumericRegex = /^[a-zA-Z0-9\-_]{8,64}$/;
    
    return uuidRegex.test(key) || alphanumericRegex.test(key);
  }

  /**
   * Create initial processing record
   */
  private async createProcessingRecord(
    scope: Scope, 
    idempotencyKey: string, 
    request: NextRequest
  ): Promise<void> {
    // Create hash of request body for verification
    const body = await request.text();
    const requestHash = await this.hashRequest(body);
    
    // Store processing state
    await storeIdempotencyResult(
      scope, 
      idempotencyKey, 
      { status: 'processing', requestHash }, 
      'processing' as any
    );
  }

  /**
   * Create hash of request for duplicate detection
   */
  private async hashRequest(body: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(body);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * Idempotency error class
 */
export class IdempotencyError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'IdempotencyError';
  }
}

/**
 * Helper function to create idempotency middleware
 */
export function createIdempotencyMiddleware(options?: IdempotencyOptions) {
  return new IdempotencyMiddleware(options);
}

/**
 * Decorator for API routes with idempotency
 */
export function withIdempotency(
  handler: (req: NextRequest, idempotencyResult: IdempotencyResult) => Promise<NextResponse>,
  options?: IdempotencyOptions
) {
  const middleware = new IdempotencyMiddleware(options);

  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract scope from headers (same as existing API)
      const scope: Scope = {
        tenantId: req.headers.get('x-tenant-id') || '',
        companyId: req.headers.get('x-company-id') || '',
        userId: req.headers.get('x-user-id') || '',
        userRole: req.headers.get('x-user-role') || ''
      };

      // Check idempotency
      const idempotencyResult = await middleware.checkRequest(req, scope);

      // If duplicate, return existing response
      if (idempotencyResult.isDuplicate) {
        return middleware.createIdempotentResponse(idempotencyResult);
      }

      // Process new request
      const response = await handler(req, idempotencyResult);

      // Store result for future idempotency
      if (idempotencyResult.key) {
        const responseBody = await response.clone().json();
        const status = response.status === 201 ? 'posted' : 
                     response.status === 202 ? 'draft' : 'completed';
        
        await middleware.storeResult(scope, idempotencyResult.key, responseBody, status as any);
      }

      return response;

    } catch (error) {
      if (error instanceof IdempotencyError) {
        return NextResponse.json(
          {
            error: {
              code: error.code,
              message: error.message,
              details: error.details
            }
          },
          { status: 400 }
        );
      }
      throw error;
    }
  };
}
