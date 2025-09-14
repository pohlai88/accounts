import { type FeatureFlags, type PolicySettings } from '@aibos/auth';
export interface ClientUserContext {
    id: string;
    tenantId: string;
    companyId: string;
    roles: string[];
    featureFlags: FeatureFlags;
    policySettings: PolicySettings;
    memberPermissions?: {
        roles?: string[];
        allow?: string[];
        deny?: string[];
        overrides?: Record<string, unknown>;
    };
}
/**
 * Hook to check if user can perform an action
 */
export declare function useCanPerform(user: ClientUserContext | null, action: string, context?: {
    amount?: number;
    module?: string;
    creatorRole?: string;
}): boolean;
/**
 * Hook to check if feature is enabled
 */
export declare function useHasFeature(user: ClientUserContext | null, feature: string): boolean;
/**
 * Hook to get permission decision with details
 */
export declare function usePermissionDecision(user: ClientUserContext | null, action: string, context?: {
    amount?: number;
    module?: string;
    creatorRole?: string;
}): {
    allowed: boolean;
    requiresApproval?: boolean;
    reason?: string;
};
/**
 * Hook to get all user capabilities
 */
export declare function useUserCapabilities(user: ClientUserContext | null): {
    canPerform: () => boolean;
    hasFeature: () => boolean;
    getDecision: () => {
        allowed: boolean;
        reason: string;
    };
} | {
    canPerform: (action: string, context?: {
        amount?: number;
        module?: string;
        creatorRole?: string;
    }) => boolean;
    hasFeature: (feature: string) => boolean;
    getDecision: (action: string, context?: {
        amount?: number;
        module?: string;
        creatorRole?: string;
    }) => import("@aibos/auth").Decision;
};
//# sourceMappingURL=react-hooks.d.ts.map