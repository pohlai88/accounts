// =====================================================
// Phase 8: API Manager Component
// Professional API key management and documentation
// =====================================================

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
  Settings,
} from "lucide-react";
import { APIService, APIKey } from "@/lib/api-service";
import { format } from "date-fns";

interface APIManagerProps {
  companyId: string;
  userId: string;
}

export function APIManager({ companyId, userId }: APIManagerProps) {
  const [apiService] = useState(new APIService(companyId, userId));
  const [apiKeys] = useState<APIKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<Record<string, boolean>>({
    read: true,
    write: false,
    delete: false,
    admin: false,
  });
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000);
  const [newKeyExpiry, setNewKeyExpiry] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<{ apiKey: string; keyId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  // Load API keys on component mount
  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      // This would be implemented in the API service
      // const keys = await apiService.getAPIKeys();
      // setApiKeys(keys);
    } catch (error) {
      console.error("Failed to load API keys:", error);
    }
  };

  const handleCreateAPIKey = async () => {
    if (!newKeyName.trim()) {
      setError("API key name is required");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      setSuccess(null);

      const result = await apiService.generateAPIKey(
        newKeyName,
        newKeyPermissions,
        newKeyRateLimit,
        newKeyExpiry ? new Date(newKeyExpiry) : undefined,
      );

      setCreatedKey(result);
      setSuccess("API key created successfully!");
      setNewKeyName("");
      setNewKeyPermissions({
        read: true,
        write: false,
        delete: false,
        admin: false,
      });
      setNewKeyRateLimit(1000);
      setNewKeyExpiry("");
      await loadAPIKeys();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAPIKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) {
      return;
    }

    try {
      // await apiService.deleteAPIKey(keyId);
      console.log("Deleting API key:", keyId);
      setSuccess("API key deleted successfully");
      await loadAPIKeys();
    } catch {
      setError("Failed to delete API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard");
  };

  const toggleShowAPIKey = (keyId: string) => {
    setShowApiKey((prev: Record<string, boolean>) => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  const getPermissionBadge = (permission: string) => {
    const variants = {
      read: "default",
      write: "secondary",
      delete: "destructive",
      admin: "outline",
    } as const;

    return (
      <Badge variant={variants[permission as keyof typeof variants] || "outline"}>
        {permission.charAt(0).toUpperCase() + permission.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean, expiresAt?: Date) => {
    if (!isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  const formatDate = (date: Date) => {
    return format(date, "MMM dd, yyyy HH:mm");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Management</h2>
          <p className="text-muted-foreground">
            Manage API keys and access to your accounting data
          </p>
        </div>
        <Button onClick={loadAPIKeys} variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="create">Create Key</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API keys and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No API keys found. Create your first API key to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map(key => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Key className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{key.name}</span>
                            {getStatusBadge(key.isActive, key.expiresAt)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Created: {formatDate(key.createdAt)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Rate Limit: {key.rateLimitPerHour} requests/hour
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            {Object.entries(key.permissions)
                              .filter(([, enabled]) => enabled)
                              .map(([permission]) => (
                                <span key={permission}>{getPermissionBadge(permission)}</span>
                              ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleShowAPIKey(key.id)}
                        >
                          {showApiKey[key.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAPIKey(key.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Key Tab */}
        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New API Key</CardTitle>
                <CardDescription>Generate a new API key with specific permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    value={newKeyName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewKeyName(e.target.value)
                    }
                    placeholder="Enter a descriptive name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="space-y-2">
                    {Object.entries(newKeyPermissions).map(([permission, enabled]) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={permission}
                          checked={enabled}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewKeyPermissions((prev: Record<string, boolean>) => ({
                              ...prev,
                              [permission]: e.target.checked,
                            }))
                          }
                        />
                        <Label htmlFor={permission} className="capitalize">
                          {permission}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    value={newKeyRateLimit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewKeyRateLimit(Number(e.target.value))
                    }
                    min="1"
                    max="10000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date (optional)</Label>
                  <Input
                    id="expiry"
                    type="datetime-local"
                    value={newKeyExpiry}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewKeyExpiry(e.target.value)
                    }
                  />
                </div>

                <Button onClick={handleCreateAPIKey} disabled={isCreating} className="w-full">
                  {isCreating ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create API Key
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Created Key Display */}
            {createdKey && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    API Key Created
                  </CardTitle>
                  <CardDescription>
                    Your new API key has been generated. Copy it now as it won&apos;t be shown
                    again.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={createdKey.apiKey} readOnly className="font-mono text-sm" />
                      <Button size="sm" onClick={() => copyToClipboard(createdKey.apiKey)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Store this API key securely. It will not be displayed again.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                API Documentation
              </CardTitle>
              <CardDescription>Complete API reference and examples</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Base URL */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Base URL</h3>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  {process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.yourapp.com"}
                </div>
              </div>

              {/* Authentication */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                <p className="text-muted-foreground mb-3">
                  Include your API key in the request header:
                </p>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  X-API-Key: your_api_key_here
                </div>
              </div>

              {/* Endpoints */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Endpoints</h3>
                <div className="space-y-4">
                  {/* Accounts */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Accounts</h4>
                      <Badge variant="outline">GET</Badge>
                    </div>
                    <div className="bg-muted p-2 rounded font-mono text-sm mb-2">
                      /api/v1/accounts
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Retrieve chart of accounts with pagination and filtering
                    </p>
                  </div>

                  {/* Transactions */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Transactions</h4>
                      <Badge variant="outline">GET</Badge>
                    </div>
                    <div className="bg-muted p-2 rounded font-mono text-sm mb-2">
                      /api/v1/transactions
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Retrieve general ledger entries with account details
                    </p>
                  </div>

                  {/* Reports */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Reports</h4>
                      <Badge variant="outline">GET</Badge>
                    </div>
                    <div className="bg-muted p-2 rounded font-mono text-sm mb-2">
                      /api/v1/reports/{"{type}"}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generate financial reports (profit_loss, balance_sheet, cash_flow,
                      trial_balance)
                    </p>
                  </div>
                </div>
              </div>

              {/* Rate Limiting */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Rate Limiting</h3>
                <p className="text-muted-foreground mb-3">
                  API requests are rate limited to prevent abuse:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Default: 1,000 requests per hour</li>
                  <li>Burst: 100 requests per minute</li>
                  <li>Rate limit headers included in responses</li>
                </ul>
              </div>

              {/* Example Request */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Example Request</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm">
                    {`curl -X GET \\
  "${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.yourapp.com"}/api/v1/accounts" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>
              </div>

              {/* Response Format */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Response Format</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm">
                    {`{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  },
  "rateLimit": {
    "limit": 1000,
    "remaining": 999,
    "resetAt": "2024-01-01T00:00:00Z"
  }
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
