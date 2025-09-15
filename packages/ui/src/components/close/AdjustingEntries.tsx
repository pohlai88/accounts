import * as React from "react";
import { cn } from "@aibos/ui/utils";
import {
  Edit,
  Trash2,
  RotateCcw,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Minus,
} from "lucide-react";

// SSOT Compliant Adjusting Entries and Reversals Component
// Manual journal entry creation and reversal management

export interface AdjustingEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference?: string;
  status: "draft" | "posted" | "reversed";
  postedAt?: string;
  postedBy?: string;
  reversedAt?: string;
  reversedBy?: string;
  reversalReason?: string;
  lines: JournalLine[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  notes?: string;
}

export interface JournalLine {
  id: string;
  account: string;
  accountName?: string;
  description: string;
  debit: number;
  credit: number;
  reference?: string;
}

export interface AdjustingEntriesProps {
  entries: AdjustingEntry[];
  onAddEntry?: (entry: Omit<AdjustingEntry, "id" | "entryNumber">) => Promise<void>;
  onUpdateEntry?: (entryId: string, updates: Partial<AdjustingEntry>) => Promise<void>;
  onPostEntry?: (entryId: string) => Promise<void>;
  onReverseEntry?: (entryId: string, reason: string) => Promise<void>;
  onDeleteEntry?: (entryId: string) => Promise<void>;
  onAddLine?: (entryId: string, line: Omit<JournalLine, "id">) => Promise<void>;
  onUpdateLine?: (entryId: string, lineId: string, updates: Partial<JournalLine>) => Promise<void>;
  onDeleteLine?: (entryId: string, lineId: string) => Promise<void>;
  className?: string;
}

