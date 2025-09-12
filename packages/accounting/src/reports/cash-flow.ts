// D4 Cash Flow Statement Engine - Statement of Cash Flows
// V1 Requirement: CF from GL only with operating/investing/financing classification

import { generateTrialBalance, type TrialBalanceInput, type TrialBalanceAccount, type TrialBalanceResult } from './trial-balance';

export interface CashFlowInput {
    tenantId: string;
    companyId: string;
    startDate: Date;
    endDate: Date;
    comparativePeriod?: {
        startDate: Date;
        endDate: Date;
    };
    method?: 'DIRECT' | 'INDIRECT';
    currency?: string;
    reportFormat?: 'STANDARD' | 'COMPARATIVE';
}

export interface CashFlowSection {
    sectionName: string;
    sectionType: 'OPERATING' | 'INVESTING' | 'FINANCING';
    activities: CashFlowActivity[];
    subtotal: number;
    comparativeSubtotal?: number;
    variance?: number;
    variancePercent?: number;
}

export interface CashFlowActivity {
    activityId: string;
    activityName: string;
    activityType: string;
    currentPeriodAmount: number;
    comparativePeriodAmount?: number;
    variance?: number;
    variancePercent?: number;
    accountIds: string[];
}

export interface CashFlowResult {
    success: true;
    startDate: Date;
    endDate: Date;
    comparativeStartDate?: Date;
    comparativeEndDate?: Date;
    generatedAt: Date;
    currency: string;
    method: 'DIRECT' | 'INDIRECT';
    reportFormat: string;

    // Main sections
    operatingActivities: CashFlowSection;
    investingActivities: CashFlowSection;
    financingActivities: CashFlowSection;

    // Key metrics
    metrics: {
        netCashFromOperating: number;
        netCashFromInvesting: number;
        netCashFromFinancing: number;
        netChangeInCash: number;
        beginningCashBalance: number;
        endingCashBalance: number;

        // Comparative metrics (if applicable)
        comparativeNetCashFromOperating?: number;
        comparativeNetCashFromInvesting?: number;
        comparativeNetCashFromFinancing?: number;
        comparativeNetChangeInCash?: number;

        // Variances
        operatingCashVariance?: number;
        investingCashVariance?: number;
        financingCashVariance?: number;
        netCashVariance?: number;
    };

    // Reconciliation (for indirect method)
    reconciliation?: {
        netIncome: number;
        adjustments: Array<{
            description: string;
            amount: number;
            type: 'ADD' | 'SUBTRACT';
        }>;
        workingCapitalChanges: Array<{
            description: string;
            amount: number;
            type: 'INCREASE' | 'DECREASE';
        }>;
    };

    metadata: {
        totalActivities: number;
        activitiesWithCashFlow: number;
        periodDays: number;
        generationTime: number;
        basedOnTrialBalance: boolean;
    };
}

export interface CashFlowError {
    success: false;
    error: string;
    code: string;
    details?: any;
}

/**
 * Generate Cash Flow Statement from Trial Balance data
 * V1 Requirement: All reports derive from GL journal lines
 */
