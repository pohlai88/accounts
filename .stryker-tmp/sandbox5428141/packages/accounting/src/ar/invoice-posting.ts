// @ts-nocheck
// D2 AR Invoice Posting Engine - Invoice to GL Integration
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
import { validateJournalPosting, type JournalPostingInput } from "../posting.js";
import { validateFxPolicy } from "../fx/policy.js";
export interface InvoicePostingInput {
  tenantId: string;
  companyId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  currency: string;
  exchangeRate: number;
  arAccountId: string; // Accounts Receivable account
  lines: InvoiceLineInput[];
  taxLines?: TaxLineInput[];
  description?: string;
}
export interface InvoiceLineInput {
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  revenueAccountId: string;
  taxCode?: string;
  taxRate?: number;
  taxAmount?: number;
}
export interface TaxLineInput {
  taxCode: string;
  taxAccountId: string;
  taxAmount: number;
  taxType: "INPUT" | "OUTPUT" | "EXEMPT";
}
export interface InvoicePostingResult {
  validated: true;
  journalInput: JournalPostingInput;
  totalRevenue: number;
  totalTax: number;
  totalAmount: number;
  requiresApproval: boolean;
  approverRoles?: string[];
  coaWarnings?: Array<{
    accountId: string;
    warning: string;
  }>;
}
export interface InvoicePostingError {
  validated: false;
  error: string;
  code: "INVALID_AMOUNTS" | "INVALID_ACCOUNTS" | "INVALID_CURRENCY" | "BUSINESS_RULE_VIOLATION";
}

/**
 * Validates and prepares an AR invoice for GL posting
 *
 * Business Rules:
 * 1. Invoice must be balanced (AR = Revenue + Tax)
 * 2. All accounts must exist and be active
 * 3. Revenue accounts must be REVENUE type
 * 4. AR account must be ASSET type
 * 5. Tax accounts must be LIABILITY type (for output tax)
 * 6. Currency validation with FX policy
 * 7. Line amounts must equal header amounts
 */
