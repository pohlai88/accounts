// @ts-nocheck
// D3 AP Payment Processing Engine - Payment to GL Integration
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
import { validateJournalPosting, type JournalPostingInput, type PostingContext } from "../posting.js";
import { validateFxPolicy } from "../fx/policy.js";
export interface PaymentProcessingInput {
  tenantId: string;
  companyId: string;
  paymentId: string;
  paymentNumber: string;
  paymentDate: string;
  paymentMethod: "BANK_TRANSFER" | "CHECK" | "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "OTHER";
  bankAccountId: string;
  currency: string;
  exchangeRate: number;
  amount: number;
  reference?: string;
  description?: string;
  allocations: PaymentAllocationInput[];
}
export interface PaymentAllocationInput {
  type: "BILL" | "INVOICE";
  documentId: string; // billId or invoiceId
  documentNumber: string;
  supplierId?: string; // For bill payments
  customerId?: string; // For invoice receipts
  allocatedAmount: number;
  apAccountId?: string; // For bill payments
  arAccountId?: string; // For invoice receipts
}
export interface PaymentProcessingResult {
  success: true;
  journalId: string;
  journalNumber: string;
  totalAmount: number;
  allocationsProcessed: number;
  lines: Array<{
    accountId: string;
    debit: number;
    credit: number;
    description: string;
  }>;
}
export interface PaymentProcessingError {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

/**
 * Validates and posts a payment to the General Ledger
 *
 * Journal Entry Structure for Bill Payment:
 * Dr. Accounts Payable                XXX
 *     Cr. Bank Account                    XXX
 *
 * Journal Entry Structure for Invoice Receipt:
 * Dr. Bank Account                    XXX
 *     Cr. Accounts Receivable             XXX
 */
export async function validatePaymentProcessing(input: PaymentProcessingInput, userId: string, userRole: string, baseCurrency: string = stryMutAct_9fa48("0") ? "" : (stryCov_9fa48("0"), "MYR")): Promise<PaymentProcessingResult | PaymentProcessingError> {
  if (stryMutAct_9fa48("1")) {
    {}
  } else {
    stryCov_9fa48("1");
    try {
      if (stryMutAct_9fa48("2")) {
        {}
      } else {
        stryCov_9fa48("2");
        // 1. Validate FX policy if foreign currency
        if (stryMutAct_9fa48("5") ? input.currency === baseCurrency : stryMutAct_9fa48("4") ? false : stryMutAct_9fa48("3") ? true : (stryCov_9fa48("3", "4", "5"), input.currency !== baseCurrency)) {
          if (stryMutAct_9fa48("6")) {
            {}
          } else {
            stryCov_9fa48("6");
            const fxResult = validateFxPolicy(baseCurrency, input.currency);
            if (stryMutAct_9fa48("8") ? false : stryMutAct_9fa48("7") ? true : (stryCov_9fa48("7", "8"), fxResult.requiresFxRate)) {
              if (stryMutAct_9fa48("9")) {
                {}
              } else {
                stryCov_9fa48("9");
                // Validate that exchange rate is provided and valid
                if (stryMutAct_9fa48("12") ? input.exchangeRate === undefined && input.exchangeRate === null : stryMutAct_9fa48("11") ? false : stryMutAct_9fa48("10") ? true : (stryCov_9fa48("10", "11", "12"), (stryMutAct_9fa48("14") ? input.exchangeRate !== undefined : stryMutAct_9fa48("13") ? false : (stryCov_9fa48("13", "14"), input.exchangeRate === undefined)) || (stryMutAct_9fa48("16") ? input.exchangeRate !== null : stryMutAct_9fa48("15") ? false : (stryCov_9fa48("15", "16"), input.exchangeRate === null)))) {
                  if (stryMutAct_9fa48("17")) {
                    {}
                  } else {
                    stryCov_9fa48("17");
                    return stryMutAct_9fa48("18") ? {} : (stryCov_9fa48("18"), {
                      success: stryMutAct_9fa48("19") ? true : (stryCov_9fa48("19"), false),
                      error: stryMutAct_9fa48("20") ? `` : (stryCov_9fa48("20"), `Exchange rate required for currency conversion from ${baseCurrency} to ${input.currency}`),
                      code: stryMutAct_9fa48("21") ? "" : (stryCov_9fa48("21"), "EXCHANGE_RATE_REQUIRED"),
                      details: stryMutAct_9fa48("22") ? {} : (stryCov_9fa48("22"), {
                        baseCurrency,
                        transactionCurrency: input.currency
                      })
                    });
                  }
                }
                if (stryMutAct_9fa48("26") ? input.exchangeRate > 0 : stryMutAct_9fa48("25") ? input.exchangeRate < 0 : stryMutAct_9fa48("24") ? false : stryMutAct_9fa48("23") ? true : (stryCov_9fa48("23", "24", "25", "26"), input.exchangeRate <= 0)) {
                  if (stryMutAct_9fa48("27")) {
                    {}
                  } else {
                    stryCov_9fa48("27");
                    return stryMutAct_9fa48("28") ? {} : (stryCov_9fa48("28"), {
                      success: stryMutAct_9fa48("29") ? true : (stryCov_9fa48("29"), false),
                      error: stryMutAct_9fa48("30") ? `` : (stryCov_9fa48("30"), `Exchange rate must be positive for currency conversion from ${baseCurrency} to ${input.currency}`),
                      code: stryMutAct_9fa48("31") ? "" : (stryCov_9fa48("31"), "INVALID_EXCHANGE_RATE"),
                      details: stryMutAct_9fa48("32") ? {} : (stryCov_9fa48("32"), {
                        baseCurrency,
                        transactionCurrency: input.currency,
                        exchangeRate: input.exchangeRate
                      })
                    });
                  }
                }
              }
            }

            // FX validation passed - we have the required rate info
          }
        }

        // 2. Validate payment business rules
        const businessValidation = validatePaymentBusinessRules(input);
        if (stryMutAct_9fa48("35") ? false : stryMutAct_9fa48("34") ? true : stryMutAct_9fa48("33") ? businessValidation.valid : (stryCov_9fa48("33", "34", "35"), !businessValidation.valid)) {
          if (stryMutAct_9fa48("36")) {
            {}
          } else {
            stryCov_9fa48("36");
            return stryMutAct_9fa48("37") ? {} : (stryCov_9fa48("37"), {
              success: stryMutAct_9fa48("38") ? true : (stryCov_9fa48("38"), false),
              error: stryMutAct_9fa48("39") ? `` : (stryCov_9fa48("39"), `Payment validation failed: ${businessValidation.errors.join(stryMutAct_9fa48("40") ? "" : (stryCov_9fa48("40"), ", "))}`),
              code: stryMutAct_9fa48("41") ? "" : (stryCov_9fa48("41"), "PAYMENT_VALIDATION_FAILED"),
              details: stryMutAct_9fa48("42") ? {} : (stryCov_9fa48("42"), {
                errors: businessValidation.errors
              })
            });
          }
        }

        // 3. Build journal lines based on payment type
        const journalLines = stryMutAct_9fa48("43") ? ["Stryker was here"] : (stryCov_9fa48("43"), []);
        const convertedAmount = stryMutAct_9fa48("44") ? input.amount / input.exchangeRate : (stryCov_9fa48("44"), input.amount * input.exchangeRate);

        // Group allocations by type
        const billAllocations = stryMutAct_9fa48("45") ? input.allocations : (stryCov_9fa48("45"), input.allocations.filter(stryMutAct_9fa48("46") ? () => undefined : (stryCov_9fa48("46"), a => stryMutAct_9fa48("49") ? a.type !== "BILL" : stryMutAct_9fa48("48") ? false : stryMutAct_9fa48("47") ? true : (stryCov_9fa48("47", "48", "49"), a.type === (stryMutAct_9fa48("50") ? "" : (stryCov_9fa48("50"), "BILL"))))));
        const invoiceAllocations = stryMutAct_9fa48("51") ? input.allocations : (stryCov_9fa48("51"), input.allocations.filter(stryMutAct_9fa48("52") ? () => undefined : (stryCov_9fa48("52"), a => stryMutAct_9fa48("55") ? a.type !== "INVOICE" : stryMutAct_9fa48("54") ? false : stryMutAct_9fa48("53") ? true : (stryCov_9fa48("53", "54", "55"), a.type === (stryMutAct_9fa48("56") ? "" : (stryCov_9fa48("56"), "INVOICE"))))));

        // Process bill payments (outgoing payments)
        if (stryMutAct_9fa48("60") ? billAllocations.length <= 0 : stryMutAct_9fa48("59") ? billAllocations.length >= 0 : stryMutAct_9fa48("58") ? false : stryMutAct_9fa48("57") ? true : (stryCov_9fa48("57", "58", "59", "60"), billAllocations.length > 0)) {
          if (stryMutAct_9fa48("61")) {
            {}
          } else {
            stryCov_9fa48("61");
            // Debit AP accounts for each bill allocation
            for (const allocation of billAllocations) {
              if (stryMutAct_9fa48("62")) {
                {}
              } else {
                stryCov_9fa48("62");
                const convertedAllocation = stryMutAct_9fa48("63") ? allocation.allocatedAmount / input.exchangeRate : (stryCov_9fa48("63"), allocation.allocatedAmount * input.exchangeRate);
                journalLines.push(stryMutAct_9fa48("64") ? {} : (stryCov_9fa48("64"), {
                  accountId: allocation.apAccountId!,
                  debit: convertedAllocation,
                  credit: 0,
                  description: stryMutAct_9fa48("65") ? `` : (stryCov_9fa48("65"), `Payment ${input.paymentNumber} - Bill ${allocation.documentNumber}`),
                  reference: input.paymentNumber
                }));
              }
            }

            // Credit bank account (total outgoing)
            const totalBillPayments = stryMutAct_9fa48("66") ? billAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0) / input.exchangeRate : (stryCov_9fa48("66"), billAllocations.reduce(stryMutAct_9fa48("67") ? () => undefined : (stryCov_9fa48("67"), (sum, a) => stryMutAct_9fa48("68") ? sum - a.allocatedAmount : (stryCov_9fa48("68"), sum + a.allocatedAmount)), 0) * input.exchangeRate);
            journalLines.push(stryMutAct_9fa48("69") ? {} : (stryCov_9fa48("69"), {
              accountId: input.bankAccountId,
              debit: 0,
              credit: totalBillPayments,
              description: stryMutAct_9fa48("70") ? `` : (stryCov_9fa48("70"), `Payment ${input.paymentNumber} - ${input.paymentMethod}`),
              reference: input.paymentNumber
            }));
          }
        }

        // Process invoice receipts (incoming payments)
        if (stryMutAct_9fa48("74") ? invoiceAllocations.length <= 0 : stryMutAct_9fa48("73") ? invoiceAllocations.length >= 0 : stryMutAct_9fa48("72") ? false : stryMutAct_9fa48("71") ? true : (stryCov_9fa48("71", "72", "73", "74"), invoiceAllocations.length > 0)) {
          if (stryMutAct_9fa48("75")) {
            {}
          } else {
            stryCov_9fa48("75");
            // Debit bank account (total incoming)
            const totalInvoiceReceipts = stryMutAct_9fa48("76") ? invoiceAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0) / input.exchangeRate : (stryCov_9fa48("76"), invoiceAllocations.reduce(stryMutAct_9fa48("77") ? () => undefined : (stryCov_9fa48("77"), (sum, a) => stryMutAct_9fa48("78") ? sum - a.allocatedAmount : (stryCov_9fa48("78"), sum + a.allocatedAmount)), 0) * input.exchangeRate);
            journalLines.push(stryMutAct_9fa48("79") ? {} : (stryCov_9fa48("79"), {
              accountId: input.bankAccountId,
              debit: totalInvoiceReceipts,
              credit: 0,
              description: stryMutAct_9fa48("80") ? `` : (stryCov_9fa48("80"), `Receipt ${input.paymentNumber} - ${input.paymentMethod}`),
              reference: input.paymentNumber
            }));

            // Credit AR accounts for each invoice allocation
            for (const allocation of invoiceAllocations) {
              if (stryMutAct_9fa48("81")) {
                {}
              } else {
                stryCov_9fa48("81");
                const convertedAllocation = stryMutAct_9fa48("82") ? allocation.allocatedAmount / input.exchangeRate : (stryCov_9fa48("82"), allocation.allocatedAmount * input.exchangeRate);
                journalLines.push(stryMutAct_9fa48("83") ? {} : (stryCov_9fa48("83"), {
                  accountId: allocation.arAccountId!,
                  debit: 0,
                  credit: convertedAllocation,
                  description: stryMutAct_9fa48("84") ? `` : (stryCov_9fa48("84"), `Receipt ${input.paymentNumber} - Invoice ${allocation.documentNumber}`),
                  reference: input.paymentNumber
                }));
              }
            }
          }
        }

        // 4. Create posting context for SoD validation
        const context: PostingContext = stryMutAct_9fa48("85") ? {} : (stryCov_9fa48("85"), {
          tenantId: input.tenantId,
          companyId: input.companyId,
          userId,
          userRole
        });

        // 5. Prepare journal posting input
        const journalInput: JournalPostingInput = stryMutAct_9fa48("86") ? {} : (stryCov_9fa48("86"), {
          context,
          journalNumber: stryMutAct_9fa48("87") ? `` : (stryCov_9fa48("87"), `PAY-${input.paymentNumber}`),
          description: stryMutAct_9fa48("90") ? input.description && `Payment ${input.paymentNumber} - ${input.paymentMethod}` : stryMutAct_9fa48("89") ? false : stryMutAct_9fa48("88") ? true : (stryCov_9fa48("88", "89", "90"), input.description || (stryMutAct_9fa48("91") ? `` : (stryCov_9fa48("91"), `Payment ${input.paymentNumber} - ${input.paymentMethod}`))),
          journalDate: new Date(input.paymentDate),
          currency: baseCurrency,
          // Always post in base currency
          lines: journalLines
        });

        // 6. Validate journal posting (includes SoD, COA, balance checks)
        const validation = await validateJournalPosting(journalInput);
        if (stryMutAct_9fa48("94") ? false : stryMutAct_9fa48("93") ? true : stryMutAct_9fa48("92") ? validation.validated : (stryCov_9fa48("92", "93", "94"), !validation.validated)) {
          if (stryMutAct_9fa48("95")) {
            {}
          } else {
            stryCov_9fa48("95");
            return stryMutAct_9fa48("96") ? {} : (stryCov_9fa48("96"), {
              success: stryMutAct_9fa48("97") ? true : (stryCov_9fa48("97"), false),
              error: stryMutAct_9fa48("98") ? "" : (stryCov_9fa48("98"), "Journal validation failed"),
              code: stryMutAct_9fa48("99") ? "" : (stryCov_9fa48("99"), "JOURNAL_VALIDATION_FAILED"),
              details: validation
            });
          }
        }

        // 7. Return successful validation result
        return stryMutAct_9fa48("100") ? {} : (stryCov_9fa48("100"), {
          success: stryMutAct_9fa48("101") ? false : (stryCov_9fa48("101"), true),
          journalId: stryMutAct_9fa48("102") ? "Stryker was here!" : (stryCov_9fa48("102"), ""),
          // Will be set when actually posted
          journalNumber: journalInput.journalNumber,
          totalAmount: convertedAmount,
          allocationsProcessed: input.allocations.length,
          lines: journalLines.map(stryMutAct_9fa48("103") ? () => undefined : (stryCov_9fa48("103"), line => stryMutAct_9fa48("104") ? {} : (stryCov_9fa48("104"), {
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description
          })))
        });
      }
    } catch (error) {
      if (stryMutAct_9fa48("105")) {
        {}
      } else {
        stryCov_9fa48("105");
        return stryMutAct_9fa48("106") ? {} : (stryCov_9fa48("106"), {
          success: stryMutAct_9fa48("107") ? true : (stryCov_9fa48("107"), false),
          error: error instanceof Error ? error.message : stryMutAct_9fa48("108") ? "" : (stryCov_9fa48("108"), "Unknown error occurred"),
          code: stryMutAct_9fa48("109") ? "" : (stryCov_9fa48("109"), "PAYMENT_PROCESSING_ERROR"),
          details: (error as Record<string, unknown>)
        });
      }
    }
  }
}

