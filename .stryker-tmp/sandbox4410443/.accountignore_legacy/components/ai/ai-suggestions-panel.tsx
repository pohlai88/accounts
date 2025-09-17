// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Lightbulb,
  CheckCircle,
  X,
  ArrowRight,
  Clock,
  AlertTriangle,
  TrendingUp,
  Settings,
  FileText,
  DollarSign,
  Shield,
  Zap,
} from "lucide-react";
import { AIEngine, AISuggestion, AIContext } from "@/lib/ai-engine";

interface AISuggestionsPanelProps {
  companyId: string;
  userId: string;
  context: AIContext;
  onSuggestionAction: (suggestion: AISuggestion) => void;
}

export function AISuggestionsPanel({
  companyId,
  userId,
  context,
  onSuggestionAction,
}: AISuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AISuggestion | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [companyId, context]);

  const loadSuggestions = async () => {
    try {
      const result = await AIEngine.getSuggestions(context);
      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions);
      }
    } catch (error) {
      console.error("Error loading suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: AISuggestion) => {
    setSelectedSuggestion(suggestion);
    setShowDetails(true);
  };

  const handleComplete = async (suggestion: AISuggestion) => {
    try {
      await AIEngine.markSuggestionCompleted(suggestion.id, userId);
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      onSuggestionAction(suggestion);
    } catch (error) {
      console.error("Error completing suggestion:", error);
    }
  };

  const handleDismiss = async (suggestion: AISuggestion) => {
    try {
      await AIEngine.dismissSuggestion(suggestion.id, userId);
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (error) {
      console.error("Error dismissing suggestion:", error);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "setup":
        return <Settings className="h-4 w-4" />;
      case "transaction":
        return <DollarSign className="h-4 w-4" />;
      case "report":
        return <FileText className="h-4 w-4" />;
      case "optimization":
        return <Zap className="h-4 w-4" />;
      case "compliance":
        return <Shield className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "setup":
        return "bg-blue-100 text-blue-800";
      case "transaction":
        return "bg-green-100 text-green-800";
      case "report":
        return "bg-purple-100 text-purple-800";
      case "optimization":
        return "bg-orange-100 text-orange-800";
      case "compliance":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading suggestions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No suggestions at the moment</p>
            <p className="text-xs text-muted-foreground">You're all caught up!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>AI Suggestions</span>
            <Badge variant="outline" className="ml-auto">
              {suggestions.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Personalized recommendations to help you get the most out of your accounting system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.map(suggestion => (
            <div
              key={suggestion.id}
              className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-0.5">{getSuggestionIcon(suggestion.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium truncate">{suggestion.title}</h4>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getPriorityColor(suggestion.priority)}`}
                      >
                        {suggestion.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getTypeColor(suggestion.type)}`}
                      >
                        {suggestion.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{suggestion.description}</p>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={e => {
                          e.stopPropagation();
                          handleComplete(suggestion);
                        }}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={e => {
                          e.stopPropagation();
                          handleDismiss(suggestion);
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Suggestion Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedSuggestion && getSuggestionIcon(selectedSuggestion.type)}
              <span>{selectedSuggestion?.title}</span>
            </DialogTitle>
            <DialogDescription>{selectedSuggestion?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSuggestion && (
              <>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={getPriorityColor(selectedSuggestion.priority)}
                  >
                    {selectedSuggestion.priority} priority
                  </Badge>
                  <Badge variant="outline" className={getTypeColor(selectedSuggestion.type)}>
                    {selectedSuggestion.type}
                  </Badge>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-1">Suggested Action</h4>
                  <p className="text-sm text-muted-foreground">{selectedSuggestion.action}</p>
                </div>

                {selectedSuggestion.metadata && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">Additional Information</h4>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {JSON.stringify(selectedSuggestion.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      handleComplete(selectedSuggestion);
                      setShowDetails(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Action
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface AISuggestionsSummaryProps {
  suggestions: AISuggestion[];
}

export function AISuggestionsSummary({ suggestions }: AISuggestionsSummaryProps) {
  const highPriorityCount = suggestions.filter(s => s.priority === "high").length;
  const setupCount = suggestions.filter(s => s.type === "setup").length;
  const transactionCount = suggestions.filter(s => s.type === "transaction").length;
  const reportCount = suggestions.filter(s => s.type === "report").length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-3 border rounded-lg">
        <div className="text-2xl font-bold text-red-600">{highPriorityCount}</div>
        <div className="text-xs text-muted-foreground">High Priority</div>
      </div>
      <div className="text-center p-3 border rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{setupCount}</div>
        <div className="text-xs text-muted-foreground">Setup Tasks</div>
      </div>
      <div className="text-center p-3 border rounded-lg">
        <div className="text-2xl font-bold text-green-600">{transactionCount}</div>
        <div className="text-xs text-muted-foreground">Transactions</div>
      </div>
      <div className="text-center p-3 border rounded-lg">
        <div className="text-2xl font-bold text-purple-600">{reportCount}</div>
        <div className="text-xs text-muted-foreground">Reports</div>
      </div>
    </div>
  );
}
