/**
 * Welcome Tour - Interactive Dashboard Tour
 * Guides new users through key features with beautiful animations
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  Settings,
  Zap,
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: "top" | "bottom" | "left" | "right";
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

interface WelcomeTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function WelcomeTour({ isOpen, onClose, onComplete }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const tourSteps: TourStep[] = [
    {
      id: "welcome",
      title: "Welcome to Modern Accounting! 🎉",
      description:
        "You're now using the most advanced accounting software available. Let's take a quick tour of the key features that will save you hours every week.",
      target: "dashboard-header",
      position: "bottom",
      icon: Sparkles,
      highlight: true,
    },
    {
      id: "transactions",
      title: "Transaction Processing",
      description:
        "Create invoices, record payments, and manage journal entries with real-time validation. Our ERPNext-inspired engine prevents errors before they happen.",
      target: "transactions-tab",
      position: "bottom",
      icon: FileText,
    },
    {
      id: "accounts",
      title: "Chart of Accounts",
      description:
        "Your account hierarchy is automatically configured with intelligent templates. Add, edit, or reorganize accounts with drag-and-drop simplicity.",
      target: "accounts-tab",
      position: "bottom",
      icon: DollarSign,
    },
    {
      id: "reports",
      title: "Real-Time Reports",
      description:
        "Generate trial balance, P&L, and balance sheet reports instantly. No waiting, no manual calculations - everything updates in real-time.",
      target: "reports-tab",
      position: "bottom",
      icon: TrendingUp,
    },
    {
      id: "settings",
      title: "User & Company Settings",
      description:
        "Manage your profile, invite team members, and configure company preferences. Role-based permissions keep your data secure.",
      target: "settings-tab",
      position: "bottom",
      icon: Settings,
    },
    {
      id: "complete",
      title: "You're All Set! 🚀",
      description:
        "You now have access to Fortune 500-grade accounting features. Start by creating your first invoice or exploring the sample data we've prepared.",
      target: "dashboard-content",
      position: "top",
      icon: Zap,
      highlight: true,
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Add tour overlay class to body
      document.body.classList.add("tour-active");
    } else {
      setIsVisible(false);
      document.body.classList.remove("tour-active");
    }

    return () => {
      document.body.classList.remove("tour-active");
    };
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isVisible) return null;

  const currentTourStep = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Tour Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 tour-overlay">
        {/* Spotlight effect for highlighted elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute bg-white/10 rounded-lg transition-all duration-500"
            style={{
              // This would be calculated based on the target element position
              top: "20%",
              left: "20%",
              width: "60%",
              height: "60%",
            }}
          />
        </div>
      </div>

      {/* Tour Card */}
      <div
        className="fixed z-[60] tour-card"
        style={{
          // Position would be calculated based on target element
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Card className="w-96 shadow-2xl border-2 border-primary/20">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <currentTourStep.icon className="h-6 w-6 text-primary" />
                <Badge variant="secondary">
                  Step {currentStep + 1} of {tourSteps.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tour Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{currentTourStep.title}</h3>
              <p className="text-muted-foreground">{currentTourStep.description}</p>

              {/* Special content for first and last steps */}
              {currentStep === 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">What makes us special:</span>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 3x faster than QuickBooks</li>
                    <li>• ERPNext-level business logic</li>
                    <li>• Real-time validation & reports</li>
                    <li>• Mobile-first design</li>
                  </ul>
                </div>
              )}

              {currentStep === tourSteps.length - 1 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Quick Start Tips:</span>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Use Ctrl+I to create invoices quickly</li>
                    <li>• All reports update in real-time</li>
                    <li>• Sample data is ready for exploration</li>
                    <li>• Need help? Check the help center</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrevious}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip Tour
                </Button>
                <Button size="sm" onClick={handleNext}>
                  {currentStep === tourSteps.length - 1 ? "Get Started" : "Next"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tour Styles */}
      <style jsx global>{`
        .tour-active {
          overflow: hidden;
        }

        .tour-overlay {
          backdrop-filter: blur(2px);
        }

        .tour-card {
          animation: tourSlideIn 0.3s ease-out;
        }

        @keyframes tourSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        /* Highlight target elements during tour */
        .tour-highlight {
          position: relative;
          z-index: 51;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
}

// Hook to manage tour state
export function useWelcomeTour() {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  useEffect(() => {
    // Check if user has completed tour
    const completed = localStorage.getItem("welcome-tour-completed");
    if (completed) {
      setHasCompletedTour(true);
    }

    // Check URL params for welcome tour trigger
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("welcome") === "true" && !completed) {
      setIsTourOpen(true);
    }
  }, []);

  const startTour = () => {
    setIsTourOpen(true);
  };

  const closeTour = () => {
    setIsTourOpen(false);
  };

  const completeTour = () => {
    setHasCompletedTour(true);
    localStorage.setItem("welcome-tour-completed", "true");
    setIsTourOpen(false);
  };

  return {
    isTourOpen,
    hasCompletedTour,
    startTour,
    closeTour,
    completeTour,
  };
}
