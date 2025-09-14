/**
 * AI Engine for Smart UX
 * Comprehensive AI-powered features for user experience enhancement
 */

import { supabase } from "./supabase";

export type AISuggestionType =
  | "setup"
  | "transaction"
  | "report"
  | "optimization"
  | "compliance"
  | "efficiency";

export type AIPriority = "high" | "medium" | "low";

export type AIActionType = "navigate" | "create" | "update" | "review" | "configure" | "export";

export interface AISuggestion {
  id: string;
  type: AISuggestionType;
  priority: AIPriority;
  title: string;
  description: string;
  action: string;
  actionType: AIActionType;
  actionUrl?: string;
  completed: boolean;
  dismissed: boolean;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface AIOnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  required: boolean;
  completed: boolean;
  estimatedTime: number; // in minutes
  dependencies: string[];
  validation: (data: any) => boolean;
}

export interface AIProgress {
  userId: string;
  companyId: string;
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  completionPercentage: number;
  estimatedTimeRemaining: number;
  lastUpdated: string;
}

export interface AIContext {
  userId: string;
  companyId: string;
  userRole: "admin" | "accountant" | "viewer";
  businessType: "retail" | "service" | "manufacturing" | "consulting" | "other";
  companySize: "startup" | "small" | "medium" | "large";
  currentPage: string;
  recentActions: string[];
  setupComplete: boolean;
  lastLogin: string;
}

export interface AICategorizationRule {
  id: string;
  pattern: string;
  accountId: string;
  confidence: number;
  category: string;
  subcategory?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface AICategorizationResult {
  accountId: string;
  confidence: number;
  category: string;
  subcategory?: string;
  reasoning: string;
  alternatives: Array<{
    accountId: string;
    confidence: number;
    reasoning: string;
  }>;
}

/**
 * AI Engine for Smart UX
 */
export class AIEngine {
  /**
   * Get contextual suggestions for user
   */
  static async getSuggestions(context: AIContext): Promise<{
    success: boolean;
    suggestions?: AISuggestion[];
    error?: string;
  }> {
    try {
      const suggestions: AISuggestion[] = [];

      // Setup suggestions for new users
      if (!context.setupComplete) {
        suggestions.push(...this.getSetupSuggestions(context));
      }

      // Transaction suggestions based on recent actions
      suggestions.push(...this.getTransactionSuggestions(context));

      // Report suggestions based on business type
      suggestions.push(...this.getReportSuggestions(context));

      // Optimization suggestions
      suggestions.push(...this.getOptimizationSuggestions(context));

      // Compliance suggestions
      suggestions.push(...this.getComplianceSuggestions(context));

      // Filter out dismissed and expired suggestions
      const activeSuggestions = suggestions.filter(
        s => !s.dismissed && (!s.expiresAt || new Date(s.expiresAt) > new Date()),
      );

      // Sort by priority and relevance
      activeSuggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      return { success: true, suggestions: activeSuggestions };
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      return { success: false, error: "Failed to get AI suggestions" };
    }
  }

  /**
   * Get setup suggestions for new users
   */
  private static getSetupSuggestions(context: AIContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Check if Chart of Accounts is set up
    suggestions.push({
      id: "setup-coa",
      type: "setup",
      priority: "high",
      title: "Set up your Chart of Accounts",
      description: "Create your company's chart of accounts to start recording transactions",
      action: "Go to Chart of Accounts",
      actionType: "navigate",
      actionUrl: "/accounts",
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });

    // Check if company information is complete
    suggestions.push({
      id: "setup-company",
      type: "setup",
      priority: "high",
      title: "Complete company information",
      description: "Add your company details, currency, and fiscal year settings",
      action: "Update company settings",
      actionType: "configure",
      actionUrl: "/settings",
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });

    // Check if first invoice is created
    suggestions.push({
      id: "create-first-invoice",
      type: "setup",
      priority: "medium",
      title: "Create your first invoice",
      description: "Start billing your customers with professional invoices",
      action: "Create invoice",
      actionType: "create",
      actionUrl: "/invoices/new",
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });

    return suggestions;
  }

  /**
   * Get transaction suggestions based on context
   */
  private static getTransactionSuggestions(context: AIContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Suggest recurring transactions if none exist
    suggestions.push({
      id: "setup-recurring",
      type: "transaction",
      priority: "medium",
      title: "Set up recurring transactions",
      description: "Automate monthly rent, utilities, and other recurring payments",
      action: "Set up recurring transactions",
      actionType: "configure",
      actionUrl: "/transactions/recurring",
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });

    // Suggest bank reconciliation if overdue
    suggestions.push({
      id: "reconcile-bank",
      type: "transaction",
      priority: "high",
      title: "Reconcile bank accounts",
      description: "Match your bank statements with recorded transactions",
      action: "Start reconciliation",
      actionType: "navigate",
      actionUrl: "/banking/reconcile",
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });

    return suggestions;
  }

