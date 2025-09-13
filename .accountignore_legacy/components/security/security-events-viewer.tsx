'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    RefreshCw,
    Filter,
    Download
} from 'lucide-react'
import { SecurityService } from '@/lib/security-service'
import { format } from 'date-fns'

interface SecurityEventsViewerProps {
    companyId: string
}

interface SecurityEvent {
    id: string
    event_type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    timestamp: string
    user_id?: string
    ip_address?: string
    user_agent?: string
    resolved: boolean
}

export function SecurityEventsViewer({ companyId }: SecurityEventsViewerProps) {
    const [events, setEvents] = useState<SecurityEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState({
        severity: 'all',
        resolved: 'all',
        search: ''
    })

    const loadEvents = async () => {
        try {
            setLoading(true)
            const result = await SecurityService.getSecurityEvents(companyId, filters)

            if (result.success && result.events) {
                setEvents(result.events)
            } else {
                setError(result.error || 'Failed to load security events')
            }
        } catch (err) {
            setError('An error occurred while loading security events')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadEvents()
    }, [companyId, filters])

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'destructive'
            case 'high': return 'destructive'
            case 'medium': return 'default'
            case 'low': return 'secondary'
            default: return 'secondary'
        }
    }

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical':
            case 'high':
                return <XCircle className="h-4 w-4" />
            case 'medium':
                return <AlertTriangle className="h-4 w-4" />
            case 'low':
                return <CheckCircle className="h-4 w-4" />
            default:
                return <Shield className="h-4 w-4" />
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium">Severity</label>
                            <Select
                                value={filters.severity}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Severities</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Status</label>
                            <Select
                                value={filters.resolved}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, resolved: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="false">Unresolved</SelectItem>
                                    <SelectItem value="true">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Search</label>
                            <Input
                                placeholder="Search events..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Events List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Security Events</CardTitle>
                        <CardDescription>
                            {events.length} events found
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {events.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No security events found
                            </div>
                        ) : (
                            events.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50"
                                >
                                    <div className="flex-shrink-0">
                                        {getSeverityIcon(event.severity)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <h4 className="text-sm font-medium">{event.event_type}</h4>
                                                <Badge variant={getSeverityColor(event.severity)}>
                                                    {event.severity}
                                                </Badge>
                                                {event.resolved && (
                                                    <Badge variant="secondary">Resolved</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm')}
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {event.description}
                                        </p>
                                        {event.user_id && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                User: {event.user_id}
                                            </p>
                                        )}
                                        {event.ip_address && (
                                            <p className="text-xs text-muted-foreground">
                                                IP: {event.ip_address}
                                            </p>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
