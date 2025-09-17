"use client";

import React, { useState, useEffect } from "react";
import {
    BuildingOfficeIcon,
    UserGroupIcon,
    CogIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../Card.js";
import { Button } from "../../Button.js";
import { Input } from "../../Input.js";
import { Label } from "../../Label.js";
import { Alert } from "../../Alert.js";
import { cn } from "../../utils.js";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TenantOnboardingData {
    // Step 1: Basic Information
    name: string;
    slug: string;
    industry: string;

    // Step 2: Company Setup
    companyName: string;
    companyCode: string;
    baseCurrency: string;
    fiscalYearEnd: string;

    // Step 3: Feature Selection
    features: {
        attachments: boolean;
        reports: boolean;
        ar: boolean;
        ap: boolean;
        je: boolean;
        regulated_mode: boolean;
    };

    // Step 4: User Invitation
    invitedUsers: Array<{
        email: string;
        role: string;
        firstName?: string;
        lastName?: string;
    }>;
}

export interface TenantOnboardingProps {
    onComplete: (data: TenantOnboardingData) => Promise<void>;
    onCancel?: () => void;
    className?: string;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const CURRENCIES = [
    { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
];

const INDUSTRIES = [
    "Technology",
    "Manufacturing",
    "Retail",
    "Healthcare",
    "Finance",
    "Education",
    "Construction",
    "Professional Services",
    "Other"
];

const ROLES = [
    { value: "admin", label: "Administrator", description: "Full access to all features and settings" },
    { value: "manager", label: "Manager", description: "Manage users, view reports, and oversee operations" },
    { value: "accountant", label: "Accountant", description: "Create and manage financial records" },
    { value: "clerk", label: "Clerk", description: "Basic data entry and record management" },
    { value: "viewer", label: "Viewer", description: "Read-only access to reports and data" },
];

const FEATURES = [
    {
        key: "attachments",
        title: "Document Management",
        description: "Upload and manage invoices, receipts, and other documents",
        icon: "📄",
        recommended: true,
    },
    {
        key: "reports",
        title: "Financial Reports",
        description: "Generate balance sheets, P&L statements, and other financial reports",
        icon: "📊",
        recommended: true,
    },
    {
        key: "ar",
        title: "Accounts Receivable",
        description: "Manage customer invoices and payments",
        icon: "💰",
        recommended: true,
    },
    {
        key: "ap",
        title: "Accounts Payable",
        description: "Manage supplier bills and payments",
        icon: "📋",
        recommended: false,
    },
    {
        key: "je",
        title: "Journal Entries",
        description: "Create and manage manual journal entries",
        icon: "📝",
        recommended: false,
    },
    {
        key: "regulated_mode",
        title: "Regulated Mode",
        description: "Enhanced compliance and audit features",
        icon: "🛡️",
        recommended: false,
    },
];

// ============================================================================
// STEP COMPONENTS
// ============================================================================

interface StepProps {
    data: TenantOnboardingData;
    onUpdate: (updates: Partial<TenantOnboardingData>) => void;
    onNext: () => void;
    onPrevious: () => void;
    isFirst: boolean;
    isLast: boolean;
}

function BasicInformationStep({ data, onUpdate, onNext, isFirst, isLast }: StepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const validateStep = () => {
        const newErrors: Record<string, string> = {};

        if (!data.name.trim()) {
            newErrors.name = "Organization name is required";
        }

        if (!data.slug.trim()) {
            newErrors.slug = "URL slug is required";
        } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
            newErrors.slug = "URL slug can only contain lowercase letters, numbers, and hyphens";
        }

        if (!data.industry) {
            newErrors.industry = "Industry selection is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNameChange = (name: string) => {
        onUpdate({ name });
        if (!data.slug || data.slug === generateSlug(data.name)) {
            const newSlug = generateSlug(name);
            onUpdate({ slug: newSlug });
            setSlugSuggestions([newSlug, `${newSlug}-inc`, `${newSlug}-ltd`]);
        }
    };

    const handleNext = () => {
        if (validateStep()) {
            onNext();
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-blue-600" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Organization Setup</h2>
                <p className="mt-2 text-gray-600">
                    Let's start by setting up your organization's basic information
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="name">Organization Name *</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
                        placeholder="e.g., Acme Corporation"
                        className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input
                        id="slug"
                        value={data.slug}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ slug: e.target.value })}
                        placeholder="e.g., acme-corp"
                        className={errors.slug ? "border-red-500" : ""}
                    />
                    {slugSuggestions.length > 0 && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">Suggestions:</p>
                            <div className="flex gap-2 mt-1">
                                {slugSuggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => onUpdate({ slug: suggestion })}
                                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                </div>

                <div>
                    <Label htmlFor="industry">Industry *</Label>
                    <select
                        id="industry"
                        value={data.industry}
                        onChange={(e) => onUpdate({ industry: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] px-3 py-2 text-sm text-[var(--sys-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sys-accent)]"
                    >
                        <option value="">Select your industry</option>
                        {INDUSTRIES.map((industry) => (
                            <option key={industry} value={industry}>
                                {industry}
                            </option>
                        ))}
                    </select>
                    {errors.industry && <p className="mt-1 text-sm text-red-600">{errors.industry}</p>}
                </div>
            </div>

            <CardFooter className="flex justify-between">
                <Button variant="secondary" onClick={() => {}} disabled={isFirst}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Previous
                </Button>
                <Button onClick={handleNext}>
                    Next
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
            </CardFooter>
        </div>
    );
}

function CompanySetupStep({ data, onUpdate, onNext, onPrevious, isFirst, isLast }: StepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateStep = () => {
        const newErrors: Record<string, string> = {};

        if (!data.companyName.trim()) {
            newErrors.companyName = "Company name is required";
        }

        if (!data.companyCode.trim()) {
            newErrors.companyCode = "Company code is required";
        }

        if (!data.baseCurrency) {
            newErrors.baseCurrency = "Base currency is required";
        }

        if (!data.fiscalYearEnd) {
            newErrors.fiscalYearEnd = "Fiscal year end is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            onNext();
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <CogIcon className="mx-auto h-12 w-12 text-blue-600" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Company Configuration</h2>
                <p className="mt-2 text-gray-600">
                    Set up your company's financial settings and preferences
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                        id="companyName"
                        value={data.companyName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ companyName: e.target.value })}
                        placeholder="e.g., Acme Corporation Sdn Bhd"
                        className={errors.companyName ? "border-red-500" : ""}
                    />
                    {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
                </div>

                <div>
                    <Label htmlFor="companyCode">Company Code *</Label>
                    <Input
                        id="companyCode"
                        value={data.companyCode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ companyCode: e.target.value.toUpperCase() })}
                        placeholder="e.g., ACME"
                        className={errors.companyCode ? "border-red-500" : ""}
                    />
                    <p className="mt-1 text-sm text-gray-500">Used for internal reference and reporting</p>
                    {errors.companyCode && <p className="mt-1 text-sm text-red-600">{errors.companyCode}</p>}
                </div>

                <div>
                    <Label htmlFor="baseCurrency">Base Currency *</Label>
                    <select
                        id="baseCurrency"
                        value={data.baseCurrency}
                        onChange={(e) => onUpdate({ baseCurrency: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] px-3 py-2 text-sm text-[var(--sys-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sys-accent)]"
                    >
                        <option value="">Select base currency</option>
                        {CURRENCIES.map((currency) => (
                            <option key={currency.code} value={currency.code}>
                                {currency.code} - {currency.name} ({currency.symbol})
                            </option>
                        ))}
                    </select>
                    {errors.baseCurrency && <p className="mt-1 text-sm text-red-600">{errors.baseCurrency}</p>}
                </div>

                <div>
                    <Label htmlFor="fiscalYearEnd">Fiscal Year End *</Label>
                    <select
                        id="fiscalYearEnd"
                        value={data.fiscalYearEnd}
                        onChange={(e) => onUpdate({ fiscalYearEnd: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] px-3 py-2 text-sm text-[var(--sys-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sys-accent)]"
                    >
                        <option value="">Select fiscal year end</option>
                        {Array.from({ length: 12 }, (_, i) => {
                            const month = i + 1;
                            const monthName = new Date(2024, month - 1).toLocaleString('default', { month: 'long' });
                            return (
                                <option key={month} value={`${month.toString().padStart(2, '0')}-31`}>
                                    {monthName} 31st
                                </option>
                            );
                        })}
                    </select>
                    {errors.fiscalYearEnd && <p className="mt-1 text-sm text-red-600">{errors.fiscalYearEnd}</p>}
                </div>
            </div>

            <CardFooter className="flex justify-between">
                <Button variant="secondary" onClick={() => {}} disabled={isFirst}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Previous
                </Button>
                <Button onClick={handleNext}>
                    Next
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
            </CardFooter>
        </div>
    );
}

function FeatureSelectionStep({ data, onUpdate, onNext, onPrevious, isFirst, isLast }: StepProps) {
    const handleFeatureToggle = (featureKey: keyof typeof data.features) => {
        onUpdate({
            features: {
                ...data.features,
                [featureKey]: !data.features[featureKey],
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-blue-600" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Feature Selection</h2>
                <p className="mt-2 text-gray-600">
                    Choose which features you'd like to enable for your organization
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FEATURES.map((feature) => (
                    <Card
                        key={feature.key}
                        className={cn(
                            "cursor-pointer transition-all duration-200 hover:shadow-md",
                            data.features[feature.key as keyof typeof data.features]
                                ? "ring-2 ring-blue-500 bg-blue-50"
                                : "hover:bg-gray-50"
                        )}
                        onClick={() => handleFeatureToggle(feature.key as keyof typeof data.features)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                                <div className="text-2xl">{feature.icon}</div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-medium text-gray-900">{feature.title}</h3>
                                        {feature.recommended && (
                                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600">{feature.description}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={data.features[feature.key as keyof typeof data.features]}
                                        onChange={() => handleFeatureToggle(feature.key as keyof typeof data.features)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Alert className="bg-blue-50 border-blue-200">
                <ExclamationTriangleIcon className="h-4 w-4 text-blue-600" />
                <div className="ml-3">
                    <p className="text-sm text-blue-800">
                        You can always modify these settings later in your organization preferences.
                    </p>
                </div>
            </Alert>

            <CardFooter className="flex justify-between">
                <Button variant="secondary" onClick={() => {}} disabled={isFirst}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Previous
                </Button>
                <Button onClick={onNext}>
                    Next
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
            </CardFooter>
        </div>
    );
}

function UserInvitationStep({ data, onUpdate, onNext, onPrevious, isFirst, isLast }: StepProps) {
    const [newUser, setNewUser] = useState({ email: "", role: "viewer", firstName: "", lastName: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const addUser = () => {
        if (!newUser.email.trim()) {
            setErrors({ email: "Email is required" });
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
            setErrors({ email: "Please enter a valid email address" });
            return;
        }

        if (data.invitedUsers.some(user => user.email === newUser.email)) {
            setErrors({ email: "This email has already been added" });
            return;
        }

        onUpdate({
            invitedUsers: [...data.invitedUsers, { ...newUser }],
        });

        setNewUser({ email: "", role: "viewer", firstName: "", lastName: "" });
        setErrors({});
    };

    const removeUser = (index: number) => {
        onUpdate({
            invitedUsers: data.invitedUsers.filter((_, i) => i !== index),
        });
    };

    const handleNext = () => {
        onNext();
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <UserGroupIcon className="mx-auto h-12 w-12 text-blue-600" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Invite Team Members</h2>
                <p className="mt-2 text-gray-600">
                    Invite your team members to join your organization (optional)
                </p>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, email: e.target.value })}
                            placeholder="colleague@company.com"
                            className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                        <Label htmlFor="role">Role</Label>
                        <select
                            id="role"
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] px-3 py-2 text-sm text-[var(--sys-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sys-accent)]"
                        >
                            {ROLES.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            value={newUser.firstName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, firstName: e.target.value })}
                            placeholder="John"
                        />
                    </div>

                    <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            value={newUser.lastName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, lastName: e.target.value })}
                            placeholder="Doe"
                        />
                    </div>
                </div>

                <Button onClick={addUser} variant="secondary" className="w-full">
                    Add Team Member
                </Button>
            </div>

            {data.invitedUsers.length > 0 && (
                <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Invited Team Members</h3>
                    <div className="space-y-2">
                        {data.invitedUsers.map((user, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{user.email}</p>
                                    <p className="text-sm text-gray-600">
                                        {ROLES.find(r => r.value === user.role)?.label} • {user.firstName} {user.lastName}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeUser(index)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Alert className="bg-green-50 border-green-200">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <div className="ml-3">
                    <p className="text-sm text-green-800">
                        Team members will receive an email invitation to join your organization.
                    </p>
                </div>
            </Alert>

            <CardFooter className="flex justify-between">
                <Button variant="secondary" onClick={() => {}} disabled={isFirst}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Previous
                </Button>
                <Button onClick={handleNext}>
                    {isLast ? "Complete Setup" : "Next"}
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
            </CardFooter>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TenantOnboarding({ onComplete, onCancel, className }: TenantOnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<TenantOnboardingData>({
        name: "",
        slug: "",
        industry: "",
        companyName: "",
        companyCode: "",
        baseCurrency: "",
        fiscalYearEnd: "",
        features: {
            attachments: true,
            reports: true,
            ar: true,
            ap: false,
            je: false,
            regulated_mode: false,
        },
        invitedUsers: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const steps = [
        { title: "Organization", component: BasicInformationStep },
        { title: "Company", component: CompanySetupStep },
        { title: "Features", component: FeatureSelectionStep },
        { title: "Team", component: UserInvitationStep },
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
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

    const handleComplete = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            await onComplete(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred during setup");
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateData = (updates: Partial<TenantOnboardingData>) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const CurrentStepComponent = steps[currentStep]?.component;

    return (
        <div className={cn("max-w-4xl mx-auto", className)}>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Setup Your Organization</CardTitle>
                            <CardDescription>
                                Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
                            </CardDescription>
                        </div>
                        {onCancel && (
                            <Button variant="ghost" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="flex space-x-2">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "h-2 flex-1 rounded-full transition-colors",
                                        index <= currentStep ? "bg-blue-600" : "bg-gray-200"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {error && (
                        <Alert className="mb-6 bg-red-50 border-red-200">
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                            <div className="ml-3">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </Alert>
                    )}

                    {CurrentStepComponent && <CurrentStepComponent
                        data={data}
                        onUpdate={updateData}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        isFirst={currentStep === 0}
                        isLast={currentStep === steps.length - 1}
                    />}
                </CardContent>
            </Card>
        </div>
    );
}

export default TenantOnboarding;