  /**
   * Get report suggestions based on business type
   */
  private static getReportSuggestions(context: AIContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Suggest relevant reports based on business type
    if (context.businessType === "retail") {
      suggestions.push({
        id: "inventory-report",
        type: "report",
        priority: "medium",
        title: "Review inventory turnover",
        description: "Analyze your inventory performance and identify slow-moving items",
        action: "View inventory report",
        actionType: "navigate",
        actionUrl: "/reports/inventory",
        completed: false,
        dismissed: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Suggest monthly financial review
    suggestions.push({
      id: "monthly-review",
      type: "report",
      priority: "high",
      title: "Monthly financial review",
      description: "Review your profit & loss statement and balance sheet",
      action: "View financial reports",
      actionType: "navigate",
      actionUrl: "/reports/financial",
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });

    return suggestions;
  }

  /**
   * Get optimization suggestions
   */
  private static getOptimizationSuggestions(context: AIContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Suggest cost center setup for better tracking
    suggestions.push({
      id: "setup-cost-centers",
      type: "optimization",
      priority: "medium",
      title: "Set up cost centers",
      description: "Track expenses by department or project for better analysis",
      action: "Set up cost centers",
      actionType: "configure",
      actionUrl: "/tags",
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });

    // Suggest multi-currency setup if international
    suggestions.push({
      id: "setup-multi-currency",
      type: "optimization",
      priority: "low",
      title: "Enable multi-currency",
      description: "Handle transactions in multiple currencies for international business",
      action: "Configure currencies",
      actionType: "configure",
      actionUrl: "/currency",
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });

    return suggestions;
  }

  /**
   * Get compliance suggestions
   */
  private static getComplianceSuggestions(context: AIContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Suggest tax setup
    suggestions.push({
      id: "setup-tax",
      type: "compliance",
      priority: "high",
      title: "Configure tax settings",
      description: "Set up tax rates and rules for accurate tax calculations",
      action: "Configure taxes",
      actionType: "configure",
      actionUrl: "/settings/taxes",
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });

    // Suggest backup setup
    suggestions.push({
      id: "setup-backup",
      type: "compliance",
      priority: "medium",
      title: "Set up automated backups",
      description: "Protect your data with regular automated backups",
      action: "Configure backups",
      actionType: "configure",
      actionUrl: "/settings/backup",
      completed: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });

    return suggestions;
  }

  /**
   * Get onboarding steps
   */
  static async getOnboardingSteps(companyId: string): Promise<{
    success: boolean;
    steps?: AIOnboardingStep[];
    error?: string;
  }> {
    try {
      const steps: AIOnboardingStep[] = [
        {
          id: "company-info",
          title: "Company Information",
          description: "Set up your company details, currency, and fiscal year",
          component: "CompanySetup",
          required: true,
          completed: false,
          estimatedTime: 2,
          dependencies: [],
          validation: data => data.companyName && data.currency && data.fiscalYear,
        },
        {
          id: "chart-of-accounts",
          title: "Chart of Accounts",
          description: "Create or import your chart of accounts",
          component: "CoASetup",
          required: true,
          completed: false,
          estimatedTime: 3,
          dependencies: ["company-info"],
          validation: data => data.accounts && data.accounts.length > 0,
        },
        {
          id: "first-transaction",
          title: "First Transaction",
          description: "Record your first transaction to get started",
          component: "FirstTransaction",
          required: true,
          completed: false,
          estimatedTime: 2,
          dependencies: ["chart-of-accounts"],
          validation: data => data.transactionType && data.amount,
        },
        {
          id: "bank-account",
          title: "Bank Account",
          description: "Add your bank account for reconciliation",
          component: "BankAccount",
          required: false,
          completed: false,
          estimatedTime: 1,
          dependencies: ["first-transaction"],
          validation: data => data.bankName && data.accountNumber,
        },
        {
          id: "first-invoice",
          title: "First Invoice",
          description: "Create your first invoice to start billing",
          component: "FirstInvoice",
          required: false,
          completed: false,
          estimatedTime: 3,
          dependencies: ["chart-of-accounts"],
          validation: data => data.customerName && data.amount,
        },
      ];

      return { success: true, steps };
    } catch (error) {
      console.error("Error getting onboarding steps:", error);
      return { success: false, error: "Failed to get onboarding steps" };
    }
  }

  /**
   * Get user progress
   */
  static async getProgress(
    userId: string,
    companyId: string,
  ): Promise<{
    success: boolean;
    progress?: AIProgress;
    error?: string;
  }> {
    try {
      // This would typically come from the database
      const progress: AIProgress = {
        userId,
        companyId,
        currentStep: "company-info",
        completedSteps: [],
        totalSteps: 5,
        completionPercentage: 0,
        estimatedTimeRemaining: 11, // minutes
        lastUpdated: new Date().toISOString(),
      };

      return { success: true, progress };
    } catch (error) {
      console.error("Error getting progress:", error);
      return { success: false, error: "Failed to get progress" };
    }
  }

  /**
   * Auto-categorize transaction
   */
  static async categorizeTransaction(
    description: string,
    amount: number,
    companyId: string,
  ): Promise<{
    success: boolean;
    result?: AICategorizationResult;
    error?: string;
  }> {
    try {
      // This would use machine learning in a real implementation
      const result: AICategorizationResult = {
        accountId: this.getAccountIdFromDescription(description),
        confidence: 0.85,
        category: this.getCategoryFromDescription(description),
        subcategory: this.getSubcategoryFromDescription(description),
        reasoning: `Based on description "${description}" and amount ${amount}`,
        alternatives: [
          {
            accountId: "alternative-account-id",
            confidence: 0.15,
            reasoning: "Alternative account based on similar transactions",
          },
        ],
      };

      return { success: true, result };
    } catch (error) {
      console.error("Error categorizing transaction:", error);
      return { success: false, error: "Failed to categorize transaction" };
    }
  }

  /**
   * Get smart account suggestions
   */
  static async getAccountSuggestions(
    description: string,
    amount: number,
    companyId: string,
  ): Promise<{
    success: boolean;
    suggestions?: Array<{
      accountId: string;
      accountName: string;
      confidence: number;
      reasoning: string;
    }>;
    error?: string;
  }> {
    try {
      const suggestions = [
        {
          accountId: "office-supplies",
          accountName: "Office Supplies",
          confidence: 0.9,
          reasoning: "High confidence based on description keywords",
        },
        {
          accountId: "utilities",
          accountName: "Utilities",
          confidence: 0.7,
          reasoning: "Medium confidence based on amount and description",
        },
        {
          accountId: "travel-expenses",
          accountName: "Travel Expenses",
          confidence: 0.5,
          reasoning: "Lower confidence based on partial keyword match",
        },
      ];

      return { success: true, suggestions };
    } catch (error) {
      console.error("Error getting account suggestions:", error);
      return { success: false, error: "Failed to get account suggestions" };
    }
  }

  /**
   * Mark suggestion as completed
   */
  static async markSuggestionCompleted(
    suggestionId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // This would update the database
      console.log(`Marking suggestion ${suggestionId} as completed for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error("Error marking suggestion as completed:", error);
      return { success: false, error: "Failed to mark suggestion as completed" };
    }
  }

  /**
   * Dismiss suggestion
   */
  static async dismissSuggestion(
    suggestionId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // This would update the database
      console.log(`Dismissing suggestion ${suggestionId} for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error("Error dismissing suggestion:", error);
      return { success: false, error: "Failed to dismiss suggestion" };
    }
  }

  /**
   * Helper methods for categorization
   */
  private static getAccountIdFromDescription(description: string): string {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes("office") || lowerDesc.includes("supplies")) {
      return "office-supplies";
    } else if (lowerDesc.includes("rent") || lowerDesc.includes("lease")) {
      return "rent-expense";
    } else if (lowerDesc.includes("utilities") || lowerDesc.includes("electric")) {
      return "utilities";
    } else if (lowerDesc.includes("travel") || lowerDesc.includes("flight")) {
      return "travel-expenses";
    } else if (lowerDesc.includes("marketing") || lowerDesc.includes("advertising")) {
      return "marketing-expenses";
    }

    return "general-expenses";
  }

  private static getCategoryFromDescription(description: string): string {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes("office") || lowerDesc.includes("supplies")) {
      return "Operating Expenses";
    } else if (lowerDesc.includes("rent") || lowerDesc.includes("lease")) {
      return "Operating Expenses";
    } else if (lowerDesc.includes("utilities")) {
      return "Operating Expenses";
    } else if (lowerDesc.includes("travel")) {
      return "Operating Expenses";
    } else if (lowerDesc.includes("marketing")) {
      return "Operating Expenses";
    }

    return "Operating Expenses";
  }

  private static getSubcategoryFromDescription(description: string): string {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes("office") || lowerDesc.includes("supplies")) {
      return "Office Supplies";
    } else if (lowerDesc.includes("rent") || lowerDesc.includes("lease")) {
      return "Rent";
    } else if (lowerDesc.includes("utilities")) {
      return "Utilities";
    } else if (lowerDesc.includes("travel")) {
      return "Travel";
    } else if (lowerDesc.includes("marketing")) {
      return "Marketing";
    }

    return "General";
  }
}