/**
 * Validate payment business rules
 */
export function validatePaymentBusinessRules(input: PaymentProcessingInput): {
  valid: boolean;
  errors: string[];
} {
  if (stryMutAct_9fa48("110")) {
    {}
  } else {
    stryCov_9fa48("110");
    const errors: string[] = stryMutAct_9fa48("111") ? ["Stryker was here"] : (stryCov_9fa48("111"), []);

    // Validate payment date is not in the future
    const paymentDate = new Date(input.paymentDate);
    if (stryMutAct_9fa48("115") ? paymentDate <= new Date() : stryMutAct_9fa48("114") ? paymentDate >= new Date() : stryMutAct_9fa48("113") ? false : stryMutAct_9fa48("112") ? true : (stryCov_9fa48("112", "113", "114", "115"), paymentDate > new Date())) {
      if (stryMutAct_9fa48("116")) {
        {}
      } else {
        stryCov_9fa48("116");
        errors.push(stryMutAct_9fa48("117") ? "" : (stryCov_9fa48("117"), "Payment date cannot be in the future"));
      }
    }

    // Validate currency format
    if (stryMutAct_9fa48("120") ? !input.currency && input.currency.length !== 3 : stryMutAct_9fa48("119") ? false : stryMutAct_9fa48("118") ? true : (stryCov_9fa48("118", "119", "120"), (stryMutAct_9fa48("121") ? input.currency : (stryCov_9fa48("121"), !input.currency)) || (stryMutAct_9fa48("123") ? input.currency.length === 3 : stryMutAct_9fa48("122") ? false : (stryCov_9fa48("122", "123"), input.currency.length !== 3)))) {
      if (stryMutAct_9fa48("124")) {
        {}
      } else {
        stryCov_9fa48("124");
        errors.push(stryMutAct_9fa48("125") ? "" : (stryCov_9fa48("125"), "Currency must be a valid 3-letter ISO code"));
      }
    }

    // Validate exchange rate
    if (stryMutAct_9fa48("129") ? input.exchangeRate > 0 : stryMutAct_9fa48("128") ? input.exchangeRate < 0 : stryMutAct_9fa48("127") ? false : stryMutAct_9fa48("126") ? true : (stryCov_9fa48("126", "127", "128", "129"), input.exchangeRate <= 0)) {
      if (stryMutAct_9fa48("130")) {
        {}
      } else {
        stryCov_9fa48("130");
        errors.push(stryMutAct_9fa48("131") ? "" : (stryCov_9fa48("131"), "Exchange rate must be positive"));
      }
    }

    // Validate amount
    if (stryMutAct_9fa48("135") ? input.amount > 0 : stryMutAct_9fa48("134") ? input.amount < 0 : stryMutAct_9fa48("133") ? false : stryMutAct_9fa48("132") ? true : (stryCov_9fa48("132", "133", "134", "135"), input.amount <= 0)) {
      if (stryMutAct_9fa48("136")) {
        {}
      } else {
        stryCov_9fa48("136");
        errors.push(stryMutAct_9fa48("137") ? "" : (stryCov_9fa48("137"), "Payment amount must be positive"));
      }
    }

    // Validate payment method
    const validMethods = stryMutAct_9fa48("138") ? [] : (stryCov_9fa48("138"), [stryMutAct_9fa48("139") ? "" : (stryCov_9fa48("139"), "BANK_TRANSFER"), stryMutAct_9fa48("140") ? "" : (stryCov_9fa48("140"), "CHECK"), stryMutAct_9fa48("141") ? "" : (stryCov_9fa48("141"), "CASH"), stryMutAct_9fa48("142") ? "" : (stryCov_9fa48("142"), "CREDIT_CARD"), stryMutAct_9fa48("143") ? "" : (stryCov_9fa48("143"), "DEBIT_CARD"), stryMutAct_9fa48("144") ? "" : (stryCov_9fa48("144"), "OTHER")]);
    if (stryMutAct_9fa48("147") ? false : stryMutAct_9fa48("146") ? true : stryMutAct_9fa48("145") ? validMethods.includes(input.paymentMethod) : (stryCov_9fa48("145", "146", "147"), !validMethods.includes(input.paymentMethod))) {
      if (stryMutAct_9fa48("148")) {
        {}
      } else {
        stryCov_9fa48("148");
        errors.push(stryMutAct_9fa48("149") ? "" : (stryCov_9fa48("149"), "Invalid payment method"));
      }
    }

    // Validate allocations exist
    if (stryMutAct_9fa48("152") ? !input.allocations && input.allocations.length === 0 : stryMutAct_9fa48("151") ? false : stryMutAct_9fa48("150") ? true : (stryCov_9fa48("150", "151", "152"), (stryMutAct_9fa48("153") ? input.allocations : (stryCov_9fa48("153"), !input.allocations)) || (stryMutAct_9fa48("155") ? input.allocations.length !== 0 : stryMutAct_9fa48("154") ? false : (stryCov_9fa48("154", "155"), input.allocations.length === 0)))) {
      if (stryMutAct_9fa48("156")) {
        {}
      } else {
        stryCov_9fa48("156");
        errors.push(stryMutAct_9fa48("157") ? "" : (stryCov_9fa48("157"), "Payment must have at least one allocation"));
      }
    }

    // Validate allocation totals match payment amount
    if (stryMutAct_9fa48("159") ? false : stryMutAct_9fa48("158") ? true : (stryCov_9fa48("158", "159"), input.allocations)) {
      if (stryMutAct_9fa48("160")) {
        {}
      } else {
        stryCov_9fa48("160");
        const totalAllocated = input.allocations.reduce(stryMutAct_9fa48("161") ? () => undefined : (stryCov_9fa48("161"), (sum, a) => stryMutAct_9fa48("162") ? sum - a.allocatedAmount : (stryCov_9fa48("162"), sum + a.allocatedAmount)), 0);
        if (stryMutAct_9fa48("166") ? Math.abs(totalAllocated - input.amount) <= 0.01 : stryMutAct_9fa48("165") ? Math.abs(totalAllocated - input.amount) >= 0.01 : stryMutAct_9fa48("164") ? false : stryMutAct_9fa48("163") ? true : (stryCov_9fa48("163", "164", "165", "166"), Math.abs(stryMutAct_9fa48("167") ? totalAllocated + input.amount : (stryCov_9fa48("167"), totalAllocated - input.amount)) > 0.01)) {
          if (stryMutAct_9fa48("168")) {
            {}
          } else {
            stryCov_9fa48("168");
            errors.push(stryMutAct_9fa48("169") ? `` : (stryCov_9fa48("169"), `Total allocated amount (${totalAllocated}) does not match payment amount (${input.amount})`));
          }
        }

        // Validate each allocation
        for (let i = 0; stryMutAct_9fa48("172") ? i >= input.allocations.length : stryMutAct_9fa48("171") ? i <= input.allocations.length : stryMutAct_9fa48("170") ? false : (stryCov_9fa48("170", "171", "172"), i < input.allocations.length); stryMutAct_9fa48("173") ? i-- : (stryCov_9fa48("173"), i++)) {
          if (stryMutAct_9fa48("174")) {
            {}
          } else {
            stryCov_9fa48("174");
            const allocation = input.allocations[i];
            if (stryMutAct_9fa48("178") ? (allocation?.allocatedAmount || 0) > 0 : stryMutAct_9fa48("177") ? (allocation?.allocatedAmount || 0) < 0 : stryMutAct_9fa48("176") ? false : stryMutAct_9fa48("175") ? true : (stryCov_9fa48("175", "176", "177", "178"), (stryMutAct_9fa48("181") ? allocation?.allocatedAmount && 0 : stryMutAct_9fa48("180") ? false : stryMutAct_9fa48("179") ? true : (stryCov_9fa48("179", "180", "181"), (stryMutAct_9fa48("182") ? allocation.allocatedAmount : (stryCov_9fa48("182"), allocation?.allocatedAmount)) || 0)) <= 0)) {
              if (stryMutAct_9fa48("183")) {
                {}
              } else {
                stryCov_9fa48("183");
                errors.push(stryMutAct_9fa48("184") ? `` : (stryCov_9fa48("184"), `Allocation ${stryMutAct_9fa48("185") ? i - 1 : (stryCov_9fa48("185"), i + 1)}: Amount must be positive`));
              }
            }
            if (stryMutAct_9fa48("188") ? allocation?.type === "BILL" || !allocation.apAccountId : stryMutAct_9fa48("187") ? false : stryMutAct_9fa48("186") ? true : (stryCov_9fa48("186", "187", "188"), (stryMutAct_9fa48("190") ? allocation?.type !== "BILL" : stryMutAct_9fa48("189") ? true : (stryCov_9fa48("189", "190"), (stryMutAct_9fa48("191") ? allocation.type : (stryCov_9fa48("191"), allocation?.type)) === (stryMutAct_9fa48("192") ? "" : (stryCov_9fa48("192"), "BILL")))) && (stryMutAct_9fa48("193") ? allocation.apAccountId : (stryCov_9fa48("193"), !allocation.apAccountId)))) {
              if (stryMutAct_9fa48("194")) {
                {}
              } else {
                stryCov_9fa48("194");
                errors.push(stryMutAct_9fa48("195") ? `` : (stryCov_9fa48("195"), `Allocation ${stryMutAct_9fa48("196") ? i - 1 : (stryCov_9fa48("196"), i + 1)}: AP account required for bill payments`));
              }
            }
            if (stryMutAct_9fa48("199") ? allocation?.type === "INVOICE" || !allocation.arAccountId : stryMutAct_9fa48("198") ? false : stryMutAct_9fa48("197") ? true : (stryCov_9fa48("197", "198", "199"), (stryMutAct_9fa48("201") ? allocation?.type !== "INVOICE" : stryMutAct_9fa48("200") ? true : (stryCov_9fa48("200", "201"), (stryMutAct_9fa48("202") ? allocation.type : (stryCov_9fa48("202"), allocation?.type)) === (stryMutAct_9fa48("203") ? "" : (stryCov_9fa48("203"), "INVOICE")))) && (stryMutAct_9fa48("204") ? allocation.arAccountId : (stryCov_9fa48("204"), !allocation.arAccountId)))) {
              if (stryMutAct_9fa48("205")) {
                {}
              } else {
                stryCov_9fa48("205");
                errors.push(stryMutAct_9fa48("206") ? `` : (stryCov_9fa48("206"), `Allocation ${stryMutAct_9fa48("207") ? i - 1 : (stryCov_9fa48("207"), i + 1)}: AR account required for invoice receipts`));
              }
            }
            if (stryMutAct_9fa48("210") ? allocation?.type === "BILL" || !allocation.supplierId : stryMutAct_9fa48("209") ? false : stryMutAct_9fa48("208") ? true : (stryCov_9fa48("208", "209", "210"), (stryMutAct_9fa48("212") ? allocation?.type !== "BILL" : stryMutAct_9fa48("211") ? true : (stryCov_9fa48("211", "212"), (stryMutAct_9fa48("213") ? allocation.type : (stryCov_9fa48("213"), allocation?.type)) === (stryMutAct_9fa48("214") ? "" : (stryCov_9fa48("214"), "BILL")))) && (stryMutAct_9fa48("215") ? allocation.supplierId : (stryCov_9fa48("215"), !allocation.supplierId)))) {
              if (stryMutAct_9fa48("216")) {
                {}
              } else {
                stryCov_9fa48("216");
                errors.push(stryMutAct_9fa48("217") ? `` : (stryCov_9fa48("217"), `Allocation ${stryMutAct_9fa48("218") ? i - 1 : (stryCov_9fa48("218"), i + 1)}: Supplier ID required for bill payments`));
              }
            }
            if (stryMutAct_9fa48("221") ? allocation?.type === "INVOICE" || !allocation.customerId : stryMutAct_9fa48("220") ? false : stryMutAct_9fa48("219") ? true : (stryCov_9fa48("219", "220", "221"), (stryMutAct_9fa48("223") ? allocation?.type !== "INVOICE" : stryMutAct_9fa48("222") ? true : (stryCov_9fa48("222", "223"), (stryMutAct_9fa48("224") ? allocation.type : (stryCov_9fa48("224"), allocation?.type)) === (stryMutAct_9fa48("225") ? "" : (stryCov_9fa48("225"), "INVOICE")))) && (stryMutAct_9fa48("226") ? allocation.customerId : (stryCov_9fa48("226"), !allocation.customerId)))) {
              if (stryMutAct_9fa48("227")) {
                {}
              } else {
                stryCov_9fa48("227");
                errors.push(stryMutAct_9fa48("228") ? `` : (stryCov_9fa48("228"), `Allocation ${stryMutAct_9fa48("229") ? i - 1 : (stryCov_9fa48("229"), i + 1)}: Customer ID required for invoice receipts`));
              }
            }
          }
        }
      }
    }
    return stryMutAct_9fa48("230") ? {} : (stryCov_9fa48("230"), {
      valid: stryMutAct_9fa48("233") ? errors.length !== 0 : stryMutAct_9fa48("232") ? false : stryMutAct_9fa48("231") ? true : (stryCov_9fa48("231", "232", "233"), errors.length === 0),
      errors
    });
  }
}

