// =====================================================
// Phase 10: User Feedback & Testing System
// Comprehensive user feedback collection and testing
// =====================================================

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Bug,
  Lightbulb,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Heart,
  Zap,
  Shield,
  Users,
} from "lucide-react";

interface FeedbackData {
  id: string;
  type: "bug" | "feature" | "improvement" | "general";
  rating: number;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "submitted" | "reviewing" | "in-progress" | "resolved" | "rejected";
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  timestamp: number;
  attachments?: string[];
  tags: string[];
}

interface UserTestingSession {
  id: string;
  userId: string;
  tasks: TestingTask[];
  startTime: number;
  endTime?: number;
  completedTasks: number;
  totalTasks: number;
  feedback: FeedbackData[];
  screenRecordings?: string[];
  heatmapData?: any[];
}

interface TestingTask {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  expectedOutcome: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  completed: boolean;
  completionTime?: number;
  userNotes?: string;
  success: boolean;
}

export function UserFeedbackSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackData["type"]>("general");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<FeedbackData["priority"]>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const feedbackCategories = [
    "User Interface",
    "Performance",
    "Functionality",
    "Mobile Experience",
    "Data Management",
    "Reporting",
    "Integration",
    "Security",
    "Other",
  ];

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);

    const feedback: FeedbackData = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: feedbackType,
      rating,
      title: title.trim(),
      description: description.trim(),
      category: category || "Other",
      priority,
      status: "submitted",
      sessionId: `session_${Date.now()}`,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      tags: [],
    };

    try {
      // Send feedback to server
      await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedback),
      });

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setTitle("");
        setDescription("");
        setRating(0);
      }, 2000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700 font-medium">Feedback submitted successfully!</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Feedback Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12 shadow-lg"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Share Your Feedback</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Feedback Type */}
              <div>
                <Label className="text-sm font-medium">What type of feedback?</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { type: "bug", label: "Bug Report", icon: Bug },
                    { type: "feature", label: "Feature Request", icon: Lightbulb },
                    { type: "improvement", label: "Improvement", icon: Zap },
                    { type: "general", label: "General", icon: MessageSquare },
                  ].map(({ type, label, icon: Icon }) => (
                    <Button
                      key={type}
                      variant={feedbackType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFeedbackType(type as FeedbackData["type"])}
                      className="flex items-center space-x-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <Label className="text-sm font-medium">How would you rate your experience?</Label>
                <div className="flex space-x-1 mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Button
                      key={star}
                      variant="ghost"
                      size="sm"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Brief description of your feedback"
                  className="mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Please provide detailed information about your feedback..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <select
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a category</option>
                  {feedbackCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <Label className="text-sm font-medium">Priority</Label>
                <div className="flex space-x-2 mt-2">
                  {[
                    { value: "low", label: "Low", color: "bg-gray-100 text-gray-700" },
                    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
                    { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
                    { value: "critical", label: "Critical", color: "bg-red-100 text-red-700" },
                  ].map(({ value, label, color }) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      onClick={() => setPriority(value as FeedbackData["priority"])}
                      className={priority === value ? color : ""}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || !description.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export function UserTestingDashboard() {
  const [testingSession, setTestingSession] = useState<UserTestingSession | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const testingTasks: TestingTask[] = [
    {
      id: "task-1",
      title: "Create a New Invoice",
      description: "Create a new invoice for a customer",
      instructions: [
        "Navigate to the Invoices section",
        'Click "Create New Invoice"',
        "Fill in customer details",
        "Add invoice items",
        "Set due date",
        "Save the invoice",
      ],
      expectedOutcome: "Invoice is created successfully and appears in the invoice list",
      difficulty: "easy",
      category: "Invoicing",
      completed: false,
      success: false,
    },
    {
      id: "task-2",
      title: "Generate Financial Report",
      description: "Generate a profit and loss statement",
      instructions: [
        "Go to the Reports section",
        'Select "Profit & Loss" report',
        "Choose date range",
        "Generate the report",
        "Export as PDF",
      ],
      expectedOutcome: "Report is generated and exported successfully",
      difficulty: "medium",
      category: "Reporting",
      completed: false,
      success: false,
    },
    {
      id: "task-3",
      title: "Set Up Bank Reconciliation",
      description: "Reconcile bank transactions",
      instructions: [
        "Navigate to Bank Reconciliation",
        "Import bank statement",
        "Match transactions",
        "Resolve discrepancies",
        "Complete reconciliation",
      ],
      expectedOutcome: "Bank reconciliation is completed successfully",
      difficulty: "hard",
      category: "Banking",
      completed: false,
      success: false,
    },
  ];

  const startTestingSession = () => {
    const session: UserTestingSession = {
      id: `session_${Date.now()}`,
      userId: "test-user",
      tasks: testingTasks,
      startTime: Date.now(),
      completedTasks: 0,
      totalTasks: testingTasks.length,
      feedback: [],
    };

    setTestingSession(session);
    setIsSessionActive(true);
  };

  const completeTask = (taskId: string, success: boolean, notes?: string) => {
    if (!testingSession) return;

    const updatedTasks = testingSession.tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: true,
          success,
          completionTime: Date.now() - testingSession.startTime,
          userNotes: notes,
        };
      }
      return task;
    });

    const completedTasks = updatedTasks.filter(task => task.completed).length;

    setTestingSession({
      ...testingSession,
      tasks: updatedTasks,
      completedTasks,
    });

    // Move to next task
    const nextTaskIndex = testingSession.tasks.findIndex(task => !task.completed);
    if (nextTaskIndex !== -1) {
      setCurrentTaskIndex(nextTaskIndex);
    } else {
      // All tasks completed
      setIsSessionActive(false);
    }
  };

  const currentTask = testingSession?.tasks[currentTaskIndex];

  if (!testingSession) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            User Testing Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-6xl">🧪</div>
            <h3 className="text-xl font-semibold">Ready to Test?</h3>
            <p className="text-gray-600">
              Help us improve the application by completing a series of tasks. Your feedback will
              help us make the app better for everyone.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">Your data is secure and anonymous</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600">Takes about 15-20 minutes</span>
              </div>
            </div>
            <Button onClick={startTestingSession} className="w-full">
              Start Testing Session
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSessionActive) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Testing Session Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-xl font-semibold">Thank you for testing!</h3>
              <p className="text-gray-600">Your feedback helps us improve the application.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {testingSession.completedTasks}
                </div>
                <div className="text-sm text-green-700">Tasks Completed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((testingSession.completedTasks / testingSession.totalTasks) * 100)}%
                </div>
                <div className="text-sm text-blue-700">Success Rate</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Task Results:</h4>
              {testingSession.tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm">{task.title}</span>
                  <Badge variant={task.success ? "default" : "destructive"}>
                    {task.success ? "Success" : "Failed"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Testing Session - Task {currentTaskIndex + 1} of {testingSession.totalTasks}
          </CardTitle>
          <Badge variant="outline">{currentTask?.difficulty}</Badge>
        </div>
        <Progress
          value={(testingSession.completedTasks / testingSession.totalTasks) * 100}
          className="w-full"
        />
      </CardHeader>
      <CardContent>
        {currentTask && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">{currentTask.title}</h3>
              <p className="text-gray-600">{currentTask.description}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Instructions:</h4>
              <ol className="list-decimal list-inside space-y-1">
                {currentTask.instructions.map((instruction, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-1">Expected Outcome:</h4>
              <p className="text-blue-800 text-sm">{currentTask.expectedOutcome}</p>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={() => completeTask(currentTask.id, true)}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Task Completed Successfully
              </Button>
              <Button
                onClick={() => completeTask(currentTask.id, false)}
                variant="destructive"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Task Failed
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FeedbackAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalFeedback: 0,
    averageRating: 0,
    feedbackByType: {} as Record<string, number>,
    feedbackByCategory: {} as Record<string, number>,
    recentFeedback: [] as FeedbackData[],
  });

  useEffect(() => {
    // Load analytics data
    const loadAnalytics = async () => {
      try {
        const response = await fetch("/api/analytics/feedback");
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      }
    };

    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{analytics.totalFeedback}</div>
                <div className="text-sm text-gray-600">Total Feedback</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">
                  {Object.values(analytics.feedbackByType).reduce((a, b) => a + b, 0)}
                </div>
                <div className="text-sm text-gray-600">This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Feedback by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.feedbackByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="capitalize">{type}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.feedbackByCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span>{category}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
