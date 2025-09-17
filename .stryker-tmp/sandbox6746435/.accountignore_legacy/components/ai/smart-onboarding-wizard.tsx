// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  Clock,
  Star,
  Building2,
  DollarSign,
  FileText,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { AIEngine, AIOnboardingStep, AIProgress, AIContext } from "@/lib/ai-engine";

interface SmartOnboardingWizardProps {
  companyId: string;
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function SmartOnboardingWizard({
  companyId,
  userId,
  onComplete,
  onSkip,
}: SmartOnboardingWizardProps) {
  const [steps, setSteps] = useState<AIOnboardingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState<AIProgress | null>(null);
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    loadOnboardingData();
  }, [companyId]);

  const loadOnboardingData = async () => {
    try {
      const [stepsResult, progressResult] = await Promise.all([
        AIEngine.getOnboardingSteps(companyId),
        AIEngine.getProgress(userId, companyId),
      ]);

      if (stepsResult.success && stepsResult.steps) {
        setSteps(stepsResult.steps);
      }

      if (progressResult.success && progressResult.progress) {
        setProgress(progressResult.progress);
        setCurrentStepIndex(
          stepsResult.steps?.findIndex(s => s.id === progressResult.progress?.currentStep) || 0,
        );
      }
    } catch (error) {
      console.error("Error loading onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const completionPercentage = progress ? progress.completionPercentage : 0;

  const handleNext = () => {
    if (currentStep && validateStep(currentStep)) {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStepIndex(nextIndex);
      } else {
        handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsOpen(false);
    onSkip();
  };

  const validateStep = (step: AIOnboardingStep): boolean => {
    if (!step.required) return true;
    return step.validation(stepData[step.id] || {});
  };

  const updateStepData = (stepId: string, data: any) => {
    setStepData(prev => ({
      ...prev,
      [stepId]: { ...prev[stepId], ...data },
    }));
  };

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case "company-info":
        return <Building2 className="h-5 w-5" />;
      case "chart-of-accounts":
        return <FileText className="h-5 w-5" />;
      case "first-transaction":
        return <DollarSign className="h-5 w-5" />;
      case "bank-account":
        return <CreditCard className="h-5 w-5" />;
      case "first-invoice":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Circle className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading onboarding wizard...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Star className="h-6 w-6 text-yellow-500" />
            <span>Welcome to Your Accounting System!</span>
          </DialogTitle>
          <DialogDescription>
            Let's get you set up in just 5 minutes. Follow these simple steps to start managing your
            finances.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Setup Progress</span>
              <span>{completionPercentage}% Complete</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{progress?.estimatedTimeRemaining || 0} min remaining</span>
              </span>
            </div>
          </div>

          {/* Steps Overview */}
          <div className="grid grid-cols-5 gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-2 rounded-lg border text-center ${
                  index === currentStepIndex
                    ? "border-primary bg-primary/5"
                    : index < currentStepIndex
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                }`}
              >
                <div className="flex justify-center mb-1">
                  {index < currentStepIndex ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    getStepIcon(step.id)
                  )}
                </div>
                <div className="text-xs font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.estimatedTime}min</div>
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          {currentStep && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getStepIcon(currentStep.id)}
                  <span>{currentStep.title}</span>
                  {currentStep.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{currentStep.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <StepContent
                  step={currentStep}
                  data={stepData[currentStep.id] || {}}
                  onUpdate={data => updateStepData(currentStep.id, data)}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <div>
              {!isFirstStep && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleSkip}>
                Skip Setup
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentStep?.required && !validateStep(currentStep)}
              >
                {isLastStep ? "Complete Setup" : "Next"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StepContentProps {
  step: AIOnboardingStep;
  data: any;
  onUpdate: (data: any) => void;
}

function StepContent({ step, data, onUpdate }: StepContentProps) {
  switch (step.id) {
    case "company-info":
      return <CompanyInfoStep data={data} onUpdate={onUpdate} />;
    case "chart-of-accounts":
      return <CoASetupStep data={data} onUpdate={onUpdate} />;
    case "first-transaction":
      return <FirstTransactionStep data={data} onUpdate={onUpdate} />;
    case "bank-account":
      return <BankAccountStep data={data} onUpdate={onUpdate} />;
    case "first-invoice":
      return <FirstInvoiceStep data={data} onUpdate={onUpdate} />;
    default:
      return <div>Step content not implemented</div>;
  }
}

function CompanyInfoStep({ data, onUpdate }: { data: any; onUpdate: (data: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          value={data.companyName || ""}
          onChange={e => onUpdate({ companyName: e.target.value })}
          placeholder="Enter your company name"
        />
      </div>
      <div>
        <Label htmlFor="currency">Default Currency</Label>
        <Input
          id="currency"
          value={data.currency || "USD"}
          onChange={e => onUpdate({ currency: e.target.value })}
          placeholder="USD"
        />
      </div>
      <div>
        <Label htmlFor="fiscalYear">Fiscal Year Start</Label>
        <Input
          id="fiscalYear"
          type="date"
          value={data.fiscalYear || ""}
          onChange={e => onUpdate({ fiscalYear: e.target.value })}
        />
      </div>
    </div>
  );
}

function CoASetupStep({ data, onUpdate }: { data: any; onUpdate: (data: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          Chart of Accounts setup will be handled by the CoA Setup Wizard
        </p>
        <Button className="mt-4" onClick={() => onUpdate({ accounts: ["placeholder"] })}>
          Open CoA Setup Wizard
        </Button>
      </div>
    </div>
  );
}

function FirstTransactionStep({ data, onUpdate }: { data: any; onUpdate: (data: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="transactionType">Transaction Type</Label>
        <Input
          id="transactionType"
          value={data.transactionType || ""}
          onChange={e => onUpdate({ transactionType: e.target.value })}
          placeholder="e.g., Office Supplies"
        />
      </div>
      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          value={data.amount || ""}
          onChange={e => onUpdate({ amount: parseFloat(e.target.value) })}
          placeholder="0.00"
        />
      </div>
    </div>
  );
}

function BankAccountStep({ data, onUpdate }: { data: any; onUpdate: (data: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="bankName">Bank Name</Label>
        <Input
          id="bankName"
          value={data.bankName || ""}
          onChange={e => onUpdate({ bankName: e.target.value })}
          placeholder="Enter bank name"
        />
      </div>
      <div>
        <Label htmlFor="accountNumber">Account Number</Label>
        <Input
          id="accountNumber"
          value={data.accountNumber || ""}
          onChange={e => onUpdate({ accountNumber: e.target.value })}
          placeholder="Enter account number"
        />
      </div>
    </div>
  );
}

function FirstInvoiceStep({ data, onUpdate }: { data: any; onUpdate: (data: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="customerName">Customer Name</Label>
        <Input
          id="customerName"
          value={data.customerName || ""}
          onChange={e => onUpdate({ customerName: e.target.value })}
          placeholder="Enter customer name"
        />
      </div>
      <div>
        <Label htmlFor="amount">Invoice Amount</Label>
        <Input
          id="amount"
          type="number"
          value={data.amount || ""}
          onChange={e => onUpdate({ amount: parseFloat(e.target.value) })}
          placeholder="0.00"
        />
      </div>
    </div>
  );
}
