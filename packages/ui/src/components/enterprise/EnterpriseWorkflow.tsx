import * as React from "react";
import { cn } from "@aibos/ui/utils";
import {
  Building2,
  Users,
  FileText,
  Settings,
  Shield,
  Globe,
  Bell,
  Lock,
  ChevronRight,
  Home,
  Search,
  Filter,
} from "lucide-react";

// SSOT Compliant Enterprise Workflow Component
// Master orchestrator for all enterprise features and settings

export interface EnterpriseWorkflowProps {
  onNavigate?: (section: string) => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: any) => void;
  className?: string;
}

export const EnterpriseWorkflow: React.FC<EnterpriseWorkflowProps> = ({
  onNavigate,
  onSearch,
  onFilter,
  className,
}) => {
  const [activeSection, setActiveSection] = React.useState<string>("overview");
  const [searchQuery, setSearchQuery] = React.useState("");

  const sections = [
    {
      id: "overview",
      name: "Overview",
      description: "Enterprise dashboard and key metrics",
      icon: Home,
      color: "text-[var(--sys-accent)] bg-[var(--sys-accent)]/10",
    },
    {
      id: "multi-company",
      name: "Multi-Company",
      description: "Manage multiple companies and switching",
      icon: Building2,
      color: "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10",
    },
    {
      id: "user-roles",
      name: "User Roles",
      description: "Manage users, roles, and permissions",
      icon: Users,
      color: "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10",
    },
    {
      id: "chart-accounts",
      name: "Chart of Accounts",
      description: "Manage accounting structure and hierarchy",
      icon: FileText,
      color: "text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10",
    },
    {
      id: "company-settings",
      name: "Company Settings",
      description: "Configure company settings and preferences",
      icon: Settings,
      color: "text-[var(--sys-text-primary)] bg-[var(--sys-fill-low)]",
    },
    {
      id: "tax-settings",
      name: "Tax Settings",
      description: "Configure tax rates and compliance",
      icon: Shield,
      color: "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10",
    },
    {
      id: "integrations",
      name: "Integrations",
      description: "Manage third-party integrations",
      icon: Globe,
      color: "text-[var(--sys-accent)] bg-[var(--sys-accent)]/10",
    },
    {
      id: "notifications",
      name: "Notifications",
      description: "Configure notification preferences",
      icon: Bell,
      color: "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10",
    },
    {
      id: "security",
      name: "Security",
      description: "Security settings and access control",
      icon: Lock,
      color: "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10",
    },
  ];

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    onNavigate?.(sectionId);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <div className={cn("flex h-full", className)}>
      {/* Sidebar */}
      <div className="w-80 border-r border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--sys-border-hairline)]">
          <h1 className="text-xl font-semibold text-[var(--sys-text-primary)] mb-2">
            Enterprise Management
          </h1>
          <p className="text-sm text-[var(--sys-text-secondary)]">
            Manage your enterprise features and settings
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--sys-border-hairline)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--sys-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search enterprise features..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] placeholder:text-[var(--sys-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
              aria-label="Search enterprise features"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className={cn(
                  "w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left",
                  isActive
                    ? "bg-[var(--sys-accent)]/10 border border-[var(--sys-accent)]/20"
                    : "hover:bg-[var(--sys-fill-low)]",
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    isActive
                      ? section.color
                      : "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--sys-text-primary)]">{section.name}</div>
                  <div className="text-sm text-[var(--sys-text-secondary)] truncate">
                    {section.description}
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isActive
                      ? "text-[var(--sys-accent)] rotate-90"
                      : "text-[var(--sys-text-tertiary)]",
                  )}
                />
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--sys-border-hairline)]">
          <div className="text-xs text-[var(--sys-text-tertiary)] text-center">
            Enterprise Management v1.0
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Header */}
        <div className="p-6 border-b border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--sys-text-primary)]">
                {sections.find(s => s.id === activeSection)?.name}
              </h2>
              <p className="text-[var(--sys-text-secondary)] mt-1">
                {sections.find(s => s.id === activeSection)?.description}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onFilter?.({})}
                className="flex items-center space-x-2 px-3 py-2 border border-[var(--sys-border-hairline)] text-[var(--sys-text-primary)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 bg-[var(--sys-bg-secondary)] overflow-auto">
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.slice(1).map(section => {
                  const Icon = section.icon;
                  return (
                    <div
                      key={section.id}
                      className="p-6 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] hover:border-[var(--sys-border-subtle)] transition-colors cursor-pointer"
                      onClick={() => handleSectionClick(section.id)}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={cn("p-2 rounded-lg", section.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-[var(--sys-text-primary)]">
                          {section.name}
                        </h3>
                      </div>
                      <p className="text-sm text-[var(--sys-text-secondary)] mb-4">
                        {section.description}
                      </p>
                      <div className="flex items-center text-sm text-[var(--sys-accent)]">
                        <span>Configure</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection !== "overview" && (
            <div className="text-center py-12">
              <div
                className={cn(
                  "w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center",
                  sections.find(s => s.id === activeSection)?.color || "bg-[var(--sys-fill-low)]",
                )}
              >
                {React.createElement(
                  sections.find(s => s.id === activeSection)?.icon || Building2,
                  {
                    className: "h-8 w-8",
                  },
                )}
              </div>
              <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-2">
                {sections.find(s => s.id === activeSection)?.name} Management
              </h3>
              <p className="text-[var(--sys-text-secondary)] mb-6">
                This section will contain the specific management interface for{" "}
                {sections.find(s => s.id === activeSection)?.name.toLowerCase()}.
              </p>
              <div className="text-sm text-[var(--sys-text-tertiary)]">
                Component integration coming soon...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
