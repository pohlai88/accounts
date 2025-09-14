import { jwtVerify, createRemoteJWKSet } from 'jose';

export type SecurityContext = {
    userId: string;
    email: string;
    tenantId: string;
    companyId: string | null;
    tenantName: string | null;
    companyName: string | null;
    scopes: string[];
    requestId: string;
    availableTenants?: Array<{
        tenantId: string;
        role: string;
        permissions: any;
    }>;
};

const JWKS_URL = process.env.SUPABASE_JWKS_URL;
const ISSUER = process.env.SUPABASE_ISSUER;
const AUDIENCE = process.env.SUPABASE_AUDIENCE;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Only create JWKS if environment variables are available
const JWKS = JWKS_URL ? createRemoteJWKSet(new URL(JWKS_URL)) : null;

export async function verifyAccessToken(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) {
        throw Object.assign(new Error('Missing token'), { status: 401 });
    }

    const token = authorization.slice(7);

    // For symmetric JWT signing (when JWKS returns empty keys), verify with Auth server
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json() as {
                    id: string;
                    email: string;
                    app_metadata?: Record<string, unknown>;
                    user_metadata?: Record<string, unknown>;
                    role?: string;
                };
                // Extract JWT payload from the user data
                return {
                    sub: userData.id,
                    email: userData.email,
                    app_metadata: userData.app_metadata || {},
                    user_metadata: userData.user_metadata || {},
                    role: userData.role || 'authenticated'
                };
            } else {
                throw Object.assign(new Error('Invalid token'), { status: 401 });
            }
        } catch (error) {
            throw Object.assign(new Error('Token verification failed'), { status: 401 });
        }
    }

    // Fallback to JWKS verification for asymmetric keys
    if (!JWKS || !ISSUER || !AUDIENCE) {
        throw Object.assign(new Error('JWT configuration missing'), { status: 500 });
    }

    const { payload } = await jwtVerify(token, JWKS, {
        issuer: ISSUER,
        audience: AUDIENCE,
    });

    return payload as Record<string, any>;
}

export function buildSecurityContext(
    payload: Record<string, any>,
    requestId: string
): SecurityContext {
    const appMetadata = payload.app_metadata || {};

    return {
        userId: String(payload.sub),
        email: String(payload.email ?? ''),
        tenantId: String(appMetadata.tenant_id ?? payload['tenant_id'] ?? ''),
        companyId: appMetadata.company_id ? String(appMetadata.company_id) : null,
        tenantName: appMetadata.tenant_name ? String(appMetadata.tenant_name) : null,
        companyName: appMetadata.company_name ? String(appMetadata.company_name) : null,
        scopes: Array.isArray(payload['scp']) ? (payload['scp'] as string[]) : [],
        requestId,
        availableTenants: Array.isArray(appMetadata.available_tenants)
            ? appMetadata.available_tenants
            : undefined,
    };
}

// Adapter for backward compatibility with existing AuthUser
export function toSecurityContext(
    authUser: { id: string; email: string; tenant_id: string; role: string; company_id?: string },
    requestId: string
): SecurityContext {
    return {
        userId: authUser.id,
        email: authUser.email,
        tenantId: authUser.tenant_id,
        companyId: authUser.company_id || null,
        tenantName: null,
        companyName: null,
        scopes: [authUser.role], // Map role to scopes
        requestId,
    };
}