export async function generateCashFlow(
    input: CashFlowInput,
    dbClient: any
): Promise<CashFlowResult | CashFlowError> {
    const startTime = Date.now();

    try {
        // 1. Validate input parameters
        const validation = validateCashFlowInput(input);
        if (!validation.valid) {
            return {
                success: false,
                error: `Input validation failed: ${validation.errors.join(', ')}`,
                code: 'INVALID_INPUT',
                details: validation.errors
            };
        }

        // 2. Generate current period trial balance
        const currentTrialBalance = await generateTrialBalance({
            tenantId: input.tenantId,
            companyId: input.companyId,
            asOfDate: input.endDate,
            includePeriodActivity: true,
            includeZeroBalances: false,
            currency: input.currency
        }, dbClient);

        if (!currentTrialBalance.success) {
            return {
                success: false,
                error: `Failed to generate trial balance: ${currentTrialBalance.error}`,
                code: 'TRIAL_BALANCE_ERROR',
                details: currentTrialBalance
            };
        }

        // 3. Generate comparative period trial balance (if requested)
        let comparativeTrialBalance: TrialBalanceResult | null = null;
        if (input.comparativePeriod) {
            const comparativeResult = await generateTrialBalance({
                tenantId: input.tenantId,
                companyId: input.companyId,
                asOfDate: input.comparativePeriod.endDate,
                includePeriodActivity: true,
                includeZeroBalances: false,
                currency: input.currency
            }, dbClient);

            if (!comparativeResult.success) {
                return {
                    success: false,
                    error: `Failed to generate comparative trial balance: ${comparativeResult.error}`,
                    code: 'COMPARATIVE_TRIAL_BALANCE_ERROR',
                    details: comparativeResult
                };
            }

            comparativeTrialBalance = comparativeResult;
        }

        // 4. Get cash flow activity data from GL
        const cashFlowData = await getCashFlowActivities(
            input.tenantId,
            input.companyId,
            input.startDate,
            input.endDate,
            dbClient,
            input.comparativePeriod
        );

        // 5. Classify activities into cash flow sections
        const { operatingActivities, investingActivities, financingActivities } =
            classifyCashFlowActivities(
                cashFlowData.current,
                cashFlowData.comparative,
                input.method || 'INDIRECT'
            );

        // 6. Calculate cash balances
        const cashBalances = await calculateCashBalances(
            input.tenantId,
            input.companyId,
            input.startDate,
            input.endDate,
            dbClient,
            input.comparativePeriod
        );

        // 7. Calculate key metrics
        const metrics = calculateCashFlowMetrics(
            operatingActivities,
            investingActivities,
            financingActivities,
            cashBalances
        );

        // 8. Generate reconciliation (for indirect method)
        let reconciliation;
        if (input.method === 'INDIRECT') {
            reconciliation = await generateReconciliation(
                currentTrialBalance.accounts,
                cashFlowData.current
            );
        }

        // 9. Generate metadata
        const periodDays = Math.ceil((input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const metadata = {
            totalActivities: operatingActivities.activities.length +
                investingActivities.activities.length +
                financingActivities.activities.length,
            activitiesWithCashFlow: cashFlowData.current.size,
            periodDays,
            generationTime: Date.now() - startTime,
            basedOnTrialBalance: true
        };

        return {
            success: true,
            startDate: input.startDate,
            endDate: input.endDate,
            comparativeStartDate: input.comparativePeriod?.startDate,
            comparativeEndDate: input.comparativePeriod?.endDate,
            generatedAt: new Date(),
            currency: input.currency || 'MYR',
            method: input.method || 'INDIRECT',
            reportFormat: input.reportFormat || 'STANDARD',
            operatingActivities,
            investingActivities,
            financingActivities,
            metrics,
            reconciliation,
            metadata
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            code: 'CASH_FLOW_ERROR',
            details: error
        };
    }
}

/**
 * Get cash flow activities from GL journal lines
 */
async function getCashFlowActivities(
    tenantId: string,
    companyId: string,
    startDate: Date,
    endDate: Date,
    dbClient: any,
    comparativePeriod?: { startDate: Date; endDate: Date }
): Promise<{
    current: Map<string, { debits: number; credits: number; netActivity: number; accountType: string }>;
    comparative?: Map<string, { debits: number; credits: number; netActivity: number; accountType: string }>;
}> {
    // Query for current period cash flow activities
    const currentQuery = `
    SELECT 
      jl.account_id,
      coa.account_type,
      coa.account_category,
      coa.normal_balance,
      SUM(jl.debit_amount) as total_debits,
      SUM(jl.credit_amount) as total_credits
    FROM gl_journal_lines jl
    JOIN gl_journal j ON jl.journal_id = j.id
    JOIN chart_of_accounts coa ON jl.account_id = coa.id
    WHERE j.tenant_id = $1 
      AND j.company_id = $2
      AND j.status = 'posted'
      AND j.journal_date >= $3
      AND j.journal_date <= $4
      AND (coa.account_type IN ('ASSET', 'LIABILITY', 'EQUITY') 
           OR coa.account_category IN ('CASH', 'CASH_EQUIVALENTS'))
    GROUP BY jl.account_id, coa.account_type, coa.account_category, coa.normal_balance
  `;

    const { data: currentData, error: currentError } = await dbClient
        .rpc('execute_sql', {
            query: currentQuery,
            params: [tenantId, companyId, startDate, endDate]
        });

    if (currentError) {
        throw new Error(`Failed to fetch current period cash flow activities: ${currentError.message}`);
    }

    const currentActivity = new Map();
    for (const row of currentData || []) {
        const debits = parseFloat(row.total_debits || '0');
        const credits = parseFloat(row.total_credits || '0');

        // Calculate net activity based on normal balance
        const netActivity = row.normal_balance === 'DEBIT'
            ? debits - credits
            : credits - debits;

        currentActivity.set(row.account_id, {
            debits,
            credits,
            netActivity,
            accountType: row.account_type,
            accountCategory: row.account_category
        });
    }

    // Query for comparative period (if requested)
    let comparativeActivity: Map<string, any> | undefined = undefined;
    if (comparativePeriod) {
        const { data: comparativeData, error: comparativeError } = await dbClient
            .rpc('execute_sql', {
                query: currentQuery,
                params: [tenantId, companyId, comparativePeriod.startDate, comparativePeriod.endDate]
            });

        if (comparativeError) {
            throw new Error(`Failed to fetch comparative period cash flow activities: ${comparativeError.message}`);
        }

        comparativeActivity = new Map();
        for (const row of comparativeData || []) {
            const debits = parseFloat(row.total_debits || '0');
            const credits = parseFloat(row.total_credits || '0');

            const netActivity = row.normal_balance === 'DEBIT'
                ? debits - credits
                : credits - debits;

            comparativeActivity.set(row.account_id, {
                debits,
                credits,
                netActivity,
                accountType: row.account_type,
                accountCategory: row.account_category
            });
        }
    }

    return {
        current: currentActivity,
        comparative: comparativeActivity
    };
}

/**
 * Classify activities into operating, investing, and financing sections
 */
function classifyCashFlowActivities(
    currentActivities: Map<string, any>,
    comparativeActivities?: Map<string, any>,
    method: 'DIRECT' | 'INDIRECT' = 'INDIRECT'
): {
    operatingActivities: CashFlowSection;
    investingActivities: CashFlowSection;
    financingActivities: CashFlowSection;
} {
    const operatingActivitiesList: CashFlowActivity[] = [];
    const investingActivitiesList: CashFlowActivity[] = [];
    const financingActivitiesList: CashFlowActivity[] = [];

    // Process each account's activity
    for (const [accountId, activity] of currentActivities) {
        const comparativeActivity = comparativeActivities?.get(accountId);
        const currentAmount = activity.netActivity || 0;
        const comparativeAmount = comparativeActivity?.netActivity || 0;
        const variance = currentAmount - comparativeAmount;
        const variancePercent = comparativeAmount !== 0
            ? (variance / Math.abs(comparativeAmount)) * 100
            : 0;

        const cashFlowActivity: CashFlowActivity = {
            activityId: accountId,
            activityName: `Account ${accountId.slice(-8)}`, // Simplified name
            activityType: activity.accountType,
            currentPeriodAmount: currentAmount,
            comparativePeriodAmount: comparativeActivities ? comparativeAmount : undefined,
            variance: comparativeActivities ? variance : undefined,
            variancePercent: comparativeActivities ? variancePercent : undefined,
            accountIds: [accountId]
        };

        // Classify based on account type and category per IAS 7 standards
        if (isOperatingActivity(activity.accountType)) {
            operatingActivitiesList.push(cashFlowActivity);
        } else if (isInvestingActivity(activity.accountType, activity.accountCategory)) {
            investingActivitiesList.push(cashFlowActivity);
        } else if (isFinancingActivity(activity.accountType, activity.accountCategory)) {
            financingActivitiesList.push(cashFlowActivity);
        }
    }

    return {
        operatingActivities: {
            sectionName: 'Operating Activities',
            sectionType: 'OPERATING',
            activities: operatingActivitiesList,
            subtotal: operatingActivitiesList.reduce((sum, act) => sum + act.currentPeriodAmount, 0),
            comparativeSubtotal: operatingActivitiesList.reduce((sum, act) => sum + (act.comparativePeriodAmount || 0), 0),
            variance: operatingActivitiesList.reduce((sum, act) => sum + (act.variance || 0), 0),
            variancePercent: calculateSectionVariancePercent(operatingActivitiesList)
        },
        investingActivities: {
            sectionName: 'Investing Activities',
            sectionType: 'INVESTING',
            activities: investingActivitiesList,
            subtotal: investingActivitiesList.reduce((sum, act) => sum + act.currentPeriodAmount, 0),
            comparativeSubtotal: investingActivitiesList.reduce((sum, act) => sum + (act.comparativePeriodAmount || 0), 0),
            variance: investingActivitiesList.reduce((sum, act) => sum + (act.variance || 0), 0),
            variancePercent: calculateSectionVariancePercent(investingActivitiesList)
        },
        financingActivities: {
            sectionName: 'Financing Activities',
            sectionType: 'FINANCING',
            activities: financingActivitiesList,
            subtotal: financingActivitiesList.reduce((sum, act) => sum + act.currentPeriodAmount, 0),
            comparativeSubtotal: financingActivitiesList.reduce((sum, act) => sum + (act.comparativePeriodAmount || 0), 0),
            variance: financingActivitiesList.reduce((sum, act) => sum + (act.variance || 0), 0),
            variancePercent: calculateSectionVariancePercent(financingActivitiesList)
        }
    };
}

/**
 * Calculate cash balances for beginning and ending periods
 */
async function calculateCashBalances(
    tenantId: string,
    companyId: string,
    startDate: Date,
    endDate: Date,
    dbClient: any,
    comparativePeriod?: { startDate: Date; endDate: Date }
): Promise<{
    beginningCashBalance: number;
    endingCashBalance: number;
    comparativeBeginningCashBalance?: number;
    comparativeEndingCashBalance?: number;
}> {
    // Query for cash account balances
    const cashBalanceQuery = `
    SELECT 
      SUM(CASE WHEN coa.normal_balance = 'DEBIT' THEN jl.debit_amount - jl.credit_amount 
               ELSE jl.credit_amount - jl.debit_amount END) as balance
    FROM gl_journal_lines jl
    JOIN gl_journal j ON jl.journal_id = j.id
    JOIN chart_of_accounts coa ON jl.account_id = coa.id
    WHERE j.tenant_id = $1 
      AND j.company_id = $2
      AND j.status = 'posted'
      AND j.journal_date < $3
      AND coa.account_category IN ('CASH', 'CASH_EQUIVALENTS')
  `;

    // Beginning balance (before start date)
    const { data: beginningData } = await dbClient
        .rpc('execute_sql', {
            query: cashBalanceQuery,
            params: [tenantId, companyId, startDate]
        });

    // Ending balance (up to end date)
    const { data: endingData } = await dbClient
        .rpc('execute_sql', {
            query: cashBalanceQuery.replace('< $3', '<= $3'),
            params: [tenantId, companyId, endDate]
        });

    const beginningCashBalance = parseFloat(beginningData?.[0]?.balance || '0');
    const endingCashBalance = parseFloat(endingData?.[0]?.balance || '0');

    let comparativeBeginningCashBalance: number | undefined;
    let comparativeEndingCashBalance: number | undefined;

    if (comparativePeriod) {
        const { data: compBeginningData } = await dbClient
            .rpc('execute_sql', {
                query: cashBalanceQuery,
                params: [tenantId, companyId, comparativePeriod.startDate]
            });

        const { data: compEndingData } = await dbClient
            .rpc('execute_sql', {
                query: cashBalanceQuery.replace('< $3', '<= $3'),
                params: [tenantId, companyId, comparativePeriod.endDate]
            });

        comparativeBeginningCashBalance = parseFloat(compBeginningData?.[0]?.balance || '0');
        comparativeEndingCashBalance = parseFloat(compEndingData?.[0]?.balance || '0');
    }

    return {
        beginningCashBalance,
        endingCashBalance,
        comparativeBeginningCashBalance,
        comparativeEndingCashBalance
    };
}

/**
 * Calculate cash flow metrics
 */
function calculateCashFlowMetrics(
    operatingActivities: CashFlowSection,
    investingActivities: CashFlowSection,
    financingActivities: CashFlowSection,
    cashBalances: any
): CashFlowResult['metrics'] {
    const netCashFromOperating = operatingActivities.subtotal;
    const netCashFromInvesting = investingActivities.subtotal;
    const netCashFromFinancing = financingActivities.subtotal;
    const netChangeInCash = netCashFromOperating + netCashFromInvesting + netCashFromFinancing;

    // Comparative metrics
    const comparativeNetCashFromOperating = operatingActivities.comparativeSubtotal;
    const comparativeNetCashFromInvesting = investingActivities.comparativeSubtotal;
    const comparativeNetCashFromFinancing = financingActivities.comparativeSubtotal;
    const comparativeNetChangeInCash = (comparativeNetCashFromOperating || 0) +
        (comparativeNetCashFromInvesting || 0) +
        (comparativeNetCashFromFinancing || 0);

    // Variances
    const operatingCashVariance = netCashFromOperating - (comparativeNetCashFromOperating || 0);
    const investingCashVariance = netCashFromInvesting - (comparativeNetCashFromInvesting || 0);
    const financingCashVariance = netCashFromFinancing - (comparativeNetCashFromFinancing || 0);
    const netCashVariance = netChangeInCash - comparativeNetChangeInCash;

    return {
        netCashFromOperating: Math.round(netCashFromOperating * 100) / 100,
        netCashFromInvesting: Math.round(netCashFromInvesting * 100) / 100,
        netCashFromFinancing: Math.round(netCashFromFinancing * 100) / 100,
        netChangeInCash: Math.round(netChangeInCash * 100) / 100,
        beginningCashBalance: Math.round(cashBalances.beginningCashBalance * 100) / 100,
        endingCashBalance: Math.round(cashBalances.endingCashBalance * 100) / 100,

        comparativeNetCashFromOperating: comparativeNetCashFromOperating ? Math.round(comparativeNetCashFromOperating * 100) / 100 : undefined,
        comparativeNetCashFromInvesting: comparativeNetCashFromInvesting ? Math.round(comparativeNetCashFromInvesting * 100) / 100 : undefined,
        comparativeNetCashFromFinancing: comparativeNetCashFromFinancing ? Math.round(comparativeNetCashFromFinancing * 100) / 100 : undefined,
        comparativeNetChangeInCash: comparativeNetChangeInCash ? Math.round(comparativeNetChangeInCash * 100) / 100 : undefined,

        operatingCashVariance: Math.round(operatingCashVariance * 100) / 100,
        investingCashVariance: Math.round(investingCashVariance * 100) / 100,
        financingCashVariance: Math.round(financingCashVariance * 100) / 100,
        netCashVariance: Math.round(netCashVariance * 100) / 100
    };
}

/**
 * Generate reconciliation for indirect method
 */
async function generateReconciliation(
    trialBalanceAccounts: TrialBalanceAccount[],
    cashFlowActivities: Map<string, any>
): Promise<CashFlowResult['reconciliation']> {
    // Calculate net income from revenue and expense accounts
    let netIncome = 0;
    for (const account of trialBalanceAccounts) {
        if (account.accountType === 'REVENUE') {
            netIncome += account.normalBalance === 'CREDIT' ? account.closingBalance : -account.closingBalance;
        } else if (account.accountType === 'EXPENSE') {
            netIncome -= account.normalBalance === 'DEBIT' ? account.closingBalance : -account.closingBalance;
        }
    }

    // Generate adjustments per IAS 7 indirect method requirements
    const adjustments = await calculateNonCashAdjustments(trialBalanceAccounts, cashFlowActivities);

    // Generate working capital changes per IAS 7 requirements
    const workingCapitalChanges = await calculateWorkingCapitalChanges(trialBalanceAccounts, cashFlowActivities);

    return {
        netIncome: Math.round(netIncome * 100) / 100,
        adjustments,
        workingCapitalChanges
    };
}

/**
 * Calculate non-cash adjustments for indirect method per IAS 7
 */
async function calculateNonCashAdjustments(
    trialBalanceAccounts: TrialBalanceAccount[],
    cashFlowActivities: Map<string, any>
): Promise<Array<{ description: string; amount: number; type: 'ADD' | 'SUBTRACT' }>> {
    const adjustments: Array<{ description: string; amount: number; type: 'ADD' | 'SUBTRACT' }> = [];

    // 1. Depreciation and Amortization (non-cash expense - add back)
    let depreciationAmount = 0;
    for (const account of trialBalanceAccounts) {
        if (account.accountType === 'EXPENSE' &&
            (account.accountName?.toLowerCase().includes('depreciation') ||
                account.accountName?.toLowerCase().includes('amortization'))) {
            depreciationAmount += account.normalBalance === 'DEBIT' ? account.closingBalance : -account.closingBalance;
        }
    }

    if (depreciationAmount > 0) {
        adjustments.push({
            description: 'Depreciation and Amortization',
            amount: Math.round(depreciationAmount * 100) / 100,
            type: 'ADD'
        });
    }

    // 2. Gain/Loss on Asset Disposal (non-cash item)
    let disposalGainLoss = 0;
    for (const account of trialBalanceAccounts) {
        if (account.accountName?.toLowerCase().includes('gain') &&
            account.accountName?.toLowerCase().includes('disposal')) {
            disposalGainLoss -= account.normalBalance === 'CREDIT' ? account.closingBalance : -account.closingBalance;
        } else if (account.accountName?.toLowerCase().includes('loss') &&
            account.accountName?.toLowerCase().includes('disposal')) {
            disposalGainLoss += account.normalBalance === 'DEBIT' ? account.closingBalance : -account.closingBalance;
        }
    }

    if (disposalGainLoss !== 0) {
        adjustments.push({
            description: 'Gain/Loss on Asset Disposal',
            amount: Math.round(Math.abs(disposalGainLoss) * 100) / 100,
            type: disposalGainLoss > 0 ? 'ADD' : 'SUBTRACT'
        });
    }

    // 3. Bad Debt Expense (non-cash expense - add back)
    let badDebtAmount = 0;
    for (const account of trialBalanceAccounts) {
        if (account.accountType === 'EXPENSE' &&
            (account.accountName?.toLowerCase().includes('bad debt') ||
                account.accountName?.toLowerCase().includes('doubtful'))) {
            badDebtAmount += account.normalBalance === 'DEBIT' ? account.closingBalance : -account.closingBalance;
        }
    }

    if (badDebtAmount > 0) {
        adjustments.push({
            description: 'Bad Debt Expense',
            amount: Math.round(badDebtAmount * 100) / 100,
            type: 'ADD'
        });
    }

    // 4. Stock-based Compensation (non-cash expense - add back)
    let stockCompAmount = 0;
    for (const account of trialBalanceAccounts) {
        if (account.accountType === 'EXPENSE' &&
            (account.accountName?.toLowerCase().includes('stock') ||
                account.accountName?.toLowerCase().includes('share-based'))) {
            stockCompAmount += account.normalBalance === 'DEBIT' ? account.closingBalance : -account.closingBalance;
        }
    }

    if (stockCompAmount > 0) {
        adjustments.push({
            description: 'Stock-based Compensation',
            amount: Math.round(stockCompAmount * 100) / 100,
            type: 'ADD'
        });
    }

    return adjustments;
}

/**
 * Calculate working capital changes per IAS 7 requirements
 */
async function calculateWorkingCapitalChanges(
    trialBalanceAccounts: TrialBalanceAccount[],
    cashFlowActivities: Map<string, any>
): Promise<Array<{ description: string; amount: number; type: 'INCREASE' | 'DECREASE' }>> {
    const workingCapitalChanges: Array<{ description: string; amount: number; type: 'INCREASE' | 'DECREASE' }> = [];

    // 1. Changes in Accounts Receivable
    let arChange = 0;
    for (const account of trialBalanceAccounts) {
        if (account.accountType === 'ASSET' &&
            (account.accountName?.toLowerCase().includes('receivable') ||
                account.accountName?.toLowerCase().includes('debtors'))) {
            // Increase in AR = cash outflow (use of cash)
            // Calculate period activity as net change (debits - credits for assets)
            const periodActivity = account.normalBalance === 'DEBIT'
                ? account.periodDebits - account.periodCredits
                : account.periodCredits - account.periodDebits;
            arChange += periodActivity;
        }
    }

    if (Math.abs(arChange) > 0) {
        workingCapitalChanges.push({
            description: 'Changes in Accounts Receivable',
            amount: Math.round(Math.abs(arChange) * 100) / 100,
            type: arChange > 0 ? 'DECREASE' : 'INCREASE'
        });
    }

    // 2. Changes in Inventory
    let inventoryChange = 0;
    for (const account of trialBalanceAccounts) {
        if (account.accountType === 'ASSET' &&
            (account.accountName?.toLowerCase().includes('inventory') ||
                account.accountName?.toLowerCase().includes('stock'))) {
            // Increase in inventory = cash outflow (use of cash)
            const periodActivity = account.normalBalance === 'DEBIT'
                ? account.periodDebits - account.periodCredits
                : account.periodCredits - account.periodDebits;
            inventoryChange += periodActivity;
        }
    }

    if (Math.abs(inventoryChange) > 0) {
        workingCapitalChanges.push({
            description: 'Changes in Inventory',
            amount: Math.round(Math.abs(inventoryChange) * 100) / 100,
            type: inventoryChange > 0 ? 'DECREASE' : 'INCREASE'
        });
    }

    // 3. Changes in Prepaid Expenses
    let prepaidChange = 0;
    for (const account of trialBalanceAccounts) {
        if (account.accountType === 'ASSET' &&
            account.accountName?.toLowerCase().includes('prepaid')) {
            // Increase in prepaid = cash outflow (use of cash)
            const periodActivity = account.normalBalance === 'DEBIT'
                ? account.periodDebits - account.periodCredits
                : account.periodCredits - account.periodDebits;
            prepaidChange += periodActivity;
        }
    }

    if (Math.abs(prepaidChange) > 0) {
        workingCapitalChanges.push({
            description: 'Changes in Prepaid Expenses',
            amount: Math.round(Math.abs(prepaidChange) * 100) / 100,
            type: prepaidChange > 0 ? 'DECREASE' : 'INCREASE'
        });
    }

    // 4. Changes in Accounts Payable
    let apChange = 0;
    for (const account of trialBalanceAccounts) {
        if (account.accountType === 'LIABILITY' &&
            (account.accountName?.toLowerCase().includes('payable') ||
                account.accountName?.toLowerCase().includes('creditors'))) {
            // Increase in AP = cash inflow (source of cash)
            const periodActivity = account.normalBalance === 'DEBIT'
                ? account.periodDebits - account.periodCredits
                : account.periodCredits - account.periodDebits;
            apChange += periodActivity;
        }
    }

    if (Math.abs(apChange) > 0) {
        workingCapitalChanges.push({
            description: 'Changes in Accounts Payable',
            amount: Math.round(Math.abs(apChange) * 100) / 100,
            type: apChange > 0 ? 'INCREASE' : 'DECREASE'
        });
    }

    // 5. Changes in Accrued Liabilities
    let accruedChange = 0;
    for (const account of trialBalanceAccounts) {
        if (account.accountType === 'LIABILITY' &&
            account.accountName?.toLowerCase().includes('accrued')) {
            // Increase in accrued liabilities = cash inflow (source of cash)
            const periodActivity = account.normalBalance === 'DEBIT'
                ? account.periodDebits - account.periodCredits
                : account.periodCredits - account.periodDebits;
            accruedChange += periodActivity;
        }
    }

    if (Math.abs(accruedChange) > 0) {
        workingCapitalChanges.push({
            description: 'Changes in Accrued Liabilities',
            amount: Math.round(Math.abs(accruedChange) * 100) / 100,
            type: accruedChange > 0 ? 'INCREASE' : 'DECREASE'
        });
    }

    return workingCapitalChanges;
}

/**
 * Helper functions for activity classification
 */
function isOperatingActivity(accountType: string): boolean {
    const operatingTypes = ['REVENUE', 'EXPENSE'];
    return operatingTypes.includes(accountType.toUpperCase());
}

function isInvestingActivity(accountType: string, accountCategory?: string): boolean {
    // Per IAS 7 (Statement of Cash Flows) - Investing Activities
    // Cash flows from acquisition and disposal of long-term assets and other investments

    const investingAccountTypes = [
        'FIXED_ASSET',
        'PROPERTY_PLANT_EQUIPMENT',
        'INTANGIBLE_ASSET',
        'INVESTMENT',
        'LONG_TERM_INVESTMENT'
    ];

    const investingCategories = [
        'PROPERTY_PLANT_EQUIPMENT',
        'INTANGIBLE_ASSETS',
        'INVESTMENTS',
        'LONG_TERM_INVESTMENTS',
        'MARKETABLE_SECURITIES',
        'INVESTMENT_PROPERTY',
        'SUBSIDIARIES',
        'ASSOCIATES',
        'JOINT_VENTURES'
    ];

    // Check account type first
    if (investingAccountTypes.includes(accountType.toUpperCase())) {
        return true;
    }

    // Check account category if provided
    if (accountCategory && investingCategories.includes(accountCategory.toUpperCase())) {
        return true;
    }

    return false;
}

function isFinancingActivity(accountType: string, accountCategory?: string): boolean {
    // Per IAS 7 (Statement of Cash Flows) - Financing Activities
    // Cash flows that result in changes in the size and composition of equity and borrowings

    const financingAccountTypes = [
        'EQUITY',
        'SHARE_CAPITAL',
        'RETAINED_EARNINGS',
        'LONG_TERM_LIABILITY',
        'SHORT_TERM_LIABILITY'
    ];

    const financingCategories = [
        'SHARE_CAPITAL',
        'ADDITIONAL_PAID_IN_CAPITAL',
        'TREASURY_STOCK',
        'DIVIDENDS_PAYABLE',
        'LONG_TERM_DEBT',
        'NOTES_PAYABLE',
        'BONDS_PAYABLE',
        'BANK_LOANS',
        'MORTGAGE_PAYABLE',
        'LEASE_LIABILITY',
        'CONVERTIBLE_DEBT',
        'PREFERENCE_SHARES'
    ];

    // Check account type first
    if (financingAccountTypes.includes(accountType.toUpperCase())) {
        return true;
    }

    // Check account category if provided
    if (accountCategory && financingCategories.includes(accountCategory.toUpperCase())) {
        return true;
    }

    // Special cases for liability accounts that are financing-related
    if (accountType.toUpperCase() === 'LIABILITY') {
        // Exclude operating liabilities (AP, accrued expenses, taxes payable)
        const operatingLiabilityCategories = [
            'ACCOUNTS_PAYABLE',
            'ACCRUED_EXPENSES',
            'TAXES_PAYABLE',
            'WAGES_PAYABLE',
            'INTEREST_PAYABLE'
        ];

        if (accountCategory && !operatingLiabilityCategories.includes(accountCategory.toUpperCase())) {
            return true;
        }
    }

    return false;
}

/**
 * Calculate section variance percentage
 */
function calculateSectionVariancePercent(activities: CashFlowActivity[]): number {
    const currentTotal = activities.reduce((sum, act) => sum + act.currentPeriodAmount, 0);
    const comparativeTotal = activities.reduce((sum, act) => sum + (act.comparativePeriodAmount || 0), 0);

    if (comparativeTotal === 0) return 0;
    return ((currentTotal - comparativeTotal) / Math.abs(comparativeTotal)) * 100;
}

/**
 * Validate cash flow input parameters
 */
function validateCashFlowInput(input: CashFlowInput): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!input.tenantId) {
        errors.push('Tenant ID is required');
    }

    if (!input.companyId) {
        errors.push('Company ID is required');
    }

    if (!input.startDate) {
        errors.push('Start date is required');
    }

    if (!input.endDate) {
        errors.push('End date is required');
    }

    if (input.startDate && input.endDate && input.startDate >= input.endDate) {
        errors.push('Start date must be before end date');
    }

    if (input.endDate && input.endDate > new Date()) {
        errors.push('End date cannot be in the future');
    }

    if (input.comparativePeriod) {
        if (!input.comparativePeriod.startDate || !input.comparativePeriod.endDate) {
            errors.push('Comparative period requires both start and end dates');
        }

        if (input.comparativePeriod.startDate >= input.comparativePeriod.endDate) {
            errors.push('Comparative period start date must be before end date');
        }
    }

    if (input.method && !['DIRECT', 'INDIRECT'].includes(input.method)) {
        errors.push('Invalid method. Must be DIRECT or INDIRECT');
    }

    if (input.reportFormat && !['STANDARD', 'COMPARATIVE'].includes(input.reportFormat)) {
        errors.push('Invalid report format. Must be STANDARD or COMPARATIVE');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
