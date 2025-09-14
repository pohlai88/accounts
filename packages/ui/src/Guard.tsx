// Permission Guard Component
// Conditionally renders children based on user permissions

"use client";

import { ReactNode } from "react";
import {
  useCanPerform,
  useHasFeature,
  type ClientUserContext,
} from "@aibos/utils/auth/react-hooks";

interface GuardProps {
  user: ClientUserContext | null;
  children: ReactNode;
  fallback?: ReactNode;
}

interface PermissionGuardProps extends GuardProps {
  action: string;
  context?: {
    amount?: number;
    module?: string;
    creatorRole?: string;
  };
}

interface FeatureGuardProps extends GuardProps {
  feature: string;
}

/**
 * Guard component for permission-based rendering
 */
export function PermissionGuard({
  user,
  action,
  context = {},
  children,
  fallback = null,
}: PermissionGuardProps) {
  const canPerform = useCanPerform(user, action, context);

  return canPerform ? <>{children}</> : <>{fallback}</>;
}

/**
 * Guard component for feature flag-based rendering
 */
export function FeatureGuard({ user, feature, children, fallback = null }: FeatureGuardProps) {
  const hasFeature = useHasFeature(user, feature);

  return hasFeature ? <>{children}</> : <>{fallback}</>;
}

/**
 * Combined guard for both permission and feature checks
 */
export function Guard({
  user,
  children,
  fallback = null,
  ...props
}: GuardProps & {
  action?: string;
  feature?: string;
  context?: { amount?: number; module?: string; creatorRole?: string };
}) {
  // If both action and feature are provided, both must pass
  if (props.action && props.feature) {
    const canPerform = useCanPerform(user, props.action, props.context);
    const hasFeature = useHasFeature(user, props.feature);
    return canPerform && hasFeature ? <>{children}</> : <>{fallback}</>;
  }

  // If only action is provided
  if (props.action) {
    return (
      <PermissionGuard
        user={user}
        action={props.action}
        context={props.context}
        fallback={fallback}
      >
        {children}
      </PermissionGuard>
    );
  }

  // If only feature is provided
  if (props.feature) {
    return (
      <FeatureGuard user={user} feature={props.feature} fallback={fallback}>
        {children}
      </FeatureGuard>
    );
  }

  // If neither is provided, always render (useful for role-only checks)
  return <>{children}</>;
}

/**
 * Role-based guard (simple role checking)
 */
export function RoleGuard({
  user,
  roles,
  children,
  fallback = null,
}: GuardProps & { roles: string[] }) {
  const hasRole = user?.roles?.some(role => roles.includes(role)) ?? false;

  return hasRole ? <>{children}</> : <>{fallback}</>;
}

// Export all guards
export { PermissionGuard as Permission, FeatureGuard as Feature, RoleGuard as Role };
