import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Refresh request schema
const RefreshRequestSchema = z.object({
    refreshToken: z.string().min(1)
});

// Mock refresh token storage - In production, this would be in your database
const REFRESH_TOKENS = new Map<string, {
    userId: string;
    expiresAt: Date;
}>();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { refreshToken } = RefreshRequestSchema.parse(body);

        // Check if refresh token exists and is valid
        const tokenData = REFRESH_TOKENS.get(refreshToken);

        if (!tokenData || tokenData.expiresAt < new Date()) {
            // Clean up expired token
            if (tokenData) {
                REFRESH_TOKENS.delete(refreshToken);
            }

            return NextResponse.json(
                {
                    success: false,
                    error: {
                        type: 'authentication_error',
                        title: 'Invalid or expired refresh token',
                        status: 401,
                        detail: 'Please log in again'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                },
                { status: 401 }
            );
        }

        // Mock user data - In production, fetch from database using tokenData.userId
        const MOCK_USERS = [
            {
                id: 'user_1',
                email: 'admin@aibos.com',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                permissions: ['read', 'write', 'delete', 'approve'],
                tenantId: 'tenant_1',
                companyId: 'company_1',
                companyName: 'AIBOS Demo Company',
                tenantName: 'AIBOS Demo Tenant'
            },
            {
                id: 'user_2',
                email: 'user@aibos.com',
                firstName: 'Regular',
                lastName: 'User',
                role: 'user',
                permissions: ['read', 'write'],
                tenantId: 'tenant_1',
                companyId: 'company_1',
                companyName: 'AIBOS Demo Company',
                tenantName: 'AIBOS Demo Tenant'
            }
        ];

        const user = MOCK_USERS.find(u => u.id === tokenData.userId);

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        type: 'authentication_error',
                        title: 'User not found',
                        status: 401,
                        detail: 'User associated with refresh token not found'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                },
                { status: 401 }
            );
        }

        // Generate new tokens
        const newAccessToken = `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newRefreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store new refresh token and remove old one
        REFRESH_TOKENS.delete(refreshToken);
        REFRESH_TOKENS.set(newRefreshToken, {
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        // Return new tokens and user data
        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    permissions: user.permissions,
                    tenantId: user.tenantId,
                    companyId: user.companyId,
                    companyName: user.companyName,
                    tenantName: user.tenantName
                },
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresAt: expiresAt.toISOString()
            },
            timestamp: new Date().toISOString(),
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

    } catch (error) {
        console.error('Token refresh error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        type: 'validation_error',
                        title: 'Invalid request data',
                        status: 400,
                        detail: 'Please provide a valid refresh token',
                        errors: error.issues.reduce((acc, err) => {
                            acc[err.path.join('.')] = [err.message];
                            return acc;
                        }, {} as Record<string, string[]>)
                    },
                    timestamp: new Date().toISOString(),
                    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: {
                    type: 'internal_error',
                    title: 'Token refresh failed',
                    status: 500,
                    detail: 'An unexpected error occurred'
                },
                timestamp: new Date().toISOString(),
                requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            },
            { status: 500 }
        );
    }
}
