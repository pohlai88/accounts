// @ts-nocheck
"use client";

import { ReactNode, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider, AccessibilityProvider } from "@aibos/ui";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // Create QueryClient inside the client component to avoid serialization issues
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount: number, error: unknown) => {
              // Don't retry on 4xx errors
              if (error instanceof Error && "status" in error && typeof error.status === "number") {
                if (error.status >= 400 && error.status < 500) {
                  return false;
                }
              }
              return failureCount < 3;
            },
          },
          mutations: {
            retry: false,
          },
        },
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider defaultMode="aesthetic" persistMode={true}>
        <AuthProvider apiBaseUrl={process.env.NEXT_PUBLIC_API_URL}>{children}</AuthProvider>
      </AccessibilityProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
