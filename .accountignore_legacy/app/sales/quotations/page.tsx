/**
 * Sales Quotations Management Page
 * Dedicated page for quotation management
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SalesQuotationForm } from '@/components/sales/SalesQuotationForm'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

export default function QuotationsPage() {
    const [isCreating, setIsCreating] = useState(false)
    const companyId = 'default-company-id' // In real app, get from user context

    if (isCreating) {
        return (
            <div className="container mx-auto py-6">
                <div className="mb-6">
                    <Button
                        variant="outline"
                        onClick={() => setIsCreating(false)}
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Quotations
                    </Button>
                </div>

                <SalesQuotationForm
                    companyId={companyId}
                    onSuccess={() => setIsCreating(false)}
                    onCancel={() => setIsCreating(false)}
                />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Sales Quotations</h1>
                    <p className="text-muted-foreground">
                        Manage your sales quotations and track conversion rates
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/sales">
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Sales
                        </Button>
                    </Link>
                    <Button onClick={() => setIsCreating(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Quotation
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-muted-foreground">
                    Quotation list and management features will be displayed here.
                    Click "New Quotation" to create your first quotation.
                </p>
            </div>
        </div>
    )
}
