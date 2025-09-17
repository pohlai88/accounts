// @ts-nocheck
// =====================================================
// Phase 8: Integration Manager Component
// Third-party integrations and data synchronization
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
  Plug,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Settings,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  IntegrationService,
  IntegrationConnection,
  IntegrationTemplate,
  SyncLog,
} from "@/lib/integration-service";
import { format } from "date-fns";

interface IntegrationManagerProps {
  companyId: string;
  userId: string;
}

export function IntegrationManager({ companyId, userId }: IntegrationManagerProps) {
  const [integrationService] = useState(new IntegrationService(companyId, userId));
  const [integrations] = useState<IntegrationTemplate[]>([]);
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationTemplate | null>(null);
  const [connectionCredentials, setConnectionCredentials] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  // Load data on component mount
  useEffect(() => {
    loadConnections();
    loadSyncLogs();
  }, []);

  const loadConnections = async () => {
    try {
      const conns = await integrationService.getConnections();
      setConnections(conns);
    } catch (error) {
      console.error("Failed to load connections:", error);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const logs = await integrationService.getSyncLogs();
      setSyncLogs(logs);
    } catch (error) {
      console.error("Failed to load sync logs:", error);
    }
  };

  const handleConnect = async (integration: IntegrationTemplate) => {
    setSelectedIntegration(integration);
    setConnectionCredentials({});
    setError(null);
  };

  const handleCreateConnection = async () => {
    if (!selectedIntegration) return;

    // Validate required fields
    const missingFields = selectedIntegration.requiredFields.filter(
      field => !connectionCredentials[field],
    );

    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(", ")}`);
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setSuccess(null);

      await integrationService.createConnection(
        selectedIntegration.name,
        connectionCredentials,
        {},
      );

      setSuccess(`${selectedIntegration.displayName} connected successfully!`);
      setSelectedIntegration(null);
      setConnectionCredentials({});
      await loadConnections();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create connection");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async (connectionId: string) => {
    try {
      const result = await integrationService.testConnection(connectionId);
      if (result.success) {
        setSuccess("Connection test successful");
      } else {
        setError(`Connection test failed: ${result.error}`);
      }
    } catch (error) {
      setError("Connection test failed");
    }
  };

  const handleSync = async (
    connectionId: string,
    syncType: "import" | "export" | "bidirectional",
  ) => {
    try {
      setIsSyncing(prev => ({ ...prev, [connectionId]: true }));
      setError(null);
      setSuccess(null);

      await integrationService.syncData(connectionId, syncType);

      setSuccess("Sync completed successfully");
      await loadSyncLogs();
    } catch (error) {
      setError("Sync failed");
    } finally {
      setIsSyncing(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm("Are you sure you want to delete this connection?")) {
      return;
    }

    try {
      await integrationService.deleteConnection(connectionId);
      setSuccess("Connection deleted successfully");
      await loadConnections();
    } catch (error) {
      setError("Failed to delete connection");
    }
  };

  const toggleShowCredentials = (connectionId: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [connectionId]: !prev[connectionId],
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: "default",
      error: "destructive",
      pending: "secondary",
      disconnected: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSyncTypeBadge = (syncType: string) => {
    const variants = {
      import: "default",
      export: "secondary",
      bidirectional: "outline",
    } as const;

    return (
      <Badge variant={variants[syncType as keyof typeof variants] || "outline"}>
        {syncType.charAt(0).toUpperCase() + syncType.slice(1)}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return format(date, "MMM dd, yyyy HH:mm");
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Manager</h2>
          <p className="text-muted-foreground">
            Connect with third-party services and sync your data
          </p>
        </div>
        <Button onClick={loadConnections} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
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

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations">Available Integrations</TabsTrigger>
          <TabsTrigger value="connections">Active Connections</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
        </TabsList>

        {/* Available Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map(integration => (
              <Card key={integration.name} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plug className="h-5 w-5 mr-2" />
                    {integration.displayName}
                  </CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{integration.connectionType.toUpperCase()}</Badge>
                    <Badge variant="secondary">
                      {integration.supportedOperations.length} operations
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <div className="font-medium mb-1">Supported Operations:</div>
                    <div className="flex flex-wrap gap-1">
                      {integration.supportedOperations.map(op => (
                        <Badge key={op} variant="outline" className="text-xs">
                          {op}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button onClick={() => handleConnect(integration)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Active Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Connections</CardTitle>
              <CardDescription>Manage your connected integrations</CardDescription>
            </CardHeader>
            <CardContent>
              {connections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active connections. Connect to an integration to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map(connection => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(connection.status)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {connection.integrationName.charAt(0).toUpperCase() +
                                connection.integrationName.slice(1)}
                            </span>
                            {getStatusBadge(connection.status)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Type: {connection.connectionType} • Frequency:{" "}
                            {connection.syncFrequency}
                          </div>
                          {connection.lastSyncAt && (
                            <div className="text-sm text-muted-foreground">
                              Last sync: {formatDate(connection.lastSyncAt)}
                            </div>
                          )}
                          {connection.errorMessage && (
                            <div className="text-sm text-red-500">
                              Error: {connection.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestConnection(connection.id)}
                        >
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSync(connection.id, "import")}
                          disabled={isSyncing[connection.id]}
                        >
                          {isSyncing[connection.id] ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleShowCredentials(connection.id)}
                        >
                          {showCredentials[connection.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteConnection(connection.id)}
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

        {/* Sync Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Logs</CardTitle>
              <CardDescription>View synchronization history and results</CardDescription>
            </CardHeader>
            <CardContent>
              {syncLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No sync logs found</div>
              ) : (
                <div className="space-y-4">
                  {syncLogs.map(log => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getSyncTypeBadge(log.syncType)}
                          <span className="text-sm text-muted-foreground">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm">
                            Processed: {log.recordsProcessed} • Successful: {log.recordsSuccessful}{" "}
                            • Failed: {log.recordsFailed}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Duration: {formatDuration(log.syncDurationMs)}
                          </div>
                          {Object.keys(log.errorDetails).length > 0 && (
                            <div className="text-sm text-red-500">
                              Errors: {Object.keys(log.errorDetails).length}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {log.recordsFailed === 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connection Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Connect to {selectedIntegration.displayName}</CardTitle>
              <CardDescription>{selectedIntegration.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedIntegration.requiredFields.map(field => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field} className="capitalize">
                    {field.replace("_", " ")}
                  </Label>
                  <Input
                    id={field}
                    type={field.includes("secret") || field.includes("key") ? "password" : "text"}
                    value={connectionCredentials[field] || ""}
                    onChange={e =>
                      setConnectionCredentials(prev => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    placeholder={`Enter ${field.replace("_", " ")}`}
                  />
                </div>
              ))}

              <div className="flex space-x-2">
                <Button onClick={handleCreateConnection} disabled={isConnecting} className="flex-1">
                  {isConnecting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setSelectedIntegration(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
