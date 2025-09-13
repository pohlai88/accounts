/**
 * InvoiceEmptyState - Steve Jobs Inspired Empty State
 * 
 * "Make it obvious" - Users immediately understand what to do
 * This empty state guides users to create their first invoice
 */

import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { EmptyState } from './EmptyState';

export interface InvoiceEmptyStateProps {
    onCreateInvoice: () => void;
    className?: string;
}

export const InvoiceEmptyState: React.FC<InvoiceEmptyStateProps> = ({
    onCreateInvoice,
    className,
}) => {
    return (
        <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="No invoices yet"
            description="Create your first invoice to start getting paid. It only takes a few minutes and you can send it immediately."
            action={{
                label: 'Create Invoice',
                onClick: onCreateInvoice,
                variant: 'primary',
            }}
            className={className}
        />
    );
};

export default InvoiceEmptyState;
