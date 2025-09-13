import * as React from "react";
import { cn } from "../../utils";
import {
    Settings, Building2, Globe, DollarSign, Shield, Users, Bell, Database,
    Save, RefreshCw, AlertTriangle, Check, X, Eye, EyeOff, Lock, Unlock
} from "lucide-react";

// SSOT Compliant Company Settings Management Component
// Comprehensive company configuration and settings management

export interface CompanySettings {
    id: string;
    companyId: string;
    general: GeneralSettings;
    financial: FinancialSettings;
    compliance: ComplianceSettings;
    integrations: IntegrationSettings;
    notifications: NotificationSettings;
    security: SecuritySettings;
    advanced: AdvancedSettings;
    updatedAt: string;
    updatedBy: string;
}

export interface GeneralSettings {
    companyName: string;
    legalName: string;
    description: string;
    industry: string;
    website: string;
    phone: string;
    email: string;
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    timezone: string;
    dateFormat: string;
    numberFormat: string;
    currency: string;
    fiscalYearStart: string;
    logo?: string;
}

export interface FinancialSettings {
    accountingMethod: 'CASH' | 'ACCRUAL';
    inventoryMethod: 'FIFO' | 'LIFO' | 'WEIGHTED_AVERAGE';
    depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION';
    roundingMethod: 'BANKER' | 'COMMERCIAL';
    decimalPlaces: number;
    autoNumbering: boolean;
    numberPrefixes: Record<string, string>;
    defaultAccounts: Record<string, string>;
    taxSettings: {
        enabled: boolean;
        rate: number;
        inclusive: boolean;
        registrationNumber: string;
    };
}

export interface ComplianceSettings {
    gdprEnabled: boolean;
    soxCompliant: boolean;
    industryStandards: string[];
    auditTrail: boolean;
    dataRetention: number; // days
    backupFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    encryptionLevel: 'STANDARD' | 'HIGH' | 'MAXIMUM';
    multiFactorAuth: boolean;
    sessionTimeout: number; // minutes
}

export interface IntegrationSettings {
    bankFeeds: {
        enabled: boolean;
        provider: string;
        lastSync: string;
        autoSync: boolean;
    };
    paymentProcessors: {
        enabled: boolean;
        providers: string[];
        defaultProvider: string;
    };
    accountingSoftware: {
        enabled: boolean;
        provider: string;
        syncFrequency: string;
    };
    crmIntegration: {
        enabled: boolean;
        provider: string;
        syncDirection: 'IMPORT' | 'EXPORT' | 'BIDIRECTIONAL';
    };
}

export interface NotificationSettings {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    notificationTypes: {
        invoices: boolean;
        payments: boolean;
        reports: boolean;
        system: boolean;
        security: boolean;
    };
    frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY';
    recipients: string[];
}

export interface SecuritySettings {
    passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSymbols: boolean;
        expirationDays: number;
    };
    sessionManagement: {
        maxConcurrentSessions: number;
        timeoutMinutes: number;
        requireReauth: boolean;
    };
    ipWhitelist: string[];
    apiAccess: {
        enabled: boolean;
        rateLimit: number;
        allowedOrigins: string[];
    };
}

export interface AdvancedSettings {
    features: {
        multiCompany: boolean;
        advancedReporting: boolean;
        customFields: boolean;
        workflowAutomation: boolean;
        apiAccess: boolean;
    };
    performance: {
        cacheEnabled: boolean;
        cacheTimeout: number;
        maxConcurrentUsers: number;
    };
    maintenance: {
        autoBackup: boolean;
        maintenanceWindow: string;
        updateNotifications: boolean;
    };
}

export interface CompanySettingsManagerProps {
    settings: CompanySettings;
    onSettingsUpdate: (updates: Partial<CompanySettings>) => Promise<void>;
    onSettingsReset: () => Promise<void>;
    onSettingsExport: () => Promise<void>;
    onSettingsImport: (file: File) => Promise<void>;
    loading?: boolean;
    className?: string;
}

