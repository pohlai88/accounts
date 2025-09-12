// Admin Settings Page - Feature Flags and Policy Configuration
// Uses existing patterns with enhanced admin configuration

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
async function saveAdminSettings(formData: FormData) {
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

export default function AdminSettingsPage() {
    // For demo purposes, use default settings
    // In a real app, you'd fetch these from the database
    const mockUser = {
        featureFlags: {
            attachments: true,
            reports: true,
            ar: true,
            ap: false,
            je: false,
            regulated_mode: false
        },
        policySettings: {
            approval_threshold_rm: 50000,
            export_requires_reason: false,
            mfa_required_for_admin: true,
            session_timeout_minutes: 480
        }
    };

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                    <div className="px-4 sm:px-0">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                            System Configuration
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Configure feature flags, approval thresholds, and security policies for your organization.
                        </p>
                    </div>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                    <form action={saveAdminSettings}>
                        <div className="shadow sm:rounded-md sm:overflow-hidden">
                            <div className="px-4 py-5 bg-white space-y-6 sm:p-6">

                                {/* Feature Flags Section */}
                                <div>
                                    <h4 className="text-base font-medium text-gray-900 mb-4">
                                        Feature Flags
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="attachments"
                                                    name="attachments"
                                                    type="checkbox"
                                                    defaultChecked={mockUser.featureFlags.attachments}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="attachments" className="font-medium text-gray-700">
                                                    Attachments
                                                </label>
                                                <p className="text-gray-500">Enable file upload and document management</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="reports"
                                                    name="reports"
                                                    type="checkbox"
                                                    defaultChecked={mockUser.featureFlags.reports}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="reports" className="font-medium text-gray-700">
                                                    Financial Reports
                                                </label>
                                                <p className="text-gray-500">Enable financial reporting and exports</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="ar"
                                                    name="ar"
                                                    type="checkbox"
                                                    defaultChecked={mockUser.featureFlags.ar}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="ar" className="font-medium text-gray-700">
                                                    Accounts Receivable
                                                </label>
                                                <p className="text-gray-500">Enable invoice creation and management</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="ap"
                                                    name="ap"
                                                    type="checkbox"
                                                    defaultChecked={mockUser.featureFlags.ap}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="ap" className="font-medium text-gray-700">
                                                    Accounts Payable
                                                </label>
                                                <p className="text-gray-500">Enable bill and payment processing</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="je"
                                                    name="je"
                                                    type="checkbox"
                                                    defaultChecked={mockUser.featureFlags.je}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="je" className="font-medium text-gray-700">
                                                    Journal Entries
                                                </label>
                                                <p className="text-gray-500">Enable manual journal entry creation</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="regulated_mode"
                                                    name="regulated_mode"
                                                    type="checkbox"
                                                    defaultChecked={mockUser.featureFlags.regulated_mode}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="regulated_mode" className="font-medium text-gray-700">
                                                    Regulated Mode
                                                </label>
                                                <p className="text-gray-500">Enable enhanced compliance and audit features</p>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Policy Settings Section */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h4 className="text-base font-medium text-gray-900 mb-4">
                                        Policy Settings
                                    </h4>
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                                        <div>
                                            <label htmlFor="approval_threshold_rm" className="block text-sm font-medium text-gray-700">
                                                Approval Threshold (RM)
                                            </label>
                                            <input
                                                type="number"
                                                name="approval_threshold_rm"
                                                id="approval_threshold_rm"
                                                defaultValue={mockUser.policySettings.approval_threshold_rm}
                                                min="0"
                                                step="1000"
                                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                            />
                                            <p className="mt-2 text-sm text-gray-500">
                                                Transactions above this amount require additional approval
                                            </p>
                                        </div>

                                        <div>
                                            <label htmlFor="session_timeout_minutes" className="block text-sm font-medium text-gray-700">
                                                Session Timeout (minutes)
                                            </label>
                                            <input
                                                type="number"
                                                name="session_timeout_minutes"
                                                id="session_timeout_minutes"
                                                defaultValue={mockUser.policySettings.session_timeout_minutes}
                                                min="30"
                                                max="1440"
                                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                            />
                                            <p className="mt-2 text-sm text-gray-500">
                                                Automatic logout after inactivity
                                            </p>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="export_requires_reason"
                                                    name="export_requires_reason"
                                                    type="checkbox"
                                                    defaultChecked={mockUser.policySettings.export_requires_reason}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="export_requires_reason" className="font-medium text-gray-700">
                                                    Export Requires Reason
                                                </label>
                                                <p className="text-gray-500">Require justification for data exports</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="mfa_required_for_admin"
                                                    name="mfa_required_for_admin"
                                                    type="checkbox"
                                                    defaultChecked={mockUser.policySettings.mfa_required_for_admin}
                                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="mfa_required_for_admin" className="font-medium text-gray-700">
                                                    MFA Required for Admins
                                                </label>
                                                <p className="text-gray-500">Require multi-factor authentication for admin users</p>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                            </div>

                            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                                <button
                                    type="submit"
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Governance Pack Presets */}
            <div className="mt-10 md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                    <div className="px-4 sm:px-0">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                            Governance Packs
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Quick presets for different organizational needs.
                        </p>
                    </div>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                    <div className="bg-white shadow sm:rounded-md">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-900">Starter Pack</h4>
                                    <p className="mt-1 text-xs text-gray-500">Basic features for small teams</p>
                                    <ul className="mt-2 text-xs text-gray-600">
                                        <li>• AR + Reports enabled</li>
                                        <li>• RM 50,000 threshold</li>
                                        <li>• Basic security</li>
                                    </ul>
                                    <button className="mt-3 text-xs text-blue-600 hover:text-blue-500">
                                        Apply Preset
                                    </button>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-900">Business Pack</h4>
                                    <p className="mt-1 text-xs text-gray-500">Full features for growing companies</p>
                                    <ul className="mt-2 text-xs text-gray-600">
                                        <li>• All modules enabled</li>
                                        <li>• RM 30,000 threshold</li>
                                        <li>• Export controls</li>
                                    </ul>
                                    <button className="mt-3 text-xs text-blue-600 hover:text-blue-500">
                                        Apply Preset
                                    </button>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-900">Enterprise Pack</h4>
                                    <p className="mt-1 text-xs text-gray-500">Maximum security and compliance</p>
                                    <ul className="mt-2 text-xs text-gray-600">
                                        <li>• Regulated mode enabled</li>
                                        <li>• RM 10,000 threshold</li>
                                        <li>• Full audit controls</li>
                                    </ul>
                                    <button className="mt-3 text-xs text-blue-600 hover:text-blue-500">
                                        Apply Preset
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
