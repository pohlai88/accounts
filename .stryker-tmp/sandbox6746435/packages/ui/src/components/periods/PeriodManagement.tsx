// @ts-nocheck
// Period Management UI Component
// DoD: Period management interface with period status, close/open operations, and lock management
// SSOT: Use existing periods API from apps/web-api/app/api/periods
// Tech Stack: React + Zustand + API client
// Industry Reference: Xero, QuickBooks, Odoo

import React, { useState, useEffect } from 'react';
import { usePeriods } from '../../store/index.js';

// Types
interface Period {
    id: string;
    fiscalYear: number;
    periodNumber: number;
    periodName: string;
    startDate: string;
    endDate: string;
    status: 'OPEN' | 'CLOSED' | 'LOCKED';
    calendarName: string;
    lockType?: 'POSTING' | 'REPORTING' | 'FULL';
    lockedAt?: string;
    lockReason?: string;
}

interface PeriodActionData {
    reason: string;
    forceClose?: boolean;
    generateReversingEntries?: boolean;
    approvalRequired?: boolean;
}

// Status Colors
const STATUS_COLORS = {
    OPEN: 'bg-green-50 border-green-200 text-green-800',
    CLOSED: 'bg-gray-50 border-gray-200 text-gray-800',
    LOCKED: 'bg-red-50 border-red-200 text-red-800',
};

// Status Icons
const STATUS_ICONS = {
    OPEN: '🔓',
    CLOSED: '🔒',
    LOCKED: '🔐',
};

export const PeriodManagement: React.FC = () => {
    const { periods, loading, error, fetchPeriods, closePeriod, openPeriod, lockPeriod } = usePeriods();
    const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'close' | 'open' | 'lock'>('close');
    const [actionData, setActionData] = useState<PeriodActionData>({
        reason: '',
        forceClose: false,
        generateReversingEntries: false,
        approvalRequired: false,
    });
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterYear, setFilterYear] = useState<string>('ALL');

    // Load periods on component mount
    useEffect(() => {
        fetchPeriods();
    }, [fetchPeriods]);

    // Get unique years for filter
    const availableYears = Array.from(new Set(periods.map(p => p.fiscalYear))).sort((a, b) => b - a);

    // Filter periods
    const filteredPeriods = periods.filter(period => {
        const statusMatch = filterStatus === 'ALL' || period.status === filterStatus;
        const yearMatch = filterYear === 'ALL' || period.fiscalYear.toString() === filterYear;
        return statusMatch && yearMatch;
    });

    // Handle period action
    const handlePeriodAction = async (period: any, action: 'close' | 'open' | 'lock') => {
        setSelectedPeriod(period);
        setActionType(action);
        setActionData({
            reason: '',
            forceClose: false,
            generateReversingEntries: false,
            approvalRequired: false,
        });
        setShowActionModal(true);
    };

    // Submit period action
    const handleSubmitAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPeriod) return;

        try {
            const actionPayload = {
                tenantId: 'current-tenant-id', // This should come from user context
                companyId: 'current-company-id', // This should come from user context
                fiscalPeriodId: selectedPeriod.id,
                closedBy: 'current-user-id', // This should come from user context
                userRole: 'current-user-role', // This should come from user context
                ...actionData,
            };

            switch (actionType) {
                case 'close':
                    await closePeriod(selectedPeriod.id, actionPayload);
                    break;
                case 'open':
                    await openPeriod(selectedPeriod.id, actionPayload);
                    break;
                case 'lock':
                    await lockPeriod(selectedPeriod.id, actionPayload);
                    break;
            }

            setShowActionModal(false);
            setSelectedPeriod(null);
        } catch (error) {
            console.error('Error performing period action:', error);
        }
    };

    // Get action button for period
    const getActionButton = (period: any) => {
        switch (period.status) {
            case 'OPEN':
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePeriodAction(period, 'close')}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                            Close Period
                        </button>
                        <button
                            onClick={() => handlePeriodAction(period, 'lock')}
                            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                        >
                            Lock Period
                        </button>
                    </div>
                );
            case 'CLOSED':
                return (
                    <button
                        onClick={() => handlePeriodAction(period, 'open')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                        Reopen Period
                    </button>
                );
            case 'LOCKED':
                return (
                    <div className="text-sm text-gray-500">
                        Locked: {period.lockType}
                        {period.lockReason && (
                            <div className="text-xs text-gray-400 mt-1">
                                Reason: {period.lockReason}
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
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
                <h1 className="text-2xl font-bold text-gray-900">Period Management</h1>
                <div className="text-sm text-gray-500">
                    Manage fiscal periods and their status
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex space-x-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="CLOSED">Closed</option>
                            <option value="LOCKED">Locked</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label>
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All Years</option>
                            {availableYears.map(year => (
                                <option key={year} value={year.toString()}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Periods List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {filteredPeriods.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No periods found. Try adjusting your filters.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Period
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date Range
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Calendar
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPeriods.map((period) => (
                                    <tr key={period.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-lg mr-2">{STATUS_ICONS[period.status as keyof typeof STATUS_ICONS] || STATUS_ICONS.OPEN}</span>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {period.periodName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Period {period.periodNumber}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div>
                                                {formatDate(period.startDate)} - {formatDate(period.endDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[period.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                                                {period.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {period.calendarName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {getActionButton(period)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {showActionModal && selectedPeriod && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {actionType === 'close' && 'Close Period'}
                            {actionType === 'open' && 'Reopen Period'}
                            {actionType === 'lock' && 'Lock Period'}
                        </h2>

                        <div className="mb-4 p-3 bg-gray-50 rounded-md">
                            <div className="text-sm font-medium text-gray-900">
                                {selectedPeriod.periodName} ({selectedPeriod.fiscalYear})
                            </div>
                            <div className="text-sm text-gray-500">
                                {formatDate(selectedPeriod.startDate)} - {formatDate(selectedPeriod.endDate)}
                            </div>
                        </div>

                        <form onSubmit={handleSubmitAction} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Reason {actionType === 'close' ? 'for Closing' : actionType === 'open' ? 'for Reopening' : 'for Locking'}
                                </label>
                                <textarea
                                    value={actionData.reason}
                                    onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    required
                                />
                            </div>

                            {actionType === 'close' && (
                                <>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="forceClose"
                                            checked={actionData.forceClose}
                                            onChange={(e) => setActionData({ ...actionData, forceClose: e.target.checked })}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="forceClose" className="ml-2 block text-sm text-gray-900">
                                            Force close (ignore warnings)
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="generateReversingEntries"
                                            checked={actionData.generateReversingEntries}
                                            onChange={(e) => setActionData({ ...actionData, generateReversingEntries: e.target.checked })}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="generateReversingEntries" className="ml-2 block text-sm text-gray-900">
                                            Generate reversing entries
                                        </label>
                                    </div>
                                </>
                            )}

                            {actionType === 'open' && (
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="approvalRequired"
                                        checked={actionData.approvalRequired}
                                        onChange={(e) => setActionData({ ...actionData, approvalRequired: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="approvalRequired" className="ml-2 block text-sm text-gray-900">
                                        Require approval for reopening
                                    </label>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowActionModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`px-4 py-2 text-white rounded-md ${actionType === 'close' ? 'bg-red-600 hover:bg-red-700' :
                                        actionType === 'open' ? 'bg-green-600 hover:bg-green-700' :
                                            'bg-yellow-600 hover:bg-yellow-700'
                                        }`}
                                >
                                    {actionType === 'close' && 'Close Period'}
                                    {actionType === 'open' && 'Reopen Period'}
                                    {actionType === 'lock' && 'Lock Period'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeriodManagement;
