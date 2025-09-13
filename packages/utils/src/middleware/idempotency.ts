// Idempotency Middleware - V1 Compliance
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface IdempotencyResult {
  cached: boolean;
  response?: unknown;
  key?: string;
}

/**
 * Process idempotency key for API requests
 * V1 requirement: All financial operations must be idempotent
 */
export async function processIdempotencyKey(request: NextRequest): Promise<IdempotencyResult> {
  try {
    // Extract idempotency key from headers
    const idempotencyKey = request.headers.get('Idempotency-Key');

    if (!idempotencyKey) {
      // No idempotency key provided - proceed normally
      return { cached: false };
    }

    // Validate idempotency key format (UUID v4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idempotencyKey)) {
      throw new Error('Invalid idempotency key format. Must be UUID v4.');
    }

    // Create Supabase client for cache lookup
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if we have a cached response for this key
    const { data: cachedResponse, error } = await supabase
      .from('idempotency_cache')
      .select('response_data, created_at')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Idempotency cache lookup error:', error);
      return { cached: false };
    }

    if (cachedResponse) {
      // Check if cache entry is still valid (24 hours)
      const cacheAge = Date.now() - new Date(cachedResponse.created_at).getTime();
      const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours

      if (cacheAge < maxCacheAge) {
        return {
          cached: true,
          response: cachedResponse.response_data,
          key: idempotencyKey
        };
      } else {
        // Cache expired, delete old entry
        await supabase
          .from('idempotency_cache')
          .delete()
          .eq('idempotency_key', idempotencyKey);
      }
    }

    return { cached: false, key: idempotencyKey };

  } catch (error) {
    console.error('Idempotency processing error:', error);
    // On error, proceed without caching to avoid blocking requests
    return { cached: false };
  }
}

/**
 * Store response in idempotency cache
 */
export async function storeIdempotencyResponse(
  idempotencyKey: string,
  response: unknown
): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from('idempotency_cache')
      .upsert({
        idempotency_key: idempotencyKey,
        response_data: response,
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Failed to store idempotency response:', error);
    // Don't throw - this is not critical for request processing
  }
}

/**
 * Clean up expired idempotency cache entries
 * Should be run periodically via cron job
 */
export async function cleanupIdempotencyCache(): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    await supabase
      .from('idempotency_cache')
      .delete()
      .lt('created_at', expiredDate);

  } catch (error) {
    console.error('Failed to cleanup idempotency cache:', error);
  }
}
