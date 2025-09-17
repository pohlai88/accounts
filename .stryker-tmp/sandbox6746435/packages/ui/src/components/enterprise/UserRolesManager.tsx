// @ts-nocheck
import * as React from "react";
import { cn } from "@aibos/ui/utils";
import {
  Users,
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Check,
  X,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";

// SSOT Compliant User Roles & Permissions Management Component
// Advanced RBAC with granular permissions and SoD compliance

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status: "active" | "inactive" | "pending" | "suspended";
  lastLogin: string;
  createdAt: string;
  roles: string[];
  permissions: UserPermissions;
  companyId: string;
}

export interface UserPermissions {
  allow: string[];
  deny: string[];
  features: string[];
  modules: string[];
  amountThreshold?: number;
  requiresApproval: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  category: string;
  isDangerous: boolean;
  requiresApproval: boolean;
  amountThreshold?: number;
}

export interface UserRolesManagerProps {
  users: User[];
  roles: Role[];
  permissions: Permission[];
  onUserUpdate: (userId: string, updates: Partial<User>) => Promise<void>;
  onRoleCreate: (
    roleData: Omit<Role, "id" | "createdAt" | "updatedAt" | "userCount">,
  ) => Promise<void>;
  onRoleUpdate: (roleId: string, updates: Partial<Role>) => Promise<void>;
  onRoleDelete: (roleId: string) => Promise<void>;
  onPermissionUpdate: (userId: string, permissions: UserPermissions) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export const UserRolesManager: React.FC<UserRolesManagerProps> = ({
  users,
  roles,
  permissions,
  onUserUpdate,
  onRoleCreate,
  onRoleUpdate,
  onRoleDelete,
  onPermissionUpdate,
  loading = false,
  className,
}) => {
  const [activeTab, setActiveTab] = React.useState<"users" | "roles" | "permissions">("users");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [showRoleDialog, setShowRoleDialog] = React.useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = React.useState(false);

  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || user.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, filterStatus]);

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "active":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "inactive":
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
      case "pending":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      case "suspended":
        return "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const getStatusIcon = (status: User["status"]) => {
    switch (status) {
      case "active":
        return <Check className="h-3 w-3" />;
      case "inactive":
        return <X className="h-3 w-3" />;
      case "pending":
        return <AlertTriangle className="h-3 w-3" />;
      case "suspended":
        return <Lock className="h-3 w-3" />;
      default:
        return <X className="h-3 w-3" />;
    }
  };

  const getPermissionCategory = (permission: Permission) => {
    const categories = {
      financial: "Financial",
      administrative: "Administrative",
      reporting: "Reporting",
      settings: "Settings",
      users: "User Management",
      integrations: "Integrations",
    };
    return categories[permission.category as keyof typeof categories] || permission.category;
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--sys-accent)]"></div>
        <span className="ml-2 text-[var(--sys-text-secondary)]">Loading user roles...</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--sys-text-primary)]">
            User Roles & Permissions
          </h2>
          <p className="text-sm text-[var(--sys-text-secondary)] mt-1">
            Manage user access, roles, and permissions across your organization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRoleDialog(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[var(--sys-accent)] text-[var(--sys-text-on-accent)] rounded-lg hover:bg-[var(--sys-accent)]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Role</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--sys-border-hairline)]">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "users", label: "Users", count: users.length },
            { id: "roles", label: "Roles", count: roles.length },
            { id: "permissions", label: "Permissions", count: permissions.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-[var(--sys-accent)] text-[var(--sys-accent)]"
                  : "border-transparent text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)] hover:border-[var(--sys-border-subtle)]",
              )}
            >
              {tab.label}
              <span className="ml-2 bg-[var(--sys-fill-low)] text-[var(--sys-text-tertiary)] py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--sys-text-tertiary)]" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] placeholder:text-[var(--sys-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
            aria-label={`Search ${activeTab}`}
          />
        </div>
        {activeTab === "users" && (
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        )}
      </div>

      {/* Content */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className="p-4 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] hover:border-[var(--sys-border-subtle)] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[var(--sys-fill-low)] rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="h-5 w-5 text-[var(--sys-text-tertiary)]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--sys-text-primary)]">{user.name}</h3>
                    <p className="text-sm text-[var(--sys-text-secondary)]">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div
                        className={cn(
                          "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                          getStatusColor(user.status),
                        )}
                      >
                        {getStatusIcon(user.status)}
                        <span className="capitalize">{user.status}</span>
                      </div>
                      <span className="text-xs text-[var(--sys-text-tertiary)]">
                        Last login: {new Date(user.lastLogin).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-sm font-medium text-[var(--sys-text-primary)]">
                      {user.roles.length} role{user.roles.length !== 1 ? "s" : ""}
                    </div>
                    <div className="text-xs text-[var(--sys-text-secondary)]">
                      {user.permissions.allow.length} permissions
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="p-2 hover:bg-[var(--sys-fill-low)] rounded-lg transition-colors"
                    aria-label="Manage user"
                  >
                    <Settings className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <div
              key={role.id}
              className="p-4 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] hover:border-[var(--sys-border-subtle)] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-[var(--sys-accent)]" />
                  <div>
                    <h3 className="font-medium text-[var(--sys-text-primary)]">{role.name}</h3>
                    <p className="text-sm text-[var(--sys-text-secondary)]">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {role.isSystem && (
                    <div className="px-2 py-1 bg-[var(--sys-fill-low)] text-[var(--sys-text-tertiary)] text-xs rounded">
                      System
                    </div>
                  )}
                  <button
                    onClick={() => {
                      /* Handle role edit */
                    }}
                    className="p-1 hover:bg-[var(--sys-fill-low)] rounded transition-colors"
                    aria-label="Edit role"
                  >
                    <Edit className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--sys-text-secondary)]">Users</span>
                  <span className="text-[var(--sys-text-primary)] font-medium">
                    {role.userCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--sys-text-secondary)]">Permissions</span>
                  <span className="text-[var(--sys-text-primary)] font-medium">
                    {role.permissions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--sys-text-secondary)]">Status</span>
                  <div
                    className={cn(
                      "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                      role.isActive
                        ? "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10"
                        : "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]",
                    )}
                  >
                    {role.isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>{role.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "permissions" && (
        <div className="space-y-4">
          {Object.entries(
            permissions.reduce(
              (acc, permission) => {
                const category = permission.category;
                if (!acc[category]) {
                  acc[category] = [];
                }
                acc[category].push(permission);
                return acc;
              },
              {} as Record<string, Permission[]>,
            ),
          ).map(([category, categoryPermissions]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">
                {getPermissionCategory(categoryPermissions[0]!)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryPermissions.map(permission => (
                  <div
                    key={permission.id}
                    className="p-3 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] hover:border-[var(--sys-border-subtle)] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-[var(--sys-text-primary)]">
                          {permission.name}
                        </h4>
                        <p className="text-sm text-[var(--sys-text-secondary)] mt-1">
                          {permission.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-[var(--sys-text-tertiary)]">
                            {permission.module}
                          </span>
                          {permission.isDangerous && (
                            <div className="flex items-center space-x-1 text-xs text-[var(--sys-status-error)]">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Dangerous</span>
                            </div>
                          )}
                          {permission.requiresApproval && (
                            <div className="flex items-center space-x-1 text-xs text-[var(--sys-status-warning)]">
                              <Lock className="h-3 w-3" />
                              <span>Requires Approval</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {((activeTab === "users" && filteredUsers.length === 0) ||
        (activeTab === "roles" && roles.length === 0) ||
        (activeTab === "permissions" && permissions.length === 0)) && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-[var(--sys-text-tertiary)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-2">
            No {activeTab} found
          </h3>
          <p className="text-[var(--sys-text-secondary)] mb-6">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria"
              : `Get started by creating your first ${activeTab === "users" ? "user" : activeTab.slice(0, -1)}`}
          </p>
        </div>
      )}
    </div>
  );
};