export const CompanySettingsManager: React.FC<CompanySettingsManagerProps> = ({
    settings,
    onSettingsUpdate,
    onSettingsReset,
    onSettingsExport,
    onSettingsImport,
    loading = false,
    className
}) => {
    const [activeTab, setActiveTab] = React.useState<string>('general');
    const [hasChanges, setHasChanges] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [localSettings, setLocalSettings] = React.useState<CompanySettings>(settings);

    React.useEffect(() => {
        setLocalSettings(settings);
        setHasChanges(false);
    }, [settings]);

    const handleSettingChange = (path: string, value: any) => {
        setLocalSettings(prev => {
            const newSettings = { ...prev };
            const keys = path.split('.');
            let current: any = newSettings;

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (key && !current[key]) {
                    current[key] = {};
                }
                if (key) {
                    current = current[key];
                }
            }

            const lastKey = keys[keys.length - 1];
            if (lastKey) {
                current[lastKey] = value;
            }
            return newSettings;
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSettingsUpdate(localSettings);
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (confirm('Are you sure you want to reset all settings to their default values?')) {
            await onSettingsReset();
            setHasChanges(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Building2 },
        { id: 'financial', label: 'Financial', icon: DollarSign },
        { id: 'compliance', label: 'Compliance', icon: Shield },
        { id: 'integrations', label: 'Integrations', icon: Globe },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'advanced', label: 'Advanced', icon: Settings }
    ];

    if (loading) {
        return (
            <div className={cn("flex items-center justify-center p-8", className)}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--sys-accent)]"></div>
                <span className="ml-2 text-[var(--sys-text-secondary)]">Loading settings...</span>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-[var(--sys-text-primary)]">
                        Company Settings
                    </h2>
                    <p className="text-sm text-[var(--sys-text-secondary)] mt-1">
                        Configure your company's settings and preferences
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {hasChanges && (
                        <div className="flex items-center space-x-2 text-[var(--sys-status-warning)]">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">Unsaved changes</span>
                        </div>
                    )}
                    <button
                        onClick={handleReset}
                        className="flex items-center space-x-2 px-4 py-2 border border-[var(--sys-border-hairline)] text-[var(--sys-text-primary)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Reset</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className="flex items-center space-x-2 px-4 py-2 bg-[var(--sys-accent)] text-[var(--sys-text-on-accent)] rounded-lg hover:bg-[var(--sys-accent)]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--sys-text-on-accent)]"></div>
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[var(--sys-border-hairline)]">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2",
                                    activeTab === tab.id
                                        ? "border-[var(--sys-accent)] text-[var(--sys-accent)]"
                                        : "border-transparent text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)] hover:border-[var(--sys-border-subtle)]"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">Company Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                            Company Name
                                        </label>
                                        <input
                                            type="text"
                                            value={localSettings.general.companyName}
                                            onChange={(e) => handleSettingChange('general.companyName', e.target.value)}
                                            className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                            Legal Name
                                        </label>
                                        <input
                                            type="text"
                                            value={localSettings.general.legalName}
                                            onChange={(e) => handleSettingChange('general.legalName', e.target.value)}
                                            className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                            Industry
                                        </label>
                                        <select
                                            value={localSettings.general.industry}
                                            onChange={(e) => handleSettingChange('general.industry', e.target.value)}
                                            className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
                                        >
                                            <option value="technology">Technology</option>
                                            <option value="retail">Retail</option>
                                            <option value="manufacturing">Manufacturing</option>
                                            <option value="services">Services</option>
                                            <option value="healthcare">Healthcare</option>
                                            <option value="finance">Finance</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">Regional Settings</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                            Timezone
                                        </label>
                                        <select
                                            value={localSettings.general.timezone}
                                            onChange={(e) => handleSettingChange('general.timezone', e.target.value)}
                                            className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
                                        >
                                            <option value="UTC">UTC</option>
                                            <option value="America/New_York">Eastern Time</option>
                                            <option value="America/Chicago">Central Time</option>
                                            <option value="America/Denver">Mountain Time</option>
                                            <option value="America/Los_Angeles">Pacific Time</option>
                                            <option value="Europe/London">London</option>
                                            <option value="Europe/Paris">Paris</option>
                                            <option value="Asia/Tokyo">Tokyo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                            Currency
                                        </label>
                                        <select
                                            value={localSettings.general.currency}
                                            onChange={(e) => handleSettingChange('general.currency', e.target.value)}
                                            className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
                                        >
                                            <option value="USD">USD - US Dollar</option>
                                            <option value="EUR">EUR - Euro</option>
                                            <option value="GBP">GBP - British Pound</option>
                                            <option value="JPY">JPY - Japanese Yen</option>
                                            <option value="CAD">CAD - Canadian Dollar</option>
                                            <option value="AUD">AUD - Australian Dollar</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                            Date Format
                                        </label>
                                        <select
                                            value={localSettings.general.dateFormat}
                                            onChange={(e) => handleSettingChange('general.dateFormat', e.target.value)}
                                            className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
                                        >
                                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'financial' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">Accounting Method</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                            Accounting Method
                                        </label>
                                        <select
                                            value={localSettings.financial.accountingMethod}
                                            onChange={(e) => handleSettingChange('financial.accountingMethod', e.target.value)}
                                            className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
                                        >
                                            <option value="CASH">Cash Basis</option>
                                            <option value="ACCRUAL">Accrual Basis</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                            Inventory Method
                                        </label>
                                        <select
                                            value={localSettings.financial.inventoryMethod}
                                            onChange={(e) => handleSettingChange('financial.inventoryMethod', e.target.value)}
                                            className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
                                        >
                                            <option value="FIFO">FIFO (First In, First Out)</option>
                                            <option value="LIFO">LIFO (Last In, First Out)</option>
                                            <option value="WEIGHTED_AVERAGE">Weighted Average</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">Tax Settings</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="taxEnabled"
                                            checked={localSettings.financial.taxSettings.enabled}
                                            onChange={(e) => handleSettingChange('financial.taxSettings.enabled', e.target.checked)}
                                            className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                        />
                                        <label htmlFor="taxEnabled" className="text-sm font-medium text-[var(--sys-text-primary)]">
                                            Enable Tax Calculations
                                        </label>
                                    </div>
                                    {localSettings.financial.taxSettings.enabled && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                                    Tax Rate (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    value={localSettings.financial.taxSettings.rate}
                                                    onChange={(e) => handleSettingChange('financial.taxSettings.rate', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                                    Tax Registration Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={localSettings.financial.taxSettings.registrationNumber}
                                                    onChange={(e) => handleSettingChange('financial.taxSettings.registrationNumber', e.target.value)}
                                                    className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'compliance' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">Data Protection</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="gdprEnabled"
                                            checked={localSettings.compliance.gdprEnabled}
                                            onChange={(e) => handleSettingChange('compliance.gdprEnabled', e.target.checked)}
                                            className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                        />
                                        <label htmlFor="gdprEnabled" className="text-sm font-medium text-[var(--sys-text-primary)]">
                                            GDPR Compliance
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="soxCompliant"
                                            checked={localSettings.compliance.soxCompliant}
                                            onChange={(e) => handleSettingChange('compliance.soxCompliant', e.target.checked)}
                                            className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                        />
                                        <label htmlFor="soxCompliant" className="text-sm font-medium text-[var(--sys-text-primary)]">
                                            SOX Compliance
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="auditTrail"
                                            checked={localSettings.compliance.auditTrail}
                                            onChange={(e) => handleSettingChange('compliance.auditTrail', e.target.checked)}
                                            className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                        />
                                        <label htmlFor="auditTrail" className="text-sm font-medium text-[var(--sys-text-primary)]">
                                            Audit Trail
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">Security</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="multiFactorAuth"
                                            checked={localSettings.compliance.multiFactorAuth}
                                            onChange={(e) => handleSettingChange('compliance.multiFactorAuth', e.target.checked)}
                                            className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                        />
                                        <label htmlFor="multiFactorAuth" className="text-sm font-medium text-[var(--sys-text-primary)]">
                                            Multi-Factor Authentication
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                            Session Timeout (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            min="5"
                                            max="480"
                                            value={localSettings.compliance.sessionTimeout}
                                            onChange={(e) => handleSettingChange('compliance.sessionTimeout', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional tabs would be implemented similarly */}
            </div>
        </div>
    );
};
