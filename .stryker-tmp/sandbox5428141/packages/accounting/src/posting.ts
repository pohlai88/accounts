// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { z } from "zod";
import { checkSoDCompliance } from "@aibos/auth";
import { validateCOAFlags, COAValidationError } from "./coa-validation.js";
import { getAccountsInfo, getAllAccountsInfo } from "@aibos/db";
export const JournalLine = z.object(stryMutAct_9fa48("472") ? {} : (stryCov_9fa48("472"), {
  accountId: z.string().uuid(),
  debit: z.number().nonnegative().default(0),
  credit: z.number().nonnegative().default(0),
  description: stryMutAct_9fa48("473") ? z.string().min(200).optional() : (stryCov_9fa48("473"), z.string().max(200).optional()),
  reference: stryMutAct_9fa48("474") ? z.string().min(100).optional() : (stryCov_9fa48("474"), z.string().max(100).optional())
}));
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
  constructor(message: string, public code: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = stryMutAct_9fa48("475") ? "" : (stryCov_9fa48("475"), "PostingError");
  }
}
export function validateBalanced(lines: Array<z.infer<typeof JournalLine>>) {
  if (stryMutAct_9fa48("476")) {
    {}
  } else {
    stryCov_9fa48("476");
    const debit = lines.reduce(stryMutAct_9fa48("477") ? () => undefined : (stryCov_9fa48("477"), (s, l) => stryMutAct_9fa48("478") ? s - l.debit : (stryCov_9fa48("478"), s + l.debit)), 0);
    const credit = lines.reduce(stryMutAct_9fa48("479") ? () => undefined : (stryCov_9fa48("479"), (s, l) => stryMutAct_9fa48("480") ? s - l.credit : (stryCov_9fa48("480"), s + l.credit)), 0);
    if (stryMutAct_9fa48("484") ? Math.abs(debit - credit) <= 0.01 : stryMutAct_9fa48("483") ? Math.abs(debit - credit) >= 0.01 : stryMutAct_9fa48("482") ? false : stryMutAct_9fa48("481") ? true : (stryCov_9fa48("481", "482", "483", "484"), Math.abs(stryMutAct_9fa48("485") ? debit + credit : (stryCov_9fa48("485"), debit - credit)) > 0.01)) {
      if (stryMutAct_9fa48("486")) {
        {}
      } else {
        stryCov_9fa48("486");
        throw new PostingError(stryMutAct_9fa48("487") ? "" : (stryCov_9fa48("487"), "Journal must be balanced: debits must equal credits"), stryMutAct_9fa48("488") ? "" : (stryCov_9fa48("488"), "UNBALANCED_JOURNAL"), stryMutAct_9fa48("489") ? {} : (stryCov_9fa48("489"), {
          totalDebit: debit,
          totalCredit: credit,
          difference: Math.abs(stryMutAct_9fa48("490") ? debit + credit : (stryCov_9fa48("490"), debit - credit))
        }));
      }
    }
  }
}
export function validateJournalLines(lines: Array<z.infer<typeof JournalLine>>) {
  if (stryMutAct_9fa48("491")) {
    {}
  } else {
    stryCov_9fa48("491");
    if (stryMutAct_9fa48("494") ? lines.length !== 0 : stryMutAct_9fa48("493") ? false : stryMutAct_9fa48("492") ? true : (stryCov_9fa48("492", "493", "494"), lines.length === 0)) {
      if (stryMutAct_9fa48("495")) {
        {}
      } else {
        stryCov_9fa48("495");
        throw new PostingError(stryMutAct_9fa48("496") ? "" : (stryCov_9fa48("496"), "Journal must have at least one line"), stryMutAct_9fa48("497") ? "" : (stryCov_9fa48("497"), "NO_LINES"));
      }
    }
    if (stryMutAct_9fa48("501") ? lines.length <= 100 : stryMutAct_9fa48("500") ? lines.length >= 100 : stryMutAct_9fa48("499") ? false : stryMutAct_9fa48("498") ? true : (stryCov_9fa48("498", "499", "500", "501"), lines.length > 100)) {
      if (stryMutAct_9fa48("502")) {
        {}
      } else {
        stryCov_9fa48("502");
        throw new PostingError(stryMutAct_9fa48("503") ? "" : (stryCov_9fa48("503"), "Journal cannot have more than 100 lines"), stryMutAct_9fa48("504") ? "" : (stryCov_9fa48("504"), "TOO_MANY_LINES"));
      }
    }

    // Validate each line has either debit or credit (but not both)
    for (const [index, line] of lines.entries()) {
      if (stryMutAct_9fa48("505")) {
        {}
      } else {
        stryCov_9fa48("505");
        if (stryMutAct_9fa48("508") ? line.debit > 0 || line.credit > 0 : stryMutAct_9fa48("507") ? false : stryMutAct_9fa48("506") ? true : (stryCov_9fa48("506", "507", "508"), (stryMutAct_9fa48("511") ? line.debit <= 0 : stryMutAct_9fa48("510") ? line.debit >= 0 : stryMutAct_9fa48("509") ? true : (stryCov_9fa48("509", "510", "511"), line.debit > 0)) && (stryMutAct_9fa48("514") ? line.credit <= 0 : stryMutAct_9fa48("513") ? line.credit >= 0 : stryMutAct_9fa48("512") ? true : (stryCov_9fa48("512", "513", "514"), line.credit > 0)))) {
          if (stryMutAct_9fa48("515")) {
            {}
          } else {
            stryCov_9fa48("515");
            throw new PostingError(stryMutAct_9fa48("516") ? `` : (stryCov_9fa48("516"), `Line ${stryMutAct_9fa48("517") ? index - 1 : (stryCov_9fa48("517"), index + 1)}: Cannot have both debit and credit amounts`), stryMutAct_9fa48("518") ? "" : (stryCov_9fa48("518"), "INVALID_LINE_AMOUNTS"), stryMutAct_9fa48("519") ? {} : (stryCov_9fa48("519"), {
              lineIndex: index,
              debit: line.debit,
              credit: line.credit
            }));
          }
        }
        if (stryMutAct_9fa48("522") ? line.debit === 0 || line.credit === 0 : stryMutAct_9fa48("521") ? false : stryMutAct_9fa48("520") ? true : (stryCov_9fa48("520", "521", "522"), (stryMutAct_9fa48("524") ? line.debit !== 0 : stryMutAct_9fa48("523") ? true : (stryCov_9fa48("523", "524"), line.debit === 0)) && (stryMutAct_9fa48("526") ? line.credit !== 0 : stryMutAct_9fa48("525") ? true : (stryCov_9fa48("525", "526"), line.credit === 0)))) {
          if (stryMutAct_9fa48("527")) {
            {}
          } else {
            stryCov_9fa48("527");
            throw new PostingError(stryMutAct_9fa48("528") ? `` : (stryCov_9fa48("528"), `Line ${stryMutAct_9fa48("529") ? index - 1 : (stryCov_9fa48("529"), index + 1)}: Must have either debit or credit amount`), stryMutAct_9fa48("530") ? "" : (stryCov_9fa48("530"), "ZERO_AMOUNTS"), stryMutAct_9fa48("531") ? {} : (stryCov_9fa48("531"), {
              lineIndex: index
            }));
          }
        }
      }
    }
  }
}
export function validateSoDCompliance(context: PostingContext) {
  if (stryMutAct_9fa48("532")) {
    {}
  } else {
    stryCov_9fa48("532");
    const sodCheck = checkSoDCompliance(stryMutAct_9fa48("533") ? "" : (stryCov_9fa48("533"), "journal:post"), context.userRole);
    if (stryMutAct_9fa48("536") ? false : stryMutAct_9fa48("535") ? true : stryMutAct_9fa48("534") ? sodCheck.allowed : (stryCov_9fa48("534", "535", "536"), !sodCheck.allowed)) {
      if (stryMutAct_9fa48("537")) {
        {}
      } else {
        stryCov_9fa48("537");
        throw new PostingError(stryMutAct_9fa48("538") ? `` : (stryCov_9fa48("538"), `User role '${context.userRole}' is not authorized to post journal entries`), stryMutAct_9fa48("539") ? "" : (stryCov_9fa48("539"), "SOD_VIOLATION"), stryMutAct_9fa48("540") ? {} : (stryCov_9fa48("540"), {
          action: stryMutAct_9fa48("541") ? "" : (stryCov_9fa48("541"), "journal:post"),
          userRole: context.userRole,
          reason: sodCheck.reason
        }));
      }
    }
    return sodCheck;
  }
}
export async function validateJournalPosting(input: JournalPostingInput) {
  if (stryMutAct_9fa48("542")) {
    {}
  } else {
    stryCov_9fa48("542");
    // 1. Validate SoD compliance
    const sodCheck = validateSoDCompliance(input.context);

    // 2. Validate journal lines structure
    validateJournalLines(input.lines);

    // 3. Validate journal is balanced
    validateBalanced(input.lines);

    // 4. Validate currency format
    if (stryMutAct_9fa48("545") ? !input.currency && input.currency.length !== 3 : stryMutAct_9fa48("544") ? false : stryMutAct_9fa48("543") ? true : (stryCov_9fa48("543", "544", "545"), (stryMutAct_9fa48("546") ? input.currency : (stryCov_9fa48("546"), !input.currency)) || (stryMutAct_9fa48("548") ? input.currency.length === 3 : stryMutAct_9fa48("547") ? false : (stryCov_9fa48("547", "548"), input.currency.length !== 3)))) {
      if (stryMutAct_9fa48("549")) {
        {}
      } else {
        stryCov_9fa48("549");
        throw new PostingError(stryMutAct_9fa48("550") ? "" : (stryCov_9fa48("550"), "Invalid currency code"), stryMutAct_9fa48("551") ? "" : (stryCov_9fa48("551"), "INVALID_CURRENCY"), stryMutAct_9fa48("552") ? {} : (stryCov_9fa48("552"), {
          currency: input.currency
        }));
      }
    }

    // 5. Validate journal date is not in the future
    if (stryMutAct_9fa48("556") ? input.journalDate <= new Date() : stryMutAct_9fa48("555") ? input.journalDate >= new Date() : stryMutAct_9fa48("554") ? false : stryMutAct_9fa48("553") ? true : (stryCov_9fa48("553", "554", "555", "556"), input.journalDate > new Date())) {
      if (stryMutAct_9fa48("557")) {
        {}
      } else {
        stryCov_9fa48("557");
        throw new PostingError(stryMutAct_9fa48("558") ? "" : (stryCov_9fa48("558"), "Journal date cannot be in the future"), stryMutAct_9fa48("559") ? "" : (stryCov_9fa48("559"), "FUTURE_DATE"), stryMutAct_9fa48("560") ? {} : (stryCov_9fa48("560"), {
          journalDate: input.journalDate
        }));
      }
    }

    // 6. Validate COA flags and account rules
    const accountIds = input.lines.map(stryMutAct_9fa48("561") ? () => undefined : (stryCov_9fa48("561"), line => line.accountId));
    try {
      if (stryMutAct_9fa48("562")) {
        {}
      } else {
        stryCov_9fa48("562");
        // Fetch account information
        const [accountsMap, allAccounts] = await Promise.all(stryMutAct_9fa48("563") ? [] : (stryCov_9fa48("563"), [getAccountsInfo(input.context, accountIds), getAllAccountsInfo(input.context)]));

        // Validate COA flags
        const coaValidation = await validateCOAFlags(input.lines, input.currency, accountsMap, allAccounts);
        return stryMutAct_9fa48("564") ? {} : (stryCov_9fa48("564"), {
          validated: stryMutAct_9fa48("565") ? false : (stryCov_9fa48("565"), true),
          requiresApproval: sodCheck.requiresApproval,
          approverRoles: sodCheck.requiresApproval ? stryMutAct_9fa48("566") ? [] : (stryCov_9fa48("566"), [stryMutAct_9fa48("567") ? "" : (stryCov_9fa48("567"), "manager"), stryMutAct_9fa48("568") ? "" : (stryCov_9fa48("568"), "admin")]) : undefined,
          coaWarnings: coaValidation.warnings,
          accountDetails: coaValidation.accountDetails,
          totalDebit: input.lines.reduce(stryMutAct_9fa48("569") ? () => undefined : (stryCov_9fa48("569"), (s, l) => stryMutAct_9fa48("570") ? s - l.debit : (stryCov_9fa48("570"), s + l.debit)), 0),
          totalCredit: input.lines.reduce(stryMutAct_9fa48("571") ? () => undefined : (stryCov_9fa48("571"), (s, l) => stryMutAct_9fa48("572") ? s - l.credit : (stryCov_9fa48("572"), s + l.credit)), 0)
        });
      }
    } catch (error) {
      if (stryMutAct_9fa48("573")) {
        {}
      } else {
        stryCov_9fa48("573");
        if (stryMutAct_9fa48("575") ? false : stryMutAct_9fa48("574") ? true : (stryCov_9fa48("574", "575"), error instanceof COAValidationError)) {
          if (stryMutAct_9fa48("576")) {
            {}
          } else {
            stryCov_9fa48("576");
            throw new PostingError(error.message, error.code, error.details);
          }
        }
        throw error;
      }
    }
  }
}
export async function postJournal(input: JournalPostingInput) {
  if (stryMutAct_9fa48("577")) {
    {}
  } else {
    stryCov_9fa48("577");
    // Validate all posting rules
    const validation = await validateJournalPosting(input);

    // Return validation result for the caller to handle DB operations
    return stryMutAct_9fa48("578") ? {} : (stryCov_9fa48("578"), {
      validated: validation.validated,
      requiresApproval: validation.requiresApproval,
      approverRoles: validation.approverRoles,
      coaWarnings: stryMutAct_9fa48("581") ? validation.coaWarnings && [] : stryMutAct_9fa48("580") ? false : stryMutAct_9fa48("579") ? true : (stryCov_9fa48("579", "580", "581"), validation.coaWarnings || (stryMutAct_9fa48("582") ? ["Stryker was here"] : (stryCov_9fa48("582"), []))),
      accountDetails: validation.accountDetails,
      totalDebit: input.lines.reduce(stryMutAct_9fa48("583") ? () => undefined : (stryCov_9fa48("583"), (s, l) => stryMutAct_9fa48("584") ? s - l.debit : (stryCov_9fa48("584"), s + l.debit)), 0),
      totalCredit: input.lines.reduce(stryMutAct_9fa48("585") ? () => undefined : (stryCov_9fa48("585"), (s, l) => stryMutAct_9fa48("586") ? s - l.credit : (stryCov_9fa48("586"), s + l.credit)), 0)
    });
  }
}