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
  Building2,
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

// Types
interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  accountNumber: string;
  routingNumber?: string;
  balance: number;
  currency: string;
  isConnected: boolean;
  lastSync?: string;
  provider: 'plaid' | 'yodlee' | 'manual';
  status: 'active' | 'pending' | 'error' | 'disconnected';
}

interface BankProvider {
  id: string;
  name: string;
  logo: string;
  type: 'plaid' | 'yodlee' | 'manual';
  isAvailable: boolean;
  features: string[];
  securityLevel: 'high' | 'medium' | 'low';
}

interface BankConnectionProps {
  onAccountConnected?: (account: BankAccount) => void;
  onAccountDisconnected?: (accountId: string) => void;
  onSyncRequested?: (accountId: string) => void;
  className?: string;
}

// Mock data
const mockProviders: BankProvider[] = [
  {
    id: 'plaid',
    name: 'Plaid',
    logo: '🏦',
    type: 'plaid',
    isAvailable: true,
    features: ['Real-time sync', 'Transaction categorization', 'Account verification'],
    securityLevel: 'high'
  },
  {
    id: 'yodlee',
    name: 'Yodlee',
    logo: '🏛️',
    type: 'yodlee',
    isAvailable: true,
    features: ['Global bank support', 'Investment accounts', 'Credit monitoring'],
    securityLevel: 'high'
  },
  {
    id: 'manual',
    name: 'Manual Entry',
    logo: '✏️',
    type: 'manual',
    isAvailable: true,
    features: ['CSV import', 'Manual reconciliation', 'Custom categories'],
    securityLevel: 'medium'
  }
];

const mockAccounts: BankAccount[] = [
  {
    id: 'acc_001',
    name: 'Business Checking',
    type: 'checking',
    accountNumber: '****1234',
    routingNumber: '****5678',
    balance: 45230.50,
    currency: 'USD',
    isConnected: true,
    lastSync: '2024-01-15T10:30:00Z',
    provider: 'plaid',
    status: 'active'
  },
  {
    id: 'acc_002',
    name: 'Business Savings',
    type: 'savings',
    accountNumber: '****5678',
    routingNumber: '****5678',
    balance: 125000.00,
    currency: 'USD',
    isConnected: true,
    lastSync: '2024-01-15T09:15:00Z',
    provider: 'plaid',
    status: 'active'
  },
  {
    id: 'acc_003',
    name: 'Business Credit Card',
    type: 'credit',
    accountNumber: '****9012',
    balance: -2340.75,
    currency: 'USD',
    isConnected: false,
    provider: 'yodlee',
    status: 'pending'
  }
];

