"use client";

import React, { useState, useEffect } from "react";
import {
    CogIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    PencilIcon,
    CheckIcon,
    ArrowPathIcon,
    InformationCircleIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../Card.js";
import { Button } from "../../Button.js";
import { Input } from "../../Input.js";
import { Label } from "../../Label.js";
import { Alert } from "../../Alert.js";
import { Badge } from "../../Badge.js";
import { cn } from "../../utils.js";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FeatureFlag {
    key: string;
    label: string;
    description: string;
    enabled: boolean;
    source: "plan_feature" | "tenant_setting" | "user_override" | "default";
    category: "core" | "premium" | "enterprise" | "experimental";
    dependencies?: string[];
    impact: "low" | "medium" | "high";
    lastModified?: string;
    modifiedBy?: string;
}

export interface FeatureFlagsProps {
    tenantId: string;
    onFeatureToggle?: (featureKey: string, enabled: boolean) => Promise<void>;
    onBulkUpdate?: (updates: Record<string, boolean>) => Promise<void>;
    onResetToDefaults?: () => Promise<void>;
    className?: string;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const FEATURE_CATEGORIES = {
    core: { label: "Core Features", color: "blue", description: "Essential accounting features" },
    premium: { label: "Premium Features", color: "green", description: "Advanced features for growing businesses" },
    enterprise: { label: "Enterprise Features", color: "purple", description: "Full-featured solution for large organizations" },
    experimental: { label: "Experimental Features", color: "yellow", description: "Beta features and new capabilities" },
};

const IMPACT_LEVELS = {
    low: { label: "Low Impact", color: "green", description: "Minimal impact on system performance" },
    medium: { label: "Medium Impact", color: "yellow", description: "Moderate impact on system performance" },
    high: { label: "High Impact", color: "red", description: "Significant impact on system performance" },
};

const SOURCE_LABELS = {
    plan_feature: "Plan Feature",
    tenant_setting: "Tenant Setting",
    user_override: "User Override",
    default: "Default",
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FeatureFlagCardProps {
    feature: FeatureFlag;
    onToggle: (enabled: boolean) => void;
    onEdit?: () => void;
    isEditing?: boolean;
    onSave?: () => void;
    onCancel?: () => void;
}

function FeatureFlagCard({
    feature,
    onToggle,
    onEdit,
    isEditing = false,
    onSave,
    onCancel
}: FeatureFlagCardProps) {
    const categoryInfo = FEATURE_CATEGORIES[feature.category];
    const impactInfo = IMPACT_LEVELS[feature.impact];
    const sourceLabel = SOURCE_LABELS[feature.source];

    const getSourceColor = (source: string) => {
        switch (source) {
            case "plan_feature": return "blue";
            case "tenant_setting": return "green";
            case "user_override": return "purple";
            default: return "gray";
        }
    };

    const sourceColor = getSourceColor(feature.source);

    return (
        <Card className={cn(
            "hover:shadow-md transition-shadow",
            feature.enabled ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
        )}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <CardTitle className="text-lg">{feature.label}</CardTitle>
                            <Badge
                                variant={categoryInfo.color === "blue" ? "default" : categoryInfo.color === "green" ? "default" : "secondary"}
                                className="text-xs"
                            >
                                {categoryInfo.label}
                            </Badge>
                            <Badge
                                variant={impactInfo.color === "red" ? "destructive" : impactInfo.color === "yellow" ? "secondary" : "outline"}
                                className="text-xs"
                            >
                                {impactInfo.label}
                            </Badge>
                        </div>
                        <CardDescription className="mb-3">
                            {feature.description}
                        </CardDescription>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Source: {sourceLabel}</span>
                            {feature.lastModified && (
                                <span>Modified: {new Date(feature.lastModified).toLocaleDateString()}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {!isEditing && onEdit && (
                            <Button variant="ghost" size="sm" onClick={onEdit}>
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {isEditing && (
                            <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" onClick={onCancel}>
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={onSave}>
                                    <CheckIcon className="w-4 h-4 mr-1" />
                                    Save
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="space-y-4">
                    {/* Dependencies */}
                    {feature.dependencies && feature.dependencies.length > 0 && (
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Dependencies</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {feature.dependencies.map((dep) => (
                                    <Badge key={dep} variant="outline" className="text-xs">
                                        {dep}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Toggle Switch */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={() => onToggle(!feature.enabled)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                                    feature.enabled ? "bg-blue-600" : "bg-gray-200"
                                )}
                            >
                                <span
                                    className={cn(
                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                        feature.enabled ? "translate-x-6" : "translate-x-1"
                                    )}
                                />
                            </button>
                            <span className="text-sm font-medium text-gray-900">
                                {feature.enabled ? "Enabled" : "Disabled"}
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            {feature.enabled ? (
                                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            ) : (
                                <XCircleIcon className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* Impact Warning */}
                    {feature.impact === "high" && feature.enabled && (
                        <Alert className="bg-yellow-50 border-yellow-200">
                            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                            <div className="ml-3">
                                <p className="text-sm text-yellow-800">
                                    This feature has high impact on system performance. Monitor usage carefully.
                                </p>
                            </div>
                        </Alert>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

interface FeatureEvaluationProps {
    tenantId: string;
    features: string[];
    onEvaluate: (results: Record<string, any>) => void;
}

function FeatureEvaluation({ tenantId, features, onEvaluate }: FeatureEvaluationProps) {
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [results, setResults] = useState<Record<string, any>>({});

    const evaluateFeatures = async () => {
        try {
            setIsEvaluating(true);

            const response = await fetch("/api/feature-flags/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantId,
                    features,
                    context: {
                        timeOfDay: new Date().getHours(),
                        userAgent: navigator.userAgent,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to evaluate features");
            }

            const data = await response.json();
            setResults(data.data.evaluation);
            onEvaluate(data.data.evaluation);
        } catch (error) {
            console.error("Feature evaluation error:", error);
        } finally {
            setIsEvaluating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Feature Evaluation</CardTitle>
                <CardDescription>Test feature flags with current context</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="features">Features to Evaluate</Label>
                        <Input
                            id="features"
                            placeholder="attachments,reports,ar,ap"
                            defaultValue={features.join(",")}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const featureList = e.target.value.split(",").map((f: string) => f.trim()).filter((f: string) => f);
                                // Update features array
                            }}
                        />
                    </div>

                    <Button onClick={evaluateFeatures} disabled={isEvaluating}>
                        {isEvaluating ? (
                            <>
                                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                                Evaluating...
                            </>
                        ) : (
                            <>
                                <EyeIcon className="w-4 h-4 mr-2" />
                                Evaluate Features
                            </>
                        )}
                    </Button>

                    {Object.keys(results).length > 0 && (
                        <div className="space-y-2">
                            <Label>Evaluation Results</Label>
                            <div className="space-y-2">
                                {Object.entries(results).map(([feature, result]) => (
                                    <div key={feature} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <span className="font-medium">{feature}</span>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={result.enabled ? "default" : "outline"}>
                                                {result.enabled ? "Enabled" : "Disabled"}
                                            </Badge>
                                            <span className="text-xs text-gray-500">{result.source}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FeatureFlags({
    tenantId,
    onFeatureToggle,
    onBulkUpdate,
    onResetToDefaults,
    className
}: FeatureFlagsProps) {
    const [features, setFeatures] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingFeature, setEditingFeature] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch feature flags
    const fetchFeatureFlags = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/feature-flags?tenantId=${tenantId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch feature flags");
            }

            const data = await response.json();

            // Transform API response to FeatureFlag format
            const featureFlags: FeatureFlag[] = Object.entries(data.data.featureFlags).map(([key, enabled]) => {
                const featureInfo = getFeatureInfo(key);
                return {
                    key,
                    label: featureInfo.label,
                    description: featureInfo.description,
                    enabled: enabled as boolean,
                    source: data.data.planFeatures[key] !== undefined ? "plan_feature" : "tenant_setting",
                    category: featureInfo.category,
                    dependencies: featureInfo.dependencies,
                    impact: featureInfo.impact,
                    lastModified: data.data.lastUpdated,
                };
            });

            setFeatures(featureFlags);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch feature flags");
        } finally {
            setLoading(false);
        }
    };

    // Get feature information
    const getFeatureInfo = (key: string) => {
        const featureMap: Record<string, any> = {
            attachments: {
                label: "Document Management",
                description: "Upload and manage invoices, receipts, and other documents",
                category: "core",
                impact: "medium",
            },
            reports: {
                label: "Financial Reports",
                description: "Generate balance sheets, P&L statements, and other financial reports",
                category: "core",
                impact: "high",
            },
            ar: {
                label: "Accounts Receivable",
                description: "Manage customer invoices and payments",
                category: "core",
                impact: "high",
            },
            ap: {
                label: "Accounts Payable",
                description: "Manage supplier bills and payments",
                category: "premium",
                impact: "high",
            },
            je: {
                label: "Journal Entries",
                description: "Create and manage manual journal entries",
                category: "premium",
                impact: "medium",
            },
            regulated_mode: {
                label: "Regulated Mode",
                description: "Enhanced compliance and audit features",
                category: "enterprise",
                impact: "high",
            },
            multi_company: {
                label: "Multi-Company",
                description: "Manage multiple companies from one dashboard",
                category: "premium",
                impact: "high",
            },
            advanced_reporting: {
                label: "Advanced Reporting",
                description: "Custom reports and advanced analytics",
                category: "premium",
                impact: "medium",
            },
            api_access: {
                label: "API Access",
                description: "Programmatic access to your data",
                category: "enterprise",
                impact: "high",
            },
            white_label: {
                label: "White Label",
                description: "Customize the platform with your branding",
                category: "enterprise",
                impact: "low",
            },
            custom_fields: {
                label: "Custom Fields",
                description: "Add custom fields to forms and records",
                category: "premium",
                impact: "medium",
            },
            workflow_automation: {
                label: "Workflow Automation",
                description: "Automate business processes and approvals",
                category: "enterprise",
                impact: "high",
            },
            data_export: {
                label: "Data Export",
                description: "Export data in various formats",
                category: "premium",
                impact: "medium",
            },
            audit_trail: {
                label: "Audit Trail",
                description: "Track all changes and user activities",
                category: "enterprise",
                impact: "medium",
            },
        };

        return featureMap[key] || {
            label: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            description: "Feature description not available",
            category: "core",
            impact: "low",
        };
    };

    // Handle feature toggle
    const handleFeatureToggle = async (featureKey: string, enabled: boolean) => {
        if (onFeatureToggle) {
            try {
                await onFeatureToggle(featureKey, enabled);
                await fetchFeatureFlags(); // Refresh data
            } catch (error) {
                console.error("Failed to toggle feature:", error);
            }
        }
    };

    // Handle bulk update
    const handleBulkUpdate = async (updates: Record<string, boolean>) => {
        if (onBulkUpdate) {
            try {
                await onBulkUpdate(updates);
                await fetchFeatureFlags(); // Refresh data
            } catch (error) {
                console.error("Failed to bulk update features:", error);
            }
        }
    };

    // Filter features
    const filteredFeatures = features.filter(feature => {
        const matchesCategory = selectedCategory === "all" || feature.category === selectedCategory;
        const matchesSearch = feature.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            feature.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    useEffect(() => {
        fetchFeatureFlags();
    }, [tenantId]);

    if (loading) {
        return (
            <div className={cn("space-y-6", className)}>
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-48 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn("space-y-6", className)}>
                <Alert className="bg-red-50 border-red-200">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                    <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                </Alert>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Feature Flags</h2>
                    <p className="text-gray-600">Manage which features are enabled for your organization</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="secondary" onClick={() => fetchFeatureFlags()}>
                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    {onResetToDefaults && (
                        <Button variant="destructive" onClick={onResetToDefaults}>
                            Reset to Defaults
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <EyeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search features..."
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="flex h-10 rounded-md border border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] px-3 py-2 text-sm text-[var(--sys-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sys-accent)]"
                            >
                                <option value="all">All Categories</option>
                                {Object.entries(FEATURE_CATEGORIES).map(([key, info]) => (
                                    <option key={key} value={key}>
                                        {info.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Feature Evaluation */}
            <FeatureEvaluation
                tenantId={tenantId}
                features={features.map(f => f.key)}
                onEvaluate={(results) => {
                    console.log("Feature evaluation results:", results);
                }}
            />

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredFeatures.map((feature) => (
                    <FeatureFlagCard
                        key={feature.key}
                        feature={feature}
                        onToggle={(enabled) => handleFeatureToggle(feature.key, enabled)}
                        onEdit={() => setEditingFeature(feature.key)}
                        isEditing={editingFeature === feature.key}
                        onSave={() => setEditingFeature(null)}
                        onCancel={() => setEditingFeature(null)}
                    />
                ))}
            </div>

            {filteredFeatures.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No features found</h3>
                        <p className="mt-2 text-gray-600">
                            Try adjusting your search or filter criteria
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default FeatureFlags;
