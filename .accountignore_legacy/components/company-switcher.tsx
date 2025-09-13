'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {
    Building2,
    ChevronDown,
    Plus,
    Settings,
    Users,
    Globe,
    TrendingUp
} from 'lucide-react'
import { Company } from '@/lib/supabase'
import { CompanyHierarchyService } from '@/lib/company-hierarchy'

interface CompanySwitcherProps {
    currentCompanyId: string
    onCompanyChange: (companyId: string) => void
}

export function CompanySwitcher({ currentCompanyId, onCompanyChange }: CompanySwitcherProps) {
    const [companies, setCompanies] = useState<Company[]>([])
    const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
    const [loading, setLoading] = useState(true)
    const [showCreateDialog, setShowCreateDialog] = useState(false)

    useEffect(() => {
        loadCompanies()
    }, [])

    useEffect(() => {
        if (companies.length > 0) {
            const current = companies.find(c => c.id === currentCompanyId)
            setCurrentCompany(current || null)
        }
    }, [companies, currentCompanyId])

    const loadCompanies = async () => {
        try {
            const result = await CompanyHierarchyService.getAllCompanies()
            if (result.success && result.companies) {
                setCompanies(result.companies)
            }
        } catch (error) {
            console.error('Error loading companies:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCompanyChange = (companyId: string) => {
        onCompanyChange(companyId)
    }

    const handleCreateCompany = async (companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            // In a real app, this would create a new company
            console.log('Creating company:', companyData)
            setShowCreateDialog(false)
            loadCompanies()
        } catch (error) {
            console.error('Error creating company:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">Loading companies...</span>
            </div>
        )
    }

    return (
        <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <Select value={currentCompanyId} onValueChange={handleCompanyChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                    {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                            <div className="flex items-center space-x-2">
                                <Building2 className="h-4 w-4" />
                                <span>{company.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <CreateCompanyForm
                        onSuccess={handleCreateCompany}
                        onCancel={() => setShowCreateDialog(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}

interface CreateCompanyFormProps {
    onSuccess: (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => void
    onCancel: () => void
}

function CreateCompanyForm({ onSuccess, onCancel }: CreateCompanyFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        default_currency: 'USD',
        fiscal_year_start: '2024-01-01',
        country: '',
        is_active: true
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSuccess(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Company Name
                </label>
                <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter company name"
                    required
                />
            </div>

            <div>
                <label htmlFor="default_currency" className="block text-sm font-medium mb-1">
                    Default Currency
                </label>
                <Select
                    value={formData.default_currency}
                    onValueChange={(value) => setFormData({ ...formData, default_currency: value })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <label htmlFor="fiscal_year_start" className="block text-sm font-medium mb-1">
                    Fiscal Year Start
                </label>
                <input
                    id="fiscal_year_start"
                    type="date"
                    value={formData.fiscal_year_start}
                    onChange={(e) => setFormData({ ...formData, fiscal_year_start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>

            <div>
                <label htmlFor="country" className="block text-sm font-medium mb-1">
                    Country
                </label>
                <input
                    id="country"
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter country"
                />
            </div>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">Create Company</Button>
            </div>
        </form>
    )
}

interface CompanyInfoProps {
    company: Company
}

export function CompanyInfo({ company }: CompanyInfoProps) {
    return (
        <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {company.default_currency} • {company.country || 'No country set'}
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                    <Globe className="h-4 w-4" />
                    <span>{company.default_currency}</span>
                </div>
                <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>FY {company.fiscal_year_start}</span>
                </div>
            </div>
        </div>
    )
}
