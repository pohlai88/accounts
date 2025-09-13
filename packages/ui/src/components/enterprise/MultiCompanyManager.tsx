import * as React from "react";
import { cn } from "../../utils";
import {
    Building2, Plus, Settings, Users, Globe, TrendingUp, ChevronDown,
    Check, AlertCircle, Loader2, Search, Filter, MoreVertical, Edit, Trash2
} from "lucide-react";

// SSOT Compliant Multi-Company Management Component
// Enterprise-ready company switching, creation, and management

export interface Company {
    id: string;
    name: string;
    description?: string;
    industry: string;
    country: string;
    currency: string;
    fiscalYearStart: string;
    status: 'active' | 'inactive' | 'suspended';
    userCount: number;
    lastActivity: string;
    createdAt: string;
    settings: CompanySettings;
}

export interface CompanySettings {
    timezone: string;
    dateFormat: string;
    numberFormat: string;
    features: string[];
    integrations: string[];
    compliance: ComplianceSettings;
}

export interface ComplianceSettings {
    gdprEnabled: boolean;
    soxCompliant: boolean;
    industryStandards: string[];
    auditTrail: boolean;
}

export interface MultiCompanyManagerProps {
    companies: Company[];
    currentCompanyId: string;
    onCompanySwitch: (companyId: string) => Promise<void>;
    onCompanyCreate: (companyData: Omit<Company, 'id' | 'createdAt' | 'lastActivity' | 'userCount'>) => Promise<void>;
    onCompanyUpdate: (companyId: string, updates: Partial<Company>) => Promise<void>;
    onCompanyDelete: (companyId: string) => Promise<void>;
    onCompanySettings: (companyId: string) => void;
    loading?: boolean;
    className?: string;
}

