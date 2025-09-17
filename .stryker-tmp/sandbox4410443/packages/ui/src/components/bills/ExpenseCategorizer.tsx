// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Tag, Plus, Edit, Trash2, CheckCircle, AlertCircle, Settings, Filter } from "lucide-react";
import { cn } from "@aibos/ui/utils";

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  account: string;
  taxDeductible: boolean;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategorizationRule {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    field: "vendor" | "description" | "amount" | "account";
    operator: "contains" | "equals" | "starts_with" | "ends_with" | "greater_than" | "less_than";
    value: string;
  }>;
  categoryId: string;
  priority: number;
  isActive: boolean;
  hitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategorizerProps {
  className?: string;
  onCategoryCreate?: (category: ExpenseCategory) => void;
  onCategoryUpdate?: (categoryId: string, category: Partial<ExpenseCategory>) => void;
  onCategoryDelete?: (categoryId: string) => void;
  onRuleCreate?: (rule: CategorizationRule) => void;
  onRuleUpdate?: (ruleId: string, rule: Partial<CategorizationRule>) => void;
  onRuleDelete?: (ruleId: string) => void;
  onCategorizeExpense?: (expenseData: any) => string;
  isLoading?: boolean;
}

export const ExpenseCategorizer: React.FC<ExpenseCategorizerProps> = ({
  className,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
  onRuleCreate,
  onRuleUpdate,
  onRuleDelete,
  onCategorizeExpense,
  isLoading = false,
}) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [activeTab, setActiveTab] = useState<"categories" | "rules">("categories");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [editingRule, setEditingRule] = useState<CategorizationRule | null>(null);

  // Mock categories data
  const mockCategories: ExpenseCategory[] = [
    {
      id: "1",
      name: "Office Supplies",
      description: "General office supplies and equipment",
      account: "Office Expenses",
      taxDeductible: true,
      color: "bg-sys-blue-500",
      isActive: true,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      name: "Cloud Services",
      description: "Cloud computing and hosting services",
      account: "Technology Expenses",
      taxDeductible: true,
      color: "bg-sys-green-500",
      isActive: true,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "3",
      name: "Utilities",
      description: "Electricity, water, internet, and other utilities",
      account: "Operating Expenses",
      taxDeductible: true,
      color: "bg-sys-yellow-500",
      isActive: true,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "4",
      name: "Travel",
      description: "Business travel and transportation",
      account: "Travel Expenses",
      taxDeductible: true,
      color: "bg-sys-red-500",
      isActive: true,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
  ];

  // Mock rules data
  const mockRules: CategorizationRule[] = [
    {
      id: "1",
      name: "AWS Services",
      description: "Automatically categorize AWS bills",
      conditions: [{ field: "vendor", operator: "contains", value: "Amazon Web Services" }],
      categoryId: "2",
      priority: 1,
      isActive: true,
      hitCount: 12,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      name: "Office Depot Orders",
      description: "Categorize Office Depot purchases",
      conditions: [{ field: "vendor", operator: "contains", value: "Office Depot" }],
      categoryId: "1",
      priority: 2,
      isActive: true,
      hitCount: 8,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "3",
      name: "High-Value Expenses",
      description: "Flag expenses over $1000 for review",
      conditions: [{ field: "amount", operator: "greater_than", value: "1000" }],
      categoryId: "1",
      priority: 3,
      isActive: true,
      hitCount: 5,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
  ];

  useEffect(() => {
    setCategories(mockCategories);
    setRules(mockRules);
  }, []);

  const handleCategoryCreate = (categoryData: Partial<ExpenseCategory>) => {
    const newCategory: ExpenseCategory = {
      id: Date.now().toString(),
      name: categoryData.name || "",
      description: categoryData.description || "",
      account: categoryData.account || "",
      taxDeductible: categoryData.taxDeductible || false,
      color: categoryData.color || "bg-sys-gray-500",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...categoryData,
    };

    setCategories(prev => [...prev, newCategory]);
    setShowCategoryForm(false);

    if (onCategoryCreate) {
      onCategoryCreate(newCategory);
    }
  };

  const handleCategoryUpdate = (categoryId: string, categoryData: Partial<ExpenseCategory>) => {
    setCategories(prev =>
      prev.map(category =>
        category.id === categoryId
          ? { ...category, ...categoryData, updatedAt: new Date().toISOString() }
          : category,
      ),
    );
    setShowCategoryForm(false);
    setEditingCategory(null);

    if (onCategoryUpdate) {
      onCategoryUpdate(categoryId, categoryData);
    }
  };

  const handleCategoryDelete = (categoryId: string) => {
    setCategories(prev => prev.filter(category => category.id !== categoryId));

    if (onCategoryDelete) {
      onCategoryDelete(categoryId);
    }
  };

  const handleRuleCreate = (ruleData: Partial<CategorizationRule>) => {
    const newRule: CategorizationRule = {
      id: Date.now().toString(),
      name: ruleData.name || "",
      description: ruleData.description || "",
      conditions: ruleData.conditions || [],
      categoryId: ruleData.categoryId || "",
      priority: ruleData.priority || 1,
      isActive: true,
      hitCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...ruleData,
    };

    setRules(prev => [...prev, newRule]);
    setShowRuleForm(false);

    if (onRuleCreate) {
      onRuleCreate(newRule);
    }
  };

  const handleRuleUpdate = (ruleId: string, ruleData: Partial<CategorizationRule>) => {
    setRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, ...ruleData, updatedAt: new Date().toISOString() } : rule,
      ),
    );
    setShowRuleForm(false);
    setEditingRule(null);

    if (onRuleUpdate) {
      onRuleUpdate(ruleId, ruleData);
    }
  };

  const handleRuleDelete = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));

    if (onRuleDelete) {
      onRuleDelete(ruleId);
    }
  };

  const getCategoryById = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-4 bg-sys-fill-low rounded w-32"></div>
            <div className="h-8 bg-sys-fill-low rounded w-full"></div>
            <div className="h-4 bg-sys-fill-low rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sys-status-info/10 rounded-lg">
            <Tag className="h-6 w-6 text-sys-status-info" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-sys-text-primary">Expense Categorization</h1>
            <p className="text-sm text-sys-text-tertiary">Manage categories and automation rules</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("categories")}
            className={cn("btn btn-outline btn-sm", activeTab === "categories" && "btn-primary")}
            aria-label="View categories"
          >
            <Tag className="h-4 w-4 mr-2" aria-hidden="true" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={cn("btn btn-outline btn-sm", activeTab === "rules" && "btn-primary")}
            aria-label="View rules"
          >
            <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
            Rules
          </button>
        </div>
      </div>

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          {/* Categories Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-sys-text-primary">Expense Categories</h2>
            <button
              onClick={() => setShowCategoryForm(true)}
              className="btn btn-primary btn-sm"
              aria-label="Add new category"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Category
            </button>
          </div>

          {/* Categories List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <div
                key={category.id}
                className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-medium text-sys-text-primary">{category.name}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowCategoryForm(true);
                      }}
                      className="p-1 text-sys-text-tertiary hover:bg-sys-fill-low rounded"
                      aria-label={`Edit ${category.name}`}
                    >
                      <Edit className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleCategoryDelete(category.id)}
                      className="p-1 text-sys-text-tertiary hover:bg-sys-status-error/10 hover:text-sys-status-error rounded"
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-sys-text-secondary mb-3">{category.description}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-sys-text-tertiary">Account</span>
                    <span className="text-sys-text-secondary">{category.account}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-sys-text-tertiary">Tax Deductible</span>
                    <span
                      className={cn(
                        "text-xs",
                        category.taxDeductible
                          ? "text-sys-status-success"
                          : "text-sys-text-tertiary",
                      )}
                    >
                      {category.taxDeductible ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          {/* Rules Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-sys-text-primary">Categorization Rules</h2>
            <button
              onClick={() => setShowRuleForm(true)}
              className="btn btn-primary btn-sm"
              aria-label="Add new rule"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Rule
            </button>
          </div>

          {/* Rules List */}
          <div className="space-y-4">
            {rules.map(rule => (
              <div
                key={rule.id}
                className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-sys-status-info/10 rounded-lg">
                      <Filter className="h-4 w-4 text-sys-status-info" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-sys-text-primary">{rule.name}</h3>
                      <p className="text-xs text-sys-text-tertiary">{rule.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-sys-status-info/10 text-sys-status-info text-xs rounded-full">
                      Priority {rule.priority}
                    </span>
                    <span className="px-2 py-1 bg-sys-status-success/10 text-sys-status-success text-xs rounded-full">
                      {rule.hitCount} hits
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setShowRuleForm(true);
                        }}
                        className="p-1 text-sys-text-tertiary hover:bg-sys-fill-low rounded"
                        aria-label={`Edit ${rule.name}`}
                      >
                        <Edit className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleRuleDelete(rule.id)}
                        className="p-1 text-sys-text-tertiary hover:bg-sys-status-error/10 hover:text-sys-status-error rounded"
                        aria-label={`Delete ${rule.name}`}
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-sys-text-tertiary">Category:</span>
                    <span className="text-xs text-sys-text-secondary">
                      {getCategoryById(rule.categoryId)?.name || "Unknown"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-sys-text-tertiary">Conditions:</span>
                    {rule.conditions.map((condition, index) => (
                      <div key={index} className="text-xs text-sys-text-secondary ml-2">
                        {condition.field} {condition.operator} "{condition.value}"
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Form */}
      {showCategoryForm && (
        <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
          <h3 className="text-lg font-medium text-sys-text-primary mb-4">
            {editingCategory ? "Edit Category" : "Add New Category"}
          </h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="category-name"
                className="block text-sm font-medium text-sys-text-primary mb-2"
              >
                Category Name
              </label>
              <input
                id="category-name"
                type="text"
                defaultValue={editingCategory?.name || ""}
                className="input w-full"
                aria-label="Category name"
              />
            </div>
            <div>
              <label
                htmlFor="category-description"
                className="block text-sm font-medium text-sys-text-primary mb-2"
              >
                Description
              </label>
              <textarea
                id="category-description"
                defaultValue={editingCategory?.description || ""}
                rows={3}
                className="input w-full resize-none"
                aria-label="Category description"
              />
            </div>
            <div>
              <label
                htmlFor="category-account"
                className="block text-sm font-medium text-sys-text-primary mb-2"
              >
                Account
              </label>
              <input
                id="category-account"
                type="text"
                defaultValue={editingCategory?.account || ""}
                className="input w-full"
                aria-label="Account"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="tax-deductible"
                type="checkbox"
                defaultChecked={editingCategory?.taxDeductible || false}
                className="rounded"
                aria-label="Tax deductible"
              />
              <label htmlFor="tax-deductible" className="text-sm text-sys-text-primary">
                Tax Deductible
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                }}
                className="btn btn-outline"
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const name = (document.getElementById("category-name") as HTMLInputElement)
                    ?.value;
                  const description = (
                    document.getElementById("category-description") as HTMLTextAreaElement
                  )?.value;
                  const account = (document.getElementById("category-account") as HTMLInputElement)
                    ?.value;
                  const taxDeductible = (
                    document.getElementById("tax-deductible") as HTMLInputElement
                  )?.checked;

                  if (editingCategory) {
                    handleCategoryUpdate(editingCategory.id, {
                      name,
                      description,
                      account,
                      taxDeductible,
                    });
                  } else {
                    handleCategoryCreate({ name, description, account, taxDeductible });
                  }
                }}
                className="btn btn-primary"
                aria-label={editingCategory ? "Update category" : "Create category"}
              >
                {editingCategory ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Form */}
      {showRuleForm && (
        <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
          <h3 className="text-lg font-medium text-sys-text-primary mb-4">
            {editingRule ? "Edit Rule" : "Add New Rule"}
          </h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="rule-name"
                className="block text-sm font-medium text-sys-text-primary mb-2"
              >
                Rule Name
              </label>
              <input
                id="rule-name"
                type="text"
                defaultValue={editingRule?.name || ""}
                className="input w-full"
                aria-label="Rule name"
              />
            </div>
            <div>
              <label
                htmlFor="rule-description"
                className="block text-sm font-medium text-sys-text-primary mb-2"
              >
                Description
              </label>
              <textarea
                id="rule-description"
                defaultValue={editingRule?.description || ""}
                rows={3}
                className="input w-full resize-none"
                aria-label="Rule description"
              />
            </div>
            <div>
              <label
                htmlFor="rule-category"
                className="block text-sm font-medium text-sys-text-primary mb-2"
              >
                Category
              </label>
              <select
                id="rule-category"
                defaultValue={editingRule?.categoryId || ""}
                className="input w-full"
                aria-label="Category"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="rule-priority"
                className="block text-sm font-medium text-sys-text-primary mb-2"
              >
                Priority
              </label>
              <input
                id="rule-priority"
                type="number"
                min="1"
                defaultValue={editingRule?.priority || 1}
                className="input w-full"
                aria-label="Priority"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRuleForm(false);
                  setEditingRule(null);
                }}
                className="btn btn-outline"
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const name = (document.getElementById("rule-name") as HTMLInputElement)?.value;
                  const description = (
                    document.getElementById("rule-description") as HTMLTextAreaElement
                  )?.value;
                  const categoryId = (document.getElementById("rule-category") as HTMLSelectElement)
                    ?.value;
                  const priority = parseInt(
                    (document.getElementById("rule-priority") as HTMLInputElement)?.value || "1",
                  );

                  if (editingRule) {
                    handleRuleUpdate(editingRule.id, { name, description, categoryId, priority });
                  } else {
                    handleRuleCreate({ name, description, categoryId, priority });
                  }
                }}
                className="btn btn-primary"
                aria-label={editingRule ? "Update rule" : "Create rule"}
              >
                {editingRule ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