export async function validateInvoicePosting(input: InvoicePostingInput, userId: string, userRole: string, baseCurrency: string = stryMutAct_9fa48("292") ? "" : (stryCov_9fa48("292"), "MYR")): Promise<InvoicePostingResult | InvoicePostingError> {
  if (stryMutAct_9fa48("293")) {
    {}
  } else {
    stryCov_9fa48("293");
    try {
      if (stryMutAct_9fa48("294")) {
        {}
      } else {
        stryCov_9fa48("294");
        // 1. Validate basic input
        if (stryMutAct_9fa48("297") ? (!input.invoiceId || !input.arAccountId) && !input.lines.length : stryMutAct_9fa48("296") ? false : stryMutAct_9fa48("295") ? true : (stryCov_9fa48("295", "296", "297"), (stryMutAct_9fa48("299") ? !input.invoiceId && !input.arAccountId : stryMutAct_9fa48("298") ? false : (stryCov_9fa48("298", "299"), (stryMutAct_9fa48("300") ? input.invoiceId : (stryCov_9fa48("300"), !input.invoiceId)) || (stryMutAct_9fa48("301") ? input.arAccountId : (stryCov_9fa48("301"), !input.arAccountId)))) || (stryMutAct_9fa48("302") ? input.lines.length : (stryCov_9fa48("302"), !input.lines.length)))) {
          if (stryMutAct_9fa48("303")) {
            {}
          } else {
            stryCov_9fa48("303");
            return stryMutAct_9fa48("304") ? {} : (stryCov_9fa48("304"), {
              validated: stryMutAct_9fa48("305") ? true : (stryCov_9fa48("305"), false),
              error: stryMutAct_9fa48("306") ? "" : (stryCov_9fa48("306"), "Missing required fields: invoiceId, arAccountId, or lines"),
              code: stryMutAct_9fa48("307") ? "" : (stryCov_9fa48("307"), "INVALID_AMOUNTS")
            });
          }
        }

        // 2. Calculate totals from lines
        const totalRevenue = input.lines.reduce(stryMutAct_9fa48("308") ? () => undefined : (stryCov_9fa48("308"), (sum, line) => stryMutAct_9fa48("309") ? sum - line.lineAmount : (stryCov_9fa48("309"), sum + line.lineAmount)), 0);
        const totalTax = stryMutAct_9fa48("310") ? input.lines.reduce((sum, line) => sum + (line.taxAmount || 0), 0) - (input.taxLines?.reduce((sum, tax) => sum + tax.taxAmount, 0) || 0) : (stryCov_9fa48("310"), input.lines.reduce(stryMutAct_9fa48("311") ? () => undefined : (stryCov_9fa48("311"), (sum, line) => stryMutAct_9fa48("312") ? sum - (line.taxAmount || 0) : (stryCov_9fa48("312"), sum + (stryMutAct_9fa48("315") ? line.taxAmount && 0 : stryMutAct_9fa48("314") ? false : stryMutAct_9fa48("313") ? true : (stryCov_9fa48("313", "314", "315"), line.taxAmount || 0)))), 0) + (stryMutAct_9fa48("318") ? input.taxLines?.reduce((sum, tax) => sum + tax.taxAmount, 0) && 0 : stryMutAct_9fa48("317") ? false : stryMutAct_9fa48("316") ? true : (stryCov_9fa48("316", "317", "318"), (stryMutAct_9fa48("319") ? input.taxLines.reduce((sum, tax) => sum + tax.taxAmount, 0) : (stryCov_9fa48("319"), input.taxLines?.reduce(stryMutAct_9fa48("320") ? () => undefined : (stryCov_9fa48("320"), (sum, tax) => stryMutAct_9fa48("321") ? sum - tax.taxAmount : (stryCov_9fa48("321"), sum + tax.taxAmount)), 0))) || 0)));
        const totalAmount = stryMutAct_9fa48("322") ? totalRevenue - totalTax : (stryCov_9fa48("322"), totalRevenue + totalTax);

        // 3. Validate amounts are positive
        if (stryMutAct_9fa48("326") ? totalRevenue > 0 : stryMutAct_9fa48("325") ? totalRevenue < 0 : stryMutAct_9fa48("324") ? false : stryMutAct_9fa48("323") ? true : (stryCov_9fa48("323", "324", "325", "326"), totalRevenue <= 0)) {
          if (stryMutAct_9fa48("327")) {
            {}
          } else {
            stryCov_9fa48("327");
            return stryMutAct_9fa48("328") ? {} : (stryCov_9fa48("328"), {
              validated: stryMutAct_9fa48("329") ? true : (stryCov_9fa48("329"), false),
              error: stryMutAct_9fa48("330") ? "" : (stryCov_9fa48("330"), "Invoice revenue must be positive"),
              code: stryMutAct_9fa48("331") ? "" : (stryCov_9fa48("331"), "INVALID_AMOUNTS")
            });
          }
        }
        if (stryMutAct_9fa48("335") ? totalAmount > 0 : stryMutAct_9fa48("334") ? totalAmount < 0 : stryMutAct_9fa48("333") ? false : stryMutAct_9fa48("332") ? true : (stryCov_9fa48("332", "333", "334", "335"), totalAmount <= 0)) {
          if (stryMutAct_9fa48("336")) {
            {}
          } else {
            stryCov_9fa48("336");
            return stryMutAct_9fa48("337") ? {} : (stryCov_9fa48("337"), {
              validated: stryMutAct_9fa48("338") ? true : (stryCov_9fa48("338"), false),
              error: stryMutAct_9fa48("339") ? "" : (stryCov_9fa48("339"), "Invoice total amount must be positive"),
              code: stryMutAct_9fa48("340") ? "" : (stryCov_9fa48("340"), "INVALID_AMOUNTS")
            });
          }
        }

        // 4. Validate currency and FX policy
        const fxValidation = validateFxPolicy(baseCurrency, input.currency);
        const exchangeRate = fxValidation.requiresFxRate ? input.exchangeRate : 1.0;
        if (stryMutAct_9fa48("343") ? fxValidation.requiresFxRate || !input.exchangeRate || input.exchangeRate <= 0 : stryMutAct_9fa48("342") ? false : stryMutAct_9fa48("341") ? true : (stryCov_9fa48("341", "342", "343"), fxValidation.requiresFxRate && (stryMutAct_9fa48("345") ? !input.exchangeRate && input.exchangeRate <= 0 : stryMutAct_9fa48("344") ? true : (stryCov_9fa48("344", "345"), (stryMutAct_9fa48("346") ? input.exchangeRate : (stryCov_9fa48("346"), !input.exchangeRate)) || (stryMutAct_9fa48("349") ? input.exchangeRate > 0 : stryMutAct_9fa48("348") ? input.exchangeRate < 0 : stryMutAct_9fa48("347") ? false : (stryCov_9fa48("347", "348", "349"), input.exchangeRate <= 0)))))) {
          if (stryMutAct_9fa48("350")) {
            {}
          } else {
            stryCov_9fa48("350");
            return stryMutAct_9fa48("351") ? {} : (stryCov_9fa48("351"), {
              validated: stryMutAct_9fa48("352") ? true : (stryCov_9fa48("352"), false),
              error: stryMutAct_9fa48("353") ? `` : (stryCov_9fa48("353"), `Exchange rate required for ${input.currency} to ${baseCurrency} conversion`),
              code: stryMutAct_9fa48("354") ? "" : (stryCov_9fa48("354"), "INVALID_CURRENCY")
            });
          }
        }

        // 5. Build journal lines for GL posting
        const journalLines: Array<{
          accountId: string;
          debit: number;
          credit: number;
          description: string;
          reference?: string;
        }> = stryMutAct_9fa48("355") ? ["Stryker was here"] : (stryCov_9fa48("355"), []);

        // Debit: Accounts Receivable (total amount in base currency)
        const arAmountBase = stryMutAct_9fa48("356") ? totalAmount / exchangeRate : (stryCov_9fa48("356"), totalAmount * exchangeRate);
        journalLines.push(stryMutAct_9fa48("357") ? {} : (stryCov_9fa48("357"), {
          accountId: input.arAccountId,
          debit: arAmountBase,
          credit: 0,
          description: stryMutAct_9fa48("358") ? `` : (stryCov_9fa48("358"), `AR - ${input.customerName} - ${input.invoiceNumber}`),
          reference: input.invoiceNumber
        }));

        // Credit: Revenue accounts (line amounts in base currency)
        for (const line of input.lines) {
          if (stryMutAct_9fa48("359")) {
            {}
          } else {
            stryCov_9fa48("359");
            const revenueAmountBase = stryMutAct_9fa48("360") ? line.lineAmount / exchangeRate : (stryCov_9fa48("360"), line.lineAmount * exchangeRate);
            journalLines.push(stryMutAct_9fa48("361") ? {} : (stryCov_9fa48("361"), {
              accountId: line.revenueAccountId,
              debit: 0,
              credit: revenueAmountBase,
              description: stryMutAct_9fa48("362") ? `` : (stryCov_9fa48("362"), `Revenue - ${line.description}`),
              reference: input.invoiceNumber
            }));

            // Credit: Tax amount if applicable
            if (stryMutAct_9fa48("365") ? line.taxAmount && line.taxAmount > 0 || line.taxCode : stryMutAct_9fa48("364") ? false : stryMutAct_9fa48("363") ? true : (stryCov_9fa48("363", "364", "365"), (stryMutAct_9fa48("367") ? line.taxAmount || line.taxAmount > 0 : stryMutAct_9fa48("366") ? true : (stryCov_9fa48("366", "367"), line.taxAmount && (stryMutAct_9fa48("370") ? line.taxAmount <= 0 : stryMutAct_9fa48("369") ? line.taxAmount >= 0 : stryMutAct_9fa48("368") ? true : (stryCov_9fa48("368", "369", "370"), line.taxAmount > 0)))) && line.taxCode)) {
              // Note: Tax account ID would need to be resolved from tax code
              // For now, we'll handle this in the service layer
            }
          }
        }

        // Credit: Tax lines (if any)
        if (stryMutAct_9fa48("372") ? false : stryMutAct_9fa48("371") ? true : (stryCov_9fa48("371", "372"), input.taxLines)) {
          if (stryMutAct_9fa48("373")) {
            {}
          } else {
            stryCov_9fa48("373");
            for (const taxLine of input.taxLines) {
              if (stryMutAct_9fa48("374")) {
                {}
              } else {
                stryCov_9fa48("374");
                const taxAmountBase = stryMutAct_9fa48("375") ? taxLine.taxAmount / exchangeRate : (stryCov_9fa48("375"), taxLine.taxAmount * exchangeRate);
                journalLines.push(stryMutAct_9fa48("376") ? {} : (stryCov_9fa48("376"), {
                  accountId: taxLine.taxAccountId,
                  debit: 0,
                  credit: taxAmountBase,
                  description: stryMutAct_9fa48("377") ? `` : (stryCov_9fa48("377"), `${taxLine.taxCode} Tax - ${input.invoiceNumber}`),
                  reference: input.invoiceNumber
                }));
              }
            }
          }
        }

        // 6. Create journal posting input
        const journalInput: JournalPostingInput = stryMutAct_9fa48("378") ? {} : (stryCov_9fa48("378"), {
          journalNumber: input.invoiceNumber,
          // Use invoice number as journal number
          description: stryMutAct_9fa48("381") ? input.description && `Invoice ${input.invoiceNumber} - ${input.customerName}` : stryMutAct_9fa48("380") ? false : stryMutAct_9fa48("379") ? true : (stryCov_9fa48("379", "380", "381"), input.description || (stryMutAct_9fa48("382") ? `` : (stryCov_9fa48("382"), `Invoice ${input.invoiceNumber} - ${input.customerName}`))),
          journalDate: new Date(input.invoiceDate),
          // Convert string to Date
          currency: baseCurrency,
          // Always post in base currency
          lines: journalLines,
          context: stryMutAct_9fa48("383") ? {} : (stryCov_9fa48("383"), {
            tenantId: input.tenantId,
            companyId: input.companyId,
            userId,
            userRole
          })
        });

        // 7. Validate the journal posting
        const journalValidation = await validateJournalPosting(journalInput);
        if (stryMutAct_9fa48("386") ? false : stryMutAct_9fa48("385") ? true : stryMutAct_9fa48("384") ? journalValidation.validated : (stryCov_9fa48("384", "385", "386"), !journalValidation.validated)) {
          if (stryMutAct_9fa48("387")) {
            {}
          } else {
            stryCov_9fa48("387");
            return stryMutAct_9fa48("388") ? {} : (stryCov_9fa48("388"), {
              validated: stryMutAct_9fa48("389") ? true : (stryCov_9fa48("389"), false),
              error: stryMutAct_9fa48("390") ? `` : (stryCov_9fa48("390"), `Journal validation failed: ${stryMutAct_9fa48("393") ? (journalValidation as {
                error?: string;
              }).error && "Unknown validation error" : stryMutAct_9fa48("392") ? false : stryMutAct_9fa48("391") ? true : (stryCov_9fa48("391", "392", "393"), (journalValidation as {
                error?: string;
              }).error || (stryMutAct_9fa48("394") ? "" : (stryCov_9fa48("394"), "Unknown validation error")))}`),
              code: stryMutAct_9fa48("395") ? "" : (stryCov_9fa48("395"), "BUSINESS_RULE_VIOLATION")
            });
          }
        }

        // 8. Return successful validation
        return stryMutAct_9fa48("396") ? {} : (stryCov_9fa48("396"), {
          validated: stryMutAct_9fa48("397") ? false : (stryCov_9fa48("397"), true),
          journalInput,
          totalRevenue,
          totalTax,
          totalAmount,
          requiresApproval: journalValidation.requiresApproval,
          approverRoles: journalValidation.approverRoles,
          coaWarnings: journalValidation.coaWarnings
        });
      }
    } catch (error) {
      if (stryMutAct_9fa48("398")) {
        {}
      } else {
        stryCov_9fa48("398");
        return stryMutAct_9fa48("399") ? {} : (stryCov_9fa48("399"), {
          validated: stryMutAct_9fa48("400") ? true : (stryCov_9fa48("400"), false),
          error: error instanceof Error ? error.message : stryMutAct_9fa48("401") ? "" : (stryCov_9fa48("401"), "Unknown validation error"),
          code: stryMutAct_9fa48("402") ? "" : (stryCov_9fa48("402"), "BUSINESS_RULE_VIOLATION")
        });
      }
    }
  }
}