/**
 * Generate payment number if not provided
 */
export function generatePaymentNumber(companyCode: string, sequence: number, type: "OUT" | "IN" = stryMutAct_9fa48("234") ? "" : (stryCov_9fa48("234"), "OUT")): string {
  if (stryMutAct_9fa48("235")) {
    {}
  } else {
    stryCov_9fa48("235");
    const year = new Date().getFullYear();
    const paddedSequence = sequence.toString().padStart(6, stryMutAct_9fa48("236") ? "" : (stryCov_9fa48("236"), "0"));
    const prefix = (stryMutAct_9fa48("239") ? type !== "OUT" : stryMutAct_9fa48("238") ? false : stryMutAct_9fa48("237") ? true : (stryCov_9fa48("237", "238", "239"), type === (stryMutAct_9fa48("240") ? "" : (stryCov_9fa48("240"), "OUT")))) ? stryMutAct_9fa48("241") ? "" : (stryCov_9fa48("241"), "PAY") : stryMutAct_9fa48("242") ? "" : (stryCov_9fa48("242"), "REC");
    return stryMutAct_9fa48("243") ? `` : (stryCov_9fa48("243"), `${prefix}-${companyCode}-${year}-${paddedSequence}`);
  }
}

/**
 * Calculate payment summary by type
 */
