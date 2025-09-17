/**
 * Authentication Hook
 * React hook for managing authentication state
 */
// @ts-nocheck


"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthService, Company } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: { full_name?: string; avatar_url?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await AuthService.signIn(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      await AuthService.signUp(email, password, fullName);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  const updatePassword = async (newPassword: string) => {
    await AuthService.updatePassword(newPassword);
  };

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
    await AuthService.updateProfile(updates);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Company management hook
interface CompanyContextType {
  companies: (Company & { role: string })[];
  currentCompany: Company | null;
  loading: boolean;
  switchCompany: (companyId: string) => Promise<void>;
  createCompany: (companyData: {
    name: string;
    default_currency?: string;
    fiscal_year_start?: string;
    country?: string;
  }) => Promise<Company>;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<(Company & { role: string })[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCompanies = async () => {
    if (!user) {
      setCompanies([]);
      setCurrentCompany(null);
      setLoading(false);
      return;
    }

    try {
      const userCompanies = await AuthService.getUserCompanies(user.id);
      setCompanies(userCompanies);

      // Set first company as current if none selected
      if (userCompanies.length > 0 && !currentCompany) {
        setCurrentCompany(userCompanies[0]);
        localStorage.setItem("currentCompanyId", userCompanies[0].id);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCompanies();
  }, [user]);

  useEffect(() => {
    // Restore current company from localStorage
    const savedCompanyId = localStorage.getItem("currentCompanyId");
    if (savedCompanyId && companies.length > 0) {
      const company = companies.find(c => c.id === savedCompanyId);
      if (company) {
        setCurrentCompany(company);
      }
    }
  }, [companies]);

  const switchCompany = async (companyId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await AuthService.switchCompany(user.id, companyId);
      const company = companies.find(c => c.id === companyId);
      if (company) {
        setCurrentCompany(company);
        localStorage.setItem("currentCompanyId", companyId);
      }
    } catch (error) {
      throw error;
    }
  };

  const createCompany = async (companyData: {
    name: string;
    default_currency?: string;
    fiscal_year_start?: string;
    country?: string;
  }) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const newCompany = await AuthService.createCompany(user.id, companyData);
      await refreshCompanies();
      return newCompany;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    companies,
    currentCompany,
    loading,
    switchCompany,
    createCompany,
    refreshCompanies,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
