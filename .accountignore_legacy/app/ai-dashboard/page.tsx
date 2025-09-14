"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Lightbulb,
  Target,
  Zap,
  TrendingUp,
  Settings,
  FileText,
  DollarSign,
  Shield,
  Star,
} from "lucide-react";
import { SmartOnboardingWizard } from "@/components/ai/smart-onboarding-wizard";
import { AISuggestionsPanel } from "@/components/ai/ai-suggestions-panel";
import { AutoCategorization } from "@/components/ai/auto-categorization";
import {
  ProgressTrackingDashboard,
  QuickActions,
} from "@/components/ai/progress-tracking-dashboard";
import { AIEngine, AIContext } from "@/lib/ai-engine";

export default function AIDashboardPage() {
  const [context, setContext] = useState<AIContext>({
    userId: "user-123",
    companyId: "company-123",
    userRole: "admin",
    businessType: "service",
    companySize: "small",
    currentPage: "ai-dashboard",
    recentActions: [],
    setupComplete: false,
    lastLogin: new Date().toISOString(),
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Check if user needs onboarding
    if (!context.setupComplete) {
      setShowOnboarding(true);
    }
  }, [context.setupComplete]);

  const handleOnboardingComplete = () => {
    setContext(prev => ({ ...prev, setupComplete: true }));
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  const handleSuggestionAction = (suggestion: any) => {
    console.log("Suggestion action:", suggestion);
    // Handle suggestion action
  };

  const handleStepComplete = (stepId: string) => {
    console.log("Step completed:", stepId);
    // Handle step completion
  };

  const handleQuickAction = (action: string) => {
    console.log("Quick action:", action);
    // Handle quick action
  };

  const handleCategorizationComplete = (result: any) => {
    console.log("Categorization complete:", result);
    // Handle categorization completion
  };

  const handleManualOverride = (accountId: string) => {
    console.log("Manual override:", accountId);
    // Handle manual override
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Brain className="h-8 w-8 text-purple-500" />
            <span>AI Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Your intelligent accounting assistant powered by AI
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Star className="h-3 w-3" />
            <span>AI Powered</span>
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="categorization">Auto-Categorization</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* AI Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <span>AI Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Features</span>
                    <Badge variant="outline">8</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Suggestions Today</span>
                    <Badge variant="outline">12</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Auto-Categorizations</span>
                    <Badge variant="outline">45</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Setup Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span>Setup Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Completion</span>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                  <div className="text-xs text-muted-foreground">3 of 4 steps completed</div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">• Auto-categorized 5 transactions</div>
                  <div className="text-sm">• Generated 3 new suggestions</div>
                  <div className="text-sm">• Completed setup step</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Features Overview */}
          <Card>
            <CardHeader>
              <CardTitle>AI Features Overview</CardTitle>
              <CardDescription>
                Discover the powerful AI features available to help you manage your accounting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <Lightbulb className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <h3 className="font-medium">Smart Suggestions</h3>
                  <p className="text-sm text-muted-foreground">Get personalized recommendations</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Brain className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-medium">Auto-Categorization</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically categorize transactions
                  </p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-medium">Progress Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your setup and usage progress
                  </p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <h3 className="font-medium">Quick Actions</h3>
                  <p className="text-sm text-muted-foreground">Jump to common tasks quickly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions">
          <AISuggestionsPanel
            companyId={context.companyId}
            userId={context.userId}
            context={context}
            onSuggestionAction={handleSuggestionAction}
          />
        </TabsContent>

        {/* Auto-Categorization Tab */}
        <TabsContent value="categorization">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AutoCategorization
              onCategorizationComplete={handleCategorizationComplete}
              onManualOverride={handleManualOverride}
            />
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span>Recent Categorizations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Office Supplies</div>
                          <div className="text-sm text-muted-foreground">$45.99</div>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          95% confidence
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Utilities</div>
                          <div className="text-sm text-muted-foreground">$120.50</div>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          88% confidence
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Travel Expenses</div>
                          <div className="text-sm text-muted-foreground">$250.00</div>
                        </div>
                        <Badge variant="outline" className="text-yellow-600">
                          72% confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <ProgressTrackingDashboard
            companyId={context.companyId}
            userId={context.userId}
            onStepComplete={handleStepComplete}
          />
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="quick-actions">
          <QuickActions onAction={handleQuickAction} />
        </TabsContent>
      </Tabs>

      {/* Onboarding Wizard */}
      {showOnboarding && (
        <SmartOnboardingWizard
          companyId={context.companyId}
          userId={context.userId}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
  );
}
