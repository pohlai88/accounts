"use client";

/**
 * @aibos/ui - React Authentication Context (SSOT Compliant)
 * 
 * Follows the existing auth package patterns and SSOT principles
 * Integrates with the existing SoD compliance and governance packs
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Define User type locally to avoid dependency issues
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'viewer';
    companyId: string;
    createdAt: string;
    updatedAt: string;
}

// Session and User Types following SSOT patterns
export interface AuthUser extends User {
    permissions: string[];
    tenantName?: string;
    companyName?: string;
}

export interface Session {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    isAuthenticated: boolean;
}

export interface AuthState {
    session: Session | null;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;
}

// Auth Actions following SSOT patterns
type AuthAction =
    | { type: 'AUTH_START' }
    | { type: 'AUTH_SUCCESS'; payload: Session }
    | { type: 'AUTH_FAILURE'; payload: string }
    | { type: 'AUTH_LOGOUT' }
    | { type: 'AUTH_CLEAR_ERROR' }
    | { type: 'AUTH_INITIALIZED' };

// Auth Context following SSOT patterns
interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshSession: () => Promise<void>;
    clearError: () => void;
    hasPermission: (permission: string) => boolean;
    hasRole: (role: string) => boolean;
    getRequestContext: () => {
        tenantId: string;
        companyId: string;
        userId: string;
        userRole: string;
        requestId: string;
    } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Reducer following SSOT patterns
function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'AUTH_START':
            return {
                ...state,
                isLoading: true,
                error: null
            };

        case 'AUTH_SUCCESS':
            return {
                ...state,
                session: action.payload,
                isLoading: false,
                error: null,
                isInitialized: true
            };

        case 'AUTH_FAILURE':
            return {
                ...state,
                session: null,
                isLoading: false,
                error: action.payload,
                isInitialized: true
            };

        case 'AUTH_LOGOUT':
            return {
                ...state,
                session: null,
                isLoading: false,
                error: null,
                isInitialized: true
            };

        case 'AUTH_CLEAR_ERROR':
            return {
                ...state,
                error: null
            };

        case 'AUTH_INITIALIZED':
            return {
                ...state,
                isInitialized: true
            };

        default:
            return state;
    }
}

// Initial State following SSOT patterns
const initialState: AuthState = {
    session: null,
    isLoading: false,
    error: null,
    isInitialized: false
};

// Auth Provider Props following SSOT patterns
interface AuthProviderProps {
    children: ReactNode;
    apiBaseUrl?: string;
}

// Auth Provider Component following SSOT patterns
export function AuthProvider({ children, apiBaseUrl }: AuthProviderProps) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Initialize auth state on mount following SSOT patterns
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Check for existing session in localStorage
                const storedSession = localStorage.getItem('aibos_session');
                if (storedSession) {
                    const session: Session = JSON.parse(storedSession);

                    // Check if session is still valid
                    if (new Date(session.expiresAt) > new Date()) {
                        dispatch({ type: 'AUTH_SUCCESS', payload: session });
                        return;
                    } else {
                        // Try to refresh the session
                        await refreshSession();
                        return;
                    }
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);
                localStorage.removeItem('aibos_session');
            }

            dispatch({ type: 'AUTH_INITIALIZED' });
        };

        initializeAuth();
    }, []);

    // Login function following SSOT patterns
    const login = async (email: string, password: string): Promise<void> => {
        dispatch({ type: 'AUTH_START' });

        try {
            const response = await fetch(`${apiBaseUrl || '/api'}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.title || 'Login failed');
            }

            const sessionData = await response.json();
            const session: Session = {
                user: sessionData.user,
                accessToken: sessionData.accessToken,
                refreshToken: sessionData.refreshToken,
                expiresAt: new Date(sessionData.expiresAt),
                isAuthenticated: true
            };

            // Store session in localStorage
            localStorage.setItem('aibos_session', JSON.stringify(session));

            dispatch({ type: 'AUTH_SUCCESS', payload: session });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
            throw error;
        }
    };

    // Logout function following SSOT patterns
    const logout = async (): Promise<void> => {
        try {
            if (state.session?.accessToken) {
                // Call logout endpoint to invalidate server-side session
                await fetch(`${apiBaseUrl || '/api'}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${state.session.accessToken}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            // Clear local session regardless of API call success
            localStorage.removeItem('aibos_session');
            dispatch({ type: 'AUTH_LOGOUT' });
        }
    };

    // Refresh session function following SSOT patterns
    const refreshSession = async (): Promise<void> => {
        if (!state.session?.refreshToken) {
            dispatch({ type: 'AUTH_LOGOUT' });
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl || '/api'}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken: state.session.refreshToken })
            });

            if (!response.ok) {
                throw new Error('Session refresh failed');
            }

            const sessionData = await response.json();
            const session: Session = {
                user: sessionData.user,
                accessToken: sessionData.accessToken,
                refreshToken: sessionData.refreshToken,
                expiresAt: new Date(sessionData.expiresAt),
                isAuthenticated: true
            };

            localStorage.setItem('aibos_session', JSON.stringify(session));
            dispatch({ type: 'AUTH_SUCCESS', payload: session });
        } catch (error) {
            console.error('Session refresh failed:', error);
            localStorage.removeItem('aibos_session');
            dispatch({ type: 'AUTH_LOGOUT' });
        }
    };

    // Clear error function following SSOT patterns
    const clearError = (): void => {
        dispatch({ type: 'AUTH_CLEAR_ERROR' });
    };

    // Permission check function following SSOT patterns
    const hasPermission = (permission: string): boolean => {
        if (!state.session?.user) return false;
        return state.session.user.permissions.includes(permission);
    };

    // Role check function following SSOT patterns
    const hasRole = (role: string): boolean => {
        if (!state.session?.user) return false;
        return state.session.user.role === role;
    };

    // Get request context for API calls following SSOT patterns
    const getRequestContext = () => {
        if (!state.session?.user) return null;

        return {
            tenantId: state.session.user.tenantName || state.session.user.companyId,
            companyId: state.session.user.companyId,
            userId: state.session.user.id,
            userRole: state.session.user.role,
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    };

    const contextValue: AuthContextType = {
        ...state,
        login,
        logout,
        refreshSession,
        clearError,
        hasPermission,
        hasRole,
        getRequestContext
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook to use auth context following SSOT patterns
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Higher-order component for protected routes following SSOT patterns
interface ProtectedRouteProps {
    children: ReactNode;
    requiredPermission?: string;
    requiredRole?: string;
    fallback?: ReactNode;
}

export function ProtectedRoute({
    children,
    requiredPermission,
    requiredRole,
    fallback = <div>Access Denied</div>
}: ProtectedRouteProps) {
    const { session, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!session?.isAuthenticated) {
        return <div>Please log in to access this page</div>;
    }

    if (requiredPermission && !session.user.permissions.includes(requiredPermission)) {
        return <>{fallback}</>;
    }

    if (requiredRole && session.user.role !== requiredRole) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

// Hook for permission-based rendering following SSOT patterns
export function usePermission(permission: string): boolean {
    const { hasPermission } = useAuth();
    return hasPermission(permission);
}

// Hook for role-based rendering following SSOT patterns
export function useRole(role: string): boolean {
    const { hasRole } = useAuth();
    return hasRole(role);
}
