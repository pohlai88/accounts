/**
 * Sales Management Page
 * Complete sales dashboard with quotations and orders management
 */

'use client'

import { Suspense } from 'react'
import { SalesDashboard } from '@/components/sales/SalesDashboard'

export default function SalesPage() {
    // In a real application, you would get this from user context
    const companyId = 'default-company-id'

    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                    <div className="text-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground">Loading sales dashboard...</p>
                    </div>
                </div>
            }>
                <SalesDashboard companyId={companyId} />
            </Suspense>
        </div>
    )
}
