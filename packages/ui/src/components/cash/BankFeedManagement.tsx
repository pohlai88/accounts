'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@aibos/ui/utils';
import { Button } from '@aibos/ui/Button';
import { Input } from '@aibos/ui/Input';
import { Label } from '@aibos/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@aibos/ui/Card';
import { Badge } from '@aibos/ui/Badge';
import { Alert, AlertDescription } from '@aibos/ui/Alert';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Settings,
  Shield,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Filter,
  Search,
  Calendar,
  Building2,
  Wifi,
  WifiOff,
  AlertTriangle,
  Info
} from 'lucide-react';

// Types
interface BankFeed {
  id: string;
  accountId: string;
  accountName: string;
  provider: 'plaid' | 'yodlee' | 'manual';
  status: 'active' | 'inactive' | 'error' | 'pending';
  lastSync: string;
  nextSync?: string;
  syncFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  transactionCount: number;
  errorCount: number;
  lastError?: string;
  isHealthy: boolean;
  uptime: number; // percentage
  responseTime: number; // milliseconds
  createdAt: string;
  updatedAt: string;
}

interface SyncLog {
  id: string;
  feedId: string;
  timestamp: string;
  status: 'success' | 'error' | 'warning';
  transactionsImported: number;
  transactionsSkipped: number;
  errors: string[];
  duration: number; // milliseconds
  responseTime: number; // milliseconds
}

interface FeedHealth {
  feedId: string;
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  lastChecked: string;
}

interface BankFeedManagementProps {
  onFeedStatusChanged?: (feedId: string, status: string) => void;
  onSyncRequested?: (feedId: string) => void;
  onFeedConfigured?: (feedId: string, config: any) => void;
  className?: string;
}

// Mock data
const mockFeeds: BankFeed[] = [
  {
    id: 'feed_001',
    accountId: 'acc_001',
    accountName: 'Business Checking',
    provider: 'plaid',
    status: 'active',
    lastSync: '2024-01-15T10:30:00Z',
    nextSync: '2024-01-15T11:30:00Z',
    syncFrequency: 'hourly',
    transactionCount: 45,
    errorCount: 0,
    isHealthy: true,
    uptime: 99.8,
    responseTime: 245,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'feed_002',
    accountId: 'acc_002',
    accountName: 'Business Savings',
    provider: 'plaid',
    status: 'active',
    lastSync: '2024-01-15T09:15:00Z',
    nextSync: '2024-01-15T10:15:00Z',
    syncFrequency: 'hourly',
    transactionCount: 12,
    errorCount: 0,
    isHealthy: true,
    uptime: 99.9,
    responseTime: 189,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T09:15:00Z'
  },
  {
    id: 'feed_003',
    accountId: 'acc_003',
    accountName: 'Business Credit Card',
    provider: 'yodlee',
    status: 'error',
    lastSync: '2024-01-14T16:45:00Z',
    nextSync: '2024-01-15T16:45:00Z',
    syncFrequency: 'daily',
    transactionCount: 8,
    errorCount: 3,
    lastError: 'Authentication failed - token expired',
    isHealthy: false,
    uptime: 87.2,
    responseTime: 1200,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-14T16:45:00Z'
  },
  {
    id: 'feed_004',
    accountId: 'acc_004',
    accountName: 'Investment Account',
    provider: 'yodlee',
    status: 'pending',
    lastSync: '2024-01-10T14:20:00Z',
    syncFrequency: 'weekly',
    transactionCount: 3,
    errorCount: 1,
    lastError: 'Account access revoked by user',
    isHealthy: false,
    uptime: 45.6,
    responseTime: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T14:20:00Z'
  }
];

const mockSyncLogs: SyncLog[] = [
  {
    id: 'log_001',
    feedId: 'feed_001',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'success',
    transactionsImported: 5,
    transactionsSkipped: 0,
    errors: [],
    duration: 1250,
    responseTime: 245
  },
  {
    id: 'log_002',
    feedId: 'feed_001',
    timestamp: '2024-01-15T09:30:00Z',
    status: 'success',
    transactionsImported: 3,
    transactionsSkipped: 1,
    errors: [],
    duration: 980,
    responseTime: 189
  },
  {
    id: 'log_003',
    feedId: 'feed_003',
    timestamp: '2024-01-14T16:45:00Z',
    status: 'error',
    transactionsImported: 0,
    transactionsSkipped: 0,
    errors: ['Authentication failed - token expired'],
    duration: 5000,
    responseTime: 1200
  }
];

