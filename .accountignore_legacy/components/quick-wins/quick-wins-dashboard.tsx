"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Keyboard,
  Zap,
  Save,
  Download,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Clock,
  MemoryStick,
  Network,
  Database,
} from "lucide-react";
import { keyboardShortcuts, type KeyboardShortcut } from "@/lib/keyboard-shortcuts";
import { useBulkOperations } from "@/lib/bulk-operations";
import { usePerformanceOptimization } from "@/lib/performance-optimizer";

interface QuickWinsDashboardProps {
  companyId: string;
}

export function QuickWinsDashboard({ companyId }: QuickWinsDashboardProps) {
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [performanceOptimizations, setPerformanceOptimizations] = useState({
    virtualization: true,
    lazyLoading: true,
    caching: true,
    compression: true,
    prefetching: true,
  });

  const { metrics, cacheData, getCachedData, debounce, throttle } = usePerformanceOptimization({
    enableVirtualization: performanceOptimizations.virtualization,
    enableLazyLoading: performanceOptimizations.lazyLoading,
    enableCaching: performanceOptimizations.caching,
    enableCompression: performanceOptimizations.compression,
    enablePrefetching: performanceOptimizations.prefetching,
  });

  // Mock data for bulk operations demo
  const mockItems = Array.from({ length: 50 }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i + 1}`,
    status: i % 3 === 0 ? "active" : "inactive",
    value: Math.random() * 1000,
  }));

  const {
    selection,
    selectAll,
    deselectAll,
    toggleItem,
    executeOperation,
    operations,
    hasSelection,
    selectedCount,
    totalCount,
  } = useBulkOperations(mockItems);

  // Keyboard shortcuts
  const shortcuts = keyboardShortcuts.getAllShortcuts();
  const shortcutsByCategory = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>,
  );

  // Toggle keyboard shortcuts
  const toggleShortcuts = () => {
    setShortcutsEnabled(!shortcutsEnabled);
    keyboardShortcuts.setEnabled(!shortcutsEnabled);
  };

  // Performance optimization toggles
  const toggleOptimization = (key: keyof typeof performanceOptimizations) => {
    setPerformanceOptimizations(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Demo bulk operation
  const handleBulkOperation = async (operationId: string) => {
    const result = await executeOperation(operationId);
    console.log("Bulk operation result:", result);
  };

  // Demo auto-save
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [autoSaveState, setAutoSaveState] = useState({
    isDirty: false,
    isSaving: false,
    lastSaved: null as Date | null,
    hasError: false,
  });

  // Simulate auto-save
  useEffect(() => {
    if (formData.name || formData.email || formData.message) {
      setAutoSaveState(prev => ({ ...prev, isDirty: true }));

      const timer = setTimeout(() => {
        setAutoSaveState(prev => ({ ...prev, isSaving: true }));

        setTimeout(() => {
          setAutoSaveState(prev => ({
            ...prev,
            isSaving: false,
            isDirty: false,
            lastSaved: new Date(),
          }));
        }, 1000);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [formData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Quick Wins Dashboard
          </h2>
          <p className="text-muted-foreground">Power user features and performance optimizations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={shortcutsEnabled ? "default" : "secondary"}>
            {shortcutsEnabled ? "Shortcuts ON" : "Shortcuts OFF"}
          </Badge>
          <Badge variant={autoSaveEnabled ? "default" : "secondary"}>
            {autoSaveEnabled ? "Auto-save ON" : "Auto-save OFF"}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Performance Score</p>
                <p className="text-2xl font-bold">95%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{metrics.cacheHitRate.toFixed(1)}%</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Load Time</p>
                <p className="text-2xl font-bold">{metrics.loadTime.toFixed(0)}ms</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Memory Usage</p>
                <p className="text-2xl font-bold">
                  {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
              <MemoryStick className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="shortcuts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="shortcuts">Keyboard Shortcuts</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="autosave">Auto-save</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Keyboard Shortcuts Tab */}
        <TabsContent value="shortcuts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </CardTitle>
              <CardDescription>
                Power user shortcuts for faster navigation and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Switch checked={shortcutsEnabled} onCheckedChange={toggleShortcuts} />
                  <label className="text-sm font-medium">Enable Keyboard Shortcuts</label>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Customize
                </Button>
              </div>

              <div className="space-y-4">
                {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
                  <div key={category}>
                    <h4 className="font-semibold mb-2">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categoryShortcuts.map(shortcut => (
                        <div
                          key={shortcut.key}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <span className="text-sm">{shortcut.description}</span>
                          <kbd className="px-2 py-1 bg-muted rounded text-xs">
                            {shortcut.modifier ? `${shortcut.modifier}+` : ""}
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Bulk Operations
              </CardTitle>
              <CardDescription>Perform actions on multiple items at once</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Selection Controls */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      disabled={selection.isAllSelected}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAll}
                      disabled={!hasSelection}
                    >
                      Deselect All
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedCount} of {totalCount} selected
                    </span>
                  </div>
                </div>

                {/* Bulk Actions */}
                {hasSelection && (
                  <div className="flex flex-wrap gap-2">
                    {operations.map(operation => (
                      <Button
                        key={operation.id}
                        variant={operation.isDestructive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleBulkOperation(operation.id)}
                      >
                        {operation.name}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Demo Items List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mockItems.slice(0, 10).map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 border rounded cursor-pointer ${
                        selection.selectedItems.includes(item) ? "bg-blue-50 border-blue-200" : ""
                      }`}
                      onClick={() => toggleItem(item)}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selection.selectedItems.includes(item)}
                          onChange={() => toggleItem(item)}
                          className="rounded"
                        />
                        <span className="text-sm">{item.name}</span>
                        <Badge variant={item.status === "active" ? "default" : "secondary"}>
                          {item.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ${item.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-save Tab */}
        <TabsContent value="autosave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Auto-save
              </CardTitle>
              <CardDescription>Automatically save your work to prevent data loss</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Auto-save Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch checked={autoSaveEnabled} onCheckedChange={setAutoSaveEnabled} />
                    <label className="text-sm font-medium">Enable Auto-save</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    {autoSaveState.isSaving && (
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {autoSaveState.isDirty && !autoSaveState.isSaving && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    {!autoSaveState.isDirty &&
                      !autoSaveState.isSaving &&
                      autoSaveState.lastSaved && <CheckCircle className="h-4 w-4 text-green-500" />}
                    <span className="text-sm text-muted-foreground">
                      {autoSaveState.isSaving && "Saving..."}
                      {autoSaveState.isDirty && !autoSaveState.isSaving && "Unsaved changes"}
                      {!autoSaveState.isDirty &&
                        !autoSaveState.isSaving &&
                        autoSaveState.lastSaved &&
                        "Saved"}
                    </span>
                  </div>
                </div>

                {/* Demo Form */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Demo Form (Auto-save enabled)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2 border rounded"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-2 border rounded"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <textarea
                      value={formData.message}
                      onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full p-2 border rounded"
                      rows={3}
                      placeholder="Enter your message"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Performance Optimizations
              </CardTitle>
              <CardDescription>Configure performance settings for optimal speed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Load Time</span>
                      <span>{metrics.loadTime.toFixed(0)}ms</span>
                    </div>
                    <Progress value={(1000 - metrics.loadTime) / 10} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cache Hit Rate</span>
                      <span>{metrics.cacheHitRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.cacheHitRate} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>{(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
                    </div>
                    <Progress value={metrics.memoryUsage / 1024 / 1024 / 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Network Requests</span>
                      <span>{metrics.networkRequests}</span>
                    </div>
                    <Progress value={Math.min(metrics.networkRequests / 10, 100)} className="h-2" />
                  </div>
                </div>

                {/* Optimization Toggles */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Optimization Settings</h4>
                  {Object.entries(performanceOptimizations).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {key === "virtualization" && "Render only visible items in large lists"}
                          {key === "lazyLoading" && "Load images and content as needed"}
                          {key === "caching" && "Cache frequently accessed data"}
                          {key === "compression" && "Compress data for faster transfer"}
                          {key === "prefetching" && "Preload resources for faster navigation"}
                        </p>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={() =>
                          toggleOptimization(key as keyof typeof performanceOptimizations)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
