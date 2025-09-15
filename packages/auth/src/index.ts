
export * from "./types.js";

// Re-export key functions for easy access
export {
  canPerformAction,
  isFeatureEnabled,
  checkSoDCompliance,
  getApproverRoles,
  SOD_MATRIX,
} from "./sod.js";

// Re-export governance packs
export {
  GOVERNANCE_PACKS,
  STARTER_PACK,
  BUSINESS_PACK,
  ENTERPRISE_PACK,
  REGULATED_FINANCE_PACK,
  FRANCHISE_PACK,
  applyGovernancePack,
  getRecommendedPack,
} from "./governance-packs.js";
export type { GovernancePack } from "./governance-packs.js";

// Note: React context moved to @aibos/ui package to avoid React dependency

export const auth = {
  login: async (_email: string, _password: string) => {
    // TODO: Implement Supabase auth
    return { user: null, error: null };
  },
};