const mockHealthChecks: FeedHealth[] = [
  {
    feedId: 'feed_001',
    status: 'healthy',
    issues: [],
    recommendations: ['Consider upgrading to real-time sync for better data freshness'],
    lastChecked: '2024-01-15T10:30:00Z'
  },
  {
    feedId: 'feed_002',
    status: 'healthy',
    issues: [],
    recommendations: ['All systems operating normally'],
    lastChecked: '2024-01-15T09:15:00Z'
  },
  {
    feedId: 'feed_003',
    status: 'critical',
    issues: ['Authentication token expired', 'High error rate detected'],
    recommendations: ['Re-authenticate account', 'Check provider status page'],
    lastChecked: '2024-01-14T16:45:00Z'
  },
  {
    feedId: 'feed_004',
    status: 'warning',
    issues: ['Account access revoked', 'No recent sync activity'],
    recommendations: ['Re-authorize account access', 'Contact account holder'],
    lastChecked: '2024-01-10T14:20:00Z'
  }
];

export function BankFeedManagement({
  onFeedStatusChanged,
  onSyncRequested,
  onFeedConfigured,
  className
}: BankFeedManagementProps) {
  const [feeds, setFeeds] = useState<BankFeed[]>(mockFeeds);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(mockSyncLogs);
  const [healthChecks, setHealthChecks] = useState<FeedHealth[]>(mockHealthChecks);
  const [selectedFeed, setSelectedFeed] = useState<BankFeed | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'error' | 'pending'>('all');
  const [filterProvider, setFilterProvider] = useState<'all' | 'plaid' | 'yodlee' | 'manual'>('all');
  const [showLogs, setShowLogs] = useState(false);
  const [showHealth, setShowHealth] = useState(false);

  // Filter feeds based on search and filters
  const filteredFeeds = feeds.filter(feed => {
    const matchesSearch = feed.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feed.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || feed.status === filterStatus;
    const matchesProvider = filterProvider === 'all' || feed.provider === filterProvider;

    return matchesSearch && matchesStatus && matchesProvider;
  });

  const handleSyncFeed = async (feedId: string) => {
    setIsSyncing(true);

    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update feed with new sync data
    setFeeds(prev => prev.map(feed =>
      feed.id === feedId
        ? {
          ...feed,
          lastSync: new Date().toISOString(),
          nextSync: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          transactionCount: feed.transactionCount + Math.floor(Math.random() * 5),
          updatedAt: new Date().toISOString()
        }
        : feed
    ));

    // Add sync log
    const newLog: SyncLog = {
      id: `log_${Date.now()}`,
      feedId,
      timestamp: new Date().toISOString(),
      status: 'success',
      transactionsImported: Math.floor(Math.random() * 5) + 1,
      transactionsSkipped: 0,
      errors: [],
      duration: 1000 + Math.random() * 1000,
      responseTime: 200 + Math.random() * 100
    };

    setSyncLogs(prev => [newLog, ...prev]);
    setIsSyncing(false);

    if (onSyncRequested) {
      onSyncRequested(feedId);
    }
  };

  const handleToggleFeed = (feedId: string) => {
    setFeeds(prev => prev.map(feed =>
      feed.id === feedId
        ? {
          ...feed,
          status: feed.status === 'active' ? 'inactive' : 'active',
          updatedAt: new Date().toISOString()
        }
        : feed
    ));

    const feed = feeds.find(f => f.id === feedId);
    if (feed && onFeedStatusChanged) {
      onFeedStatusChanged(feedId, feed.status === 'active' ? 'inactive' : 'active');
    }
  };

  const handleConfigureFeed = (feedId: string) => {
    const feed = feeds.find(f => f.id === feedId);
    if (feed) {
      setSelectedFeed(feed);
      // In a real implementation, this would open a configuration modal
    }
  };

  const getStatusColor = (status: BankFeed['status']) => {
    switch (status) {
      case 'active': return 'bg-sys-green-100 text-sys-green-800 border-sys-green-200';
      case 'inactive': return 'bg-sys-gray-100 text-sys-gray-800 border-sys-gray-200';
      case 'error': return 'bg-sys-red-100 text-sys-red-800 border-sys-red-200';
      case 'pending': return 'bg-sys-yellow-100 text-sys-yellow-800 border-sys-yellow-200';
      default: return 'bg-sys-gray-100 text-sys-gray-800 border-sys-gray-200';
    }
  };

  const getHealthColor = (status: FeedHealth['status']) => {
    switch (status) {
      case 'healthy': return 'text-sys-green-600';
      case 'warning': return 'text-sys-yellow-600';
      case 'critical': return 'text-sys-red-600';
      default: return 'text-sys-gray-600';
    }
  };

  const getHealthIcon = (status: FeedHealth['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getProviderIcon = (provider: BankFeed['provider']) => {
    switch (provider) {
      case 'plaid': return <Shield className="w-4 h-4" />;
      case 'yodlee': return <Building2 className="w-4 h-4" />;
      case 'manual': return <Settings className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  const formatLastSync = (lastSync: string) => {
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatNextSync = (nextSync?: string) => {
    if (!nextSync) return 'Not scheduled';
    const date = new Date(nextSync);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return 'Overdue';
    if (diffMins < 60) return `In ${diffMins}m`;
    if (diffMins < 1440) return `In ${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString();
  };

  const totalFeeds = feeds.length;
  const activeFeeds = feeds.filter(f => f.status === 'active').length;
  const errorFeeds = feeds.filter(f => f.status === 'error').length;
  const totalTransactions = feeds.reduce((sum, feed) => sum + feed.transactionCount, 0);
  const avgUptime = feeds.reduce((sum, feed) => sum + feed.uptime, 0) / feeds.length;
  const avgResponseTime = feeds.reduce((sum, feed) => sum + feed.responseTime, 0) / feeds.length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-sys-fg-default">Bank Feed Management</h2>
        <p className="text-sys-fg-muted">
          Monitor and manage bank feed connections, sync status, and health metrics.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-sys-blue-600" />
              <div>
                <p className="text-2xl font-bold text-sys-fg-default">{totalFeeds}</p>
                <p className="text-sm text-sys-fg-muted">Total Feeds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-sys-green-600" />
              <div>
                <p className="text-2xl font-bold text-sys-fg-default">{activeFeeds}</p>
                <p className="text-sm text-sys-fg-muted">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-sys-red-600" />
              <div>
                <p className="text-2xl font-bold text-sys-fg-default">{errorFeeds}</p>
                <p className="text-sm text-sys-fg-muted">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-sys-purple-600" />
              <div>
                <p className="text-2xl font-bold text-sys-fg-default">{totalTransactions}</p>
                <p className="text-sm text-sys-fg-muted">Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-sys-orange-600" />
              <div>
                <p className="text-2xl font-bold text-sys-fg-default">{Math.round(avgUptime)}%</p>
                <p className="text-sm text-sys-fg-muted">Avg Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-sys-brand-600" />
                Feed Management
              </CardTitle>
              <CardDescription>
                Monitor feed status, sync schedules, and health metrics.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogs(!showLogs)}
              >
                {showLogs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showLogs ? 'Hide Logs' : 'Show Logs'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHealth(!showHealth)}
              >
                {showHealth ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showHealth ? 'Hide Health' : 'Show Health'}
              </Button>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search feeds</Label>
              <Input
                id="search"
                placeholder="Search feeds..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-sys-border rounded-md bg-sys-bg-default text-sys-fg-default"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="error">Error</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value as any)}
              className="px-3 py-2 border border-sys-border rounded-md bg-sys-bg-default text-sys-fg-default"
            >
              <option value="all">All Providers</option>
              <option value="plaid">Plaid</option>
              <option value="yodlee">Yodlee</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Feeds List */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Feeds</CardTitle>
          <CardDescription>
            {filteredFeeds.length} of {totalFeeds} feeds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFeeds.map(feed => {
              const health = healthChecks.find(h => h.feedId === feed.id);

              return (
                <Card key={feed.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getProviderIcon(feed.provider)}
                        <div>
                          <h3 className="font-medium text-sys-fg-default">{feed.accountName}</h3>
                          <p className="text-sm text-sys-fg-muted">
                            {feed.provider.toUpperCase()} • {feed.syncFrequency}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Badge className={getStatusColor(feed.status)}>
                          {feed.status}
                        </Badge>
                        {health && (
                          <Badge
                            variant="outline"
                            className={cn('flex items-center gap-1', getHealthColor(health.status))}
                          >
                            {getHealthIcon(health.status)}
                            {health.status}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-medium text-sys-fg-default">{feed.transactionCount} transactions</p>
                        <p className="text-sm text-sys-fg-muted">
                          Last sync: {formatLastSync(feed.lastSync)}
                        </p>
                        <p className="text-sm text-sys-fg-muted">
                          Next sync: {formatNextSync(feed.nextSync)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-medium text-sys-fg-default">{feed.uptime.toFixed(1)}% uptime</p>
                        <p className="text-sm text-sys-fg-muted">{feed.responseTime}ms response</p>
                        {feed.errorCount > 0 && (
                          <p className="text-sm text-sys-red-600">{feed.errorCount} errors</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncFeed(feed.id)}
                          disabled={isSyncing || feed.status === 'inactive'}
                        >
                          {isSyncing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleFeed(feed.id)}
                        >
                          {feed.status === 'active' ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfigureFeed(feed.id)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Health Issues */}
                  {health && health.issues.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-sys-border">
                      <div className="space-y-2">
                        <Label className="text-sys-fg-muted">Issues</Label>
                        {health.issues.map((issue, index) => (
                          <Alert key={index} className="border-sys-red-200">
                            <AlertCircle className="w-4 h-4 text-sys-red-500" />
                            <AlertDescription>{issue}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {health && health.recommendations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-sys-border">
                      <div className="space-y-2">
                        <Label className="text-sys-fg-muted">Recommendations</Label>
                        {health.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-sys-fg-muted">
                            <Info className="w-4 h-4" />
                            {recommendation}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}

            {filteredFeeds.length === 0 && (
              <div className="text-center py-8 text-sys-fg-muted">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No feeds found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Logs */}
      {showLogs && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-sys-brand-600" />
              Sync Logs
            </CardTitle>
            <CardDescription>
              Recent sync activity and performance metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncLogs.map(log => {
                const feed = feeds.find(f => f.id === log.feedId);

                return (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {log.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-sys-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-sys-red-500" />
                          )}
                          <div>
                            <p className="font-medium text-sys-fg-default">
                              {feed?.accountName || 'Unknown Feed'}
                            </p>
                            <p className="text-sm text-sys-fg-muted">
                              {formatLastSync(log.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-medium text-sys-fg-default">
                            {log.transactionsImported} imported
                          </p>
                          {log.transactionsSkipped > 0 && (
                            <p className="text-sm text-sys-fg-muted">
                              {log.transactionsSkipped} skipped
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="font-medium text-sys-fg-default">
                            {log.duration}ms duration
                          </p>
                          <p className="text-sm text-sys-fg-muted">
                            {log.responseTime}ms response
                          </p>
                        </div>

                        <Badge className={cn(
                          log.status === 'success'
                            ? 'bg-sys-green-100 text-sys-green-800 border-sys-green-200'
                            : 'bg-sys-red-100 text-sys-red-800 border-sys-red-200'
                        )}>
                          {log.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Errors */}
                    {log.errors.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-sys-border">
                        <Label className="text-sys-fg-muted">Errors</Label>
                        <div className="space-y-1 mt-1">
                          {log.errors.map((error, index) => (
                            <p key={index} className="text-sm text-sys-red-600">{error}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