export function BankConnection({
  onAccountConnected,
  onAccountDisconnected,
  onSyncRequested,
  className
}: BankConnectionProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>(mockAccounts);
  const [providers] = useState<BankProvider[]>(mockProviders);
  const [selectedProvider, setSelectedProvider] = useState<BankProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'select' | 'authenticate' | 'verify' | 'complete'>('select');
  const [showAccountNumbers, setShowAccountNumbers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'checking' | 'savings' | 'credit' | 'investment'>('all');

  // Filter accounts based on search and type
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountNumber.includes(searchTerm);
    const matchesType = filterType === 'all' || account.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleProviderSelect = (provider: BankProvider) => {
    setSelectedProvider(provider);
    setConnectionStep('authenticate');
  };

  const handleConnect = async () => {
    setIsConnecting(true);

    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock successful connection
    const newAccount: BankAccount = {
      id: `acc_${Date.now()}`,
      name: `${selectedProvider?.name} Account`,
      type: 'checking',
      accountNumber: '****' + Math.floor(Math.random() * 10000),
      balance: Math.floor(Math.random() * 100000),
      currency: 'USD',
      isConnected: true,
      lastSync: new Date().toISOString(),
      provider: selectedProvider?.type || 'manual',
      status: 'active'
    };

    setAccounts(prev => [...prev, newAccount]);
    setConnectionStep('complete');
    setIsConnecting(false);

    if (onAccountConnected) {
      onAccountConnected(newAccount);
    }
  };

  const handleDisconnect = (accountId: string) => {
    setAccounts(prev => prev.map(account =>
      account.id === accountId
        ? { ...account, isConnected: false, status: 'disconnected' }
        : account
    ));

    if (onAccountDisconnected) {
      onAccountDisconnected(accountId);
    }
  };

  const handleSync = (accountId: string) => {
    setAccounts(prev => prev.map(account =>
      account.id === accountId
        ? { ...account, lastSync: new Date().toISOString() }
        : account
    ));

    if (onSyncRequested) {
      onSyncRequested(accountId);
    }
  };

  const getStatusColor = (status: BankAccount['status']) => {
    switch (status) {
      case 'active': return 'bg-sys-green-100 text-sys-green-800 border-sys-green-200';
      case 'pending': return 'bg-sys-yellow-100 text-sys-yellow-800 border-sys-yellow-200';
      case 'error': return 'bg-sys-red-100 text-sys-red-800 border-sys-red-200';
      case 'disconnected': return 'bg-sys-gray-100 text-sys-gray-800 border-sys-gray-200';
      default: return 'bg-sys-gray-100 text-sys-gray-800 border-sys-gray-200';
    }
  };

  const getAccountTypeIcon = (type: BankAccount['type']) => {
    switch (type) {
      case 'checking': return <Building2 className="w-4 h-4" />;
      case 'savings': return <Building2 className="w-4 h-4" />;
      case 'credit': return <CreditCard className="w-4 h-4" />;
      case 'investment': return <Building2 className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(balance);
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-sys-fg-default">Bank Connections</h2>
        <p className="text-sys-fg-muted">
          Connect your bank accounts for automatic transaction import and reconciliation.
        </p>
      </div>

      {/* Connection Step */}
      {connectionStep === 'select' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-sys-brand-600" />
              Connect Bank Account
            </CardTitle>
            <CardDescription>
              Choose a secure provider to connect your bank accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {providers.map(provider => (
                <Card
                  key={provider.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    selectedProvider?.id === provider.id && 'ring-2 ring-sys-brand-500'
                  )}
                  onClick={() => handleProviderSelect(provider)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{provider.logo}</span>
                      <div>
                        <h3 className="font-medium text-sys-fg-default">{provider.name}</h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            provider.securityLevel === 'high' && 'border-sys-green-200 text-sys-green-700',
                            provider.securityLevel === 'medium' && 'border-sys-yellow-200 text-sys-yellow-700',
                            provider.securityLevel === 'low' && 'border-sys-red-200 text-sys-red-700'
                          )}
                        >
                          {provider.securityLevel} security
                        </Badge>
                      </div>
                    </div>
                    <ul className="space-y-1 text-sm text-sys-fg-muted">
                      {provider.features.map(feature => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-sys-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Authentication Step */}
      {connectionStep === 'authenticate' && selectedProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-sys-brand-600" />
              Authenticate with {selectedProvider.name}
            </CardTitle>
            <CardDescription>
              You'll be redirected to {selectedProvider.name} to securely authenticate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                Your bank credentials are never stored. We use bank-level security to connect your accounts.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect to {selectedProvider.name}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConnectionStep('select')}
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Step */}
      {connectionStep === 'complete' && (
        <Alert>
          <CheckCircle className="w-4 h-4 text-sys-green-500" />
          <AlertDescription>
            Bank account connected successfully! You can now import transactions and reconcile your accounts.
          </AlertDescription>
        </Alert>
      )}

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage your connected bank accounts and sync settings.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setConnectionStep('select')}
            >
              Add Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search accounts</Label>
              <Input
                id="search"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <select
              value={filterType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-sys-border rounded-md bg-sys-bg-default text-sys-fg-default"
            >
              <option value="all">All Types</option>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit</option>
              <option value="investment">Investment</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAccountNumbers(!showAccountNumbers)}
            >
              {showAccountNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          {/* Accounts List */}
          <div className="space-y-3">
            {filteredAccounts.map(account => (
              <Card key={account.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getAccountTypeIcon(account.type)}
                      <div>
                        <h3 className="font-medium text-sys-fg-default">{account.name}</h3>
                        <p className="text-sm text-sys-fg-muted">
                          {showAccountNumbers ? account.accountNumber : '••••••••'}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(account.status)}>
                      {account.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-sys-fg-default">
                        {formatBalance(account.balance)}
                      </p>
                      <p className="text-sm text-sys-fg-muted">
                        Last sync: {formatLastSync(account.lastSync)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(account.id)}
                        disabled={!account.isConnected}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                        disabled={!account.isConnected}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {filteredAccounts.length === 0 && (
              <div className="text-center py-8 text-sys-fg-muted">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No accounts found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
