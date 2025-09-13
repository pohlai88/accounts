import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Mail,
    Clock,
    CheckCircle,
    AlertCircle,
    Calendar,
    User,
    DollarSign,
    Send,
    Plus,
    Edit,
    Trash2
} from 'lucide-react';
import { cn } from '@aibos/ui/utils';

export interface PaymentReminder {
    id: string;
    invoiceId: string;
    type: 'email' | 'sms' | 'whatsapp';
    subject?: string;
    message: string;
    scheduledFor?: string;
    sentAt?: string;
    status: 'draft' | 'scheduled' | 'sent' | 'failed';
    recipient: string;
    createdAt: string;
}

export interface PaymentRemindersProps {
    className?: string;
    invoiceId: string;
    invoiceNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    invoiceAmount: number;
    dueDate: string;
    onReminderSend?: (reminder: PaymentReminder) => void;
    onReminderSchedule?: (reminder: PaymentReminder) => void;
    onReminderUpdate?: (reminderId: string, updates: Partial<PaymentReminder>) => void;
    onReminderDelete?: (reminderId: string) => void;
    isLoading?: boolean;
}

const reminderTypes = {
    email: {
        label: 'Email Reminder',
        icon: Mail,
        color: 'text-sys-status-info bg-sys-status-info/10',
        description: 'Send reminder via email'
    },
    sms: {
        label: 'SMS Reminder',
        icon: MessageSquare,
        color: 'text-sys-status-success bg-sys-status-success/10',
        description: 'Send reminder via SMS'
    },
    whatsapp: {
        label: 'WhatsApp Reminder',
        icon: MessageSquare,
        color: 'text-sys-status-success bg-sys-status-success/10',
        description: 'Send reminder via WhatsApp'
    }
};

const reminderTemplates = {
    friendly: {
        name: 'Friendly Reminder',
        subject: 'Friendly reminder: Invoice {invoiceNumber}',
        message: `Hi {customerName},

This is a friendly reminder that invoice {invoiceNumber} for {amount} is due on {dueDate}.

You can view and pay your invoice online at: {link}

If you have any questions, please don't hesitate to contact us.

Thank you for your business!

Best regards,
AI-BOS Team`
    },
    urgent: {
        name: 'Urgent Reminder',
        subject: 'URGENT: Payment overdue - Invoice {invoiceNumber}',
        message: `Dear {customerName},

This is an urgent reminder that payment for invoice {invoiceNumber} in the amount of {amount} is now overdue.

Please remit payment immediately to avoid any late fees or service interruptions.

You can pay online at: {link}

If you have already made this payment, please disregard this notice.

Best regards,
AI-BOS Team`
    },
    final: {
        name: 'Final Notice',
        subject: 'FINAL NOTICE: Invoice {invoiceNumber}',
        message: `Dear {customerName},

This is our final notice regarding invoice {invoiceNumber} in the amount of {amount}.

Payment is now significantly overdue. If payment is not received within 7 days, we will be forced to take further action.

Please remit payment immediately at: {link}

If you have any questions or concerns, please contact us immediately.

Best regards,
AI-BOS Team`
    }
};

