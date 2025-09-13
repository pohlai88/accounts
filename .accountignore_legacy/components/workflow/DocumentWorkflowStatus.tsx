/**
 * Document Workflow Status Component
 * Shows document status, approval workflow, and actions
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import {
    CheckCircle,
    XCircle,
    Clock,
    Send,
    ArrowRight,
    User,
    Calendar,
    MessageSquare,
    FileText,
    AlertTriangle,
    ThumbsUp,
    ThumbsDown,
    RotateCcw,
    Eye
} from 'lucide-react'
import { EnhancedDocumentWorkflowEngine } from '@/lib/document-workflow-enhanced'
import { format } from 'date-fns'

export type DocumentStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Submitted' | 'Cancelled'

interface DocumentApproval {
    id: string
    documentType: string
    documentId: string
    currentState: string
    approvalStatus: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
    requestedBy: string
    requestedAt: string
    approvedBy?: string
    approvedAt?: string
    rejectedBy?: string
    rejectedAt?: string
    comments?: string
    approvalLevel: number
    totalLevels: number
}

interface DocumentWorkflowStatusProps {
    documentType: string
    documentId: string
    currentStatus: DocumentStatus
    companyId: string
    userId: string
    userRole?: string
    onStatusChange?: (newStatus: DocumentStatus) => void
    onSubmit?: () => void
    onApprove?: () => void
    onReject?: (comments: string) => void
    onCancel?: () => void
    className?: string
}

export function DocumentWorkflowStatus({
    documentType,
    documentId,
    currentStatus,
    companyId,
    userId,
    userRole,
    onStatusChange,
    onSubmit,
    onApprove,
    onReject,
    onCancel,
    className = ''
}: DocumentWorkflowStatusProps) {
    const [approval, setApproval] = useState<DocumentApproval | null>(null)
    const [loading, setLoading] = useState(false)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [rejectComments, setRejectComments] = useState('')
    const [canApprove, setCanApprove] = useState(false)

    // Load approval details
    useEffect(() => {
        if (documentId && currentStatus === 'Pending Approval') {
            loadApprovalDetails()
        }
    }, [documentId, currentStatus])

    const loadApprovalDetails = async () => {
        setLoading(true)
        try {
            // Mock approval data - in real implementation, this would call your service
            const mockApproval: DocumentApproval = {
                id: '1',
                documentType,
                documentId,
                currentState: 'Pending Approval',
                approvalStatus: 'Pending',
                requestedBy: 'user1',
                requestedAt: new Date().toISOString(),
                approvalLevel: 1,
                totalLevels: 2
            }
            setApproval(mockApproval)

            // Check if current user can approve
            setCanApprove(userRole === 'Manager' || userRole === 'Admin')
        } catch (error) {
            console.error('Failed to load approval details:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const result = await EnhancedDocumentWorkflowEngine.submitDocumentEnhanced(
                documentType,
                documentId,
                {
                    companyId,
                    userId,
                    submissionDate: new Date().toISOString()
                }
            )

            if (result.success) {
                onStatusChange?.(result.approvalRequired ? 'Pending Approval' : 'Submitted')
                onSubmit?.()
            }
        } catch (error) {
            console.error('Failed to submit document:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        setLoading(true)
        try {
            const result = await EnhancedDocumentWorkflowEngine.approveDocument(
                documentType,
                documentId,
                userId
            )

            if (result.success) {
                onStatusChange?.('Approved')
                onApprove?.()
            }
        } catch (error) {
            console.error('Failed to approve document:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        if (!rejectComments.trim()) {
            alert('Please provide comments for rejection')
            return
        }

        setLoading(true)
        try {
            const result = await EnhancedDocumentWorkflowEngine.rejectDocument(
                documentType,
                documentId,
                userId,
                rejectComments
            )

            if (result.success) {
                onStatusChange?.('Rejected')
                onReject?.(rejectComments)
                setShowRejectDialog(false)
                setRejectComments('')
            }
        } catch (error) {
            console.error('Failed to reject document:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: DocumentStatus) => {
        const statusConfig = {
            'Draft': { variant: 'secondary' as const, icon: FileText, color: 'text-gray-500' },
            'Pending Approval': { variant: 'default' as const, icon: Clock, color: 'text-yellow-500' },
            'Approved': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-500' },
            'Rejected': { variant: 'destructive' as const, icon: XCircle, color: 'text-red-500' },
            'Submitted': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-500' },
            'Cancelled': { variant: 'secondary' as const, icon: XCircle, color: 'text-gray-500' }
        }

        const config = statusConfig[status]
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className="flex items-center">
                <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
                {status}
            </Badge>
        )
    }

    const getAvailableActions = () => {
        const actions = []

        switch (currentStatus) {
            case 'Draft':
                actions.push({
                    label: 'Submit for Approval',
                    icon: Send,
                    action: handleSubmit,
                    variant: 'default' as const,
                    disabled: loading
                })
                break

            case 'Pending Approval':
                if (canApprove) {
                    actions.push(
                        {
                            label: 'Approve',
                            icon: ThumbsUp,
                            action: handleApprove,
                            variant: 'default' as const,
                            disabled: loading
                        },
                        {
                            label: 'Reject',
                            icon: ThumbsDown,
                            action: () => setShowRejectDialog(true),
                            variant: 'destructive' as const,
                            disabled: loading
                        }
                    )
                }
                break

            case 'Rejected':
                actions.push({
                    label: 'Resubmit',
                    icon: RotateCcw,
                    action: handleSubmit,
                    variant: 'default' as const,
                    disabled: loading
                })
                break

            case 'Submitted':
                actions.push({
                    label: 'Cancel',
                    icon: XCircle,
                    action: onCancel,
                    variant: 'destructive' as const,
                    disabled: loading
                })
                break
        }

        return actions
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Status Header */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                Document Status
                            </CardTitle>
                            <CardDescription>
                                {documentType} #{documentId.slice(-8)}
                            </CardDescription>
                        </div>
                        {getStatusBadge(currentStatus)}
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Approval Progress */}
                    {approval && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Approval Progress</span>
                                <span className="text-sm text-gray-500">
                                    Level {approval.approvalLevel} of {approval.totalLevels}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(approval.approvalLevel / approval.totalLevels) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        {getAvailableActions().map((action, index) => {
                            const Icon = action.icon
                            return (
                                <Button
                                    key={index}
                                    variant={action.variant}
                                    size="sm"
                                    onClick={action.action}
                                    disabled={action.disabled}
                                    className="flex items-center"
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {action.label}
                                </Button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Approval History */}
            {approval && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Approval History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {/* Requested */}
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Send className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Submitted for approval</p>
                                    <p className="text-xs text-gray-500">
                                        by {approval.requestedBy} • {format(new Date(approval.requestedAt), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                </div>
                            </div>

                            {/* Approved */}
                            {approval.approvedBy && (
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Approved</p>
                                        <p className="text-xs text-gray-500">
                                            by {approval.approvedBy} • {format(new Date(approval.approvedAt!), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                        {approval.comments && (
                                            <p className="text-sm text-gray-700 mt-1 p-2 bg-gray-50 rounded">
                                                {approval.comments}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Rejected */}
                            {approval.rejectedBy && (
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                        <XCircle className="h-4 w-4 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Rejected</p>
                                        <p className="text-xs text-gray-500">
                                            by {approval.rejectedBy} • {format(new Date(approval.rejectedAt!), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                        {approval.comments && (
                                            <p className="text-sm text-gray-700 mt-1 p-2 bg-red-50 rounded">
                                                {approval.comments}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <ThumbsDown className="h-5 w-5 mr-2 text-red-500" />
                            Reject Document
                        </DialogTitle>
                        <DialogDescription>
                            Please provide comments explaining why this document is being rejected.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="comments">Rejection Comments *</Label>
                            <Textarea
                                id="comments"
                                placeholder="Enter your comments..."
                                value={rejectComments}
                                onChange={(e) => setRejectComments(e.target.value)}
                                className="mt-1"
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectComments.trim() || loading}
                        >
                            {loading ? 'Rejecting...' : 'Reject Document'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DocumentWorkflowStatus
