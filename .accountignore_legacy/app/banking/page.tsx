/**
 * Bank Integration & Reconciliation Page - Complete Banking Automation
 */

'use client'

import React from 'react'
import BankDashboard from '@/components/banking/BankDashboard'

export default function BankingPage() {
    return (
        <div className="container mx-auto p-6">
            <BankDashboard />
        </div>
    )
}

/**
 * Page metadata
 */
export const metadata = {
    title: 'Bank Integration & Reconciliation - Automated Banking with Multi-Bank Connectivity',
    description: 'Complete banking integration platform with automated transaction feeds, intelligent reconciliation, and comprehensive reporting.'
}
