'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Shield,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Download,
    Settings,
    FileText,
    Globe,
    RefreshCw,
    Plus,
    Calendar,
    Flag
} from 'lucide-react'
import { SecurityService } from '@/lib/security-service'
import { format } from 'date-fns'

interface ComplianceManagerProps {
    companyId: string
}

interface ComplianceStandard {
    id: string
    name: string
    description: string
    country: string
    version: string
    is_active: boolean
    requirements: string[]
}

interface CompanyCompliance {
    id: string
    company_id: string
    compliance_standard_id: string
    is_active: boolean
    effective_date: string
    configuration: Record<string, any>
    compliance_standard?: ComplianceStandard
}

export function ComplianceManager({ companyId }: ComplianceManagerProps) {
    const [loading, setLoading] = useState(true)
    const [standards, setStandards] = useState<ComplianceStandard[]>([])
    const [companyCompliance, setCompanyCompliance] = useState<CompanyCompliance[]>([])
    const [error, setError] = useState<string | null>(null)
    const [selectedStandard, setSelectedStandard] = useState<string>('')
    const [effectiveDate, setEffectiveDate] = useState<string>('')
    const [showSetupDialog, setShowSetupDialog] = useState(false)

    const loadData = async () => {
        try {
            setLoading(true)
            const [standardsResult, complianceResult] = await Promise.all([
                SecurityService.getComplianceStandards(),
                // Add method to get company compliance
                Promise.resolve({ success: true, compliance: [] })
            ])

            if (standardsResult.success) {
                setStandards(standardsResult.standards || [])
            }

            if (complianceResult.success) {
                setCompanyCompliance(complianceResult.compliance || [])
            }
        } catch (err) {
            setError('An error occurred while loading compliance data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [companyId])

    const handleSetupCompliance = async () => {
        if (!selectedStandard || !effectiveDate) return

        try {
            const result = await SecurityService.setCompanyCompliance(
                companyId,
                selectedStandard,
                effectiveDate
            )

            if (result.success) {
                setShowSetupDialog(false)
                setSelectedStandard('')
                setEffectiveDate('')
                loadData()
            } else {
                setError(result.error || 'Failed to setup compliance')
            }
        } catch (err) {
            setError('An error occurred while setting up compliance')
        }
    }

    const getCountryFlag = (country: string) => {
        const flags: Record<string, string> = {
            'Malaysia': '🇲🇾',
            'United States': '🇺🇸',
            'United Kingdom': '🇬🇧',
            'International': '🌍'
        }
        return flags[country] || '🌍'
    }

    const getComplianceStatus = (compliance: CompanyCompliance) => {
        if (!compliance.is_active) return { status: 'Inactive', color: 'bg-gray-100 text-gray-800' }

        const effectiveDate = new Date(compliance.effective_date)
        const now = new Date()

        if (effectiveDate > now) {
            return { status: 'Pending', color: 'bg-yellow-100 text-yellow-800' }
        }

        return { status: 'Active', color: 'bg-green-100 text-green-800' }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Compliance Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Configure and monitor compliance standards for your company
                    </p>
                </div>
                <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Setup Compliance
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Setup Compliance Standard</DialogTitle>
                            <DialogDescription>
                                Select a compliance standard and effective date for your company
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="standard">Compliance Standard</Label>
                                <Select value={selectedStandard} onValueChange={setSelectedStandard}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a compliance standard" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {standards.map((standard) => (
                                            <SelectItem key={standard.id} value={standard.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{getCountryFlag(standard.country)}</span>
                                                    <span>{standard.name}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        ({standard.country})
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="date">Effective Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={effectiveDate}
                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSetupCompliance}>
                                    Setup Compliance
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {error && (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Available Standards */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Available Compliance Standards
                    </CardTitle>
                    <CardDescription>
                        Choose from internationally recognized compliance standards
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {standards.map((standard) => (
                            <Card key={standard.id} className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{getCountryFlag(standard.country)}</span>
                                            <div>
                                                <h4 className="font-semibold">{standard.name}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {standard.country} • Version {standard.version}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm">{standard.description}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {standard.requirements.slice(0, 3).map((req, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    {req.replace(/_/g, ' ')}
                                                </Badge>
                                            ))}
                                            {standard.requirements.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{standard.requirements.length - 3} more
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant={standard.is_active ? 'default' : 'secondary'}>
                                        {standard.is_active ? 'Available' : 'Inactive'}
                                    </Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Company Compliance Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Your Company Compliance
                    </CardTitle>
                    <CardDescription>
                        Current compliance standards and their status
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {companyCompliance.length === 0 ? (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                No compliance standards configured. Click "Setup Compliance" to get started.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-4">
                            {companyCompliance.map((compliance) => {
                                const status = getComplianceStatus(compliance)
                                const standard = standards.find(s => s.id === compliance.compliance_standard_id)

                                return (
                                    <Card key={compliance.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">
                                                        {standard ? getCountryFlag(standard.country) : '🌍'}
                                                    </span>
                                                    <div>
                                                        <h4 className="font-semibold">
                                                            {standard?.name || 'Unknown Standard'}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Effective: {format(new Date(compliance.effective_date), 'PP')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={status.color}>
                                                        {status.status}
                                                    </Badge>
                                                    {standard && (
                                                        <Badge variant="outline">
                                                            {standard.country}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm">
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Generate Report
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Malaysia Focus Section */}
            <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                        <Flag className="h-5 w-5" />
                        Malaysia Compliance Focus
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                        Specialized compliance features for Malaysian businesses
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-blue-900">MFRS Requirements</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Annual Financial Statements</li>
                                <li>• Quarterly Reports</li>
                                <li>• 7-Year Data Retention</li>
                                <li>• Audit Trail Compliance</li>
                                <li>• Malaysian Ringgit (MYR) Support</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-blue-900">Tax Compliance</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• SST (Sales & Service Tax)</li>
                                <li>• Corporate Tax Returns</li>
                                <li>• Withholding Tax</li>
                                <li>• Real Property Gains Tax</li>
                                <li>• Stamp Duty Calculations</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
