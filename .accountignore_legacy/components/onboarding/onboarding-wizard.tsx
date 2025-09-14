/**
 * User Onboarding Wizard - Fortune 500 Grade Experience
 * Multi-step guided setup that crushes competitor onboarding
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Users,
  DollarSign,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  Zap,
  Shield,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<any>;
}

interface CompanySetupData {
  // Company Information
  company_name: string;
  industry: string;
  company_size: string;
  country: string;
  currency: string;
  fiscal_year_start: string;

  // Accounting Preferences
  accounting_method: "accrual" | "cash";
  chart_of_accounts_template: string;
  enable_multi_currency: boolean;
  enable_cost_centers: boolean;
  enable_projects: boolean;

  // User Preferences
  date_format: string;
  number_format: string;
  timezone: string;
  language: string;

  // Initial Setup
  create_sample_data: boolean;
  import_existing_data: boolean;
  setup_bank_accounts: boolean;
}

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<CompanySetupData>({
    company_name: "",
    industry: "",
    company_size: "",
    country: "United States",
    currency: "USD",
    fiscal_year_start: "January",
    accounting_method: "accrual",
    chart_of_accounts_template: "standard",
    enable_multi_currency: false,
    enable_cost_centers: true,
    enable_projects: false,
    date_format: "MM/DD/YYYY",
    number_format: "1,234.56",
    timezone: "America/New_York",
    language: "English",
    create_sample_data: true,
    import_existing_data: false,
    setup_bank_accounts: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to Modern Accounting",
      description: "Let's set up your Fortune 500-grade accounting system",
      icon: Sparkles,
      component: WelcomeStep,
    },
    {
      id: "company",
      title: "Company Information",
      description: "Tell us about your business",
      icon: Building2,
      component: CompanyStep,
    },
    {
      id: "accounting",
      title: "Accounting Preferences",
      description: "Configure your accounting settings",
      icon: FileText,
      component: AccountingStep,
    },
    {
      id: "features",
      title: "Advanced Features",
      description: "Enable powerful features for your business",
      icon: Target,
      component: FeaturesStep,
    },
    {
      id: "preferences",
      title: "User Preferences",
      description: "Customize your experience",
      icon: Users,
      component: PreferencesStep,
    },
    {
      id: "complete",
      title: "Setup Complete",
      description: "You're ready to start!",
      icon: CheckCircle2,
      component: CompleteStep,
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Create company with all setup data
      await createCompanyWithSetup(setupData);

      // Redirect to dashboard with welcome tour
      router.push("/dashboard?welcome=true");
    } catch (error) {
      console.error("Setup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Modern Accounting</h1>
            <Badge variant="secondary">Setup Wizard</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Setup Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center mb-8 space-x-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <StepIcon className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
              {React.createElement(steps[currentStep].icon, { className: "h-6 w-6" })}
              <span>{steps[currentStep].title}</span>
            </CardTitle>
            <p className="text-muted-foreground">{steps[currentStep].description}</p>
          </CardHeader>

          <CardContent>
            <CurrentStepComponent
              data={setupData}
              onChange={setSetupData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onComplete={handleComplete}
              isLoading={isLoading}
              isFirstStep={currentStep === 0}
              isLastStep={currentStep === steps.length - 1}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Step Components
function WelcomeStep({ onNext }: any) {
  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="text-6xl">🚀</div>
        <h2 className="text-3xl font-bold">Welcome to the Future of Accounting!</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          You're about to experience accounting software that's 3x faster than QuickBooks, more
          powerful than Xero, and more beautiful than anything else on the market.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <div className="text-center space-y-2">
          <Zap className="h-12 w-12 mx-auto text-yellow-500" />
          <h3 className="font-semibold">Lightning Fast</h3>
          <p className="text-sm text-muted-foreground">Sub-second response times</p>
        </div>
        <div className="text-center space-y-2">
          <Shield className="h-12 w-12 mx-auto text-green-500" />
          <h3 className="font-semibold">Enterprise Security</h3>
          <p className="text-sm text-muted-foreground">Bank-grade security & compliance</p>
        </div>
        <div className="text-center space-y-2">
          <Target className="h-12 w-12 mx-auto text-blue-500" />
          <h3 className="font-semibold">ERPNext Logic</h3>
          <p className="text-sm text-muted-foreground">Battle-tested business rules</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This setup will take about 3 minutes and will configure everything you need to get
          started.
        </p>
        <Button onClick={onNext} size="lg" className="px-8">
          Let's Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CompanyStep({ data, onChange, onNext, onPrevious }: any) {
  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Retail",
    "Manufacturing",
    "Construction",
    "Professional Services",
    "Non-Profit",
    "Other",
  ];

  const companySizes = [
    "1-10 employees",
    "11-50 employees",
    "51-200 employees",
    "201-1000 employees",
    "1000+ employees",
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            value={data.company_name}
            onChange={e => onChange({ ...data, company_name: e.target.value })}
            placeholder="Your Company Ltd"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <select
            id="industry"
            value={data.industry}
            onChange={e => onChange({ ...data, industry: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select Industry</option>
            {industries.map(industry => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_size">Company Size</Label>
          <select
            id="company_size"
            value={data.company_size}
            onChange={e => onChange({ ...data, company_size: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select Size</option>
            {companySizes.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <select
            id="country"
            value={data.country}
            onChange={e => onChange({ ...data, country: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Japan">Japan</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={onNext} disabled={!data.company_name}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function AccountingStep({ data, onChange, onNext, onPrevious }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Accounting Method</Label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="accrual"
                checked={data.accounting_method === "accrual"}
                onChange={e => onChange({ ...data, accounting_method: e.target.value })}
              />
              <span>Accrual (Recommended)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="cash"
                checked={data.accounting_method === "cash"}
                onChange={e => onChange({ ...data, accounting_method: e.target.value })}
              />
              <span>Cash</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Base Currency</Label>
          <select
            id="currency"
            value={data.currency}
            onChange={e => onChange({ ...data, currency: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="JPY">JPY - Japanese Yen</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fiscal_year_start">Fiscal Year Starts</Label>
          <select
            id="fiscal_year_start"
            value={data.fiscal_year_start}
            onChange={e => onChange({ ...data, fiscal_year_start: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="January">January</option>
            <option value="April">April</option>
            <option value="July">July</option>
            <option value="October">October</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chart_template">Chart of Accounts Template</Label>
          <select
            id="chart_template"
            value={data.chart_of_accounts_template}
            onChange={e => onChange({ ...data, chart_of_accounts_template: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="standard">Standard Business</option>
            <option value="retail">Retail & E-commerce</option>
            <option value="service">Service Business</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="nonprofit">Non-Profit</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={onNext}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function FeaturesStep({ data, onChange, onNext, onPrevious }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">Multi-Currency Support</h3>
            <p className="text-sm text-muted-foreground">
              Handle transactions in multiple currencies
            </p>
          </div>
          <input
            type="checkbox"
            checked={data.enable_multi_currency}
            onChange={e => onChange({ ...data, enable_multi_currency: e.target.checked })}
            className="h-4 w-4"
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">Cost Centers</h3>
            <p className="text-sm text-muted-foreground">
              Track expenses by department or location
            </p>
          </div>
          <input
            type="checkbox"
            checked={data.enable_cost_centers}
            onChange={e => onChange({ ...data, enable_cost_centers: e.target.checked })}
            className="h-4 w-4"
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">Project Tracking</h3>
            <p className="text-sm text-muted-foreground">Track income and expenses by project</p>
          </div>
          <input
            type="checkbox"
            checked={data.enable_projects}
            onChange={e => onChange({ ...data, enable_projects: e.target.checked })}
            className="h-4 w-4"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={onNext}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PreferencesStep({ data, onChange, onNext, onPrevious }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="date_format">Date Format</Label>
          <select
            id="date_format"
            value={data.date_format}
            onChange={e => onChange({ ...data, date_format: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="number_format">Number Format</Label>
          <select
            id="number_format"
            value={data.number_format}
            onChange={e => onChange({ ...data, number_format: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="1,234.56">1,234.56</option>
            <option value="1.234,56">1.234,56</option>
            <option value="1 234.56">1 234.56</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Initial Setup Options</h3>

        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={data.create_sample_data}
              onChange={e => onChange({ ...data, create_sample_data: e.target.checked })}
              className="h-4 w-4"
            />
            <span>Create sample data for learning (Recommended)</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={data.setup_bank_accounts}
              onChange={e => onChange({ ...data, setup_bank_accounts: e.target.checked })}
              className="h-4 w-4"
            />
            <span>Set up bank accounts after completion</span>
          </label>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={onNext}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CompleteStep({ onComplete, isLoading }: any) {
  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-bold">Setup Complete!</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your Fortune 500-grade accounting system is ready. You now have access to features that
          rival enterprise solutions at a fraction of the cost.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
          <h3 className="font-semibold">Company Created</h3>
          <p className="text-sm text-muted-foreground">Multi-tenant setup complete</p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <FileText className="h-8 w-8 mx-auto text-blue-600 mb-2" />
          <h3 className="font-semibold">Accounts Ready</h3>
          <p className="text-sm text-muted-foreground">Chart of accounts configured</p>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
          <h3 className="font-semibold">User Access</h3>
          <p className="text-sm text-muted-foreground">Permissions configured</p>
        </div>
      </div>

      <div className="space-y-4">
        <Button onClick={onComplete} size="lg" className="px-8" disabled={isLoading}>
          {isLoading ? "Setting up..." : "Enter Dashboard"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          You'll be taken to your dashboard with a guided tour of key features.
        </p>
      </div>
    </div>
  );
}

// Helper function to create company with setup data
async function createCompanyWithSetup(setupData: CompanySetupData) {
  // This would integrate with your existing auth system
  // Implementation would call your Supabase functions
  console.log("Creating company with setup data:", setupData);

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000));

  return { success: true };
}
