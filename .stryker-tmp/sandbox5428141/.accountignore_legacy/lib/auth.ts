/**
 * Authentication Service - Supabase Integration
 * Handles user authentication, company switching, and role management
 */
// @ts-nocheck


import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  default_currency: string;
  fiscal_year_start: string;
  country?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCompany {
  user_id: string;
  company_id: string;
  role: "Owner" | "Admin" | "Manager" | "User" | "Viewer";
  is_active: boolean;
  created_at: string;
}

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw new Error(error.message);
    }

    return user;
  }

  /**
   * Get user's companies
   */
  static async getUserCompanies(userId: string): Promise<(Company & { role: string })[]> {
    const { data, error } = await supabase
      .from("company_members")
      .select(
        `
        role,
        is_active,
        companies (
          id,
          name,
          default_currency,
          fiscal_year_start,
          country,
          created_at,
          updated_at
        )
      `,
      )
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) {
      throw new Error(error.message);
    }

    return (
      data?.map(item => ({
        ...item.companies,
        role: item.role,
      })) || []
    );
  }

  /**
   * Create a new company for user
   */
  static async createCompany(
    userId: string,
    companyData: {
      name: string;
      default_currency?: string;
      fiscal_year_start?: string;
      country?: string;
    },
  ): Promise<Company> {
    // Create company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: companyData.name,
        default_currency: companyData.default_currency || "USD",
        fiscal_year_start: companyData.fiscal_year_start || "2024-01-01",
        country: companyData.country,
      })
      .select()
      .single();

    if (companyError) {
      throw new Error(companyError.message);
    }

    // Add user as owner
    const { error: memberError } = await supabase.from("company_members").insert({
      user_id: userId,
      company_id: company.id,
      role: "Owner",
      is_active: true,
    });

    if (memberError) {
      throw new Error(memberError.message);
    }

    return company;
  }

  /**
   * Switch to a different company
   */
  static async switchCompany(userId: string, companyId: string): Promise<boolean> {
    // Verify user has access to this company
    const { data, error } = await supabase
      .from("company_members")
      .select("role")
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      throw new Error("Access denied to this company");
    }

    return true;
  }

  /**
   * Get user role in company
   */
  static async getUserRole(userId: string, companyId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("company_members")
      .select("role")
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .eq("is_active", true)
      .single();

    if (error) {
      return null;
    }

    return data?.role || null;
  }

  /**
   * Check if user has permission for action
   */
  static hasPermission(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      Viewer: 1,
      User: 2,
      Manager: 3,
      Admin: 4,
      Owner: 5,
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: { full_name?: string; avatar_url?: string }) {
    const { error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}
