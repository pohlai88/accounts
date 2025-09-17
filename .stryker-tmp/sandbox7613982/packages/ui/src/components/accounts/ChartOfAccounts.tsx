// @ts-nocheck
// Chart of Accounts UI Component
// DoD: COA management interface with hierarchical view, CRUD operations, and search
// SSOT: Use existing accounts API from apps/web-api/app/api/accounts
// Tech Stack: React + Zustand + API client
// Industry Reference: Xero, QuickBooks, Odoo

import React, { useState, useEffect, useMemo } from 'react';
import { useAccounts } from '../../store/index.js';

// Types
interface Account {
  id: string;
  code: string;
  name: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parentId?: string;
  level: number;
  isActive: boolean;
  description?: string;
  children?: Account[];
}

interface AccountFormData {
  code: string;
  name: string;
  accountType: string;
  parentId?: string;
  description?: string;
}

// Account Type Colors (inspired by QuickBooks)
const ACCOUNT_TYPE_COLORS = {
  ASSET: 'bg-blue-50 border-blue-200 text-blue-800',
  LIABILITY: 'bg-red-50 border-red-200 text-red-800',
  EQUITY: 'bg-green-50 border-green-200 text-green-800',
  REVENUE: 'bg-purple-50 border-purple-200 text-purple-800',
  EXPENSE: 'bg-orange-50 border-orange-200 text-orange-800',
};

// Account Type Icons
const ACCOUNT_TYPE_ICONS = {
  ASSET: '💰',
  LIABILITY: '📋',
  EQUITY: '🏛️',
  REVENUE: '📈',
  EXPENSE: '💸',
};

export const ChartOfAccounts: React.FC = () => {
  const { accounts, loading, error, fetchAccounts, createAccount, updateAccount, deleteAccount } = useAccounts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<AccountFormData>({
    code: '',
    name: '',
    accountType: 'ASSET',
    parentId: '',
    description: '',
  });

  // Load accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Build hierarchical structure (inspired by Odoo's COA structure)
  const hierarchicalAccounts = useMemo(() => {
    const accountMap = new Map<string, Account & { children: Account[] }>();
    const rootAccounts: (Account & { children: Account[] })[] = [];

    // First pass: create account map
    accounts.forEach(account => {
      accountMap.set(account.id, {
        id: account.id,
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        parentId: account.parentId,
        level: account.level,
        isActive: account.isActive,
        description: account.description,
        children: []
      });
    });

    // Second pass: build hierarchy
    accounts.forEach(account => {
      const accountWithChildren = accountMap.get(account.id)!;
      if (account.parentId && accountMap.has(account.parentId)) {
        const parent = accountMap.get(account.parentId)!;
        if (parent.children) {
          parent.children.push(accountWithChildren);
        }
      } else {
        rootAccounts.push(accountWithChildren);
      }
    });

    return rootAccounts as Account[];
  }, [accounts]);

  // Filter accounts based on search and type
  const filteredAccounts = useMemo(() => {
    const filterAccount = (account: Account): Account | null => {
      const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedAccountType === 'ALL' || account.accountType === selectedAccountType;

      if (!matchesSearch && !matchesType) return null;

      const filteredChildren = account.children?.map(filterAccount).filter(Boolean) as Account[] || [];

      return {
        ...account,
        children: filteredChildren
      };
    };

    return hierarchicalAccounts.map(filterAccount).filter(Boolean) as Account[];
  }, [hierarchicalAccounts, searchTerm, selectedAccountType]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, formData);
        setEditingAccount(null);
      } else {
        await createAccount(formData);
      }
      setShowForm(false);
      setFormData({ code: '', name: '', accountType: 'ASSET', parentId: '', description: '' });
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  // Handle account edit
  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      accountType: account.accountType,
      parentId: account.parentId || '',
      description: account.description || '',
    });
    setShowForm(true);
  };

  // Handle account delete
  const handleDelete = async (account: Account) => {
    if (window.confirm(`Are you sure you want to delete account "${account.name}"?`)) {
      try {
        await deleteAccount(account.id);
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  // Toggle account expansion
  const toggleExpansion = (accountId: string) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  // Render account row (inspired by Xero's COA interface)
  const renderAccountRow = (account: Account, level: number = 0) => {
    const isExpanded = expandedAccounts.has(account.id);
    const hasChildren = account.children && account.children.length > 0;
    const indentClass = `ml-${level * 4}`;

    return (
      <div key={account.id} className={`${indentClass} border-b border-gray-100 hover:bg-gray-50`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            {hasChildren && (
              <button
                onClick={() => toggleExpansion(account.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}

            <div className="flex items-center space-x-2">
              <span className="text-lg">{ACCOUNT_TYPE_ICONS[account.accountType]}</span>
              <div>
                <div className="font-medium text-gray-900">{account.name}</div>
                <div className="text-sm text-gray-500">Code: {account.code}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${ACCOUNT_TYPE_COLORS[account.accountType]}`}>
              {account.accountType}
            </span>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(account)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                title="Edit Account"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(account)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Delete Account"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {account.children!.map(child => renderAccountRow(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + Add Account
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedAccountType}
            onChange={(e) => setSelectedAccountType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="ASSET">Assets</option>
            <option value="LIABILITY">Liabilities</option>
            <option value="EQUITY">Equity</option>
            <option value="REVENUE">Revenue</option>
            <option value="EXPENSE">Expenses</option>
          </select>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No accounts found. {searchTerm && 'Try adjusting your search criteria.'}
          </div>
        ) : (
          <div>
            {filteredAccounts.map(account => renderAccountRow(account))}
          </div>
        )}
      </div>

      {/* Account Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Account Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Account Type</label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                  <option value="EQUITY">Equity</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Parent Account (Optional)</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Parent</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAccount(null);
                    setFormData({ code: '', name: '', accountType: 'ASSET', parentId: '', description: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingAccount ? 'Update' : 'Create'} Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;
