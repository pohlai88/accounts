import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, MessageSquare, AlertTriangle, Eye, Send } from 'lucide-react';
import { cn } from '@aibos/ui/utils';

export interface ApprovalRequest {
    id: string;
    billId: string;
    billNumber: string;
    vendorName: string;
    amount: number;
    submittedBy: string;
    submittedAt: string;
    dueDate: string;
    status: 'pending' | 'approved' | 'rejected' | 'escalated';
    approver?: string;
    approvedAt?: string;
    comments: ApprovalComment[];
    attachments: string[];
    escalationLevel: number;
    maxEscalationLevel: number;
}

export interface ApprovalComment {
    id: string;
    author: string;
    authorRole: string;
    comment: string;
    timestamp: string;
    type: 'comment' | 'approval' | 'rejection' | 'escalation';
}

export interface ApprovalWorkflowProps {
    className?: string;
    approvalRequest?: ApprovalRequest;
    currentUser: {
        id: string;
        name: string;
        role: string;
        canApprove: boolean;
        approvalLimit: number;
    };
    onApprove?: (requestId: string, comments?: string) => void;
    onReject?: (requestId: string, reason: string) => void;
    onEscalate?: (requestId: string, comments?: string) => void;
    onComment?: (requestId: string, comment: string) => void;
    isLoading?: boolean;
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
    className,
    approvalRequest,
    currentUser,
    onApprove,
    onReject,
    onEscalate,
    onComment,
    isLoading = false
}) => {
    const [newComment, setNewComment] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [showEscalationForm, setShowEscalationForm] = useState(false);

    // Mock approval request data
    const mockRequest: ApprovalRequest = {
        id: 'req_001',
        billId: 'bill_001',
        billNumber: 'BILL-2024-001',
        vendorName: 'Amazon Web Services',
        amount: 2500.00,
        submittedBy: 'John Doe',
        submittedAt: '2024-01-15T10:30:00Z',
        dueDate: '2024-01-20T17:00:00Z',
        status: 'pending',
        comments: [
            {
                id: '1',
                author: 'John Doe',
                authorRole: 'Submitter',
                comment: 'Monthly AWS bill for production services',
                timestamp: '2024-01-15T10:30:00Z',
                type: 'comment'
            }
        ],
        attachments: ['aws-invoice.pdf'],
        escalationLevel: 1,
        maxEscalationLevel: 3
    };

    const request = approvalRequest || mockRequest;

    const getStatusIcon = (status: ApprovalRequest['status']) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-5 w-5 text-sys-status-warning" aria-hidden="true" />;
            case 'approved':
                return <CheckCircle className="h-5 w-5 text-sys-status-success" aria-hidden="true" />;
            case 'rejected':
                return <XCircle className="h-5 w-5 text-sys-status-error" aria-hidden="true" />;
            case 'escalated':
                return <AlertTriangle className="h-5 w-5 text-sys-status-info" aria-hidden="true" />;
        }
    };

    const getStatusColor = (status: ApprovalRequest['status']) => {
        switch (status) {
            case 'pending':
                return 'text-sys-status-warning bg-sys-status-warning/10';
            case 'approved':
                return 'text-sys-status-success bg-sys-status-success/10';
            case 'rejected':
                return 'text-sys-status-error bg-sys-status-error/10';
            case 'escalated':
                return 'text-sys-status-info bg-sys-status-info/10';
        }
    };

    const canApprove = currentUser.canApprove && request.amount <= currentUser.approvalLimit;
    const canEscalate = request.escalationLevel < request.maxEscalationLevel;
    const isOverdue = new Date(request.dueDate) < new Date() && request.status === 'pending';

    const handleApprove = () => {
        if (onApprove) {
            onApprove(request.id, newComment);
        }
        setNewComment('');
    };

    const handleReject = () => {
        if (onReject && rejectionReason.trim()) {
            onReject(request.id, rejectionReason);
            setRejectionReason('');
            setShowRejectionForm(false);
        }
    };

    const handleEscalate = () => {
        if (onEscalate) {
            onEscalate(request.id, newComment);
        }
        setNewComment('');
        setShowEscalationForm(false);
    };

    const handleComment = () => {
        if (onComment && newComment.trim()) {
            onComment(request.id, newComment);
            setNewComment('');
        }
    };

    if (isLoading) {
        return (
            <div className={cn('space-y-4', className)}>
                <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6 animate-pulse">
                    <div className="space-y-4">
                        <div className="h-4 bg-sys-fill-low rounded w-32"></div>
                        <div className="h-8 bg-sys-fill-low rounded w-full"></div>
                        <div className="h-4 bg-sys-fill-low rounded w-24"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-sys-status-warning/10 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-sys-status-warning" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-sys-text-primary">Approval Workflow</h1>
                        <p className="text-sm text-sys-text-tertiary">Review and approve bill requests</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {getStatusIcon(request.status)}
                    <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(request.status))}>
                        {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Request Details */}
            <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-sys-text-primary">Request Details</h2>
                    {isOverdue && (
                        <div className="flex items-center space-x-2 text-sys-status-error">
                            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                            <span className="text-sm font-medium">Overdue</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <p className="text-xs text-sys-text-tertiary mb-1">Bill Number</p>
                        <p className="text-sm font-medium text-sys-text-primary">{request.billNumber}</p>
                    </div>
                    <div>
                        <p className="text-xs text-sys-text-tertiary mb-1">Vendor</p>
                        <p className="text-sm font-medium text-sys-text-primary">{request.vendorName}</p>
                    </div>
                    <div>
                        <p className="text-xs text-sys-text-tertiary mb-1">Amount</p>
                        <p className="text-sm font-medium text-sys-text-primary">${request.amount.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-sys-text-tertiary mb-1">Submitted By</p>
                        <p className="text-sm font-medium text-sys-text-primary">{request.submittedBy}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                        <p className="text-xs text-sys-text-tertiary mb-1">Submitted</p>
                        <p className="text-sm font-medium text-sys-text-primary">
                            {new Date(request.submittedAt).toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-sys-text-tertiary mb-1">Due Date</p>
                        <p className="text-sm font-medium text-sys-text-primary">
                            {new Date(request.dueDate).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Escalation Info */}
                <div className="mt-6 p-4 bg-sys-fill-low rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-sys-text-primary">Escalation Level</p>
                            <p className="text-xs text-sys-text-tertiary">
                                Level {request.escalationLevel} of {request.maxEscalationLevel}
                            </p>
                        </div>
                        <div className="flex space-x-1">
                            {Array.from({ length: request.maxEscalationLevel }, (_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'w-3 h-3 rounded-full',
                                        i < request.escalationLevel ? 'bg-sys-status-info' : 'bg-sys-fill-low'
                                    )}
                                    aria-hidden="true"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Attachments */}
            {request.attachments.length > 0 && (
                <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
                    <h3 className="text-lg font-medium text-sys-text-primary mb-4">Attachments</h3>
                    <div className="space-y-2">
                        {request.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-sys-fill-low rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Eye className="h-5 w-5 text-sys-text-tertiary" aria-hidden="true" />
                                    <span className="text-sm font-medium text-sys-text-primary">{attachment}</span>
                                </div>
                                <button
                                    className="btn btn-outline btn-sm"
                                    aria-label={`View attachment ${attachment}`}
                                >
                                    View
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Comments */}
            <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
                <h3 className="text-lg font-medium text-sys-text-primary mb-4">Comments & History</h3>

                <div className="space-y-4 mb-6">
                    {request.comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-sys-fill-low rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-sys-text-tertiary" aria-hidden="true" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                    <p className="text-sm font-medium text-sys-text-primary">{comment.author}</p>
                                    <span className="text-xs text-sys-text-tertiary">{comment.authorRole}</span>
                                    <span className="text-xs text-sys-text-tertiary">
                                        {new Date(comment.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-sys-text-secondary">{comment.comment}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Comment */}
                <div className="space-y-3">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        className="input w-full resize-none"
                        aria-label="Add comment"
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleComment}
                            disabled={!newComment.trim()}
                            className="btn btn-outline btn-sm"
                            aria-label="Add comment"
                        >
                            <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                            Add Comment
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {request.status === 'pending' && (
                <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
                    <h3 className="text-lg font-medium text-sys-text-primary mb-4">Actions</h3>

                    <div className="flex flex-wrap gap-3">
                        {canApprove && (
                            <button
                                onClick={handleApprove}
                                className="btn btn-primary"
                                aria-label="Approve this request"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                                Approve
                            </button>
                        )}

                        <button
                            onClick={() => setShowRejectionForm(true)}
                            className="btn btn-outline"
                            aria-label="Reject this request"
                        >
                            <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                            Reject
                        </button>

                        {canEscalate && (
                            <button
                                onClick={() => setShowEscalationForm(true)}
                                className="btn btn-outline"
                                aria-label="Escalate this request"
                            >
                                <Send className="h-4 w-4 mr-2" aria-hidden="true" />
                                Escalate
                            </button>
                        )}
                    </div>

                    {!canApprove && request.amount > currentUser.approvalLimit && (
                        <div className="mt-4 p-3 bg-sys-status-warning/10 border border-sys-status-warning/20 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4 text-sys-status-warning" aria-hidden="true" />
                                <span className="text-sm text-sys-status-warning">
                                    Amount exceeds your approval limit (${currentUser.approvalLimit})
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Rejection Form */}
            {showRejectionForm && (
                <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
                    <h3 className="text-lg font-medium text-sys-text-primary mb-4">Reject Request</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="rejection-reason" className="block text-sm font-medium text-sys-text-primary mb-2">
                                Reason for Rejection
                            </label>
                            <textarea
                                id="rejection-reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Please provide a reason for rejecting this request..."
                                rows={4}
                                className="input w-full resize-none"
                                aria-label="Reason for rejection"
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowRejectionForm(false)}
                                className="btn btn-outline"
                                aria-label="Cancel rejection"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim()}
                                className="btn btn-primary"
                                aria-label="Confirm rejection"
                            >
                                <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                                Reject Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Escalation Form */}
            {showEscalationForm && (
                <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
                    <h3 className="text-lg font-medium text-sys-text-primary mb-4">Escalate Request</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="escalation-comment" className="block text-sm font-medium text-sys-text-primary mb-2">
                                Escalation Comments (Optional)
                            </label>
                            <textarea
                                id="escalation-comment"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add any additional context for the next approver..."
                                rows={4}
                                className="input w-full resize-none"
                                aria-label="Escalation comments"
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowEscalationForm(false)}
                                className="btn btn-outline"
                                aria-label="Cancel escalation"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEscalate}
                                className="btn btn-primary"
                                aria-label="Confirm escalation"
                            >
                                <Send className="h-4 w-4 mr-2" aria-hidden="true" />
                                Escalate Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
