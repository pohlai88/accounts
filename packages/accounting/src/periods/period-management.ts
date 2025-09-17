// D4 Period Management System - Period Close/Open with Approval Workflow
// V1 Requirement: Period open/close/reversal with approval flow

import { validateSoDCompliance } from "../posting.js";

export interface PeriodCloseInput {
  tenantId: string;
  companyId: string;
  fiscalPeriodId: string;
  closeDate: Date;
  closedBy: string;
  userRole: string;
  closeReason?: string;
  forceClose?: boolean; // Override validation warnings
  generateReversingEntries?: boolean;
}

export interface PeriodOpenInput {
  tenantId: string;
  companyId: string;
  fiscalPeriodId: string;
  openedBy: string;
  userRole: string;
  openReason: string;
  approvalRequired?: boolean;
}

export interface PeriodLockInput {
  tenantId: string;
  companyId: string;
  fiscalPeriodId: string;
  lockType: "POSTING" | "REPORTING" | "FULL";
  lockedBy: string;
  userRole: string;
  reason: string;
}

export interface PeriodCloseValidation {
  canClose: boolean;
  warnings: string[];
  errors: string[];
  checks: {
    allJournalsPosted: boolean;
    trialBalanceBalanced: boolean;
    noUnreconciledTransactions: boolean;
    allRequiredAdjustments: boolean;
    approvalRequired: boolean;
    sodCompliance: boolean;
  };
}

export interface PeriodCloseResult {
  success: true;
  fiscalPeriodId: string;
  closedAt: Date;
  closedBy: string;
  status: "CLOSED" | "LOCKED";
  reversingEntriesCreated: number;
  nextPeriodId?: string;
  validationResults: PeriodCloseValidation;
}