/**
 * Calculate invoice totals from lines
 */
export function calculateInvoiceTotals(lines: InvoiceLineInput[]): {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
} {
  if (stryMutAct_9fa48("403")) {
    {}
  } else {
    stryCov_9fa48("403");
    const subtotal = lines.reduce(stryMutAct_9fa48("404") ? () => undefined : (stryCov_9fa48("404"), (sum, line) => stryMutAct_9fa48("405") ? sum - line.lineAmount : (stryCov_9fa48("405"), sum + line.lineAmount)), 0);
    const taxAmount = lines.reduce(stryMutAct_9fa48("406") ? () => undefined : (stryCov_9fa48("406"), (sum, line) => stryMutAct_9fa48("407") ? sum - (line.taxAmount || 0) : (stryCov_9fa48("407"), sum + (stryMutAct_9fa48("410") ? line.taxAmount && 0 : stryMutAct_9fa48("409") ? false : stryMutAct_9fa48("408") ? true : (stryCov_9fa48("408", "409", "410"), line.taxAmount || 0)))), 0);
    const totalAmount = stryMutAct_9fa48("411") ? subtotal - taxAmount : (stryCov_9fa48("411"), subtotal + taxAmount);
    return stryMutAct_9fa48("412") ? {} : (stryCov_9fa48("412"), {
      subtotal: stryMutAct_9fa48("413") ? Math.round(subtotal * 100) * 100 : (stryCov_9fa48("413"), Math.round(stryMutAct_9fa48("414") ? subtotal / 100 : (stryCov_9fa48("414"), subtotal * 100)) / 100),
      // Round to 2 decimal places
      taxAmount: stryMutAct_9fa48("415") ? Math.round(taxAmount * 100) * 100 : (stryCov_9fa48("415"), Math.round(stryMutAct_9fa48("416") ? taxAmount / 100 : (stryCov_9fa48("416"), taxAmount * 100)) / 100),
      totalAmount: stryMutAct_9fa48("417") ? Math.round(totalAmount * 100) * 100 : (stryCov_9fa48("417"), Math.round(stryMutAct_9fa48("418") ? totalAmount / 100 : (stryCov_9fa48("418"), totalAmount * 100)) / 100)
    });
  }
}

