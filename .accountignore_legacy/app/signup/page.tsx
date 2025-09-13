/**
 * Signup Page
 * User registration with automatic company creation
 */

'use client'

import { useState } from 'react'
import { SignupForm } from '@/components/auth/SignupForm'
import { CompanySetupWizard } from '@/components/setup/CompanySetupWizard'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
    const [showSetup, setShowSetup] = useState(false)
    const router = useRouter()

    const handleSignupSuccess = () => {
        setShowSetup(true)
    }

    const handleSetupComplete = () => {
        router.push('/dashboard')
    }

    if (showSetup) {
        return <CompanySetupWizard onComplete={handleSetupComplete} />
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">Join Modern Accounting</h1>
                    <p className="text-muted-foreground mt-2">
                        Start your accounting journey today
                    </p>
                </div>

                <SignupForm onSuccess={handleSignupSuccess} />
            </div>
        </div>
    )
}