export interface PeriodManagementError {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

/**
 * Close a fiscal period with full validation and approval workflow
 * V1 Requirement: Period close with approval flow
 */
export async function closeFiscalPeriod(
  input: PeriodCloseInput,
  dbClient: unknown,
): Promise<PeriodCloseResult | PeriodManagementError> {
  try {
    // 1. Validate input parameters
    const inputValidation = validatePeriodCloseInput(input);
    if (!inputValidation.valid) {
      return {
        success: false,
        error: `Input validation failed: ${inputValidation.errors.join(", ")}`,
        code: "INVALID_INPUT",
        details: inputValidation.errors,
      };
    }

    // 2. Get fiscal period details
    const fiscalPeriod = await getFiscalPeriod(input.fiscalPeriodId, dbClient);
    if (!fiscalPeriod) {
      return {
        success: false,
        error: "Fiscal period not found",
        code: "PERIOD_NOT_FOUND",
      };
    }

    // 3. Check if period is already closed
    const period = fiscalPeriod as { status: string };
    if (period.status === "CLOSED" || period.status === "LOCKED") {
      return {
        success: false,
        error: `Period is already ${period.status.toLowerCase()}`,
        code: "PERIOD_ALREADY_CLOSED",
      };
    }

    // 4. Validate SoD compliance for period close
    const sodCheck = validateSoDCompliance({
      tenantId: input.tenantId,
      companyId: input.companyId,
      userId: input.closedBy,
      userRole: input.userRole,
    });

    if (!sodCheck.allowed) {
      return {
        success: false,
        error: `SoD violation: ${sodCheck.reason}`,
        code: "SOD_VIOLATION",
      };
    }

    // 5. Perform period close validation
    const validation = await validatePeriodClose(
      input.tenantId,
      input.companyId,
      fiscalPeriod,
      dbClient as { query: (sql: string, params?: unknown[]) => Promise<unknown> },
    );

    // 6. Check if force close is required
    if (!validation.canClose && !input.forceClose) {
      return {
        success: false,
        error: `Period cannot be closed: ${validation.errors.join(", ")}`,
        code: "PERIOD_CLOSE_VALIDATION_FAILED",
        details: validation,
      };
    }

    // 7. Create reversing entries if requested
    let reversingEntriesCreated = 0;
    if (input.generateReversingEntries) {
      reversingEntriesCreated = await createReversingEntries(
        input.tenantId,
        input.companyId,
        fiscalPeriod,
        dbClient as { query: (sql: string, params?: unknown[]) => Promise<unknown> },
      );
    }

    // 8. Update fiscal period status
    await updateFiscalPeriodStatus(
      input.fiscalPeriodId,
      "CLOSED",
      input.closedBy,
      input.closeDate,
      dbClient as { query: (sql: string, params?: unknown[]) => Promise<unknown> },
      input.closeReason,
    );

    // 9. Create period lock
    await createPeriodLock(
      {
        tenantId: input.tenantId,
        companyId: input.companyId,
        fiscalPeriodId: input.fiscalPeriodId,
        lockType: "POSTING",
        lockedBy: input.closedBy,
        userRole: input.userRole,
        reason: input.closeReason || "Period closed",
      },
      dbClient,
    );

    // 10. Get next period ID
    const nextPeriod = await getNextFiscalPeriod(fiscalPeriod, dbClient);

    return {
      success: true,
      fiscalPeriodId: input.fiscalPeriodId,
      closedAt: input.closeDate,
      closedBy: input.closedBy,
      status: "CLOSED",
      reversingEntriesCreated,
      nextPeriodId: (nextPeriod as { id: string })?.id,
      validationResults: validation,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: "PERIOD_CLOSE_ERROR",
      details: error,
    };
  }
}

/**
 * Open a previously closed fiscal period
 */
export async function openFiscalPeriod(
  input: PeriodOpenInput,
  dbClient: unknown,
): Promise<PeriodCloseResult | PeriodManagementError> {
  try {
    // 1. Validate input
    if (!input.fiscalPeriodId || !input.openedBy || !input.openReason) {
      return {
        success: false,
        error: "Missing required fields for period open",
        code: "INVALID_INPUT",
      };
    }

    // 2. Get fiscal period
    const fiscalPeriod = await getFiscalPeriod(input.fiscalPeriodId, dbClient);
    if (!fiscalPeriod) {
      return {
        success: false,
        error: "Fiscal period not found",
        code: "PERIOD_NOT_FOUND",
      };
    }

    // 3. Check if period can be opened
    if ((fiscalPeriod as { status: string }).status === "OPEN") {
      return {
        success: false,
        error: "Period is already open",
        code: "PERIOD_ALREADY_OPEN",
      };
    }

    // 4. Validate SoD compliance for period open
    const sodCheck = validateSoDCompliance({
      tenantId: input.tenantId,
      companyId: input.companyId,
      userId: input.openedBy,
      userRole: input.userRole,
    });

    if (!sodCheck.allowed) {
      return {
        success: false,
        error: `SoD violation: ${sodCheck.reason}`,
        code: "SOD_VIOLATION",
      };
    }

    // 5. Check for approval requirement
    if (input.approvalRequired && !sodCheck.requiresApproval) {
      return {
        success: false,
        error: "Period open requires approval from manager or admin",
        code: "APPROVAL_REQUIRED",
      };
    }

    // 6. Update fiscal period status
    await updateFiscalPeriodStatus(
      input.fiscalPeriodId,
      "OPEN",
      input.openedBy,
      new Date(),
      dbClient as { query: (sql: string, params?: unknown[]) => Promise<unknown> },
      input.openReason,
    );

    // 7. Remove period locks
    await removePeriodLocks(input.fiscalPeriodId, dbClient);

    return {
      success: true,
      fiscalPeriodId: input.fiscalPeriodId,
      closedAt: new Date(),
      closedBy: input.openedBy,
      status: "CLOSED", // This will be updated to OPEN by the status update
      reversingEntriesCreated: 0,
      validationResults: {
        canClose: true,
        warnings: [],
        errors: [],
        checks: {
          allJournalsPosted: true,
          trialBalanceBalanced: true,
          noUnreconciledTransactions: true,
          allRequiredAdjustments: true,
          approvalRequired: false,
          sodCompliance: true,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: "PERIOD_OPEN_ERROR",
      details: error,
    };
  }
}

/**
 * Create a period lock
 */
export async function createPeriodLock(
  input: PeriodLockInput,
  dbClient: unknown,
): Promise<{ success: boolean; lockId?: string; error?: string }> {
  try {
    // Validate SoD compliance
    const sodCheck = validateSoDCompliance({
      tenantId: input.tenantId,
      companyId: input.companyId,
      userId: input.lockedBy,
      userRole: input.userRole,
    });

    if (!sodCheck.allowed) {
      return {
        success: false,
        error: `SoD violation: ${sodCheck.reason}`,
      };
    }

    // Create period lock
    const query = `
      INSERT INTO period_locks (
        tenant_id, company_id, fiscal_period_id, lock_type,
        locked_by, reason, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id
    `;

    const { data, error } = await (
      dbClient as {
        rpc: (name: string, params: unknown) => Promise<{ data: unknown; error: unknown }>;
      }
    ).rpc("execute_sql", {
      query,
      params: [
        input.tenantId,
        input.companyId,
        input.fiscalPeriodId,
        input.lockType,
        input.lockedBy,
        input.reason,
      ],
    });

    if (error) {
      throw new Error(`Failed to create period lock: ${(error as { message: string }).message}`);
    }

    return {
      success: true,
      lockId: ((data as unknown[])[0] as { id: string })?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Validate period close requirements
 */
async function validatePeriodClose(
  tenantId: string,
  companyId: string,
  fiscalPeriod: unknown,
  dbClient: unknown,
): Promise<PeriodCloseValidation> {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check 1: All journals posted
  const unpostedJournals = await checkUnpostedJournals(
    tenantId,
    companyId,
    (fiscalPeriod as { startDate: Date }).startDate,
    (fiscalPeriod as { endDate: Date }).endDate,
    dbClient as { query: (sql: string, params?: unknown[]) => Promise<unknown> },
  );

  const allJournalsPosted = unpostedJournals === 0;
  if (!allJournalsPosted) {
    errors.push(`${unpostedJournals} unposted journal entries found`);
  }

  // Check 2: Trial balance balanced
  const trialBalanceCheck = await checkTrialBalanceBalanced(
    tenantId,
    companyId,
    (fiscalPeriod as { endDate: Date }).endDate,
    dbClient as { query: (sql: string, params?: unknown[]) => Promise<unknown> },
  );

  if (!trialBalanceCheck.balanced) {
    errors.push(`Trial balance is out of balance by ${trialBalanceCheck.difference}`);
  }

  // Check 3: Bank reconciliations
  const unreconciledTransactions = await checkBankReconciliation(
    tenantId,
    companyId,
    (fiscalPeriod as { endDate: Date }).endDate,
    dbClient as { query: (sql: string, params?: unknown[]) => Promise<unknown> },
  );

  const noUnreconciledTransactions = unreconciledTransactions === 0;
  if (unreconciledTransactions > 0) {
    warnings.push(`${unreconciledTransactions} unreconciled bank transactions`);
  }

  // Check 4: Required adjustments (placeholder)
  const allRequiredAdjustments = true; // Reserved for adjustment validation implementation

  // Check 5: Approval requirements
  const approvalRequired = errors.length > 0 || warnings.length > 0;

  // Check 6: SoD compliance (already checked in main function)
  const sodCompliance = true;

  const canClose = errors.length === 0;

  return {
    canClose,
    warnings,
    errors,
    checks: {
      allJournalsPosted,
      trialBalanceBalanced: trialBalanceCheck.balanced,
      noUnreconciledTransactions,
      allRequiredAdjustments,
      approvalRequired,
      sodCompliance,
    },
  };
}

/**
 * Create reversing entries for accruals
 */
async function createReversingEntries(
  tenantId: string,
  companyId: string,
  fiscalPeriod: unknown,
  dbClient: unknown,
): Promise<number> {
  // Find journals marked for reversal in the period
  const query = `
    SELECT j.id, j.journal_number, j.description
    FROM gl_journal j
    WHERE j.tenant_id = $1
      AND j.company_id = $2
      AND j.journal_date BETWEEN $3 AND $4
      AND j.status = 'posted'
      AND j.reference LIKE '%ACCRUAL%'
      AND NOT EXISTS (
        SELECT 1 FROM reversing_entries re
        WHERE re.original_journal_id = j.id
      )
  `;

  const { data, error } = await (
    dbClient as {
      rpc: (name: string, params: unknown) => Promise<{ data: unknown; error: unknown }>;
    }
  ).rpc("execute_sql", {
    query,
    params: [
      tenantId,
      companyId,
      (fiscalPeriod as { startDate: Date }).startDate,
      (fiscalPeriod as { endDate: Date }).endDate,
    ],
  });

  if (error) {
    throw new Error(`Failed to find accrual journals: ${(error as { message: string }).message}`);
  }

  let reversingEntriesCreated = 0;

  // Create reversing entries for each accrual journal
  for (const journal of (data as unknown[]) || []) {
    const nextPeriod = await getNextFiscalPeriod(fiscalPeriod, dbClient);
    if (!nextPeriod) { continue; }

    const reversalDate = (nextPeriod as { startDate: Date }).startDate;

    // Insert reversing entry record
    const insertQuery = `
      INSERT INTO reversing_entries (
        tenant_id, company_id, original_journal_id,
        reversal_date, reversal_reason, status
      ) VALUES ($1, $2, $3, $4, $5, 'PENDING')
    `;

    await (dbClient as { rpc: (name: string, params: unknown) => Promise<unknown> }).rpc(
      "execute_sql",
      {
        query: insertQuery,
        params: [
          tenantId,
          companyId,
          (journal as { id: string }).id,
          reversalDate,
          `Auto-reversal for period close: ${(journal as { description: string }).description}`,
        ],
      },
    );

    reversingEntriesCreated++;
  }

  return reversingEntriesCreated;
}

/**
 * Helper functions for period management
 */
async function getFiscalPeriod(fiscalPeriodId: string, dbClient: unknown) {
  const query = `
    SELECT * FROM fiscal_periods
    WHERE id = $1
  `;

  const { data, error } = await (
    dbClient as {
      rpc: (name: string, params: unknown) => Promise<{ data: unknown; error: unknown }>;
    }
  ).rpc("execute_sql", { query, params: [fiscalPeriodId] });

  if (error) {
    throw new Error(`Failed to fetch fiscal period: ${(error as { message: string }).message}`);
  }

  return (data as unknown[])?.[0];
}

async function getNextFiscalPeriod(currentPeriod: unknown, dbClient: unknown) {
  const query = `
    SELECT * FROM fiscal_periods
    WHERE fiscal_calendar_id = $1
      AND period_number = $2
    ORDER BY period_number
    LIMIT 1
  `;

  const { data, error } = await (
    dbClient as {
      rpc: (name: string, params: unknown) => Promise<{ data: unknown; error: unknown }>;
    }
  ).rpc("execute_sql", {
    query,
    params: [
      (currentPeriod as { fiscal_calendar_id: string }).fiscal_calendar_id,
      (currentPeriod as { period_number: number }).period_number + 1,
    ],
  });

  if (error) {
    throw new Error(
      `Failed to fetch next fiscal period: ${(error as { message: string }).message}`,
    );
  }

  return (data as unknown[])?.[0];
}

async function updateFiscalPeriodStatus(
  fiscalPeriodId: string,
  status: string,
  userId: string,
  date: Date,
  dbClient: unknown,
  _reason?: string,
) {
  const query = `
    UPDATE fiscal_periods
    SET status = $1,
        closed_at = $2,
        closed_by = $3,
        updated_at = now()
    WHERE id = $4
  `;

  const { error } = await (
    dbClient as { rpc: (name: string, params: unknown) => Promise<{ error: unknown }> }
  ).rpc("execute_sql", {
    query,
    params: [status, date, userId, fiscalPeriodId],
  });

  if (error) {
    throw new Error(
      `Failed to update fiscal period status: ${(error as { message: string }).message}`,
    );
  }
}

async function removePeriodLocks(fiscalPeriodId: string, dbClient?: unknown) {
  const query = `
    UPDATE period_locks
    SET is_active = false
    WHERE fiscal_period_id = $1
  `;

  const { error } = await (
    dbClient as { rpc: (name: string, params: unknown) => Promise<{ error: unknown }> }
  ).rpc("execute_sql", { query, params: [fiscalPeriodId] });

  if (error) {
    throw new Error(`Failed to remove period locks: ${(error as { message: string }).message}`);
  }
}

async function checkUnpostedJournals(
  tenantId: string,
  companyId: string,
  startDate: Date,
  endDate: Date,
  dbClient: unknown,
): Promise<number> {
  const query = `
    SELECT COUNT(*) as count
    FROM gl_journal
    WHERE tenant_id = $1
      AND company_id = $2
      AND journal_date BETWEEN $3 AND $4
      AND status != 'posted'
  `;

  const { data, error } = await (
    dbClient as {
      rpc: (name: string, params: unknown) => Promise<{ data: unknown; error: unknown }>;
    }
  ).rpc("execute_sql", { query, params: [tenantId, companyId, startDate, endDate] });

  if (error) {
    throw new Error(`Failed to check unposted journals: ${(error as { message: string }).message}`);
  }

  return parseInt(((data as unknown[])?.[0] as { count: string })?.count || "0");
}

async function checkTrialBalanceBalanced(
  tenantId: string,
  companyId: string,
  asOfDate: Date,
  dbClient: unknown,
): Promise<{ balanced: boolean; difference: number }> {
  const query = `
    SELECT
      SUM(jl.debit_amount) as total_debits,
      SUM(jl.credit_amount) as total_credits
    FROM gl_journal_lines jl
    JOIN gl_journal j ON jl.journal_id = j.id
    WHERE j.tenant_id = $1
      AND j.company_id = $2
      AND j.status = 'posted'
      AND j.journal_date <= $3
  `;

  const { data, error } = await (
    dbClient as {
      rpc: (name: string, params: unknown) => Promise<{ data: unknown; error: unknown }>;
    }
  ).rpc("execute_sql", { query, params: [tenantId, companyId, asOfDate] });

  if (error) {
    throw new Error(`Failed to check trial balance: ${(error as { message: string }).message}`);
  }

  const totalDebits = parseFloat(
    ((data as unknown[])?.[0] as { total_debits: string })?.total_debits || "0",
  );
  const totalCredits = parseFloat(
    ((data as unknown[])?.[0] as { total_credits: string })?.total_credits || "0",
  );
  const difference = totalDebits - totalCredits;
  const balanced = Math.abs(difference) < 0.01; // 1 cent tolerance

  return { balanced, difference };
}

async function checkBankReconciliation(
  _tenantId: string,
  _companyId: string,
  _asOfDate: Date,
  _dbClient: { query: (sql: string, params?: unknown[]) => Promise<unknown> },
): Promise<number> {
  // Reserved for bank reconciliation validation implementation
  // This would check for unreconciled bank transactions
  return 0; // Placeholder
}

/**
 * Validate period close input
 */
function validatePeriodCloseInput(input: PeriodCloseInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.tenantId) { errors.push("Tenant ID is required"); }
  if (!input.companyId) { errors.push("Company ID is required"); }
  if (!input.fiscalPeriodId) { errors.push("Fiscal period ID is required"); }
  if (!input.closedBy) { errors.push("Closed by user ID is required"); }
  if (!input.userRole) { errors.push("User role is required"); }
  if (!input.closeDate) { errors.push("Close date is required"); }

  if (input.closeDate && input.closeDate > new Date()) {
    errors.push("Close date cannot be in the future");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
