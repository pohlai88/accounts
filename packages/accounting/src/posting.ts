import { z } from "zod";
import { checkSoDCompliance } from "@aibos/auth";
import { validateCOAFlags, COAValidationError } from "./coa-validation";
import { getAccountsInfo, getAllAccountsInfo } from "@aibos/db";

export const JournalLine = z.object({
  accountId: z.string().uuid(),
  debit: z.number().nonnegative().default(0),
  credit: z.number().nonnegative().default(0),
  description: z.string().max(200).optional(),
  reference: z.string().max(100).optional()
});

export interface PostingContext {
  tenantId: string;
  companyId: string;
  userId: string;
  userRole: string;
}

export interface JournalPostingInput {
  journalNumber: string;
  description?: string;
  journalDate: Date;
  currency: string;
  lines: Array<z.infer<typeof JournalLine>>;
  context: PostingContext;
}

export class PostingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PostingError';
  }
}

export function validateBalanced(lines: Array<z.infer<typeof JournalLine>>) {
  const debit = lines.reduce((s, l) => s + l.debit, 0);
  const credit = lines.reduce((s, l) => s + l.credit, 0);

  if (Math.abs(debit - credit) > 0.01) {
    throw new PostingError(
      "Journal must be balanced: debits must equal credits",
      "UNBALANCED_JOURNAL",
      { totalDebit: debit, totalCredit: credit, difference: Math.abs(debit - credit) }
    );
  }
}

export function validateJournalLines(lines: Array<z.infer<typeof JournalLine>>) {
  if (lines.length === 0) {
    throw new PostingError("Journal must have at least one line", "NO_LINES");
  }

  if (lines.length > 100) {
    throw new PostingError("Journal cannot have more than 100 lines", "TOO_MANY_LINES");
  }

  // Validate each line has either debit or credit (but not both)
  for (const [index, line] of lines.entries()) {
    if (line.debit > 0 && line.credit > 0) {
      throw new PostingError(
        `Line ${index + 1}: Cannot have both debit and credit amounts`,
        "INVALID_LINE_AMOUNTS",
        { lineIndex: index, debit: line.debit, credit: line.credit }
      );
    }

    if (line.debit === 0 && line.credit === 0) {
      throw new PostingError(
        `Line ${index + 1}: Must have either debit or credit amount`,
        "ZERO_AMOUNTS",
        { lineIndex: index }
      );
    }
  }
}

export function validateSoDCompliance(context: PostingContext) {
  const sodCheck = checkSoDCompliance('journal:post', context.userRole);

  if (!sodCheck.allowed) {
    throw new PostingError(
      `User role '${context.userRole}' is not authorized to post journal entries`,
      "SOD_VIOLATION",
      { action: 'journal:post', userRole: context.userRole, reason: sodCheck.reason }
    );
  }

  return sodCheck;
}

export async function validateJournalPosting(input: JournalPostingInput) {
  // 1. Validate SoD compliance
  const sodCheck = validateSoDCompliance(input.context);

  // 2. Validate journal lines structure
  validateJournalLines(input.lines);

  // 3. Validate journal is balanced
  validateBalanced(input.lines);

  // 4. Validate currency format
  if (!input.currency || input.currency.length !== 3) {
    throw new PostingError("Invalid currency code", "INVALID_CURRENCY", { currency: input.currency });
  }

  // 5. Validate journal date is not in the future
  if (input.journalDate > new Date()) {
    throw new PostingError("Journal date cannot be in the future", "FUTURE_DATE", { journalDate: input.journalDate });
  }

  // 6. Validate COA flags and account rules
  const accountIds = input.lines.map(line => line.accountId);

  try {
    // Fetch account information
    const [accountsMap, allAccounts] = await Promise.all([
      getAccountsInfo(input.context, accountIds),
      getAllAccountsInfo(input.context)
    ]);

    // Validate COA flags
    const coaValidation = await validateCOAFlags(
      input.lines,
      input.currency,
      accountsMap,
      allAccounts
    );

    return {
      validated: true,
      requiresApproval: sodCheck.requiresApproval,
      approverRoles: sodCheck.requiresApproval ? ['manager', 'admin'] : undefined,
      coaWarnings: coaValidation.warnings,
      accountDetails: coaValidation.accountDetails,
      totalDebit: input.lines.reduce((s, l) => s + l.debit, 0),
      totalCredit: input.lines.reduce((s, l) => s + l.credit, 0)
    };

  } catch (error) {
    if (error instanceof COAValidationError) {
      throw new PostingError(
        error.message,
        error.code,
        error.details
      );
    }
    throw error;
  }
}

export async function postJournal(input: JournalPostingInput) {
  // Validate all posting rules
  const validation = await validateJournalPosting(input);

  // Return validation result for the caller to handle DB operations
  return {
    validated: validation.validated,
    requiresApproval: validation.requiresApproval,
    approverRoles: validation.approverRoles,
    coaWarnings: validation.coaWarnings || [],
    accountDetails: validation.accountDetails,
    totalDebit: input.lines.reduce((s, l) => s + l.debit, 0),
    totalCredit: input.lines.reduce((s, l) => s + l.credit, 0)
  };
}
