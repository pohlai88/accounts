'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
    Users,
    UserPlus,
    UserX,
    Shield,
    Key,
    Mail,
    Phone,
    Calendar,
    RefreshCw,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    CheckCircle,
    XCircle
} from 'lucide-react'
import { SecurityService } from '@/lib/security-service'
import { format } from 'date-fns'

interface UserManagementProps {
    companyId: string
}

interface User {
    id: string
    email: string
    name: string
    role: string
    status: 'active' | 'inactive' | 'suspended'
    last_login?: string
    created_at: string
    permissions: string[]
}

export function UserManagement({ companyId }: UserManagementProps) {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const loadUsers = async () => {
        try {
            setLoading(true)
            const result = await SecurityService.getUsers(companyId)

            if (result.success && result.users) {
                setUsers(result.users)
            } else {
                setError(result.error || 'Failed to load users')
            }
        } catch (err) {
            setError('An error occurred while loading users')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [companyId])

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter

        return matchesSearch && matchesRole && matchesStatus
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'default'
            case 'inactive': return 'secondary'
            case 'suspended': return 'destructive'
            default: return 'secondary'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'inactive':
                return <XCircle className="h-4 w-4 text-gray-500" />
            case 'suspended':
                return <XCircle className="h-4 w-4 text-red-500" />
            default:
                return <Shield className="h-4 w-4" />
        }
    }

    const handleUserAction = async (userId: string, action: string) => {
        try {
            let result
            switch (action) {
                case 'activate':
                    result = await SecurityService.updateUserStatus(companyId, userId, 'active')
                    break
                case 'suspend':
                    result = await SecurityService.updateUserStatus(companyId, userId, 'suspended')
                    break
                case 'delete':
                    result = await SecurityService.deleteUser(companyId, userId)
                    break
                default:
                    return
            }

            if (result.success) {
                loadUsers()
            } else {
                setError(result.error || 'Action failed')
            }
        } catch (err) {
            setError('An error occurred while performing the action')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            User Management
                        </CardTitle>
                        <CardDescription>
                            Manage user accounts and permissions
                        </CardDescription>
                    </div>
                    <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                    </Button>
                </CardHeader>
            </Card>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="search">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Role</Label>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button variant="outline" onClick={loadUsers}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Users List */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No users found
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            {getStatusIcon(user.status)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <h4 className="text-sm font-medium">{user.name}</h4>
                                                <Badge variant={getStatusColor(user.status)}>
                                                    {user.status}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {user.role}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                                                <span className="flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    Created: {format(new Date(user.created_at), 'MMM d, yyyy')}
                                                </span>
                                                {user.last_login && (
                                                    <span className="flex items-center">
                                                        <Key className="h-3 w-3 mr-1" />
                                                        Last login: {format(new Date(user.last_login), 'MMM d, yyyy')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedUser(user)
                                                setIsDialogOpen(true)
                                            }}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        {user.status === 'active' ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleUserAction(user.id, 'suspend')}
                                            >
                                                <UserX className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleUserAction(user.id, 'activate')}
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleUserAction(user.id, 'delete')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* User Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                        <DialogDescription>
                            View and edit user information
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <div>
                                <Label>Name</Label>
                                <Input value={selectedUser.name} readOnly />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input value={selectedUser.email} readOnly />
                            </div>
                            <div>
                                <Label>Role</Label>
                                <Input value={selectedUser.role} readOnly />
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Input value={selectedUser.status} readOnly />
                            </div>
                            <div>
                                <Label>Permissions</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedUser.permissions.map((permission) => (
                                        <Badge key={permission} variant="outline">
                                            {permission}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
