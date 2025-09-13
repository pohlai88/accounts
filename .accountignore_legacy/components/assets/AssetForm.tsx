/**
 * Asset Form - Create/Edit Fixed Assets
 * Complete asset management with ERPNext feature parity
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { AlertTriangle, Building, Calculator, Shield, FileText, Save, X } from 'lucide-react'
import {
    FixedAssetsService,
    CreateAssetInput,
    Asset,
    AssetCategory,
    AssetLocation,
    DepreciationMethod,
    AssetOwner,
    AssetCondition
} from '@/lib/fixed-assets-service'

interface AssetFormProps {
    assetId?: string
    onSave?: (asset: Asset) => void
    onCancel?: () => void
}

export default function AssetForm({ assetId, onSave, onCancel }: AssetFormProps) {
    const [formData, setFormData] = useState<CreateAssetInput>({
        asset_name: '',
        company_id: 'current-company-id', // Get from context
        asset_category_id: '',
        gross_purchase_amount: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        calculate_depreciation: true,
        asset_owner: 'Company' as AssetOwner,
        asset_condition: 'Excellent' as AssetCondition,
        expected_value_after_useful_life: 0,
        opening_accumulated_depreciation: 0,
        number_of_depreciations_booked: 0,
        is_existing_asset: false
    })

    const [categories, setCategories] = useState<AssetCategory[]>([])
    const [locations, setLocations] = useState<AssetLocation[]>([])
    const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        loadFormData()
        if (assetId) {
            loadAsset(assetId)
        }
    }, [assetId])

    useEffect(() => {
        // Update depreciation settings when category changes
        if (selectedCategory && formData.asset_category_id === selectedCategory.id) {
            setFormData(prev => ({
                ...prev,
                depreciation_method: prev.depreciation_method || selectedCategory.depreciation_method,
                total_number_of_depreciations: prev.total_number_of_depreciations || selectedCategory.total_number_of_depreciations,
                frequency_of_depreciation: prev.frequency_of_depreciation || selectedCategory.frequency_of_depreciation
            }))
        }
    }, [selectedCategory, formData.asset_category_id])

    const loadFormData = async () => {
        try {
            setLoading(true)

            const [categoriesResult, locationsResult] = await Promise.all([
                FixedAssetsService.getAssetCategories(formData.company_id),
                FixedAssetsService.getAssetLocations(formData.company_id)
            ])

            if (categoriesResult.success && categoriesResult.data) {
                setCategories(categoriesResult.data)
            }

            if (locationsResult.success && locationsResult.data) {
                setLocations(locationsResult.data)
            }

        } catch (error) {
            console.error('Error loading form data:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadAsset = async (id: string) => {
        try {
            const result = await FixedAssetsService.getAsset(id)
            if (result.success && result.data) {
                const asset = result.data
                setFormData({
                    asset_name: asset.asset_name,
                    company_id: asset.company_id,
                    asset_category_id: asset.asset_category_id,
                    item_code: asset.item_code,
                    asset_owner: asset.asset_owner,
                    owner_name: asset.owner_name,
                    custodian: asset.custodian,
                    location_id: asset.location_id,
                    department: asset.department,
                    cost_center: asset.cost_center,
                    project: asset.project,
                    gross_purchase_amount: asset.gross_purchase_amount,
                    purchase_date: asset.purchase_date,
                    available_for_use_date: asset.available_for_use_date,
                    purchase_receipt_amount: asset.purchase_receipt_amount,
                    purchase_invoice: asset.purchase_invoice,
                    supplier_id: asset.supplier_id,
                    calculate_depreciation: asset.calculate_depreciation,
                    is_existing_asset: asset.is_existing_asset,
                    depreciation_method: asset.depreciation_method,
                    total_number_of_depreciations: asset.total_number_of_depreciations,
                    frequency_of_depreciation: asset.frequency_of_depreciation,
                    expected_value_after_useful_life: asset.expected_value_after_useful_life,
                    opening_accumulated_depreciation: asset.opening_accumulated_depreciation,
                    number_of_depreciations_booked: asset.number_of_depreciations_booked,
                    asset_condition: asset.asset_condition,
                    warranty_expiry_date: asset.warranty_expiry_date,
                    insured_value: asset.insured_value,
                    insurance_start_date: asset.insurance_start_date,
                    insurance_end_date: asset.insurance_end_date,
                    policy_number: asset.policy_number,
                    manufacturer: asset.manufacturer,
                    model: asset.model,
                    serial_no: asset.serial_no,
                    asset_description: asset.asset_description
                })
            }
        } catch (error) {
            console.error('Error loading asset:', error)
        }
    }

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.asset_name.trim()) {
            newErrors.asset_name = 'Asset name is required'
        }

        if (!formData.asset_category_id) {
            newErrors.asset_category_id = 'Asset category is required'
        }

        if (!formData.purchase_date) {
            newErrors.purchase_date = 'Purchase date is required'
        }

        if (formData.gross_purchase_amount <= 0) {
            newErrors.gross_purchase_amount = 'Purchase amount must be greater than 0'
        }

        if (formData.calculate_depreciation) {
            if (!formData.total_number_of_depreciations || formData.total_number_of_depreciations <= 0) {
                newErrors.total_number_of_depreciations = 'Total number of depreciations must be greater than 0'
            }

            if (!formData.frequency_of_depreciation || formData.frequency_of_depreciation <= 0) {
                newErrors.frequency_of_depreciation = 'Frequency of depreciation must be greater than 0'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSaving(true)

            let result
            if (assetId) {
                // Update logic would go here
                // result = await FixedAssetsService.updateAsset(assetId, formData)
            } else {
                result = await FixedAssetsService.createAsset(formData)
            }

            if (result?.success && result.data) {
                if (onSave) {
                    onSave(result.data)
                }
            } else {
                console.error('Error saving asset:', result?.error)
            }

        } catch (error) {
            console.error('Error saving asset:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleFieldChange = (field: keyof CreateAssetInput, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))

        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }))
        }

        // Update selected category when category changes
        if (field === 'asset_category_id') {
            const category = categories.find(c => c.id === value)
            setSelectedCategory(category || null)
        }
    }

    const calculateDepreciationAmount = () => {
        if (!formData.calculate_depreciation || !formData.total_number_of_depreciations) {
            return 0
        }

        const depreciableAmount = formData.gross_purchase_amount - (formData.expected_value_after_useful_life || 0)
        return depreciableAmount / formData.total_number_of_depreciations
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading asset form...</p>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {assetId ? 'Edit Asset' : 'Create New Asset'}
                    </h2>
                    <p className="text-muted-foreground">
                        {assetId ? 'Update asset information and settings' : 'Add a new fixed asset to your inventory'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Asset'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="financial">Financial Details</TabsTrigger>
                    <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
                    <TabsTrigger value="additional">Additional Info</TabsTrigger>
                </TabsList>

                {/* Basic Information */}
                <TabsContent value="basic" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="w-5 h-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="asset_name" className="required">Asset Name</Label>
                                    <Input
                                        id="asset_name"
                                        value={formData.asset_name}
                                        onChange={(e) => handleFieldChange('asset_name', e.target.value)}
                                        placeholder="Enter asset name"
                                        className={errors.asset_name ? 'border-red-500' : ''}
                                    />
                                    {errors.asset_name && (
                                        <p className="text-sm text-red-500 mt-1">{errors.asset_name}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="asset_category_id" className="required">Asset Category</Label>
                                    <Select value={formData.asset_category_id} onValueChange={(value) => handleFieldChange('asset_category_id', value)}>
                                        <SelectTrigger className={errors.asset_category_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.category_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.asset_category_id && (
                                        <p className="text-sm text-red-500 mt-1">{errors.asset_category_id}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="item_code">Item Code</Label>
                                    <Input
                                        id="item_code"
                                        value={formData.item_code || ''}
                                        onChange={(e) => handleFieldChange('item_code', e.target.value)}
                                        placeholder="Enter item code"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="serial_no">Serial Number</Label>
                                    <Input
                                        id="serial_no"
                                        value={formData.serial_no || ''}
                                        onChange={(e) => handleFieldChange('serial_no', e.target.value)}
                                        placeholder="Enter serial number"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="asset_owner">Asset Owner</Label>
                                    <Select value={formData.asset_owner} onValueChange={(value) => handleFieldChange('asset_owner', value as AssetOwner)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Company">Company</SelectItem>
                                            <SelectItem value="Supplier">Supplier</SelectItem>
                                            <SelectItem value="Customer">Customer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="asset_condition">Asset Condition</Label>
                                    <Select value={formData.asset_condition} onValueChange={(value) => handleFieldChange('asset_condition', value as AssetCondition)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Excellent">Excellent</SelectItem>
                                            <SelectItem value="Good">Good</SelectItem>
                                            <SelectItem value="Fair">Fair</SelectItem>
                                            <SelectItem value="Poor">Poor</SelectItem>
                                            <SelectItem value="Under Repair">Under Repair</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="location_id">Location</Label>
                                    <Select value={formData.location_id || ''} onValueChange={(value) => handleFieldChange('location_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map((location) => (
                                                <SelectItem key={location.id} value={location.id}>
                                                    {location.location_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="custodian">Custodian</Label>
                                    <Input
                                        id="custodian"
                                        value={formData.custodian || ''}
                                        onChange={(e) => handleFieldChange('custodian', e.target.value)}
                                        placeholder="Person responsible for asset"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="asset_description">Description</Label>
                                <Textarea
                                    id="asset_description"
                                    value={formData.asset_description || ''}
                                    onChange={(e) => handleFieldChange('asset_description', e.target.value)}
                                    placeholder="Enter asset description"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Financial Details */}
                <TabsContent value="financial" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Financial Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="gross_purchase_amount" className="required">Gross Purchase Amount</Label>
                                    <Input
                                        id="gross_purchase_amount"
                                        type="number"
                                        value={formData.gross_purchase_amount}
                                        onChange={(e) => handleFieldChange('gross_purchase_amount', parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        className={errors.gross_purchase_amount ? 'border-red-500' : ''}
                                    />
                                    {errors.gross_purchase_amount && (
                                        <p className="text-sm text-red-500 mt-1">{errors.gross_purchase_amount}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="purchase_date" className="required">Purchase Date</Label>
                                    <Input
                                        id="purchase_date"
                                        type="date"
                                        value={formData.purchase_date}
                                        onChange={(e) => handleFieldChange('purchase_date', e.target.value)}
                                        className={errors.purchase_date ? 'border-red-500' : ''}
                                    />
                                    {errors.purchase_date && (
                                        <p className="text-sm text-red-500 mt-1">{errors.purchase_date}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="available_for_use_date">Available for Use Date</Label>
                                    <Input
                                        id="available_for_use_date"
                                        type="date"
                                        value={formData.available_for_use_date || ''}
                                        onChange={(e) => handleFieldChange('available_for_use_date', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="purchase_receipt_amount">Purchase Receipt Amount</Label>
                                    <Input
                                        id="purchase_receipt_amount"
                                        type="number"
                                        value={formData.purchase_receipt_amount || 0}
                                        onChange={(e) => handleFieldChange('purchase_receipt_amount', parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="purchase_invoice">Purchase Invoice</Label>
                                    <Input
                                        id="purchase_invoice"
                                        value={formData.purchase_invoice || ''}
                                        onChange={(e) => handleFieldChange('purchase_invoice', e.target.value)}
                                        placeholder="Invoice reference"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="warranty_expiry_date">Warranty Expiry Date</Label>
                                    <Input
                                        id="warranty_expiry_date"
                                        type="date"
                                        value={formData.warranty_expiry_date || ''}
                                        onChange={(e) => handleFieldChange('warranty_expiry_date', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Depreciation */}
                <TabsContent value="depreciation" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="w-5 h-5" />
                                Depreciation Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2 mb-4">
                                <Checkbox
                                    id="calculate_depreciation"
                                    checked={formData.calculate_depreciation}
                                    onCheckedChange={(checked) => handleFieldChange('calculate_depreciation', checked)}
                                />
                                <Label htmlFor="calculate_depreciation">Calculate Depreciation</Label>
                            </div>

                            {formData.calculate_depreciation && (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_existing_asset"
                                            checked={formData.is_existing_asset}
                                            onCheckedChange={(checked) => handleFieldChange('is_existing_asset', checked)}
                                        />
                                        <Label htmlFor="is_existing_asset">Is Existing Asset</Label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="depreciation_method">Depreciation Method</Label>
                                            <Select
                                                value={formData.depreciation_method || ''}
                                                onValueChange={(value) => handleFieldChange('depreciation_method', value as DepreciationMethod)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Straight Line">Straight Line</SelectItem>
                                                    <SelectItem value="Double Declining Balance">Double Declining Balance</SelectItem>
                                                    <SelectItem value="Written Down Value">Written Down Value</SelectItem>
                                                    <SelectItem value="Sum of Years Digits">Sum of Years Digits</SelectItem>
                                                    <SelectItem value="Manual">Manual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="total_number_of_depreciations">Total Number of Depreciations</Label>
                                            <Input
                                                id="total_number_of_depreciations"
                                                type="number"
                                                value={formData.total_number_of_depreciations || ''}
                                                onChange={(e) => handleFieldChange('total_number_of_depreciations', parseInt(e.target.value) || 0)}
                                                placeholder="60 (for 5 years monthly)"
                                                min="1"
                                                className={errors.total_number_of_depreciations ? 'border-red-500' : ''}
                                            />
                                            {errors.total_number_of_depreciations && (
                                                <p className="text-sm text-red-500 mt-1">{errors.total_number_of_depreciations}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="frequency_of_depreciation">Frequency of Depreciation (per year)</Label>
                                            <Select
                                                value={formData.frequency_of_depreciation?.toString() || ''}
                                                onValueChange={(value) => handleFieldChange('frequency_of_depreciation', parseInt(value))}
                                            >
                                                <SelectTrigger className={errors.frequency_of_depreciation ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select frequency" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">Yearly</SelectItem>
                                                    <SelectItem value="4">Quarterly</SelectItem>
                                                    <SelectItem value="12">Monthly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.frequency_of_depreciation && (
                                                <p className="text-sm text-red-500 mt-1">{errors.frequency_of_depreciation}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="expected_value_after_useful_life">Expected Value After Useful Life</Label>
                                            <Input
                                                id="expected_value_after_useful_life"
                                                type="number"
                                                value={formData.expected_value_after_useful_life}
                                                onChange={(e) => handleFieldChange('expected_value_after_useful_life', parseFloat(e.target.value) || 0)}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    {formData.is_existing_asset && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                            <div>
                                                <Label htmlFor="opening_accumulated_depreciation">Opening Accumulated Depreciation</Label>
                                                <Input
                                                    id="opening_accumulated_depreciation"
                                                    type="number"
                                                    value={formData.opening_accumulated_depreciation}
                                                    onChange={(e) => handleFieldChange('opening_accumulated_depreciation', parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="number_of_depreciations_booked">Number of Depreciations Booked</Label>
                                                <Input
                                                    id="number_of_depreciations_booked"
                                                    type="number"
                                                    value={formData.number_of_depreciations_booked}
                                                    onChange={(e) => handleFieldChange('number_of_depreciations_booked', parseInt(e.target.value) || 0)}
                                                    placeholder="0"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Depreciation Preview */}
                                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                        <h4 className="font-semibold mb-2">Depreciation Preview</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Depreciable Amount:</span>
                                                <span className="font-medium ml-2">
                                                    ${((formData.gross_purchase_amount || 0) - (formData.expected_value_after_useful_life || 0)).toLocaleString()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Depreciation per Period:</span>
                                                <span className="font-medium ml-2">
                                                    ${calculateDepreciationAmount().toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Additional Information */}
                <TabsContent value="additional" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Additional Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="manufacturer">Manufacturer</Label>
                                    <Input
                                        id="manufacturer"
                                        value={formData.manufacturer || ''}
                                        onChange={(e) => handleFieldChange('manufacturer', e.target.value)}
                                        placeholder="Enter manufacturer"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="model">Model</Label>
                                    <Input
                                        id="model"
                                        value={formData.model || ''}
                                        onChange={(e) => handleFieldChange('model', e.target.value)}
                                        placeholder="Enter model"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="insured_value">Insured Value</Label>
                                    <Input
                                        id="insured_value"
                                        type="number"
                                        value={formData.insured_value || 0}
                                        onChange={(e) => handleFieldChange('insured_value', parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="policy_number">Insurance Policy Number</Label>
                                    <Input
                                        id="policy_number"
                                        value={formData.policy_number || ''}
                                        onChange={(e) => handleFieldChange('policy_number', e.target.value)}
                                        placeholder="Enter policy number"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="insurance_start_date">Insurance Start Date</Label>
                                    <Input
                                        id="insurance_start_date"
                                        type="date"
                                        value={formData.insurance_start_date || ''}
                                        onChange={(e) => handleFieldChange('insurance_start_date', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="insurance_end_date">Insurance End Date</Label>
                                    <Input
                                        id="insurance_end_date"
                                        type="date"
                                        value={formData.insurance_end_date || ''}
                                        onChange={(e) => handleFieldChange('insurance_end_date', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        value={formData.department || ''}
                                        onChange={(e) => handleFieldChange('department', e.target.value)}
                                        placeholder="Enter department"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="cost_center">Cost Center</Label>
                                    <Input
                                        id="cost_center"
                                        value={formData.cost_center || ''}
                                        onChange={(e) => handleFieldChange('cost_center', e.target.value)}
                                        placeholder="Enter cost center"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </form>
    )
}