export function calculatePaymentSummary(allocations: PaymentAllocationInput[]): {
  billPayments: number;
  invoiceReceipts: number;
  totalAmount: number;
} {
  if (stryMutAct_9fa48("244")) {
    {}
  } else {
    stryCov_9fa48("244");
    const billPayments = stryMutAct_9fa48("245") ? allocations.reduce((sum, a) => sum + a.allocatedAmount, 0) : (stryCov_9fa48("245"), allocations.filter(stryMutAct_9fa48("246") ? () => undefined : (stryCov_9fa48("246"), a => stryMutAct_9fa48("249") ? a.type !== "BILL" : stryMutAct_9fa48("248") ? false : stryMutAct_9fa48("247") ? true : (stryCov_9fa48("247", "248", "249"), a.type === (stryMutAct_9fa48("250") ? "" : (stryCov_9fa48("250"), "BILL"))))).reduce(stryMutAct_9fa48("251") ? () => undefined : (stryCov_9fa48("251"), (sum, a) => stryMutAct_9fa48("252") ? sum - a.allocatedAmount : (stryCov_9fa48("252"), sum + a.allocatedAmount)), 0));
    const invoiceReceipts = stryMutAct_9fa48("253") ? allocations.reduce((sum, a) => sum + a.allocatedAmount, 0) : (stryCov_9fa48("253"), allocations.filter(stryMutAct_9fa48("254") ? () => undefined : (stryCov_9fa48("254"), a => stryMutAct_9fa48("257") ? a.type !== "INVOICE" : stryMutAct_9fa48("256") ? false : stryMutAct_9fa48("255") ? true : (stryCov_9fa48("255", "256", "257"), a.type === (stryMutAct_9fa48("258") ? "" : (stryCov_9fa48("258"), "INVOICE"))))).reduce(stryMutAct_9fa48("259") ? () => undefined : (stryCov_9fa48("259"), (sum, a) => stryMutAct_9fa48("260") ? sum - a.allocatedAmount : (stryCov_9fa48("260"), sum + a.allocatedAmount)), 0));
    return stryMutAct_9fa48("261") ? {} : (stryCov_9fa48("261"), {
      billPayments: stryMutAct_9fa48("262") ? Math.round(billPayments * 100) * 100 : (stryCov_9fa48("262"), Math.round(stryMutAct_9fa48("263") ? billPayments / 100 : (stryCov_9fa48("263"), billPayments * 100)) / 100),
      invoiceReceipts: stryMutAct_9fa48("264") ? Math.round(invoiceReceipts * 100) * 100 : (stryCov_9fa48("264"), Math.round(stryMutAct_9fa48("265") ? invoiceReceipts / 100 : (stryCov_9fa48("265"), invoiceReceipts * 100)) / 100),
      totalAmount: stryMutAct_9fa48("266") ? Math.round((billPayments + invoiceReceipts) * 100) * 100 : (stryCov_9fa48("266"), Math.round(stryMutAct_9fa48("267") ? (billPayments + invoiceReceipts) / 100 : (stryCov_9fa48("267"), (stryMutAct_9fa48("268") ? billPayments - invoiceReceipts : (stryCov_9fa48("268"), billPayments + invoiceReceipts)) * 100)) / 100)
    });
  }
}

