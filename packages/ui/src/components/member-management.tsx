'use client';

import React, { useState } from 'react';
import {
    UserPlusIcon,
    TrashIcon,
    PencilIcon,
    UserIcon,
    ShieldCheckIcon,
    ShieldExclamationIcon
} from '@heroicons/react/24/outline';

export interface Member {
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: any;
    company: {
        id: string;
        name: string;
        code: string;
    } | null;
    joinedAt: string;
    isCurrentUser: boolean;
}

export interface MemberManagementProps {
    members: Member[];
    currentUserRole: string;
    onInviteUser: (email: string, role: string) => Promise<void>;
    onRemoveMember: (userId: string) => Promise<void>;
    onUpdateRole: (userId: string, role: string) => Promise<void>;
    loading?: boolean;
    className?: string;
}

const roleColors = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    accountant: 'bg-green-100 text-green-800',
    clerk: 'bg-yellow-100 text-yellow-800',
    viewer: 'bg-gray-100 text-gray-800'
};

const roleIcons = {
    admin: ShieldCheckIcon,
    manager: ShieldExclamationIcon,
    accountant: UserIcon,
    clerk: UserIcon,
    viewer: UserIcon
};

export function MemberManagement({
    members,
    currentUserRole,
    onInviteUser,
    onRemoveMember,
    onUpdateRole,
    loading = false,
    className = ''
}: MemberManagementProps) {
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('user');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const canManageMembers = ['admin', 'manager'].includes(currentUserRole);
    const canChangeRoles = currentUserRole === 'admin';

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail || inviteLoading) return;

        setInviteLoading(true);
        try {
            await onInviteUser(inviteEmail, inviteRole);
            setInviteEmail('');
            setInviteRole('user');
            setShowInviteForm(false);
        } catch (error) {
            console.error('Failed to invite user:', error);
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (actionLoading || !confirm('Are you sure you want to remove this member?')) return;

        setActionLoading(userId);
        try {
            await onRemoveMember(userId);
        } catch (error) {
            console.error('Failed to remove member:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        if (actionLoading) return;

        setActionLoading(userId);
        try {
            await onUpdateRole(userId, newRole);
        } catch (error) {
            console.error('Failed to update role:', error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded-md"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
                {canManageMembers && (
                    <button
                        type="button"
                        onClick={() => setShowInviteForm(!showInviteForm)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <UserPlusIcon className="w-4 h-4 mr-2" />
                        Invite Member
                    </button>
                )}
            </div>

            {/* Invite Form */}
            {showInviteForm && canManageMembers && (
                <form onSubmit={handleInviteUser} className="p-4 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="invite-email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="user@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">
                                Role
                            </label>
                            <select
                                id="invite-role"
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="clerk">Clerk</option>
                                <option value="accountant">Accountant</option>
                                {currentUserRole === 'admin' && (
                                    <>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <button
                            type="button"
                            onClick={() => setShowInviteForm(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={inviteLoading || !inviteEmail}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            {inviteLoading ? 'Inviting...' : 'Send Invitation'}
                        </button>
                    </div>
                </form>
            )}

            {/* Members List */}
            <div className="space-y-3">
                {members.map((member) => {
                    const RoleIcon = roleIcons[member.role as keyof typeof roleIcons] || UserIcon;

                    return (
                        <div
                            key={member.id}
                            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-md"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                        <UserIcon className="w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm font-medium text-gray-900">
                                            {member.firstName} {member.lastName}
                                        </p>
                                        {member.isCurrentUser && (
                                            <span className="text-xs text-blue-600 font-medium">(You)</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">{member.email}</p>
                                    {member.company && (
                                        <p className="text-xs text-gray-400">{member.company.name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                {/* Role Badge */}
                                <div className="flex items-center space-x-2">
                                    <RoleIcon className="w-4 h-4 text-gray-400" />
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[member.role as keyof typeof roleColors]}`}>
                                        {member.role}
                                    </span>
                                </div>

                                {/* Actions */}
                                {canManageMembers && !member.isCurrentUser && (
                                    <div className="flex items-center space-x-2">
                                        {canChangeRoles && (
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                                                disabled={actionLoading === member.userId}
                                                className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="viewer">Viewer</option>
                                                <option value="clerk">Clerk</option>
                                                <option value="accountant">Accountant</option>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMember(member.userId)}
                                            disabled={actionLoading === member.userId}
                                            className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                                            title="Remove member"
                                        >
                                            {actionLoading === member.userId ? (
                                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <TrashIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {members.length === 0 && (
                <div className="text-center py-8">
                    <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No members found</p>
                </div>
            )}
        </div>
    );
}

export default MemberManagement;
