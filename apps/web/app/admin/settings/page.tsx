// SSOT Compliant Admin Settings Page
// Uses semantic tokens throughout, proper accessibility

import { z } from 'zod';

// Zod schemas for validation
const FeatureFlagsSchema = z.object({
    attachments: z.boolean().default(true),
    reports: z.boolean().default(true),
    ar: z.boolean().default(true),
    ap: z.boolean().default(false),
    je: z.boolean().default(false),
    regulated_mode: z.boolean().default(false),
});

const PolicySettingsSchema = z.object({
    approval_threshold_rm: z.coerce.number().min(0).default(50000),
    export_requires_reason: z.boolean().default(false),
    mfa_required_for_admin: z.boolean().default(true),
    session_timeout_minutes: z.coerce.number().min(30).max(1440).default(480),
});

// Server action for saving settings (simplified for demo)
async function saveAdminSettings(formData: globalThis.FormData) {
    'use server';

    try {
        // Parse and validate form data
        const featureFlags = FeatureFlagsSchema.parse({
            attachments: formData.get('attachments') === 'on',
            reports: formData.get('reports') === 'on',
            ar: formData.get('ar') === 'on',
            ap: formData.get('ap') === 'on',
            je: formData.get('je') === 'on',
            regulated_mode: formData.get('regulated_mode') === 'on',
        });

        const policySettings = PolicySettingsSchema.parse({
            approval_threshold_rm: formData.get('approval_threshold_rm'),
            export_requires_reason: formData.get('export_requires_reason') === 'on',
            mfa_required_for_admin: formData.get('mfa_required_for_admin') === 'on',
            session_timeout_minutes: formData.get('session_timeout_minutes'),
        });

        // TODO: In production, implement database updates here
        console.log('Settings saved:', { featureFlags, policySettings });

    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// Mock user data for demo
const mockUser = {
    id: 'admin-001',
    name: 'System Administrator',
    email: 'admin@example.com',
    role: 'admin',
    featureFlags: {
        attachments: true,
        reports: true,
        ar: true,
        ap: false,
        je: false,
        regulated_mode: false,
    },
    policySettings: {
        approval_threshold_rm: 50000,
        export_requires_reason: false,
        mfa_required_for_admin: true,
        session_timeout_minutes: 480,
    }
};

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="border-b border-[var(--sys-border-hairline)] pb-4">
                <h1 className="text-2xl font-bold text-[var(--sys-text-primary)]">
                    System Configuration
                </h1>
                <p className="mt-1 text-sm text-[var(--sys-text-secondary)]">
                    Configure system-wide settings and feature flags
                </p>
            </div>

            <form action={saveAdminSettings} className="space-y-8">
                {/* Feature Flags Section */}
                <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-[var(--sys-text-primary)] mb-4">
                        Feature Flags
                    </h2>
                    <p className="text-sm text-[var(--sys-text-secondary)] mb-6">
                        Enable or disable system features for all users
                    </p>

                    <div className="space-y-4">
                        {/* Attachments */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="attachments" className="text-sm font-medium text-[var(--sys-text-primary)]">
                                    File Attachments
                                </label>
                                <p className="text-xs text-[var(--sys-text-secondary)]">
                                    Allow users to attach files to transactions
                                </p>
                            </div>
                            <input
                                id="attachments"
                                name="attachments"
                                type="checkbox"
                                defaultChecked={mockUser.featureFlags.attachments}
                                className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                aria-describedby="attachments-description"
                                aria-label="Enable attachments feature"
                            />
                        </div>

                        {/* Reports */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="reports" className="text-sm font-medium text-[var(--sys-text-primary)]">
                                    Financial Reports
                                </label>
                                <p className="text-xs text-[var(--sys-text-secondary)]">
                                    Enable financial reporting capabilities
                                </p>
                            </div>
                            <input
                                id="reports"
                                name="reports"
                                type="checkbox"
                                defaultChecked={mockUser.featureFlags.reports}
                                className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                aria-describedby="reports-description"
                                aria-label="Enable reports feature"
                            />
                        </div>

                        {/* Accounts Receivable */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="ar" className="text-sm font-medium text-[var(--sys-text-primary)]">
                                    Accounts Receivable
                                </label>
                                <p className="text-xs text-[var(--sys-text-secondary)]">
                                    Enable invoice and customer management
                                </p>
                            </div>
                            <input
                                id="ar"
                                name="ar"
                                type="checkbox"
                                defaultChecked={mockUser.featureFlags.ar}
                                className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                aria-describedby="ar-description"
                                aria-label="Enable accounts receivable feature"
                            />
                        </div>

                        {/* Accounts Payable */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="ap" className="text-sm font-medium text-[var(--sys-text-primary)]">
                                    Accounts Payable
                                </label>
                                <p className="text-xs text-[var(--sys-text-secondary)]">
                                    Enable bill and vendor management
                                </p>
                            </div>
                            <input
                                id="ap"
                                name="ap"
                                type="checkbox"
                                defaultChecked={mockUser.featureFlags.ap}
                                className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                aria-describedby="ap-description"
                                aria-label="Enable accounts payable feature"
                            />
                        </div>

                        {/* Journal Entries */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="je" className="text-sm font-medium text-[var(--sys-text-primary)]">
                                    Journal Entries
                                </label>
                                <p className="text-xs text-[var(--sys-text-secondary)]">
                                    Enable manual journal entry creation
                                </p>
                            </div>
                            <input
                                id="je"
                                name="je"
                                type="checkbox"
                                defaultChecked={mockUser.featureFlags.je}
                                className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                aria-describedby="je-description"
                                aria-label="Enable journal entries feature"
                            />
                        </div>

                        {/* Regulated Mode */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="regulated_mode" className="text-sm font-medium text-[var(--sys-text-primary)]">
                                    Regulated Mode
                                </label>
                                <p className="text-xs text-[var(--sys-text-secondary)]">
                                    Enable enhanced compliance and audit features
                                </p>
                            </div>
                            <input
                                id="regulated_mode"
                                name="regulated_mode"
                                type="checkbox"
                                defaultChecked={mockUser.featureFlags.regulated_mode}
                                className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                aria-describedby="regulated_mode-description"
                                aria-label="Enable regulated mode feature"
                            />
                        </div>
                    </div>
                </div>

                {/* Policy Settings Section */}
                <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-[var(--sys-text-primary)] mb-4">
                        Policy Settings
                    </h2>
                    <p className="text-sm text-[var(--sys-text-secondary)] mb-6">
                        Configure system policies and thresholds
                    </p>

                    <div className="space-y-6">
                        {/* Approval Threshold */}
                        <div>
                            <label htmlFor="approval_threshold_rm" className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                Regulated Mode Approval Threshold
                            </label>
                            <p className="text-xs text-[var(--sys-text-secondary)] mb-3">
                                Minimum amount requiring approval in regulated mode
                            </p>
                            <input
                                type="number"
                                name="approval_threshold_rm"
                                id="approval_threshold_rm"
                                defaultValue={mockUser.policySettings.approval_threshold_rm}
                                min="0"
                                step="1000"
                                className="block w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-[var(--sys-accent)]"
                                aria-describedby="approval_threshold_rm-description"
                                aria-label="Approval threshold for regulated mode"
                            />
                            <p id="approval_threshold_rm-description" className="mt-1 text-xs text-[var(--sys-text-secondary)]">
                                Enter amount in cents (e.g., 50000 = $500.00)
                            </p>
                        </div>

                        {/* Session Timeout */}
                        <div>
                            <label htmlFor="session_timeout_minutes" className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                Session Timeout
                            </label>
                            <p className="text-xs text-[var(--sys-text-secondary)] mb-3">
                                Maximum session duration in minutes
                            </p>
                            <input
                                type="number"
                                name="session_timeout_minutes"
                                id="session_timeout_minutes"
                                defaultValue={mockUser.policySettings.session_timeout_minutes}
                                min="30"
                                max="1440"
                                className="block w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-[var(--sys-accent)]"
                                aria-describedby="session_timeout_minutes-description"
                                aria-label="Session timeout in minutes"
                            />
                            <p id="session_timeout_minutes-description" className="mt-1 text-xs text-[var(--sys-text-secondary)]">
                                Minimum: 30 minutes, Maximum: 1440 minutes (24 hours)
                            </p>
                        </div>

                        {/* Export Requires Reason */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="export_requires_reason" className="text-sm font-medium text-[var(--sys-text-primary)]">
                                    Export Requires Reason
                                </label>
                                <p className="text-xs text-[var(--sys-text-secondary)]">
                                    Require reason for data exports
                                </p>
                            </div>
                            <input
                                id="export_requires_reason"
                                name="export_requires_reason"
                                type="checkbox"
                                defaultChecked={mockUser.policySettings.export_requires_reason}
                                className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                aria-describedby="export_requires_reason-description"
                                aria-label="Require reason for exports"
                            />
                        </div>

                        {/* MFA Required for Admin */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="mfa_required_for_admin" className="text-sm font-medium text-[var(--sys-text-primary)]">
                                    MFA Required for Admin
                                </label>
                                <p className="text-xs text-[var(--sys-text-secondary)]">
                                    Require multi-factor authentication for admin users
                                </p>
                            </div>
                            <input
                                id="mfa_required_for_admin"
                                name="mfa_required_for_admin"
                                type="checkbox"
                                defaultChecked={mockUser.policySettings.mfa_required_for_admin}
                                className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                aria-describedby="mfa_required_for_admin-description"
                                aria-label="Require MFA for admin users"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-[var(--sys-accent)] text-white rounded-md hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2"
                        aria-label="Save all configuration changes"
                    >
                        Save Configuration
                    </button>
                </div>
            </form>

            {/* Help Section */}
            <div className="bg-[var(--sys-bg-subtle)] border border-[var(--sys-border-hairline)] rounded-lg p-6">
                <h3 className="text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                    Need Help?
                </h3>
                <p className="text-xs text-[var(--sys-text-secondary)] mb-3">
                    For assistance with system configuration, contact your system administrator or refer to the documentation.
                </p>
                <div className="flex gap-4">
                    <button className="text-xs text-[var(--sys-accent)] hover:text-[var(--sys-accent)]/80 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] rounded">
                        View Documentation
                    </button>
                    <button className="text-xs text-[var(--sys-accent)] hover:text-[var(--sys-accent)]/80 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] rounded">
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
}