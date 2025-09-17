/**
 * TenantOnboarding Component Usage Example
 *
 * This example demonstrates how to use the TenantOnboarding component
 * with proper error handling and integration with the tenant management API.
 */

import React, { useState } from "react";
import { TenantOnboarding, TenantOnboardingData } from "./TenantOnboarding.js";
import { Alert } from "../../Alert.js";
import { Button } from "../../Button.js";

export function TenantOnboardingExample() {
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleOnboardingComplete = async (data: TenantOnboardingData) => {
        try {
            setError(null);

            // Step 1: Create the tenant
            const tenantResponse = await fetch("/api/tenants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    slug: data.slug,
                    featureFlags: data.features,
                }),
            });

            if (!tenantResponse.ok) {
                const errorData = await tenantResponse.json();
                throw new Error(errorData.error?.detail || "Failed to create tenant");
            }

            const tenant = await tenantResponse.json();

            // Step 2: Create the company
            const companyResponse = await fetch("/api/companies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantId: tenant.data.id,
                    name: data.companyName,
                    code: data.companyCode,
                    baseCurrency: data.baseCurrency,
                    fiscalYearEnd: data.fiscalYearEnd,
                }),
            });

            if (!companyResponse.ok) {
                const errorData = await companyResponse.json();
                throw new Error(errorData.error?.detail || "Failed to create company");
            }

            // Step 3: Invite team members
            if (data.invitedUsers.length > 0) {
                const invitePromises = data.invitedUsers.map((user: any) =>
                    fetch(`/api/tenants/${tenant.data.id}/invite`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: user.email,
                            role: user.role,
                            firstName: user.firstName,
                            lastName: user.lastName,
                        }),
                    })
                );

                await Promise.all(invitePromises);
            }

            setSuccess(`Organization "${data.name}" has been created successfully!`);
            setIsOnboarding(false);

            // Redirect to the new tenant or refresh the page
            window.location.reload();

        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred during setup");
        }
    };

    const handleCancel = () => {
        setIsOnboarding(false);
        setError(null);
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <Alert className="bg-green-50 border-green-200">
                    <div className="text-green-800">{success}</div>
                </Alert>
                <div className="mt-4 text-center">
                    <Button onClick={() => setSuccess(null)}>
                        Create Another Organization
                    </Button>
                </div>
            </div>
        );
    }

    if (isOnboarding) {
        return (
            <TenantOnboarding
                onComplete={handleOnboardingComplete}
                onCancel={handleCancel}
                className="p-6"
            />
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Welcome to AI-BOS Accounting
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    Let's set up your organization and get you started with our powerful accounting platform.
                </p>

                {error && (
                    <Alert className="mb-6 bg-red-50 border-red-200">
                        <div className="text-red-800">{error}</div>
                    </Alert>
                )}

                <div className="space-y-4">
                    <Button size="lg" onClick={() => setIsOnboarding(true)}>
                        Start Organization Setup
                    </Button>

                    <div className="text-sm text-gray-500">
                        <p>Already have an organization?</p>
                        <Button variant="ghost" size="sm" className="mt-2">
                            Sign in to existing organization
                        </Button>
                    </div>
                </div>

                {/* Feature highlights */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">🏢</span>
                        </div>
                        <h3 className="font-medium text-gray-900">Multi-Company</h3>
                        <p className="text-sm text-gray-600">Manage multiple companies from one dashboard</p>
                    </div>

                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">👥</span>
                        </div>
                        <h3 className="font-medium text-gray-900">Team Collaboration</h3>
                        <p className="text-sm text-gray-600">Invite team members with role-based access</p>
                    </div>

                    <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="font-medium text-gray-900">Powerful Features</h3>
                        <p className="text-sm text-gray-600">Choose the features that fit your business</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TenantOnboardingExample;
