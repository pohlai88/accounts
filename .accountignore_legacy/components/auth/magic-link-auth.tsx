/**
 * Magic Link Authentication - 1-Click Sign-up
 * Zero friction authentication with smart company detection
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Sparkles, Zap, CheckCircle2, ArrowRight, Building2, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface MagicLinkAuthProps {
  onSuccess?: () => void;
}

export function MagicLinkAuth({ onSuccess }: MagicLinkAuthProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [detectedCompany, setDetectedCompany] = useState("");
  const [error, setError] = useState("");

  // Smart company name detection from email domain
  const detectCompanyFromEmail = (email: string) => {
    const domain = email.split("@")[1];
    if (!domain) return "";

    // Skip common email providers
    const commonProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com"];
    if (commonProviders.includes(domain.toLowerCase())) return "";

    // Convert domain to company name
    const companyName = domain
      .split(".")[0]
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return `${companyName} Sdn Bhd`;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    if (newEmail.includes("@")) {
      const company = detectCompanyFromEmail(newEmail);
      setDetectedCompany(company);
    } else {
      setDetectedCompany("");
    }
  };

  const handleMagicLinkSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?setup=true&company=${encodeURIComponent(detectedCompany)}`,
          data: {
            company_name: detectedCompany,
            country: "Malaysia",
            currency: "MYR",
            onboarding_flow: "magic_link",
          },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setIsSuccess(true);
        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <Card className="w-full max-w-md border-2 border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/40">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-xl text-green-800 dark:text-green-400">
              Magic Link Sent! ✨
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-green-700 dark:text-green-300">
              We've sent a magic link to <strong>{email}</strong>
            </p>
            <div className="bg-white dark:bg-green-900/20 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold mb-2 text-green-800 dark:text-green-400">
                What happens next:
              </h3>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Click the link in your email</li>
                <li>• We'll create your Malaysia-ready company</li>
                <li>• MYR currency & MFRS-aligned COA</li>
                <li>• Demo data so you can explore immediately</li>
              </ul>
            </div>
            {detectedCompany && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">
                    Setting up: <strong>{detectedCompany}</strong>
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Modern Accounting</h1>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="secondary">Malaysia Ready</Badge>
            <Badge variant="outline">1-Click Setup</Badge>
          </div>
          <p className="text-muted-foreground">Fortune 500-grade accounting in 5 minutes</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>Get Started Instantly</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              No password needed. We'll send you a magic link.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleMagicLinkSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Work Email</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="you@company.com"
                  required
                  className="text-center text-lg py-6"
                />
              </div>

              {detectedCompany && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">
                      We'll set up: <strong>{detectedCompany}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    You can change this later
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <Button type="submit" disabled={isLoading || !email} className="w-full text-lg py-6">
                {isLoading ? (
                  "Sending Magic Link..."
                ) : (
                  <>
                    Send Magic Link
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* What You Get Preview */}
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-center">What you get instantly:</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>MYR Currency</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>MFRS COA</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>SST/GST Ready</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Demo Data</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Globe className="h-3 w-3" />
              <span>Malaysia Localized</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="h-3 w-3" />
              <span>3x Faster than QuickBooks</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Trusted by Malaysian businesses • SOC2 compliant • Bank-grade security
          </p>
        </div>
      </div>
    </div>
  );
}
