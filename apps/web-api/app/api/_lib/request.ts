import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { verifyAccessToken, buildSecurityContext, SecurityContext } from '@aibos/security';

export async function getSecurityContext(req: NextRequest): Promise<SecurityContext> {
    const requestId = req.headers.get('x-request-id') ?? randomUUID();

    try {
        const claims = await verifyAccessToken(req.headers.get('authorization') ?? '');
        return buildSecurityContext(claims, requestId);
    } catch (error: unknown) {
        // Re-throw the error with proper status code
        if (error && typeof error === 'object' && 'status' in error) {
            throw error;
        }
        // If it's a generic error, treat as unauthorized
        throw Object.assign(new Error('Authentication failed'), { status: 401 });
    }
}
