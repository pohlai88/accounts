'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    Plus,
    Tag,
    TrendingUp,
    BarChart3,
    Settings,
    ChevronRight,
    Folder,
    FolderOpen
} from 'lucide-react'
import { TagTrackingService, Tag as TagInterface, TagType, TagHierarchy, TagReport } from '@/lib/tag-tracking'

interface TagTrackingProps {
    companyId: string
}

export function TagTracking({ companyId }: TagTrackingProps) {
    const [tags, setTags] = useState<TagInterface[]>([])
    const [hierarchy, setHierarchy] = useState<TagHierarchy[]>([])
    const [reports, setReports] = useState<TagReport[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTagType, setSelectedTagType] = useState<TagType>('Cost Center')
    const [showCreateDialog, setShowCreateDialog] = useState(false)

    useEffect(() => {
        loadTags()
        loadHierarchy()
        loadReports()
    }, [companyId, selectedTagType])

    const loadTags = async () => {
        try {
            const result = await TagTrackingService.getTags(companyId, selectedTagType)
            if (result.success && result.tags) {
                setTags(result.tags)
            }
        } catch (error) {
            console.error('Error loading tags:', error)
        }
    }

    const loadHierarchy = async () => {
        try {
            const result = await TagTrackingService.getTagHierarchy(companyId, selectedTagType)
            if (result.success && result.hierarchy) {
                setHierarchy(result.hierarchy)
            }
        } catch (error) {
            console.error('Error loading hierarchy:', error)
        }
    }

    const loadReports = async () => {
        try {
            const startDate = new Date()
            startDate.setMonth(startDate.getMonth() - 1)
            const endDate = new Date()

            const result = await TagTrackingService.getTagReport(
                companyId,
                selectedTagType,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            )

            if (result.success && result.report) {
                setReports(result.report)
            }
        } catch (error) {
            console.error('Error loading reports:', error)
        }
    }

    const handleCreateTag = async (tagData: Omit<Tag, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const result = await TagTrackingService.createTag(tagData)
            if (result.success) {
                setShowCreateDialog(false)
                loadTags()
                loadHierarchy()
            }
        } catch (error) {
            console.error('Error creating tag:', error)
        }
    }

    const renderTagHierarchy = (hierarchy: TagHierarchy[], level = 0) => {
        return hierarchy.map(tag => (
            <div key={tag.id} className="ml-4">
                <div className="flex items-center space-x-2 py-1">
                    {tag.is_group ? (
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                    ) : (
                        <Tag className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm font-medium">{tag.name}</span>
                    <Badge variant="secondary" className="text-xs">
                        {tag.tag_type}
                    </Badge>
                    {tag.status !== 'Active' && (
                        <Badge variant="outline" className="text-xs">
                            {tag.status}
                        </Badge>
                    )}
                </div>
                {tag.children.length > 0 && renderTagHierarchy(tag.children, level + 1)}
            </div>
        ))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Tag Tracking</h2>
                    <p className="text-muted-foreground">
                        Manage cost centers, projects, and dimensional accounting
                    </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Tag
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <CreateTagForm
                            companyId={companyId}
                            onSuccess={handleCreateTag}
                            onCancel={() => setShowCreateDialog(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="hierarchy" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="hierarchy" className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <Label htmlFor="tag-type">Tag Type</Label>
                        <Select value={selectedTagType} onValueChange={(value: TagType) => setSelectedTagType(value)}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cost Center">Cost Center</SelectItem>
                                <SelectItem value="Project">Project</SelectItem>
                                <SelectItem value="Department">Department</SelectItem>
                                <SelectItem value="Location">Location</SelectItem>
                                <SelectItem value="Product Line">Product Line</SelectItem>
                                <SelectItem value="Customer Segment">Customer Segment</SelectItem>
                                <SelectItem value="Custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Building2 className="h-5 w-5 mr-2" />
                                {selectedTagType} Hierarchy
                            </CardTitle>
                            <CardDescription>
                                Hierarchical view of your {selectedTagType.toLowerCase()} structure
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {hierarchy.length > 0 ? (
                                <div className="space-y-2">
                                    {renderTagHierarchy(hierarchy)}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No {selectedTagType.toLowerCase()}s found</p>
                                    <p className="text-sm">Create your first {selectedTagType.toLowerCase()} to get started</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <BarChart3 className="h-5 w-5 mr-2" />
                                Financial Reports by {selectedTagType}
                            </CardTitle>
                            <CardDescription>
                                Track income and expenses by {selectedTagType.toLowerCase()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reports.length > 0 ? (
                                <div className="space-y-4">
                                    {reports.map(report => (
                                        <div key={report.tag_id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <div>
                                                    <p className="font-medium">{report.tag_name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {report.transaction_count} transactions
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">
                                                    ${Math.abs(report.net_amount).toLocaleString()}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {report.percentage_of_total.toFixed(1)}% of total
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No financial data available</p>
                                    <p className="text-sm">Create transactions with {selectedTagType.toLowerCase()} assignments</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Settings className="h-5 w-5 mr-2" />
                                Tag Settings
                            </CardTitle>
                            <CardDescription>
                                Configure tag tracking preferences and defaults
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label>Default Tag Type for New Transactions</Label>
                                    <Select defaultValue="Cost Center">
                                        <SelectTrigger className="w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cost Center">Cost Center</SelectItem>
                                            <SelectItem value="Project">Project</SelectItem>
                                            <SelectItem value="Department">Department</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Require Tag Assignment</Label>
                                    <Select defaultValue="optional">
                                        <SelectTrigger className="w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="optional">Optional</SelectItem>
                                            <SelectItem value="required">Required</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

interface CreateTagFormProps {
    companyId: string
    onSuccess: (tag: Omit<Tag, 'id' | 'created_at' | 'updated_at'>) => void
    onCancel: () => void
}

function CreateTagForm({ companyId, onSuccess, onCancel }: CreateTagFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        tag_type: 'Cost Center' as TagType,
        parent_id: '',
        description: '',
        color: '#3B82F6',
        is_group: false
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSuccess({
            ...formData,
            company_id: companyId,
            status: 'Active' as const,
            sort_order: 0
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Tag Name</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter tag name"
                    required
                />
            </div>

            <div>
                <Label htmlFor="tag_type">Tag Type</Label>
                <Select
                    value={formData.tag_type}
                    onValueChange={(value: TagType) => setFormData({ ...formData, tag_type: value })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cost Center">Cost Center</SelectItem>
                        <SelectItem value="Project">Project</SelectItem>
                        <SelectItem value="Department">Department</SelectItem>
                        <SelectItem value="Location">Location</SelectItem>
                        <SelectItem value="Product Line">Product Line</SelectItem>
                        <SelectItem value="Customer Segment">Customer Segment</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                />
            </div>

            <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center space-x-2">
                    <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-16 h-10"
                    />
                    <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#3B82F6"
                        className="flex-1"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="is_group"
                    checked={formData.is_group}
                    onChange={(e) => setFormData({ ...formData, is_group: e.target.checked })}
                    className="rounded"
                />
                <Label htmlFor="is_group">Is Group (can contain other tags)</Label>
            </div>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">Create Tag</Button>
            </div>
        </form>
    )
}
