/**
 * Zero-Friction 4-Step Setup Wizard
 * Smart defaults + Skip options - no dead ends
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Building2,
    Upload,
    Banknote,
    Receipt,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Skip,
    Sparkles,
    FileSpreadsheet,
    Link as LinkIcon,
    Clock
} from 'lucide-react'

interface WizardData {
    // Step 1: Company Basics
    company_name: string
    logo_url?: string
    financial_year_start: string
    currency: string
    multi_company: boolean

    // Step 2: Opening Balances
    has_opening_balances: boolean
    opening_balances_file?: File
    skip_opening_balances: boolean

    // Step 3: Bank Accounts
    bank_accounts: Array<{
        name: string
        account_number: string
        connect_later: boolean
    }>

    // Step 4: Tax Settings
    business_type: 'b2b' | 'b2c' | 'both'
    sst_registered: boolean
    sst_number?: string
}

interface ZeroFrictionWizardProps {
    initialData?: Partial<WizardData>
    onComplete: (data: WizardData) => void
    onSkip: () => void
}

export function ZeroFrictionWizard({
    initialData,
    onComplete,
    onSkip
}: ZeroFrictionWizardProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [data, setData] = useState<WizardData>({
        company_name: initialData?.company_name || '',
        financial_year_start: 'January',
        currency: 'MYR',
        multi_company: false,
        has_opening_balances: false,
        skip_opening_balances: false,
        bank_accounts: [{ name: '', account_number: '', connect_later: false }],
        business_type: 'both',
        sst_registered: false,
        ...initialData
    })

    const steps = [
        {
            id: 'company',
            title: 'Company Basics',
            description: 'Confirm your company details',
            icon: Building2,
            estimatedTime: '1 min'
        },
        {
            id: 'balances',
            title: 'Opening Balances',
            description: 'Import existing balances (optional)',
            icon: Upload,
            estimatedTime: '2 min'
        },
        {
            id: 'banking',
            title: 'Bank Accounts',
            description: 'Add your primary bank account',
            icon: Banknote,
            estimatedTime: '1 min'
        },
        {
            id: 'taxes',
            title: 'Tax Settings',
            description: 'Configure Malaysian tax settings',
            icon: Receipt,
            estimatedTime: '1 min'
        }
    ]

    const progress = ((currentStep + 1) / steps.length) * 100

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            onComplete(data)
        }
    }

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSkipStep = () => {
        // Mark current step as skipped and move to next
        handleNext()
    }

    const updateData = (updates: Partial<WizardData>) => {
        setData(prev => ({ ...prev, ...updates }))
    }

    const currentStepData = steps[currentStep]
    const CurrentStepIcon = currentStepData.icon

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
            {/* Header */}
            <div className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl font-bold">Quick Setup</h1>
                        <Badge variant="secondary">5 Minutes</Badge>
                    </div>
                    <Button variant="ghost" onClick={onSkip}>
                        Skip Setup
                    </Button>
                </div>

                {/* Progress */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Setup Progress</span>
                        <span className="text-sm text-muted-foreground">
                            Step {currentStep + 1} of {steps.length}
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Step Indicators */}
                <div className="flex items-center justify-center mb-8 space-x-2">
                    {steps.map((step, index) => {
                        const StepIcon = step.icon
                        const isActive = index === currentStep
                        const isCompleted = index < currentStep

                        return (
                            <div
                                key={step.id}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-primary text-primary-foreground' :
                                        isCompleted ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                            'bg-muted text-muted-foreground'
                                    }`}
                            >
                                <StepIcon className="h-4 w-4" />
                                <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 pb-8">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <CurrentStepIcon className="h-6 w-6 text-primary" />
                            <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {currentStepData.estimatedTime}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">{currentStepData.description}</p>
                    </CardHeader>

                    <CardContent>
                        {currentStep === 0 && (
                            <CompanyBasicsStep data={data} onChange={updateData} />
                        )}
                        {currentStep === 1 && (
                            <OpeningBalancesStep data={data} onChange={updateData} />
                        )}
                        {currentStep === 2 && (
                            <BankAccountsStep data={data} onChange={updateData} />
                        )}
                        {currentStep === 3 && (
                            <TaxSettingsStep data={data} onChange={updateData} />
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t">
                            <div>
                                {currentStep > 0 && (
                                    <Button variant="outline" onClick={handlePrevious}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Previous
                                    </Button>
                                )}
                            </div>

                            <div className="flex space-x-2">
                                <Button variant="ghost" onClick={handleSkipStep}>
                                    <Skip className="mr-2 h-4 w-4" />
                                    Skip for Now
                                </Button>
                                <Button onClick={handleNext}>
                                    {currentStep === steps.length - 1 ? (
                                        <>
                                            Complete Setup
                                            <CheckCircle2 className="ml-2 h-4 w-4" />
                                        </>
                                    ) : (
                                        <>
                                            Next
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Step 1: Company Basics
function CompanyBasicsStep({
    data,
    onChange
}: {
    data: WizardData
    onChange: (updates: Partial<WizardData>) => void
}) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                        id="company_name"
                        value={data.company_name}
                        onChange={(e) => onChange({ company_name: e.target.value })}
                        placeholder="Your Company Sdn Bhd"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="financial_year">Financial Year Starts</Label>
                    <select
                        id="financial_year"
                        value={data.financial_year_start}
                        onChange={(e) => onChange({ financial_year_start: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="January">January (Most Common)</option>
                        <option value="April">April</option>
                        <option value="July">July</option>
                        <option value="October">October</option>
                    </select>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
                    Smart Defaults Applied ✨
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Currency: Malaysian Ringgit (MYR)</li>
                    <li>• Date Format: DD/MM/YYYY</li>
                    <li>• Timezone: Asia/Kuala_Lumpur</li>
                    <li>• Chart of Accounts: MFRS-aligned</li>
                </ul>
            </div>

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="multi_company"
                    checked={data.multi_company}
                    onChange={(e) => onChange({ multi_company: e.target.checked })}
                    className="h-4 w-4"
                />
                <Label htmlFor="multi_company" className="text-sm">
                    Multi-company setup (enables intercompany transactions)
                </Label>
            </div>
        </div>
    )
}

// Step 2: Opening Balances
function OpeningBalancesStep({
    data,
    onChange
}: {
    data: WizardData
    onChange: (updates: Partial<WizardData>) => void
}) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Do you have existing balances to import?</h3>
                <p className="text-sm text-muted-foreground">
                    If you're migrating from another system, you can import your opening balances
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                    className={`cursor-pointer border-2 transition-colors ${data.has_opening_balances ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                    onClick={() => onChange({ has_opening_balances: true, skip_opening_balances: false })}
                >
                    <CardContent className="p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-3 text-primary" />
                        <h3 className="font-semibold mb-2">Yes, Import Balances</h3>
                        <p className="text-sm text-muted-foreground">
                            Upload CSV or Excel file with your opening balances
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer border-2 transition-colors ${data.skip_opening_balances ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                    onClick={() => onChange({ has_opening_balances: false, skip_opening_balances: true })}
                >
                    <CardContent className="p-6 text-center">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-green-500" />
                        <h3 className="font-semibold mb-2">Start Fresh</h3>
                        <p className="text-sm text-muted-foreground">
                            Begin with zero balances (creates Opening Equity account)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {data.has_opening_balances && (
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                        <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-semibold mb-2">Drop your file here</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            CSV or Excel file with Account Code, Account Name, and Balance columns
                        </p>
                        <Button variant="outline">
                            Choose File
                        </Button>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
                            📊 Need a template?
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                            Download our Google Sheet template with sample data
                        </p>
                        <Button variant="outline" size="sm">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Get Template
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// Step 3: Bank Accounts
function BankAccountsStep({
    data,
    onChange
}: {
    data: WizardData
    onChange: (updates: Partial<WizardData>) => void
}) {
    const updateBankAccount = (index: number, updates: Partial<typeof data.bank_accounts[0]>) => {
        const newBankAccounts = [...data.bank_accounts]
        newBankAccounts[index] = { ...newBankAccounts[index], ...updates }
        onChange({ bank_accounts: newBankAccounts })
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Add Your Primary Bank Account</h3>
                <p className="text-sm text-muted-foreground">
                    This helps with reconciliation and cash flow tracking
                </p>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="bank_name">Bank Name</Label>
                        <select
                            id="bank_name"
                            value={data.bank_accounts[0]?.name || ''}
                            onChange={(e) => updateBankAccount(0, { name: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Select Bank</option>
                            <option value="Maybank">Maybank</option>
                            <option value="CIMB Bank">CIMB Bank</option>
                            <option value="Public Bank">Public Bank</option>
                            <option value="RHB Bank">RHB Bank</option>
                            <option value="Hong Leong Bank">Hong Leong Bank</option>
                            <option value="AmBank">AmBank</option>
                            <option value="UOB Malaysia">UOB Malaysia</option>
                            <option value="Standard Chartered">Standard Chartered</option>
                            <option value="HSBC Malaysia">HSBC Malaysia</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account_number">Account Number</Label>
                        <Input
                            id="account_number"
                            value={data.bank_accounts[0]?.account_number || ''}
                            onChange={(e) => updateBankAccount(0, { account_number: e.target.value })}
                            placeholder="1234567890"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="connect_later"
                        checked={data.bank_accounts[0]?.connect_later || false}
                        onChange={(e) => updateBankAccount(0, { connect_later: e.target.checked })}
                        className="h-4 w-4"
                    />
                    <Label htmlFor="connect_later" className="text-sm">
                        Connect for automatic transaction import later
                    </Label>
                </div>

                {data.bank_accounts[0]?.connect_later && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                            🔗 Bank Connection Available
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            We'll pull your last 30 days of transactions for sample reconciliation
                        </p>
                    </div>
                )}
            </div>

            <div className="text-center">
                <Button variant="outline" size="sm">
                    + Add Another Bank Account
                </Button>
            </div>
        </div>
    )
}

// Step 4: Tax Settings
function TaxSettingsStep({
    data,
    onChange
}: {
    data: WizardData
    onChange: (updates: Partial<WizardData>) => void
}) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Malaysian Tax Configuration</h3>
                <p className="text-sm text-muted-foreground">
                    We've preloaded SST/GST settings for Malaysia
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-3">
                    <Label>Business Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { value: 'b2b', label: 'B2B Only', desc: 'Business to Business' },
                            { value: 'b2c', label: 'B2C Only', desc: 'Business to Consumer' },
                            { value: 'both', label: 'Both', desc: 'Mixed Business' }
                        ].map(option => (
                            <Card
                                key={option.value}
                                className={`cursor-pointer border-2 transition-colors ${data.business_type === option.value ? 'border-primary bg-primary/5' : 'border-border'
                                    }`}
                                onClick={() => onChange({ business_type: option.value as any })}
                            >
                                <CardContent className="p-4 text-center">
                                    <h4 className="font-semibold text-sm">{option.label}</h4>
                                    <p className="text-xs text-muted-foreground">{option.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="sst_registered"
                            checked={data.sst_registered}
                            onChange={(e) => onChange({ sst_registered: e.target.checked })}
                            className="h-4 w-4"
                        />
                        <Label htmlFor="sst_registered">
                            SST Registered Business
                        </Label>
                    </div>

                    {data.sst_registered && (
                        <div className="space-y-2">
                            <Label htmlFor="sst_number">SST Registration Number</Label>
                            <Input
                                id="sst_number"
                                value={data.sst_number || ''}
                                onChange={(e) => onChange({ sst_number: e.target.value })}
                                placeholder="A12-3456-78901234"
                            />
                        </div>
                    )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
                        📋 Tax Presets Configured
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• SST Standard Rate: 6%</li>
                        <li>• SST Service Tax: 6%</li>
                        <li>• SST Zero Rate: 0%</li>
                        <li>• SST Exempt: 0%</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
