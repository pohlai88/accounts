/**
 * @aibos/ui - Authentication API Hook
 *
 * Provides typed API calls for authentication endpoints
 */

import { useApiCall } from "./useApiClient.js";

// Auth API Types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        permissions: string[];
        tenantId: string;
        companyId: string;
        companyName: string;
        tenantName: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
}

export interface RefreshRequest {
    refreshToken: string;
}

export interface RefreshResponse {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        permissions: string[];
        tenantId: string;
        companyId: string;
        companyName: string;
        tenantName: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
}

export interface LogoutResponse {
    message: string;
}

/**
 * Hook for authentication API calls
 */
export function useAuthApi() {
    const api = useApiCall();

    return {
        /**
         * Login user
         */
        login: async (credentials: LoginRequest): Promise<LoginResponse> => {
            return api.post<LoginResponse>("/auth/login", credentials);
        },

        /**
         * Refresh authentication token
         */
        refresh: async (refreshToken: string): Promise<RefreshResponse> => {
            return api.post<RefreshResponse>("/auth/refresh", { refreshToken });
        },

        /**
         * Logout user
         */
        logout: async (): Promise<LogoutResponse> => {
            return api.post<LogoutResponse>("/auth/logout");
        },
    };
}
