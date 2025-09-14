import * as React from "react";
import { cn } from "../../utils";
import {
  Lock,
  Unlock,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";

// SSOT Compliant Lock States Component
// Period management with lock states and access control

export interface PeriodLock {
  id: string;
  periodId: string;
  periodName: string;
  startDate: string;
  endDate: string;
  lockType: "soft" | "hard" | "readonly";
  lockedBy: string;
  lockedByName?: string;
  lockedAt: string;
  reason?: string;
  notes?: string;
  affectedModules: string[];
  canUnlock: boolean;
  unlockReason?: string;
}

export interface LockRule {
  id: string;
  name: string;
  description: string;
  module: string;
  condition: "days_after_period" | "manual" | "auto_on_complete";
  daysAfterPeriod?: number;
  autoUnlock?: boolean;
  requiresApproval: boolean;
  enabled: boolean;
}

export interface LockStatesProps {
  currentPeriod: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: "open" | "closing" | "locked" | "closed";
  };
  locks: PeriodLock[];
  lockRules: LockRule[];
  onLockPeriod?: (
    periodId: string,
    lockType: PeriodLock["lockType"],
    reason?: string,
  ) => Promise<void>;
  onUnlockPeriod?: (lockId: string, reason: string) => Promise<void>;
  onUpdateLockRule?: (ruleId: string, updates: Partial<LockRule>) => Promise<void>;
  className?: string;
}

