/**
 * Email Verification System
 * Professional email verification flow that builds trust
 */
// @ts-nocheck


"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface EmailVerificationProps {
  email?: string;
  onVerified?: () => void;
}

export function EmailVerification({ email, onVerified }: EmailVerificationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"pending" | "verified" | "error">("pending");
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    // Check for verification token in URL
    const token = searchParams.get("token");
    const type = searchParams.get("type");

    if (token && type === "email") {
      verifyEmail(token);
    }

    // Start countdown for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown, searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "email",
      });

      if (error) {
        setStatus("error");
      } else {
        setStatus("verified");
        if (onVerified) {
          onVerified();
        }
        // Redirect to onboarding after verification
        setTimeout(() => {
          router.push("/onboarding");
        }, 2000);
      }
    } catch (error) {
      setStatus("error");
    }
  };

  const resendVerification = async () => {
    if (!email || !canResend) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (!error) {
        setCountdown(60);
        setCanResend(false);
      }
    } catch (error) {
      console.error("Resend failed:", error);
    } finally {
      setIsResending(false);
    }
  };

  const getStatusContent = () => {
    switch (status) {
      case "verified":
        return {
          icon: CheckCircle2,
          iconColor: "text-green-600",
          title: "Email Verified Successfully! 🎉",
          description:
            "Your email has been verified. You'll be redirected to complete your account setup.",
          bgColor: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50",
        };
      case "error":
        return {
          icon: AlertCircle,
          iconColor: "text-red-600",
          title: "Verification Failed",
          description:
            "The verification link is invalid or has expired. Please request a new verification email.",
          bgColor: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50",
        };
      default:
        return {
          icon: Mail,
          iconColor: "text-blue-600",
          title: "Check Your Email",
          description:
            "We've sent a verification link to your email address. Click the link to verify your account and continue.",
          bgColor: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50",
        };
    }
  };

  const statusContent = getStatusContent();
  const StatusIcon = statusContent.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Modern Accounting</h1>
          </div>
          <Badge variant="secondary">Email Verification</Badge>
        </div>

        <Card className={`border-2 ${statusContent.bgColor}`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-background">
                <StatusIcon className={`h-8 w-8 ${statusContent.iconColor}`} />
              </div>
            </div>
            <CardTitle className="text-xl">{statusContent.title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">{statusContent.description}</p>

            {email && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Verification email sent to:</p>
                <p className="font-medium text-sm bg-background px-3 py-2 rounded border">
                  {email}
                </p>
              </div>
            )}

            {status === "pending" && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Didn't receive the email? Check your spam folder or request a new one.
                  </p>

                  <Button
                    variant="outline"
                    onClick={resendVerification}
                    disabled={!canResend || isResending}
                    className="w-full"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : canResend ? (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend in {countdown}s
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Having trouble? Contact our support team for assistance.
                  </p>
                </div>
              </div>
            )}

            {status === "verified" && (
              <div className="text-center space-y-4">
                <div className="bg-background p-4 rounded-lg border">
                  <h3 className="font-semibold mb-2">What's Next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Complete your company setup</li>
                    <li>• Configure your chart of accounts</li>
                    <li>• Invite team members</li>
                    <li>• Start creating transactions</li>
                  </ul>
                </div>

                <Button onClick={() => router.push("/onboarding")} className="w-full">
                  Continue Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <Button onClick={resendVerification} disabled={isResending} className="w-full">
                  {isResending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending New Link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send New Verification Email
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button variant="ghost" onClick={() => router.push("/login")} className="text-sm">
                    Back to Login
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Why verify your email?</p>
          <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
            <span>🔒 Account Security</span>
            <span>📧 Important Updates</span>
            <span>🔄 Password Recovery</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Email verification page component
export default function EmailVerificationPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return <EmailVerification email={email || undefined} />;
}