/**
 * Validate payment allocation against outstanding balances
 */
export function validatePaymentAllocations(allocations: PaymentAllocationInput[], outstandingBalances: Map<string, number>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  if (stryMutAct_9fa48("269")) {
    {}
  } else {
    stryCov_9fa48("269");
    const errors: string[] = stryMutAct_9fa48("270") ? ["Stryker was here"] : (stryCov_9fa48("270"), []);
    const warnings: string[] = stryMutAct_9fa48("271") ? ["Stryker was here"] : (stryCov_9fa48("271"), []);
    for (const allocation of allocations) {
      if (stryMutAct_9fa48("272")) {
        {}
      } else {
        stryCov_9fa48("272");
        const outstandingBalance = stryMutAct_9fa48("275") ? outstandingBalances.get(allocation.documentId) && 0 : stryMutAct_9fa48("274") ? false : stryMutAct_9fa48("273") ? true : (stryCov_9fa48("273", "274", "275"), outstandingBalances.get(allocation.documentId) || 0);
        if (stryMutAct_9fa48("279") ? allocation.allocatedAmount <= outstandingBalance : stryMutAct_9fa48("278") ? allocation.allocatedAmount >= outstandingBalance : stryMutAct_9fa48("277") ? false : stryMutAct_9fa48("276") ? true : (stryCov_9fa48("276", "277", "278", "279"), allocation.allocatedAmount > outstandingBalance)) {
          if (stryMutAct_9fa48("280")) {
            {}
          } else {
            stryCov_9fa48("280");
            if (stryMutAct_9fa48("283") ? outstandingBalance !== 0 : stryMutAct_9fa48("282") ? false : stryMutAct_9fa48("281") ? true : (stryCov_9fa48("281", "282", "283"), outstandingBalance === 0)) {
              if (stryMutAct_9fa48("284")) {
                {}
              } else {
                stryCov_9fa48("284");
                errors.push(stryMutAct_9fa48("285") ? `` : (stryCov_9fa48("285"), `Document ${allocation.documentNumber} has no outstanding balance`));
              }
            } else {
              if (stryMutAct_9fa48("286")) {
                {}
              } else {
                stryCov_9fa48("286");
                warnings.push(stryMutAct_9fa48("287") ? `` : (stryCov_9fa48("287"), `Document ${allocation.documentNumber}: Allocated amount (${allocation.allocatedAmount}) exceeds outstanding balance (${outstandingBalance})`));
              }
            }
          }
        }
      }
    }
    return stryMutAct_9fa48("288") ? {} : (stryCov_9fa48("288"), {
      valid: stryMutAct_9fa48("291") ? errors.length !== 0 : stryMutAct_9fa48("290") ? false : stryMutAct_9fa48("289") ? true : (stryCov_9fa48("289", "290", "291"), errors.length === 0),
      errors,
      warnings
    });
  }
}