/**
 * Validate invoice line calculations
 */
export function validateInvoiceLines(lines: InvoiceLineInput[]): {
  valid: boolean;
  errors: string[];
} {
  if (stryMutAct_9fa48("419")) {
    {}
  } else {
    stryCov_9fa48("419");
    const errors: string[] = stryMutAct_9fa48("420") ? ["Stryker was here"] : (stryCov_9fa48("420"), []);
    for (const line of lines) {
      if (stryMutAct_9fa48("421")) {
        {}
      } else {
        stryCov_9fa48("421");
        // Validate line amount calculation
        const expectedLineAmount = stryMutAct_9fa48("422") ? line.quantity / line.unitPrice : (stryCov_9fa48("422"), line.quantity * line.unitPrice);
        const actualLineAmount = line.lineAmount;
        if (stryMutAct_9fa48("426") ? Math.abs(expectedLineAmount - actualLineAmount) <= 0.01 : stryMutAct_9fa48("425") ? Math.abs(expectedLineAmount - actualLineAmount) >= 0.01 : stryMutAct_9fa48("424") ? false : stryMutAct_9fa48("423") ? true : (stryCov_9fa48("423", "424", "425", "426"), Math.abs(stryMutAct_9fa48("427") ? expectedLineAmount + actualLineAmount : (stryCov_9fa48("427"), expectedLineAmount - actualLineAmount)) > 0.01)) {
          if (stryMutAct_9fa48("428")) {
            {}
          } else {
            stryCov_9fa48("428");
            errors.push(stryMutAct_9fa48("429") ? `` : (stryCov_9fa48("429"), `Line ${line.lineNumber}: Line amount ${actualLineAmount} does not match quantity × unit price ${expectedLineAmount}`));
          }
        }

        // Validate tax calculation if tax is applied
        if (stryMutAct_9fa48("432") ? line.taxRate || line.taxRate > 0 : stryMutAct_9fa48("431") ? false : stryMutAct_9fa48("430") ? true : (stryCov_9fa48("430", "431", "432"), line.taxRate && (stryMutAct_9fa48("435") ? line.taxRate <= 0 : stryMutAct_9fa48("434") ? line.taxRate >= 0 : stryMutAct_9fa48("433") ? true : (stryCov_9fa48("433", "434", "435"), line.taxRate > 0)))) {
          if (stryMutAct_9fa48("436")) {
            {}
          } else {
            stryCov_9fa48("436");
            const expectedTaxAmount = stryMutAct_9fa48("437") ? line.lineAmount / line.taxRate : (stryCov_9fa48("437"), line.lineAmount * line.taxRate);
            const actualTaxAmount = stryMutAct_9fa48("440") ? line.taxAmount && 0 : stryMutAct_9fa48("439") ? false : stryMutAct_9fa48("438") ? true : (stryCov_9fa48("438", "439", "440"), line.taxAmount || 0);
            if (stryMutAct_9fa48("444") ? Math.abs(expectedTaxAmount - actualTaxAmount) <= 0.01 : stryMutAct_9fa48("443") ? Math.abs(expectedTaxAmount - actualTaxAmount) >= 0.01 : stryMutAct_9fa48("442") ? false : stryMutAct_9fa48("441") ? true : (stryCov_9fa48("441", "442", "443", "444"), Math.abs(stryMutAct_9fa48("445") ? expectedTaxAmount + actualTaxAmount : (stryCov_9fa48("445"), expectedTaxAmount - actualTaxAmount)) > 0.01)) {
              if (stryMutAct_9fa48("446")) {
                {}
              } else {
                stryCov_9fa48("446");
                errors.push(stryMutAct_9fa48("447") ? `` : (stryCov_9fa48("447"), `Line ${line.lineNumber}: Tax amount ${actualTaxAmount} does not match line amount × tax rate ${expectedTaxAmount}`));
              }
            }
          }
        }

        // Validate positive amounts
        if (stryMutAct_9fa48("451") ? line.quantity > 0 : stryMutAct_9fa48("450") ? line.quantity < 0 : stryMutAct_9fa48("449") ? false : stryMutAct_9fa48("448") ? true : (stryCov_9fa48("448", "449", "450", "451"), line.quantity <= 0)) {
          if (stryMutAct_9fa48("452")) {
            {}
          } else {
            stryCov_9fa48("452");
            errors.push(stryMutAct_9fa48("453") ? `` : (stryCov_9fa48("453"), `Line ${line.lineNumber}: Quantity must be positive`));
          }
        }
        if (stryMutAct_9fa48("457") ? line.unitPrice >= 0 : stryMutAct_9fa48("456") ? line.unitPrice <= 0 : stryMutAct_9fa48("455") ? false : stryMutAct_9fa48("454") ? true : (stryCov_9fa48("454", "455", "456", "457"), line.unitPrice < 0)) {
          if (stryMutAct_9fa48("458")) {
            {}
          } else {
            stryCov_9fa48("458");
            errors.push(stryMutAct_9fa48("459") ? `` : (stryCov_9fa48("459"), `Line ${line.lineNumber}: Unit price cannot be negative`));
          }
        }
        if (stryMutAct_9fa48("463") ? line.lineAmount >= 0 : stryMutAct_9fa48("462") ? line.lineAmount <= 0 : stryMutAct_9fa48("461") ? false : stryMutAct_9fa48("460") ? true : (stryCov_9fa48("460", "461", "462", "463"), line.lineAmount < 0)) {
          if (stryMutAct_9fa48("464")) {
            {}
          } else {
            stryCov_9fa48("464");
            errors.push(stryMutAct_9fa48("465") ? `` : (stryCov_9fa48("465"), `Line ${line.lineNumber}: Line amount cannot be negative`));
          }
        }
      }
    }
    return stryMutAct_9fa48("466") ? {} : (stryCov_9fa48("466"), {
      valid: stryMutAct_9fa48("469") ? errors.length !== 0 : stryMutAct_9fa48("468") ? false : stryMutAct_9fa48("467") ? true : (stryCov_9fa48("467", "468", "469"), errors.length === 0),
      errors
    });
  }
}

/**
 * Generate invoice posting description
 */
export function generateInvoiceDescription(invoiceNumber: string, customerName: string, totalAmount: number, currency: string): string {
  if (stryMutAct_9fa48("470")) {
    {}
  } else {
    stryCov_9fa48("470");
    return stryMutAct_9fa48("471") ? `` : (stryCov_9fa48("471"), `Invoice ${invoiceNumber} - ${customerName} - ${currency} ${totalAmount.toFixed(2)}`);
  }
}