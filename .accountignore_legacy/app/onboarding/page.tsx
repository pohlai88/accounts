/**
 * Onboarding Page - User Setup Wizard
 * Fortune 500-grade onboarding experience
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // Check if user has already completed onboarding
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("company_id")
        .eq("id", session.user.id)
        .single();

      if (profile?.company_id) {
        // User already has a company, redirect to dashboard
        router.push("/dashboard");
      }
    };

    checkAuth();
  }, [router]);

  return <OnboardingWizard />;
}
