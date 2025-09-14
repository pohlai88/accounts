/**
 * Company Setup Wizard
 * Guides new users through initial company setup and data seeding
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Loader2,
  Building2,
  Users,
  DollarSign,
  FileText,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useCompany } from "@/hooks/useAuth";
import { DataSeedingService } from "@/lib/data-seeding";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  loading: boolean;
  error?: string;
}

interface CompanySetupWizardProps {
  onComplete: () => void;
}

export function CompanySetupWizard({ onComplete }: CompanySetupWizardProps) {
  const { currentCompany } = useCompany();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [setupComplete, setSetupComplete] = useState(false);
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: "check-initialization",
      title: "Check Company Status",
      description: "Verifying if your company has been initialized",
      icon: <Building2 className="h-5 w-5" />,
      completed: false,
      loading: false,
    },
    {
      id: "chart-of-accounts",
      title: "Chart of Accounts",
      description: "Setting up your default chart of accounts",
      icon: <DollarSign className="h-5 w-5" />,
      completed: false,
      loading: false,
    },
    {
      id: "sample-customers",
      title: "Sample Customers",
      description: "Creating sample customer records",
      icon: <Users className="h-5 w-5" />,
      completed: false,
      loading: false,
    },
    {
      id: "sample-suppliers",
      title: "Sample Suppliers",
      description: "Creating sample supplier records",
      icon: <FileText className="h-5 w-5" />,
      completed: false,
      loading: false,
    },
  ]);

  const updateStep = (stepId: string, updates: Partial<SetupStep>) => {
    setSteps(prev => prev.map(step => (step.id === stepId ? { ...step, ...updates } : step)));
  };

  const executeStep = async (step: SetupStep) => {
    if (!currentCompany) {
      updateStep(step.id, {
        error: "No company selected",
        loading: false,
      });
      return false;
    }

    updateStep(step.id, { loading: true, error: undefined });

    try {
      switch (step.id) {
        case "check-initialization":
          const isInitialized = await DataSeedingService.isCompanyInitialized(currentCompany.id);
          if (isInitialized) {
            // Skip setup if already initialized
            setSetupComplete(true);
            updateStep(step.id, {
              completed: true,
              loading: false,
              description: "Company is already initialized",
            });
            return true;
          }
          break;

        case "chart-of-accounts":
          await DataSeedingService.seedChartOfAccounts(currentCompany.id);
          break;

        case "sample-customers":
          await DataSeedingService.seedSampleCustomers(currentCompany.id);
          break;

        case "sample-suppliers":
          await DataSeedingService.seedSampleSuppliers(currentCompany.id);
          break;

        default:
          throw new Error(`Unknown step: ${step.id}`);
      }

      updateStep(step.id, {
        completed: true,
        loading: false,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      updateStep(step.id, {
        error: errorMessage,
        loading: false,
      });
      return false;
    }
  };

  const runSetup = async () => {
    if (setupComplete) {
      onComplete();
      return;
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setCurrentStepIndex(i);

      if (step.completed) continue;

      const success = await executeStep(step);
      if (!success) {
        break;
      }

      // If this was the initialization check and company is already set up
      if (step.id === "check-initialization" && setupComplete) {
        break;
      }

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Check if all steps are completed
    const allCompleted = steps.every(step => step.completed);
    if (allCompleted) {
      setSetupComplete(true);
    }
  };

  const retryStep = async (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      await executeStep(step);
    }
  };

  const progress = (steps.filter(s => s.completed).length / steps.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Your Accounting System!</CardTitle>
          <CardDescription>
            Let's set up your company with essential accounting data to get you started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Setup Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Company Info */}
          {currentCompany && (
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                Setting up: <strong>{currentCompany.name}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Setup Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-4 p-4 rounded-lg border ${
                  step.completed
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                    : step.loading
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                      : step.error
                        ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                        : index === currentStepIndex
                          ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
                          : "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800"
                }`}
              >
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : step.loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  ) : step.error ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    step.icon
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {step.error && <p className="text-sm text-red-600 mt-1">{step.error}</p>}
                </div>

                {step.error && (
                  <Button size="sm" variant="outline" onClick={() => retryStep(step.id)}>
                    Retry
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {!setupComplete && steps.every(s => !s.loading) && (
              <Button onClick={runSetup} size="lg">
                {steps.some(s => s.completed) ? "Continue Setup" : "Start Setup"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {setupComplete && (
              <div className="text-center space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    🎉 Setup completed successfully! Your accounting system is ready to use.
                  </AlertDescription>
                </Alert>
                <Button onClick={onComplete} size="lg">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              This setup creates a standard chart of accounts and sample data to help you get
              started. You can customize everything later from your dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
