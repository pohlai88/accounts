/**
 * Client & Vendor Portal Page - Self-Service Portal Platform
 */

'use client'

import React from 'react'
import PortalDashboard from '@/components/portals/PortalDashboard'

export default function PortalPage() {
    return (
        <div className="min-h-screen">
            <PortalDashboard />
        </div>
    )
}

/**
 * Page metadata
 */
export const metadata = {
    title: 'Portal Dashboard - Self-Service Client & Vendor Portal',
    description: 'Complete self-service portal for clients and vendors with document access, payments, messaging, and support tickets.'
}
