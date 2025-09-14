"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, X, ChevronRight } from "lucide-react";

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
}

const mockSuggestions: AISuggestion[] = [
  {
    id: "1",
    title: "Review your Chart of Accounts",
    description: "Your accounting foundation is ready! Review and customize accounts",
    action: "/accounts",
    priority: "high",
  },
  {
    id: "2",
    title: "Create your first GL entry",
    description: "Test the double-entry system with a simple journal entry",
    action: "/journal/new",
    priority: "high",
  },
  {
    id: "3",
    title: "Generate Trial Balance",
    description: "Verify your accounting data with a trial balance report",
    action: "/reports/trial-balance",
    priority: "medium",
  },
];

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(true);
  const [suggestions] = useState<AISuggestion[]>(mockSuggestions);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 shadow-lg"
        size="icon"
      >
        <Lightbulb className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            AI Assistant
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">Here's what you should do next:</p>
        {suggestions.map(suggestion => (
          <div
            key={suggestion.id}
            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <h4 className="text-sm font-medium leading-none">{suggestion.title}</h4>
                <p className="text-xs text-muted-foreground">{suggestion.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  suggestion.priority === "high"
                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    : suggestion.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                }`}
              >
                {suggestion.priority} priority
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
