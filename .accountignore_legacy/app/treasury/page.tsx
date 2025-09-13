/**
 * Treasury Management Page - Strategic CFO Financial Management
 * Advanced Cash Flow Forecasting & Working Capital Optimization
 */

'use client'

import React from 'react'
import TreasuryDashboard from '@/components/treasury/TreasuryDashboard'

export default function TreasuryPage() {
    const companyId = 'current-company-id' // Get from context/props in real app

    return (
        <div className="container mx-auto p-6">
            <TreasuryDashboard companyId={companyId} />
        </div>
    )
}

/**
 * Page metadata
 */
export const metadata = {
    title: 'Treasury Management - Advanced Cash Flow Forecasting & Working Capital Optimization',
    description: 'Strategic CFO-level treasury management with predictive cash flow forecasting, scenario analysis, and working capital optimization tools.'
}
