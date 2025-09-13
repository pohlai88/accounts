/**
 * Fixed Assets Page - Complete Asset Management System
 * ERPNext feature parity with modern React interface
 */

'use client'

import React from 'react'
import AssetsDashboard from '@/components/assets/AssetsDashboard'

export default function AssetsPage() {
    return (
        <div className="container mx-auto p-6">
            <AssetsDashboard />
        </div>
    )
}

/**
 * Page metadata
 */
export const metadata = {
    title: 'Fixed Assets - Asset Management System',
    description: 'Comprehensive fixed assets management with depreciation tracking, maintenance scheduling, and compliance reporting.'
}
