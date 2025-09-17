/**
 * @aibos/ui - API Client Hook
 *
 * React hook that provides an authenticated API client
 * integrated with the AuthProvider context
 */

import { useEffect, useRef } from "react";
import { useAuth } from "../AuthProvider.js";
import { apiClient, ApiClient } from "../lib/api-client.js";

/**
 * Hook to get authenticated API client
 */
export function useApiClient(): ApiClient {
  const { session, logout } = useAuth();
  const clientRef = useRef(apiClient);

  // Update API client tokens when session changes
  useEffect(() => {
    if (session?.accessToken && session?.refreshToken) {
      clientRef.current.setAuthTokens(
        session.accessToken,
        session.refreshToken
      );
    } else {
      clientRef.current.setAuthTokens(null, null);
    }
  }, [session?.accessToken, session?.refreshToken]);

  // Configure auth error handler
  useEffect(() => {
    const handleAuthError = () => {
      logout();
    };

    // Set up auth error handler
    clientRef.current.addRequestInterceptor((config: any) => {
      // Add any request-level auth handling here
      return config;
    });

    clientRef.current.addResponseInterceptor((response: any) => {
      // Handle auth errors at response level
      if (response.status === 401) {
        handleAuthError();
      }
      return response;
    });

    // Set auth error callback
    clientRef.current.setAuthTokens = (accessToken: any, refreshToken: any) => {
      apiClient.setAuthTokens(accessToken, refreshToken);
    };

  }, [logout]);

  return clientRef.current;
}

/**
 * Hook for making authenticated API calls
 */
export function useApiCall() {
  const apiClient = useApiClient();

  return {
    get: apiClient.get.bind(apiClient),
    post: apiClient.post.bind(apiClient),
    put: apiClient.put.bind(apiClient),
    delete: apiClient.delete.bind(apiClient),
    patch: apiClient.patch.bind(apiClient),
    request: apiClient.request.bind(apiClient),
  };
}