export const PaymentReminders: React.FC<PaymentRemindersProps> = ({
    className,
    invoiceId,
    invoiceNumber,
    customerName,
    customerEmail,
    customerPhone,
    invoiceAmount,
    dueDate,
    onReminderSend,
    onReminderSchedule,
    onReminderUpdate,
    onReminderDelete,
    isLoading = false
}) => {
    const [reminders, setReminders] = useState<PaymentReminder[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('friendly');
    const [selectedType, setSelectedType] = useState<'email' | 'sms' | 'whatsapp'>('email');
    const [newReminder, setNewReminder] = useState<Partial<PaymentReminder>>({
        type: 'email',
        subject: '',
        message: '',
        recipient: customerEmail,
        status: 'draft'
    });

    // Mock reminders data
    const mockReminders: PaymentReminder[] = [
        {
            id: '1',
            invoiceId,
            type: 'email',
            subject: 'Friendly reminder: Invoice INV-2024-001',
            message: 'Hi Acme Corporation,\n\nThis is a friendly reminder that invoice INV-2024-001 for $2,500.00 is due on February 15, 2024.\n\nYou can view and pay your invoice online at: https://app.aibos.com/invoice/123\n\nThank you for your business!\n\nBest regards,\nAI-BOS Team',
            sentAt: '2024-01-25T09:00:00Z',
            status: 'sent',
            recipient: customerEmail,
            createdAt: '2024-01-25T08:45:00Z'
        },
        {
            id: '2',
            invoiceId,
            type: 'email',
            subject: 'URGENT: Payment overdue - Invoice INV-2024-001',
            message: 'Dear Acme Corporation,\n\nThis is an urgent reminder that payment for invoice INV-2024-001 in the amount of $2,500.00 is now overdue.\n\nPlease remit payment immediately to avoid any late fees.\n\nYou can pay online at: https://app.aibos.com/invoice/123\n\nBest regards,\nAI-BOS Team',
            scheduledFor: '2024-02-01T10:00:00Z',
            status: 'scheduled',
            recipient: customerEmail,
            createdAt: '2024-01-30T14:20:00Z'
        }
    ];

    useEffect(() => {
        setReminders(mockReminders);
    }, [invoiceId]);

    // Update reminder when template or type changes
    useEffect(() => {
        const template = reminderTemplates[selectedTemplate as keyof typeof reminderTemplates];
        const link = `${window.location.origin}/invoice/${invoiceId}`;

        const processedMessage = template.message
            .replace('{customerName}', customerName)
            .replace('{invoiceNumber}', invoiceNumber)
            .replace('{amount}', formatCurrency(invoiceAmount))
            .replace('{dueDate}', formatDate(dueDate))
            .replace('{link}', link);

        const processedSubject = template.subject
            .replace('{invoiceNumber}', invoiceNumber);

        setNewReminder(prev => ({
            ...prev,
            type: selectedType,
            subject: selectedType === 'email' ? processedSubject : undefined,
            message: processedMessage,
            recipient: selectedType === 'email' ? customerEmail : customerPhone || ''
        }));
    }, [selectedTemplate, selectedType, customerName, invoiceNumber, invoiceAmount, dueDate, customerEmail, customerPhone, invoiceId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCreateReminder = () => {
        if (newReminder.message && newReminder.recipient) {
            const reminder: PaymentReminder = {
                id: Date.now().toString(),
                invoiceId,
                type: newReminder.type!,
                subject: newReminder.subject,
                message: newReminder.message,
                recipient: newReminder.recipient,
                status: 'draft',
                createdAt: new Date().toISOString()
            };

            setReminders(prev => [reminder, ...prev]);
            setShowCreateForm(false);
            setNewReminder({
                type: 'email',
                subject: '',
                message: '',
                recipient: customerEmail,
                status: 'draft'
            });
        }
    };

    const handleSendReminder = (reminder: PaymentReminder) => {
        const updatedReminder = {
            ...reminder,
            status: 'sent' as const,
            sentAt: new Date().toISOString()
        };

        setReminders(prev =>
            prev.map(r => r.id === reminder.id ? updatedReminder : r)
        );

        onReminderSend?.(updatedReminder);
    };

    const handleScheduleReminder = (reminder: PaymentReminder, scheduledFor: string) => {
        const updatedReminder = {
            ...reminder,
            status: 'scheduled' as const,
            scheduledFor
        };

        setReminders(prev =>
            prev.map(r => r.id === reminder.id ? updatedReminder : r)
        );

        onReminderSchedule?.(updatedReminder);
    };

    const handleDeleteReminder = (reminderId: string) => {
        setReminders(prev => prev.filter(r => r.id !== reminderId));
        onReminderDelete?.(reminderId);
    };

    const getStatusConfig = (status: PaymentReminder['status']) => {
        switch (status) {
            case 'sent':
                return {
                    label: 'Sent',
                    icon: CheckCircle,
                    color: 'text-sys-status-success bg-sys-status-success/10'
                };
            case 'scheduled':
                return {
                    label: 'Scheduled',
                    icon: Clock,
                    color: 'text-sys-status-warning bg-sys-status-warning/10'
                };
            case 'failed':
                return {
                    label: 'Failed',
                    icon: AlertCircle,
                    color: 'text-sys-status-error bg-sys-status-error/10'
                };
            default:
                return {
                    label: 'Draft',
                    icon: Edit,
                    color: 'text-sys-text-tertiary bg-sys-fill-low'
                };
        }
    };

    if (isLoading) {
        return (
            <div className={cn('space-y-4', className)}>
                <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6 animate-pulse">
                    <div className="space-y-4">
                        <div className="h-4 bg-sys-fill-low rounded w-32"></div>
                        <div className="h-8 bg-sys-fill-low rounded w-48"></div>
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
                <div>
                    <h2 className="text-lg font-medium text-sys-text-primary">Payment Reminders</h2>
                    <p className="text-sys-text-secondary mt-1">
                        Send automated reminders for invoice {invoiceNumber}
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn btn-primary flex items-center space-x-2"
                    aria-label="Create new payment reminder"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>New Reminder</span>
                </button>
            </div>

            {/* Create Reminder Form */}
            {showCreateForm && (
                <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-sys-text-primary">Create Payment Reminder</h3>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="btn btn-ghost p-2"
                            aria-label="Cancel reminder creation"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Template Selection */}
                        <div>
                            <label htmlFor="reminder-template" className="block text-sm font-medium text-sys-text-primary mb-2">
                                Reminder Template
                            </label>
                            <select
                                id="reminder-template"
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className="input w-full"
                                aria-label="Select reminder template"
                            >
                                {Object.entries(reminderTemplates).map(([key, template]) => (
                                    <option key={key} value={key}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Type Selection */}
                        <div>
                            <label htmlFor="reminder-type" className="block text-sm font-medium text-sys-text-primary mb-2">
                                Send Method
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(reminderTypes).map(([type, config]) => {
                                    const TypeIcon = config.icon;
                                    const isSelected = selectedType === type;

                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedType(type as any)}
                                            className={cn(
                                                'p-3 rounded-lg border-2 transition-all text-left',
                                                isSelected
                                                    ? 'border-brand-primary bg-brand-primary/5'
                                                    : 'border-sys-border-hairline hover:border-sys-border-medium'
                                            )}
                                            aria-label={`Select ${config.label}`}
                                        >
                                            <div className="flex items-center space-x-2 mb-1">
                                                <div className={cn(
                                                    'h-6 w-6 rounded flex items-center justify-center',
                                                    config.color
                                                )}>
                                                    <TypeIcon className="h-3 w-3" aria-hidden="true" />
                                                </div>
                                                <span className="text-sm font-medium text-sys-text-primary">
                                                    {config.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-sys-text-secondary">
                                                {config.description}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recipient */}
                        <div>
                            <label htmlFor="reminder-recipient" className="block text-sm font-medium text-sys-text-primary mb-2">
                                Recipient
                            </label>
                            <input
                                id="reminder-recipient"
                                type={selectedType === 'email' ? 'email' : 'tel'}
                                value={newReminder.recipient || ''}
                                onChange={(e) => setNewReminder(prev => ({ ...prev, recipient: e.target.value }))}
                                className="input w-full"
                                placeholder={selectedType === 'email' ? 'customer@example.com' : '+1 (555) 123-4567'}
                                aria-label="Reminder recipient"
                            />
                        </div>

                        {/* Subject (Email only) */}
                        {selectedType === 'email' && (
                            <div>
                                <label htmlFor="reminder-subject" className="block text-sm font-medium text-sys-text-primary mb-2">
                                    Subject
                                </label>
                                <input
                                    id="reminder-subject"
                                    type="text"
                                    value={newReminder.subject || ''}
                                    onChange={(e) => setNewReminder(prev => ({ ...prev, subject: e.target.value }))}
                                    className="input w-full"
                                    aria-label="Email subject"
                                />
                            </div>
                        )}

                        {/* Message */}
                        <div>
                            <label htmlFor="reminder-message" className="block text-sm font-medium text-sys-text-primary mb-2">
                                Message
                            </label>
                            <textarea
                                id="reminder-message"
                                value={newReminder.message || ''}
                                onChange={(e) => setNewReminder(prev => ({ ...prev, message: e.target.value }))}
                                rows={6}
                                className="input w-full resize-none"
                                aria-label="Reminder message"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="btn btn-ghost"
                                aria-label="Cancel reminder creation"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateReminder}
                                disabled={!newReminder.message || !newReminder.recipient}
                                className="btn btn-primary"
                                aria-label="Create reminder"
                            >
                                Create Reminder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reminders List */}
            <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
                <h3 className="text-lg font-medium text-sys-text-primary mb-4">Reminder History</h3>

                {reminders.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-sys-text-tertiary mx-auto mb-4" aria-hidden="true" />
                        <h4 className="text-lg font-medium text-sys-text-primary mb-2">No reminders sent</h4>
                        <p className="text-sys-text-secondary">
                            Create your first payment reminder to get started
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reminders.map((reminder) => {
                            const type = reminderTypes[reminder.type];
                            const status = getStatusConfig(reminder.status);
                            const TypeIcon = type.icon;
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={reminder.id}
                                    className="flex items-center justify-between p-4 border border-sys-border-hairline rounded-lg"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className={cn(
                                                'h-10 w-10 rounded-lg flex items-center justify-center',
                                                type.color
                                            )}>
                                                <TypeIcon className="h-5 w-5" aria-hidden="true" />
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-medium text-sys-text-primary">
                                                    {type.label}
                                                </span>
                                                <span className={cn(
                                                    'px-2 py-1 text-xs font-medium rounded-md flex items-center space-x-1',
                                                    status.color
                                                )}>
                                                    <StatusIcon className="h-3 w-3" aria-hidden="true" />
                                                    <span>{status.label}</span>
                                                </span>
                                            </div>

                                            <div className="text-sm text-sys-text-secondary mb-1">
                                                To: {reminder.recipient}
                                            </div>

                                            {reminder.subject && (
                                                <div className="text-sm text-sys-text-primary mb-1">
                                                    Subject: {reminder.subject}
                                                </div>
                                            )}

                                            <div className="text-sm text-sys-text-tertiary">
                                                {reminder.sentAt && `Sent: ${formatDateTime(reminder.sentAt)}`}
                                                {reminder.scheduledFor && `Scheduled: ${formatDateTime(reminder.scheduledFor)}`}
                                                {reminder.status === 'draft' && 'Created: ' + formatDateTime(reminder.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {reminder.status === 'draft' && (
                                            <>
                                                <button
                                                    onClick={() => handleSendReminder(reminder)}
                                                    className="btn btn-secondary p-2"
                                                    aria-label={`Send reminder ${reminder.id}`}
                                                >
                                                    <Send className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReminder(reminder.id)}
                                                    className="btn btn-ghost text-sys-status-error hover:bg-sys-status-error/10 p-2"
                                                    aria-label={`Delete reminder ${reminder.id}`}
                                                >
                                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
