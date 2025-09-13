import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Login request schema
const LoginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

// Mock user data - In production, this would come from your database
const MOCK_USERS = [
    {
        id: 'user_1',
        email: 'admin@aibos.com',
        password: 'admin123', // In production, this would be hashed
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
        password: 'user123',
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

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = LoginRequestSchema.parse(body);

        // Find user (in production, this would be a database query)
        const user = MOCK_USERS.find(u => u.email === email && u.password === password);

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        type: 'authentication_error',
                        title: 'Invalid credentials',
                        status: 401,
                        detail: 'Email or password is incorrect'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                },
                { status: 401 }
            );
        }

        // Generate tokens (in production, use proper JWT)
        const accessToken = `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Return user data and tokens
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
                accessToken,
                refreshToken,
                expiresAt: expiresAt.toISOString()
            },
            timestamp: new Date().toISOString(),
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

    } catch (error) {
        console.error('Login error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        type: 'validation_error',
                        title: 'Invalid request data',
                        status: 400,
                        detail: 'Please check your email and password format',
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
                    title: 'Login failed',
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