export const LockStates: React.FC<LockStatesProps> = ({
  currentPeriod,
  locks,
  lockRules,
  onLockPeriod,
  onUnlockPeriod,
  onUpdateLockRule,
  className,
}) => {
  const [selectedLockType, setSelectedLockType] = React.useState<PeriodLock["lockType"]>("soft");
  const [lockReason, setLockReason] = React.useState("");
  const [unlockReason, setUnlockReason] = React.useState("");
  const [showLockDialog, setShowLockDialog] = React.useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = React.useState<string | null>(null);

  const getLockTypeIcon = (lockType: PeriodLock["lockType"]) => {
    switch (lockType) {
      case "hard":
        return <Lock className="h-4 w-4 text-[var(--sys-status-error)]" />;
      case "soft":
        return <Lock className="h-4 w-4 text-[var(--sys-status-warning)]" />;
      case "readonly":
        return <FileText className="h-4 w-4 text-[var(--sys-text-secondary)]" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  const getLockTypeColor = (lockType: PeriodLock["lockType"]) => {
    switch (lockType) {
      case "hard":
        return "bg-[var(--sys-status-error)] text-white";
      case "soft":
        return "bg-[var(--sys-status-warning)] text-white";
      case "readonly":
        return "bg-[var(--sys-bg-subtle)] text-[var(--sys-text-secondary)]";
      default:
        return "bg-[var(--sys-bg-subtle)] text-[var(--sys-text-secondary)]";
    }
  };

  const getLockTypeDescription = (lockType: PeriodLock["lockType"]) => {
    switch (lockType) {
      case "hard":
        return "Complete lock - no modifications allowed";
      case "soft":
        return "Soft lock - limited modifications allowed";
      case "readonly":
        return "Read-only - view only, no modifications";
      default:
        return "Unknown lock type";
    }
  };

  const handleLockPeriod = async () => {
    if (onLockPeriod && lockReason.trim()) {
      await onLockPeriod(currentPeriod.id, selectedLockType, lockReason);
      setShowLockDialog(false);
      setLockReason("");
    }
  };

  const handleUnlockPeriod = async (lockId: string) => {
    if (onUnlockPeriod && unlockReason.trim()) {
      await onUnlockPeriod(lockId, unlockReason);
      setShowUnlockDialog(null);
      setUnlockReason("");
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    if (onUpdateLockRule) {
      await onUpdateLockRule(ruleId, { enabled });
    }
  };

  const isPeriodLocked = currentPeriod.status === "locked" || currentPeriod.status === "closed";
  const canLock = !isPeriodLocked && locks.length === 0;

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
              Lock States & Period Management
            </h2>
            <p className="text-[var(--sys-text-secondary)] mt-1">
              {currentPeriod.name} • {new Date(currentPeriod.startDate).toLocaleDateString()} -{" "}
              {new Date(currentPeriod.endDate).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isPeriodLocked ? (
                <Lock className="h-4 w-4 text-[var(--sys-status-error)]" />
              ) : (
                <Unlock className="h-4 w-4 text-[var(--sys-status-success)]" />
              )}
              <span className="text-sm text-[var(--sys-text-secondary)]">
                {currentPeriod.status.charAt(0).toUpperCase() + currentPeriod.status.slice(1)}
              </span>
            </div>

            {canLock && (
              <button
                onClick={() => setShowLockDialog(true)}
                className="px-4 py-2 bg-[var(--sys-status-warning)] text-white rounded-md hover:bg-[var(--sys-status-warning)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-warning)]"
                aria-label="Lock current period"
              >
                <Lock className="h-4 w-4 mr-2 inline" />
                Lock Period
              </button>
            )}
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            {isPeriodLocked ? (
              <AlertTriangle className="h-5 w-5 text-[var(--sys-status-warning)]" />
            ) : (
              <CheckCircle className="h-5 w-5 text-[var(--sys-status-success)]" />
            )}
            <h3 className="font-medium text-[var(--sys-text-primary)]">
              {isPeriodLocked ? "Period is Locked" : "Period is Open"}
            </h3>
          </div>
          <p className="text-sm text-[var(--sys-text-secondary)]">
            {isPeriodLocked
              ? "This period is locked and cannot be modified. Contact your administrator to unlock if needed."
              : "This period is open for modifications. Consider locking when close activities are complete."}
          </p>
        </div>
      </div>

      {/* Active Locks */}
      {locks.length > 0 && (
        <div className="p-6 border-b border-[var(--sys-border-hairline)]">
          <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">Active Locks</h3>

          <div className="space-y-4">
            {locks.map(lock => (
              <div key={lock.id} className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getLockTypeIcon(lock.lockType)}
                    <div>
                      <h4 className="font-medium text-[var(--sys-text-primary)]">
                        {lock.periodName}
                      </h4>
                      <p className="text-sm text-[var(--sys-text-secondary)]">
                        {getLockTypeDescription(lock.lockType)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      getLockTypeColor(lock.lockType),
                    )}
                  >
                    {lock.lockType.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--sys-text-tertiary)]">Locked by:</span>
                    <div className="text-[var(--sys-text-primary)]">
                      {lock.lockedByName || lock.lockedBy}
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--sys-text-tertiary)]">Locked at:</span>
                    <div className="text-[var(--sys-text-primary)]">
                      {new Date(lock.lockedAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--sys-text-tertiary)]">Affected modules:</span>
                    <div className="text-[var(--sys-text-primary)]">
                      {lock.affectedModules.join(", ")}
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--sys-text-tertiary)]">Reason:</span>
                    <div className="text-[var(--sys-text-primary)]">
                      {lock.reason || "No reason provided"}
                    </div>
                  </div>
                </div>

                {lock.canUnlock && (
                  <div className="mt-4 pt-4 border-t border-[var(--sys-border-hairline)]">
                    <button
                      onClick={() => setShowUnlockDialog(lock.id)}
                      className="px-3 py-2 bg-[var(--sys-status-success)] text-white rounded-md hover:bg-[var(--sys-status-success)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-success)]"
                      aria-label={`Unlock ${lock.periodName}`}
                    >
                      <Unlock className="h-4 w-4 mr-2 inline" />
                      Unlock Period
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lock Rules */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">Lock Rules</h3>

        <div className="space-y-4">
          {lockRules.map(rule => (
            <div key={rule.id} className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={e => handleToggleRule(rule.id, e.target.checked)}
                    className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                    aria-label={`Toggle ${rule.name}`}
                  />
                  <div>
                    <h4 className="font-medium text-[var(--sys-text-primary)]">{rule.name}</h4>
                    <p className="text-sm text-[var(--sys-text-secondary)]">{rule.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-[var(--sys-bg-primary)] text-[var(--sys-text-secondary)] px-2 py-1 rounded">
                    {rule.module}
                  </span>
                  {rule.requiresApproval && (
                    <span className="text-xs bg-[var(--sys-status-warning)] text-white px-2 py-1 rounded">
                      Requires Approval
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-[var(--sys-text-tertiary)]">Condition:</span>
                  <div className="text-[var(--sys-text-primary)]">
                    {rule.condition.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>
                {rule.daysAfterPeriod && (
                  <div>
                    <span className="text-[var(--sys-text-tertiary)]">Days after period:</span>
                    <div className="text-[var(--sys-text-primary)]">
                      {rule.daysAfterPeriod} days
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-[var(--sys-text-tertiary)]">Auto unlock:</span>
                  <div className="text-[var(--sys-text-primary)]">
                    {rule.autoUnlock ? "Yes" : "No"}
                  </div>
                </div>
                <div>
                  <span className="text-[var(--sys-text-tertiary)]">Status:</span>
                  <div className="text-[var(--sys-text-primary)]">
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lock Dialog */}
      {showLockDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[var(--sys-text-primary)] mb-4">
              Lock Period
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                  Lock Type
                </label>
                <select
                  value={selectedLockType}
                  onChange={e => setSelectedLockType(e.target.value as PeriodLock["lockType"])}
                  className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                  aria-label="Select lock type"
                >
                  <option value="soft">Soft Lock</option>
                  <option value="hard">Hard Lock</option>
                  <option value="readonly">Read-Only</option>
                </select>
                <p className="text-xs text-[var(--sys-text-secondary)] mt-1">
                  {getLockTypeDescription(selectedLockType)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                  Reason (Required)
                </label>
                <textarea
                  value={lockReason}
                  onChange={e => setLockReason(e.target.value)}
                  placeholder="Provide a reason for locking this period..."
                  className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                  rows={3}
                  aria-label="Lock reason"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowLockDialog(false)}
                className="px-4 py-2 border border-[var(--sys-border-hairline)] rounded-md hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                aria-label="Cancel lock"
              >
                Cancel
              </button>
              <button
                onClick={handleLockPeriod}
                disabled={!lockReason.trim()}
                className="px-4 py-2 bg-[var(--sys-status-warning)] text-white rounded-md hover:bg-[var(--sys-status-warning)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-warning)] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Confirm lock"
              >
                Lock Period
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Dialog */}
      {showUnlockDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[var(--sys-text-primary)] mb-4">
              Unlock Period
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                Unlock Reason (Required)
              </label>
              <textarea
                value={unlockReason}
                onChange={e => setUnlockReason(e.target.value)}
                placeholder="Provide a reason for unlocking this period..."
                className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                rows={3}
                aria-label="Unlock reason"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUnlockDialog(null)}
                className="px-4 py-2 border border-[var(--sys-border-hairline)] rounded-md hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                aria-label="Cancel unlock"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnlockPeriod(showUnlockDialog)}
                disabled={!unlockReason.trim()}
                className="px-4 py-2 bg-[var(--sys-status-success)] text-white rounded-md hover:bg-[var(--sys-status-success)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-success)] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Confirm unlock"
              >
                Unlock Period
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LockStates;
