"use client";

import React, { useState, useEffect } from "react";
import {
    UserPlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
    ShieldCheckIcon,
    EyeIcon,
    CogIcon,
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

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: Record<string, unknown>;
    company: {
        id: string;
        name: string;
        code: string;
    } | null;
    joinedAt: string;
    isCurrentUser: boolean;
    lastActiveAt?: string;
    status: "active" | "inactive" | "pending";
}

export interface UserManagementProps {
    tenantId: string;
    onUserInvite?: (email: string, role: string, firstName?: string, lastName?: string) => Promise<void>;
    onUserUpdate?: (userId: string, updates: Partial<User>) => Promise<void>;
    onUserRemove?: (userId: string) => Promise<void>;
    className?: string;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const ROLES = [
    { value: "admin", label: "Administrator", description: "Full access to all features and settings", color: "red" },
    { value: "manager", label: "Manager", description: "Manage users, view reports, and oversee operations", color: "blue" },
    { value: "accountant", label: "Accountant", description: "Create and manage financial records", color: "green" },
    { value: "clerk", label: "Clerk", description: "Basic data entry and record management", color: "yellow" },
    { value: "viewer", label: "Viewer", description: "Read-only access to reports and data", color: "gray" },
];

const STATUS_COLORS = {
    active: "green",
    inactive: "gray",
    pending: "yellow",
} as const;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface UserCardProps {
    user: User;
    currentUserRole: string;
    onEdit: (user: User) => void;
    onRemove: (user: User) => void;
}

function UserCard({ user, currentUserRole, onEdit, onRemove }: UserCardProps) {
    const [showActions, setShowActions] = useState(false);
    const roleInfo = ROLES.find(r => r.value === user.role);
    const statusColor = STATUS_COLORS[user.status];

    const canEdit = currentUserRole === "admin" || (currentUserRole === "manager" && user.role !== "admin");
    const canRemove = currentUserRole === "admin" && !user.isCurrentUser && user.role !== "admin";

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                    {user.firstName} {user.lastName}
                                </h3>
                                {user.isCurrentUser && (
                                    <Badge variant="secondary" className="text-xs">You</Badge>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                                <Badge
                                    variant={statusColor === "green" ? "default" : statusColor === "yellow" ? "secondary" : "outline"}
                                    className="text-xs"
                                >
                                    {user.status}
                                </Badge>
                                {roleInfo && (
                                    <Badge variant="outline" className="text-xs">
                                        {roleInfo.label}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Joined {new Date(user.joinedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowActions(!showActions)}
                            className="p-1"
                        >
                            <EllipsisVerticalIcon className="w-4 h-4" />
                        </Button>

                        {showActions && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                                <div className="absolute right-0 z-20 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200">
                                    <div className="py-1">
                                        {canEdit && (
                                            <button
                                                onClick={() => {
                                                    onEdit(user);
                                                    setShowActions(false);
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <PencilIcon className="w-4 h-4 mr-2" />
                                                Edit User
                                            </button>
                                        )}
                                        {canRemove && (
                                            <button
                                                onClick={() => {
                                                    onRemove(user);
                                                    setShowActions(false);
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <TrashIcon className="w-4 h-4 mr-2" />
                                                Remove User
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (email: string, role: string, firstName?: string, lastName?: string) => Promise<void>;
}

function InviteUserModal({ isOpen, onClose, onInvite }: InviteUserModalProps) {
    const [formData, setFormData] = useState({
        email: "",
        role: "viewer",
        firstName: "",
        lastName: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await onInvite(formData.email, formData.role, formData.firstName, formData.lastName);
            setFormData({ email: "", role: "viewer", firstName: "", lastName: "" });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to invite user");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>

                    {error && (
                        <Alert className="mb-4 bg-red-50 border-red-200">
                            <div className="text-sm text-red-800">{error}</div>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="colleague@company.com"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, firstName: e.target.value })}
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="role">Role</Label>
                            <select
                                id="role"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] px-3 py-2 text-sm text-[var(--sys-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sys-accent)]"
                            >
                                {ROLES.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-sm text-gray-500">
                                {ROLES.find(r => r.value === formData.role)?.description}
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button type="button" variant="secondary" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Inviting..." : "Send Invitation"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

interface EditUserModalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (userId: string, updates: Partial<User>) => Promise<void>;
}

function EditUserModal({ user, isOpen, onClose, onUpdate }: EditUserModalProps) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        role: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await onUpdate(user.id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: formData.role,
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update user");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>

                    {error && (
                        <Alert className="mb-4 bg-red-50 border-red-200">
                            <div className="text-sm text-red-800">{error}</div>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                value={user.email}
                                disabled
                                className="bg-gray-50"
                            />
                            <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, firstName: e.target.value })}
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="role">Role</Label>
                            <select
                                id="role"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] px-3 py-2 text-sm text-[var(--sys-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sys-accent)]"
                            >
                                {ROLES.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-sm text-gray-500">
                                {ROLES.find(r => r.value === formData.role)?.description}
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button type="button" variant="secondary" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Updating..." : "Update User"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UserManagement({
    tenantId,
    onUserInvite,
    onUserUpdate,
    onUserRemove,
    className
}: UserManagementProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Modal states
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/tenants/${tenantId}/members`);
            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }

            const data = await response.json();
            setUsers(data.data.members || []);
            setCurrentUserRole(data.data.currentUserRole || "");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    // Handle user invite
    const handleUserInvite = async (email: string, role: string, firstName?: string, lastName?: string) => {
        if (onUserInvite) {
            await onUserInvite(email, role, firstName, lastName);
            await fetchUsers(); // Refresh the list
        }
    };

    // Handle user update
    const handleUserUpdate = async (userId: string, updates: Partial<User>) => {
        if (onUserUpdate) {
            await onUserUpdate(userId, updates);
            await fetchUsers(); // Refresh the list
        }
    };

    // Handle user removal
    const handleUserRemove = async (user: User) => {
        if (window.confirm(`Are you sure you want to remove ${user.firstName} ${user.lastName} from this organization?`)) {
            if (onUserRemove) {
                await onUserRemove(user.id);
                await fetchUsers(); // Refresh the list
            }
        }
    };

    // Handle edit user
    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setShowEditModal(true);
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus = statusFilter === "all" || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    useEffect(() => {
        fetchUsers();
    }, [tenantId]);

    if (loading) {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
                    <p className="text-gray-600">Manage your organization's team members and their permissions</p>
                </div>
                <Button onClick={() => setShowInviteModal(true)}>
                    <UserPlusIcon className="w-4 h-4 mr-2" />
                    Invite Member
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="flex h-10 rounded-md border border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] px-3 py-2 text-sm text-[var(--sys-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sys-accent)]"
                            >
                                <option value="all">All Roles</option>
                                {ROLES.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex h-10 rounded-md border border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] px-3 py-2 text-sm text-[var(--sys-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sys-accent)]"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error State */}
            {error && (
                <Alert className="bg-red-50 border-red-200">
                    <div className="text-sm text-red-800">{error}</div>
                </Alert>
            )}

            {/* Users Grid */}
            {filteredUsers.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No users found</h3>
                        <p className="mt-2 text-gray-600">
                            {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                                ? "Try adjusting your search or filter criteria"
                                : "Get started by inviting your first team member"}
                        </p>
                        {!searchTerm && roleFilter === "all" && statusFilter === "all" && (
                            <Button className="mt-4" onClick={() => setShowInviteModal(true)}>
                                <UserPlusIcon className="w-4 h-4 mr-2" />
                                Invite Team Member
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map((user) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            currentUserRole={currentUserRole}
                            onEdit={handleEditUser}
                            onRemove={handleUserRemove}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <InviteUserModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onInvite={handleUserInvite}
            />

            <EditUserModal
                user={editingUser}
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                }}
                onUpdate={handleUserUpdate}
            />
        </div>
    );
}

export default UserManagement;
