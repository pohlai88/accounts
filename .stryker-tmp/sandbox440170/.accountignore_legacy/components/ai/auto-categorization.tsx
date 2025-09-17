// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Brain,
  CheckCircle,
  X,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  Zap,
} from "lucide-react";
import { AIEngine, AICategorizationResult } from "@/lib/ai-engine";

interface AutoCategorizationProps {
  onCategorizationComplete: (result: AICategorizationResult) => void;
  onManualOverride: (accountId: string) => void;
}

export function AutoCategorization({
  onCategorizationComplete,
  onManualOverride,
}: AutoCategorizationProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [companyId] = useState("default-company-id"); // In real app, get from context
  const [categorizationResult, setCategorizationResult] = useState<AICategorizationResult | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const handleCategorize = async () => {
    if (!description.trim()) return;

    setLoading(true);
    try {
      const result = await AIEngine.categorizeTransaction(description, amount, companyId);
      if (result.success && result.result) {
        setCategorizationResult(result.result);
      }
    } catch (error) {
      console.error("Error categorizing transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (categorizationResult) {
      onCategorizationComplete(categorizationResult);
      resetForm();
    }
  };

  const handleReject = () => {
    setCategorizationResult(null);
  };

  const resetForm = () => {
    setDescription("");
    setAmount(0);
    setCategorizationResult(null);
    setShowAlternatives(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High Confidence";
    if (confidence >= 0.6) return "Medium Confidence";
    return "Low Confidence";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <span>AI Auto-Categorization</span>
        </CardTitle>
        <CardDescription>
          Let AI automatically categorize your transactions based on description and amount
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="description">Transaction Description</Label>
            <Input
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g., Office supplies from Staples"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="mt-1"
            />
          </div>
        </div>

        <Button
          onClick={handleCategorize}
          disabled={!description.trim() || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Categorize Transaction
            </>
          )}
        </Button>

        {categorizationResult && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">AI Suggestion</h4>
                <Badge
                  variant="outline"
                  className={getConfidenceColor(categorizationResult.confidence)}
                >
                  {getConfidenceLabel(categorizationResult.confidence)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Category: </span>
                  <span className="text-sm">{categorizationResult.category}</span>
                </div>
                {categorizationResult.subcategory && (
                  <div>
                    <span className="text-sm font-medium">Subcategory: </span>
                    <span className="text-sm">{categorizationResult.subcategory}</span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium">Confidence: </span>
                  <span className="text-sm">
                    {Math.round(categorizationResult.confidence * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Reasoning: </span>
                  <span className="text-sm text-muted-foreground">
                    {categorizationResult.reasoning}
                  </span>
                </div>
              </div>
            </div>

            {categorizationResult.alternatives.length > 0 && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="w-full"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {showAlternatives ? "Hide" : "Show"} Alternative Suggestions
                </Button>

                {showAlternatives && (
                  <div className="mt-2 space-y-2">
                    {categorizationResult.alternatives.map((alt, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-background">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">Alternative {index + 1}</div>
                            <div className="text-xs text-muted-foreground">{alt.reasoning}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(alt.confidence * 100)}%
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onManualOverride(alt.accountId)}
                            >
                              Use
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleReject} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleAccept} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SmartAccountSuggestionsProps {
  description: string;
  amount: number;
  companyId: string;
  onAccountSelect: (accountId: string) => void;
}

export function SmartAccountSuggestions({
  description,
  amount,
  companyId,
  onAccountSelect,
}: SmartAccountSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<
    Array<{
      accountId: string;
      accountName: string;
      confidence: number;
      reasoning: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (description.trim()) {
      loadSuggestions();
    }
  }, [description, amount, companyId]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const result = await AIEngine.getAccountSuggestions(description, amount, companyId);
      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions);
      }
    } catch (error) {
      console.error("Error loading account suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Loading suggestions...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Zap className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium">Smart Account Suggestions</span>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onAccountSelect(suggestion.accountId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium">{suggestion.accountName}</div>
                <div className="text-xs text-muted-foreground">{suggestion.reasoning}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CategorizationRulesProps {
  companyId: string;
}

export function CategorizationRules({ companyId }: CategorizationRulesProps) {
  const [rules, setRules] = useState<
    Array<{
      id: string;
      pattern: string;
      accountName: string;
      confidence: number;
      isActive: boolean;
    }>
  >([]);

  // Mock data - in real app, this would come from the database
  useEffect(() => {
    setRules([
      {
        id: "1",
        pattern: "office supplies",
        accountName: "Office Supplies",
        confidence: 0.95,
        isActive: true,
      },
      {
        id: "2",
        pattern: "rent",
        accountName: "Rent Expense",
        confidence: 0.9,
        isActive: true,
      },
      {
        id: "3",
        pattern: "utilities",
        accountName: "Utilities",
        confidence: 0.85,
        isActive: true,
      },
    ]);
  }, [companyId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <span>Categorization Rules</span>
        </CardTitle>
        <CardDescription>Manage AI categorization rules and patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">"{rule.pattern}"</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{rule.accountName}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Confidence: {Math.round(rule.confidence * 100)}%
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={rule.isActive ? "default" : "secondary"} className="text-xs">
                    {rule.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full mt-4" variant="outline">
          <Brain className="h-4 w-4 mr-2" />
          Add New Rule
        </Button>
      </CardContent>
    </Card>
  );
}
