/**
 * Authentication Service with Role-Based Access Control
 * Fortune 500-grade security and user management
 */

import React from "react";
import { supabase, supabaseAdmin } from "./supabase";
import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "accountant" | "viewer" | "owner";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  company_id?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: UserRole;
  invited_by: string;
  invited_at: string;
  accepted_at?: string;
  is_active: boolean;
}

/**
 * Authentication Service
 */
export class AuthService {
  /**
   * Sign up new user with company creation
   */
  static async signUp(
    email: string,
    password: string,
    userData: {
      full_name: string;
      company_name: string;
      company_currency?: string;
      company_country?: string;
    },
  ): Promise<{ success: boolean; error?: string; user?: User; company?: any }> {
    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
          },
        },
      });

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || "Failed to create user" };
      }

      // 2. Create company (owner gets admin role)
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: userData.company_name,
          default_currency: userData.company_currency || "USD",
          country: userData.company_country || "United States",
        })
        .select()
        .single();

      if (companyError) {
        return { success: false, error: "Failed to create company: " + companyError.message };
      }

      // 3. Create user profile
      const { error: profileError } = await supabase.from("user_profiles").insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: userData.full_name,
        role: "owner",
        company_id: company.id,
        is_active: true,
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }

      // 4. Create company membership
      const { error: memberError } = await supabase.from("company_members").insert({
        user_id: authData.user.id,
        company_id: company.id,
        role: "owner",
        invited_by: authData.user.id,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        is_active: true,
      });

      if (memberError) {
        console.error("Membership creation error:", memberError);
      }

      // 5. Create default chart of accounts
      await this.createDefaultAccounts(company.id);

      return {
        success: true,
        user: authData.user,
        company,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Sign in user
   */
  static async signIn(
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Sign out user
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      return profile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  /**
   * Check if user has permission for action
   */
  static hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      viewer: 1,
      accountant: 2,
      admin: 3,
      owner: 4,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Invite user to company
   */
  static async inviteUser(
    email: string,
    companyId: string,
    role: UserRole,
    invitedBy: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        // Add to company if not already member
        const { data: existingMember } = await supabase
          .from("company_members")
          .select("id")
          .eq("user_id", existingUser.id)
          .eq("company_id", companyId)
          .single();

        if (existingMember) {
          return { success: false, error: "User is already a member of this company" };
        }

        const { error } = await supabase.from("company_members").insert({
          user_id: existingUser.id,
          company_id: companyId,
          role,
          invited_by: invitedBy,
          invited_at: new Date().toISOString(),
          is_active: true,
        });

        if (error) {
          return { success: false, error: error.message };
        }
      } else {
        // Create invitation record for new user
        const { error } = await supabase.from("user_invitations").insert({
          email,
          company_id: companyId,
          role,
          invited_by: invitedBy,
          invited_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });

        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get company members
   */
  static async getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
    try {
      const { data: members } = await supabase
        .from("company_members")
        .select(
          `
                    *,
                    user_profiles!inner(
                        email,
                        full_name,
                        avatar_url
                    )
                `,
        )
        .eq("company_id", companyId)
        .eq("is_active", true);

      return members || [];
    } catch (error) {
      console.error("Error fetching company members:", error);
      return [];
    }
  }

  /**
   * Create default chart of accounts for new company
   */
  private static async createDefaultAccounts(companyId: string): Promise<void> {
    try {
      const defaultAccounts = [
        // Assets
        { name: "Assets", account_type: "Asset", account_code: "1000", is_group: true },
        {
          name: "Current Assets",
          account_type: "Asset",
          account_code: "1100",
          is_group: true,
          parent_code: "1000",
        },
        {
          name: "Cash",
          account_type: "Asset",
          account_code: "1110",
          is_group: false,
          parent_code: "1100",
        },
        {
          name: "Bank Account",
          account_type: "Asset",
          account_code: "1120",
          is_group: false,
          parent_code: "1100",
        },
        {
          name: "Accounts Receivable",
          account_type: "Asset",
          account_code: "1130",
          is_group: false,
          parent_code: "1100",
        },

        // Liabilities
        { name: "Liabilities", account_type: "Liability", account_code: "2000", is_group: true },
        {
          name: "Current Liabilities",
          account_type: "Liability",
          account_code: "2100",
          is_group: true,
          parent_code: "2000",
        },
        {
          name: "Accounts Payable",
          account_type: "Liability",
          account_code: "2110",
          is_group: false,
          parent_code: "2100",
        },

        // Equity
        { name: "Equity", account_type: "Equity", account_code: "3000", is_group: true },
        {
          name: "Owner Equity",
          account_type: "Equity",
          account_code: "3100",
          is_group: false,
          parent_code: "3000",
        },

        // Income
        { name: "Income", account_type: "Income", account_code: "4000", is_group: true },
        {
          name: "Sales Revenue",
          account_type: "Income",
          account_code: "4100",
          is_group: false,
          parent_code: "4000",
        },

        // Expenses
        { name: "Expenses", account_type: "Expense", account_code: "5000", is_group: true },
        {
          name: "Operating Expenses",
          account_type: "Expense",
          account_code: "5100",
          is_group: false,
          parent_code: "5000",
        },
      ];

      // Create accounts with proper hierarchy
      const accountMap = new Map<string, string>();

      for (const account of defaultAccounts) {
        const parentId = account.parent_code ? accountMap.get(account.parent_code) : undefined;

        const { data: createdAccount } = await supabase
          .from("accounts")
          .insert({
            name: account.name,
            account_type: account.account_type,
            account_code: account.account_code,
            parent_id: parentId,
            company_id: companyId,
            is_group: account.is_group,
            is_active: true,
          })
          .select("id")
          .single();

        if (createdAccount) {
          accountMap.set(account.account_code, createdAccount.id);
        }
      }
    } catch (error) {
      console.error("Error creating default accounts:", error);
    }
  }
}

/**
 * Auth Hook for React Components
 */
export function useAuth() {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      setProfile(profile);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    profile,
    loading,
    signIn: AuthService.signIn,
    signUp: AuthService.signUp,
    signOut: AuthService.signOut,
    hasPermission: (requiredRole: UserRole) =>
      profile ? AuthService.hasPermission(profile.role, requiredRole) : false,
  };
}