export const AdjustingEntries: React.FC<AdjustingEntriesProps> = ({
  entries,
  onAddEntry,
  onUpdateEntry,
  onPostEntry,
  onReverseEntry,
  onDeleteEntry,
  onAddLine,
  onUpdateLine,
  onDeleteLine,
  className,
}) => {
  const [selectedEntry, setSelectedEntry] = React.useState<string | null>(null);
  const [showAddEntry, setShowAddEntry] = React.useState(false);
  const [showReverseDialog, setShowReverseDialog] = React.useState<string | null>(null);
  const [reversalReason, setReversalReason] = React.useState("");
  const [newLineAccount, setNewLineAccount] = React.useState("");
  const [newLineDescription, setNewLineDescription] = React.useState("");
  const [newLineDebit, setNewLineDebit] = React.useState(0);
  const [newLineCredit, setNewLineCredit] = React.useState(0);

  // Calculate totals
  const totals = React.useMemo(() => {
    const total = entries.length;
    const draft = entries.filter(e => e.status === "draft").length;
    const posted = entries.filter(e => e.status === "posted").length;
    const reversed = entries.filter(e => e.status === "reversed").length;
    const totalDebits = entries.reduce((sum, e) => sum + e.totalDebits, 0);
    const totalCredits = entries.reduce((sum, e) => sum + e.totalCredits, 0);

    return { total, draft, posted, reversed, totalDebits, totalCredits };
  }, [entries]);

  const getStatusIcon = (status: AdjustingEntry["status"]) => {
    switch (status) {
      case "posted":
        return <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />;
      case "reversed":
        return <RotateCcw className="h-4 w-4 text-[var(--sys-status-error)]" />;
      case "draft":
        return <Clock className="h-4 w-4 text-[var(--sys-text-tertiary)]" />;
      default:
        return <Clock className="h-4 w-4 text-[var(--sys-text-tertiary)]" />;
    }
  };

  const getStatusColor = (status: AdjustingEntry["status"]) => {
    switch (status) {
      case "posted":
        return "bg-[var(--sys-status-success)] text-white";
      case "reversed":
        return "bg-[var(--sys-status-error)] text-white";
      case "draft":
        return "bg-[var(--sys-bg-subtle)] text-[var(--sys-text-secondary)]";
      default:
        return "bg-[var(--sys-bg-subtle)] text-[var(--sys-text-secondary)]";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleAddLine = async (entryId: string) => {
    if (
      onAddLine &&
      newLineAccount.trim() &&
      newLineDescription.trim() &&
      (newLineDebit > 0 || newLineCredit > 0)
    ) {
      await onAddLine(entryId, {
        account: newLineAccount,
        description: newLineDescription,
        debit: newLineDebit,
        credit: newLineCredit,
      });

      // Reset form
      setNewLineAccount("");
      setNewLineDescription("");
      setNewLineDebit(0);
      setNewLineCredit(0);
    }
  };

  const handleReverseEntry = async (entryId: string) => {
    if (onReverseEntry && reversalReason.trim()) {
      await onReverseEntry(entryId, reversalReason);
      setShowReverseDialog(null);
      setReversalReason("");
    }
  };

  const handlePostEntry = async (entryId: string) => {
    if (onPostEntry) {
      await onPostEntry(entryId);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (onDeleteEntry) {
      await onDeleteEntry(entryId);
    }
  };

  const isEntryBalanced = (entry: AdjustingEntry) => {
    return Math.abs(entry.totalDebits - entry.totalCredits) < 0.01;
  };

  return (
    <div
      className={cn(
        "bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg",
        className,
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-[var(--sys-border-hairline)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--sys-text-primary)]">
              Adjusting Entries & Reversals
            </h2>
            <p className="text-[var(--sys-text-secondary)] mt-1">
              Manual journal entry creation and reversal management
            </p>
          </div>

          <button
            onClick={() => setShowAddEntry(true)}
            className="px-4 py-2 bg-[var(--sys-accent)] text-white rounded-md hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
            aria-label="Add new adjusting entry"
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            Add Entry
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[var(--sys-text-primary)]">{totals.total}</div>
            <div className="text-sm text-[var(--sys-text-secondary)]">Total Entries</div>
          </div>

          <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[var(--sys-text-tertiary)]">{totals.draft}</div>
            <div className="text-sm text-[var(--sys-text-secondary)]">Draft</div>
          </div>

          <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[var(--sys-status-success)]">
              {totals.posted}
            </div>
            <div className="text-sm text-[var(--sys-text-secondary)]">Posted</div>
          </div>

          <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[var(--sys-status-error)]">
              {totals.reversed}
            </div>
            <div className="text-sm text-[var(--sys-text-secondary)]">Reversed</div>
          </div>

          <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
            <div className="text-lg font-bold text-[var(--sys-text-primary)]">
              {formatCurrency(totals.totalDebits)}
            </div>
            <div className="text-sm text-[var(--sys-text-secondary)]">Total Debits</div>
          </div>

          <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
            <div className="text-lg font-bold text-[var(--sys-text-primary)]">
              {formatCurrency(totals.totalCredits)}
            </div>
            <div className="text-sm text-[var(--sys-text-secondary)]">Total Credits</div>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="divide-y divide-[var(--sys-border-hairline)]">
        {entries.map(entry => (
          <div key={entry.id} className="p-4 hover:bg-[var(--sys-bg-subtle)]">
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(entry.status)}
                <FileText className="h-4 w-4 text-[var(--sys-accent)]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-[var(--sys-text-primary)]">
                    {entry.entryNumber} - {entry.description}
                  </h3>
                  <span
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      getStatusColor(entry.status),
                    )}
                  >
                    {entry.status.toUpperCase()}
                  </span>
                  {!isEntryBalanced(entry) && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-[var(--sys-status-error)] text-white">
                      UNBALANCED
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-[var(--sys-text-tertiary)]">Date:</span>
                    <div className="text-[var(--sys-text-primary)]">
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--sys-text-tertiary)]">Reference:</span>
                    <div className="text-[var(--sys-text-primary)]">{entry.reference || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-[var(--sys-text-tertiary)]">Total Debits:</span>
                    <div className="text-[var(--sys-text-primary)] font-medium">
                      {formatCurrency(entry.totalDebits)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--sys-text-tertiary)]">Total Credits:</span>
                    <div className="text-[var(--sys-text-primary)] font-medium">
                      {formatCurrency(entry.totalCredits)}
                    </div>
                  </div>
                </div>

                {/* Journal Lines */}
                <div className="bg-[var(--sys-bg-subtle)] rounded-lg p-3 mb-3">
                  <div className="text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                    Journal Lines ({entry.lines.length})
                  </div>

                  <div className="space-y-2">
                    {entry.lines.map(line => (
                      <div key={line.id} className="flex items-center gap-4 text-sm">
                        <div className="w-32 text-[var(--sys-text-tertiary)]">
                          {line.accountName || line.account}
                        </div>
                        <div className="flex-1 text-[var(--sys-text-secondary)]">
                          {line.description}
                        </div>
                        <div className="w-24 text-right">
                          {line.debit > 0 && (
                            <span className="text-[var(--sys-status-error)]">
                              {formatCurrency(line.debit)}
                            </span>
                          )}
                        </div>
                        <div className="w-24 text-right">
                          {line.credit > 0 && (
                            <span className="text-[var(--sys-status-success)]">
                              {formatCurrency(line.credit)}
                            </span>
                          )}
                        </div>
                        {entry.status === "draft" && (
                          <button
                            onClick={() => onDeleteLine?.(entry.id, line.id)}
                            className="p-1 text-[var(--sys-status-error)] hover:bg-[var(--sys-status-error)]/10 rounded"
                            aria-label={`Delete line ${line.description}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Line Form */}
                  {entry.status === "draft" && (
                    <div className="mt-3 pt-3 border-t border-[var(--sys-border-hairline)]">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <input
                          type="text"
                          placeholder="Account"
                          value={newLineAccount}
                          onChange={e => setNewLineAccount(e.target.value)}
                          className="px-2 py-1 text-sm border border-[var(--sys-border-hairline)] rounded bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                          aria-label="Account for new line"
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={newLineDescription}
                          onChange={e => setNewLineDescription(e.target.value)}
                          className="px-2 py-1 text-sm border border-[var(--sys-border-hairline)] rounded bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                          aria-label="Description for new line"
                        />
                        <input
                          type="number"
                          placeholder="Debit"
                          value={newLineDebit || ""}
                          onChange={e => setNewLineDebit(Number(e.target.value) || 0)}
                          className="px-2 py-1 text-sm border border-[var(--sys-border-hairline)] rounded bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                          aria-label="Debit amount"
                        />
                        <input
                          type="number"
                          placeholder="Credit"
                          value={newLineCredit || ""}
                          onChange={e => setNewLineCredit(Number(e.target.value) || 0)}
                          className="px-2 py-1 text-sm border border-[var(--sys-border-hairline)] rounded bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                          aria-label="Credit amount"
                        />
                        <button
                          onClick={() => handleAddLine(entry.id)}
                          className="px-2 py-1 text-sm bg-[var(--sys-accent)] text-white rounded hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                          aria-label="Add journal line"
                        >
                          Add Line
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {entry.notes && (
                  <div className="p-2 bg-[var(--sys-bg-subtle)] rounded text-xs text-[var(--sys-text-secondary)]">
                    <strong>Notes:</strong> {entry.notes}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {entry.status === "draft" && isEntryBalanced(entry) && (
                  <button
                    onClick={() => handlePostEntry(entry.id)}
                    className="px-3 py-1 text-sm bg-[var(--sys-status-success)] text-white rounded hover:bg-[var(--sys-status-success)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-success)]"
                    aria-label={`Post ${entry.entryNumber}`}
                  >
                    Post
                  </button>
                )}

                {entry.status === "posted" && (
                  <button
                    onClick={() => setShowReverseDialog(entry.id)}
                    className="px-3 py-1 text-sm bg-[var(--sys-status-warning)] text-white rounded hover:bg-[var(--sys-status-warning)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-warning)]"
                    aria-label={`Reverse ${entry.entryNumber}`}
                  >
                    <RotateCcw className="h-3 w-3 mr-1 inline" />
                    Reverse
                  </button>
                )}

                {entry.status === "draft" && (
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="px-3 py-1 text-sm bg-[var(--sys-status-error)] text-white rounded hover:bg-[var(--sys-status-error)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-error)]"
                    aria-label={`Delete ${entry.entryNumber}`}
                  >
                    <Trash2 className="h-3 w-3 mr-1 inline" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reverse Dialog */}
      {showReverseDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[var(--sys-text-primary)] mb-4">
              Reverse Entry
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                Reversal Reason (Required)
              </label>
              <textarea
                value={reversalReason}
                onChange={e => setReversalReason(e.target.value)}
                placeholder="Provide a reason for reversing this entry..."
                className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                rows={3}
                aria-label="Reversal reason"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReverseDialog(null)}
                className="px-4 py-2 border border-[var(--sys-border-hairline)] rounded-md hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                aria-label="Cancel reversal"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReverseEntry(showReverseDialog)}
                disabled={!reversalReason.trim()}
                className="px-4 py-2 bg-[var(--sys-status-warning)] text-white rounded-md hover:bg-[var(--sys-status-warning)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-warning)] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Confirm reversal"
              >
                Reverse Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdjustingEntries;