export const MultiCompanyManager: React.FC<MultiCompanyManagerProps> = ({
    companies,
    currentCompanyId,
    onCompanySwitch,
    onCompanyCreate,
    onCompanyUpdate,
    onCompanyDelete,
    onCompanySettings,
    loading = false,
    className
}) => {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [filterStatus, setFilterStatus] = React.useState<string>("all");
    const [showCreateDialog, setShowCreateDialog] = React.useState(false);
    const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);
    const [switchingCompany, setSwitchingCompany] = React.useState<string | null>(null);

    const filteredCompanies = React.useMemo(() => {
        return companies.filter(company => {
            const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.industry.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === "all" || company.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [companies, searchTerm, filterStatus]);

    const handleCompanySwitch = async (companyId: string) => {
        if (companyId === currentCompanyId) return;

        setSwitchingCompany(companyId);
        try {
            await onCompanySwitch(companyId);
        } catch (error) {
            console.error("Failed to switch company:", error);
        } finally {
            setSwitchingCompany(null);
        }
    };

    const getStatusColor = (status: Company['status']) => {
        switch (status) {
            case 'active':
                return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
            case 'inactive':
                return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
            case 'suspended':
                return "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10";
            default:
                return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
        }
    };

    const getStatusIcon = (status: Company['status']) => {
        switch (status) {
            case 'active':
                return <Check className="h-3 w-3" />;
            case 'inactive':
                return <AlertCircle className="h-3 w-3" />;
            case 'suspended':
                return <AlertCircle className="h-3 w-3" />;
            default:
                return <AlertCircle className="h-3 w-3" />;
        }
    };

    if (loading) {
        return (
            <div className={cn("flex items-center justify-center p-8", className)}>
                <Loader2 className="h-6 w-6 animate-spin text-[var(--sys-accent)]" />
                <span className="ml-2 text-[var(--sys-text-secondary)]">Loading companies...</span>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-[var(--sys-text-primary)]">
                        Multi-Company Management
                    </h2>
                    <p className="text-sm text-[var(--sys-text-secondary)] mt-1">
                        Manage your companies and switch between different business entities
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateDialog(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-[var(--sys-accent)] text-[var(--sys-text-on-accent)] rounded-lg hover:bg-[var(--sys-accent)]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Company</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--sys-text-tertiary)]" />
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] placeholder:text-[var(--sys-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
                        aria-label="Search companies"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
                    aria-label="Filter by status"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                    <div
                        key={company.id}
                        className={cn(
                            "relative p-6 border rounded-lg transition-all duration-200",
                            company.id === currentCompanyId
                                ? "border-[var(--sys-accent)] bg-[var(--sys-accent)]/5 shadow-lg"
                                : "border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] hover:border-[var(--sys-border-subtle)] hover:shadow-md"
                        )}
                    >
                        {/* Current Company Badge */}
                        {company.id === currentCompanyId && (
                            <div className="absolute -top-2 -right-2">
                                <div className="bg-[var(--sys-accent)] text-[var(--sys-text-on-accent)] text-xs px-2 py-1 rounded-full font-medium">
                                    Current
                                </div>
                            </div>
                        )}

                        {/* Company Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-[var(--sys-fill-low)] rounded-lg">
                                    <Building2 className="h-5 w-5 text-[var(--sys-accent)]" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--sys-text-primary)]">
                                        {company.name}
                                    </h3>
                                    <p className="text-sm text-[var(--sys-text-secondary)]">
                                        {company.industry}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className={cn(
                                    "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                                    getStatusColor(company.status)
                                )}>
                                    {getStatusIcon(company.status)}
                                    <span className="capitalize">{company.status}</span>
                                </div>
                                <button
                                    onClick={() => setSelectedCompany(company)}
                                    className="p-1 hover:bg-[var(--sys-fill-low)] rounded transition-colors"
                                    aria-label="More options"
                                >
                                    <MoreVertical className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                                </button>
                            </div>
                        </div>

                        {/* Company Details */}
                        <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--sys-text-secondary)]">Country</span>
                                <span className="text-[var(--sys-text-primary)] flex items-center">
                                    <Globe className="h-3 w-3 mr-1" />
                                    {company.country}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--sys-text-secondary)]">Currency</span>
                                <span className="text-[var(--sys-text-primary)] font-medium">
                                    {company.currency}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--sys-text-secondary)]">Users</span>
                                <span className="text-[var(--sys-text-primary)] flex items-center">
                                    <Users className="h-3 w-3 mr-1" />
                                    {company.userCount}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--sys-text-secondary)]">Last Activity</span>
                                <span className="text-[var(--sys-text-primary)]">
                                    {new Date(company.lastActivity).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                            {company.id !== currentCompanyId ? (
                                <button
                                    onClick={() => handleCompanySwitch(company.id)}
                                    disabled={switchingCompany === company.id}
                                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-[var(--sys-accent)] text-[var(--sys-text-on-accent)] rounded-lg hover:bg-[var(--sys-accent)]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {switchingCompany === company.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <TrendingUp className="h-4 w-4" />
                                    )}
                                    <span>Switch To</span>
                                </button>
                            ) : (
                                <div className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-[var(--sys-fill-low)] text-[var(--sys-text-secondary)] rounded-lg">
                                    <Check className="h-4 w-4" />
                                    <span>Current Company</span>
                                </div>
                            )}
                            <button
                                onClick={() => onCompanySettings(company.id)}
                                className="p-2 hover:bg-[var(--sys-fill-low)] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2"
                                aria-label="Company settings"
                            >
                                <Settings className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredCompanies.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-[var(--sys-text-tertiary)] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-2">
                        No companies found
                    </h3>
                    <p className="text-[var(--sys-text-secondary)] mb-6">
                        {searchTerm || filterStatus !== "all"
                            ? "Try adjusting your search or filter criteria"
                            : "Get started by creating your first company"}
                    </p>
                    {(!searchTerm && filterStatus === "all") && (
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-[var(--sys-accent)] text-[var(--sys-text-on-accent)] rounded-lg hover:bg-[var(--sys-accent)]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create Company</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
