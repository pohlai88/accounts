/**
 * BillEmptyState - Steve Jobs Inspired Empty State
 *
 * "Make it obvious" - Users immediately understand what to do
 * This empty state guides users to add their first bill
 */
// @ts-nocheck


import React from "react";
import { Receipt, Upload } from "lucide-react";
import { EmptyState } from "./EmptyState.js";

export interface BillEmptyStateProps {
  onAddBill: () => void;
  onUploadReceipt: () => void;
  className?: string;
}

export const BillEmptyState: React.FC<BillEmptyStateProps> = ({
  onAddBill,
  onUploadReceipt,
  className,
}) => {
  return (
    <div className="space-y-6">
      <EmptyState
        icon={<Receipt className="h-8 w-8" />}
        title="No bills yet"
        description="Add your first bill to start tracking expenses. You can enter it manually or upload a receipt and we'll extract the details for you."
        className={className}
      />

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onAddBill} className="btn btn-primary px-6 py-2">
          Add Bill Manually
        </button>
        <button onClick={onUploadReceipt} className="btn btn-secondary px-6 py-2">
          <Upload className="h-4 w-4 mr-2" />
          Upload Receipt
        </button>
      </div>
    </div>
  );
};

export default BillEmptyState;
