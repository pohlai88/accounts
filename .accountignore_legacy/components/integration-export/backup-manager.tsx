// =====================================================
// Phase 8: Backup Manager Component
// Professional backup and restore functionality
// =====================================================

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Database,
    Download,
    Upload,
    Shield,
    Archive,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Trash2,
    RefreshCw,
    Settings,
    FileText,
    Lock,
    Unlock
} from 'lucide-react';
import { BackupService, BackupOptions, BackupResult, BackupJob } from '@/lib/backup-service';
import { format } from 'date-fns';

interface BackupManagerProps {
    companyId: string;
    userId: string;
}

export function BackupManager({ companyId, userId }: BackupManagerProps) {
    const [backupService] = useState(new BackupService(companyId, userId));
    const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [backupProgress, setBackupProgress] = useState(0);
    const [backupOptions, setBackupOptions] = useState<BackupOptions>({
        type: 'full',
        tables: [
            'companies',
            'accounts',
            'gl_entries',
            'customers',
            'vendors',
            'items',
            'invoices',
            'payments'
        ],
        includeMetadata: true,
        compression: true,
        encryption: false
    });
    const [restoreOptions, setRestoreOptions] = useState({
        backupId: '',
        password: '',
        mergeMode: 'replace' as 'replace' | 'merge' | 'skip_existing',
        validateData: true
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Load backup jobs on component mount
    useEffect(() => {
        loadBackupJobs();
    }, []);

    const loadBackupJobs = async () => {
        try {
            const jobs = await backupService.getBackupJobs();
            setBackupJobs(jobs);
        } catch (error) {
            console.error('Failed to load backup jobs:', error);
        }
    };

    const handleCreateBackup = async () => {
        try {
            setIsBackingUp(true);
            setBackupProgress(0);
            setError(null);
            setSuccess(null);

            // Simulate progress
            const progressInterval = setInterval(() => {
                setBackupProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const result = await backupService.createBackup(backupOptions);

            clearInterval(progressInterval);
            setBackupProgress(100);

            if (result.success) {
                setSuccess(`Backup created successfully! Backup ID: ${result.backupId}`);
                await loadBackupJobs();
            } else {
                setError(result.error || 'Backup failed');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Backup failed');
        } finally {
            setIsBackingUp(false);
            setBackupProgress(0);
        }
    };

    const handleRestore = async () => {
        if (!restoreOptions.backupId) {
            setError('Please select a backup to restore');
            return;
        }

        try {
            setIsRestoring(true);
            setError(null);
            setSuccess(null);

            const result = await backupService.restoreBackup(restoreOptions);

            if (result.success) {
                setSuccess(`Restore completed successfully! Restored ${result.restoredTables.length} tables`);
                await loadBackupJobs();
            } else {
                setError(result.errors?.join(', ') || 'Restore failed');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Restore failed');
        } finally {
            setIsRestoring(false);
        }
    };

    const handleDownloadBackup = async (backupId: string) => {
        try {
            const downloadUrl = await backupService.getBackupDownloadUrl(backupId);
            window.open(downloadUrl, '_blank');
        } catch (error) {
            setError('Failed to generate download URL');
        }
    };

    const handleDeleteBackup = async (backupId: string) => {
        if (!confirm('Are you sure you want to delete this backup?')) {
            return;
        }

        try {
            await backupService.deleteBackup(backupId);
            setSuccess('Backup deleted successfully');
            await loadBackupJobs();
        } catch (error) {
            setError('Failed to delete backup');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'processing':
                return <Clock className="h-4 w-4 text-blue-500" />;
            default:
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            completed: 'default',
            failed: 'destructive',
            processing: 'secondary',
            pending: 'outline'
        } as const;

        return (
            <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (date: Date) => {
        return format(date, 'MMM dd, yyyy HH:mm');
    };

    const availableTables = [
        'companies',
        'accounts',
        'gl_entries',
        'customers',
        'vendors',
        'items',
        'invoices',
        'payments',
        'recurring_templates',
        'budgets',
        'projects',
        'fixed_assets',
        'depreciation_schedules',
        'tax_rates',
        'exchange_rates'
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Backup Manager</h2>
                    <p className="text-muted-foreground">
                        Create backups and restore your data with enterprise-grade security
                    </p>
                </div>
                <Button onClick={loadBackupJobs} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Alerts */}
            {error && (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="backup" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="backup">Create Backup</TabsTrigger>
                    <TabsTrigger value="restore">Restore</TabsTrigger>
                    <TabsTrigger value="history">Backup History</TabsTrigger>
                </TabsList>

                {/* Create Backup Tab */}
                <TabsContent value="backup" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Backup Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Backup Configuration</CardTitle>
                                <CardDescription>
                                    Configure your backup settings and data selection
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Backup Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="backupType">Backup Type</Label>
                                    <select
                                        id="backupType"
                                        value={backupOptions.type}
                                        onChange={(e) => setBackupOptions(prev => ({ ...prev, type: e.target.value as any }))}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="full">Full Backup</option>
                                        <option value="incremental">Incremental Backup</option>
                                        <option value="differential">Differential Backup</option>
                                    </select>
                                </div>

                                {/* Tables Selection */}
                                <div className="space-y-2">
                                    <Label>Tables to Include</Label>
                                    <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                                        {availableTables.map((table) => (
                                            <div key={table} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={table}
                                                    checked={backupOptions.tables.includes(table)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setBackupOptions(prev => ({
                                                                ...prev,
                                                                tables: [...prev.tables, table]
                                                            }));
                                                        } else {
                                                            setBackupOptions(prev => ({
                                                                ...prev,
                                                                tables: prev.tables.filter(t => t !== table)
                                                            }));
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={table} className="text-sm">
                                                    {table}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="includeMetadata"
                                            checked={backupOptions.includeMetadata}
                                            onCheckedChange={(checked) => setBackupOptions(prev => ({ ...prev, includeMetadata: !!checked }))}
                                        />
                                        <Label htmlFor="includeMetadata">Include Metadata</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="compression"
                                            checked={backupOptions.compression}
                                            onCheckedChange={(checked) => setBackupOptions(prev => ({ ...prev, compression: !!checked }))}
                                        />
                                        <Label htmlFor="compression">Enable Compression</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="encryption"
                                            checked={backupOptions.encryption}
                                            onCheckedChange={(checked) => setBackupOptions(prev => ({ ...prev, encryption: !!checked }))}
                                        />
                                        <Label htmlFor="encryption">Enable Encryption</Label>
                                    </div>
                                </div>

                                {/* Create Backup Button */}
                                <Button
                                    onClick={handleCreateBackup}
                                    disabled={isBackingUp}
                                    className="w-full"
                                >
                                    {isBackingUp ? (
                                        <>
                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                            Creating Backup...
                                        </>
                                    ) : (
                                        <>
                                            <Database className="h-4 w-4 mr-2" />
                                            Create Backup
                                        </>
                                    )}
                                </Button>

                                {/* Progress Bar */}
                                {isBackingUp && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Backup Progress</span>
                                            <span>{backupProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${backupProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Backup Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Backup Information</CardTitle>
                                <CardDescription>
                                    Details about your backup configuration
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Type:</span>
                                        <span className="text-sm font-medium">{backupOptions.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Tables:</span>
                                        <span className="text-sm font-medium">{backupOptions.tables.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Metadata:</span>
                                        <span className="text-sm font-medium">
                                            {backupOptions.includeMetadata ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Compression:</span>
                                        <span className="text-sm font-medium">
                                            {backupOptions.compression ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Encryption:</span>
                                        <span className="text-sm font-medium">
                                            {backupOptions.encryption ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium mb-2">Selected Tables:</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {backupOptions.tables.map((table) => (
                                            <Badge key={table} variant="outline" className="text-xs">
                                                {table}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Restore Tab */}
                <TabsContent value="restore" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Restore from Backup</CardTitle>
                            <CardDescription>
                                Restore your data from a previous backup
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Backup Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="backupSelect">Select Backup</Label>
                                <select
                                    id="backupSelect"
                                    value={restoreOptions.backupId}
                                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, backupId: e.target.value }))}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">Select a backup...</option>
                                    {backupJobs
                                        .filter(job => job.status === 'completed')
                                        .map((job) => (
                                            <option key={job.id} value={job.id}>
                                                {job.backupType} - {formatDate(job.createdAt)} - {formatFileSize(job.fileSizeBytes || 0)}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Password for Encrypted Backups */}
                            {restoreOptions.backupId && (
                                <div className="space-y-2">
                                    <Label htmlFor="restorePassword">Password (if encrypted)</Label>
                                    <div className="relative">
                                        <Input
                                            id="restorePassword"
                                            type={showPassword ? 'text' : 'password'}
                                            value={restoreOptions.password}
                                            onChange={(e) => setRestoreOptions(prev => ({ ...prev, password: e.target.value }))}
                                            placeholder="Enter backup password"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <Unlock className="h-4 w-4" />
                                            ) : (
                                                <Lock className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Merge Mode */}
                            <div className="space-y-2">
                                <Label htmlFor="mergeMode">Merge Mode</Label>
                                <select
                                    id="mergeMode"
                                    value={restoreOptions.mergeMode}
                                    onChange={(e) => setRestoreOptions(prev => ({ ...prev, mergeMode: e.target.value as any }))}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="replace">Replace existing data</option>
                                    <option value="merge">Merge with existing data</option>
                                    <option value="skip_existing">Skip existing records</option>
                                </select>
                            </div>

                            {/* Validation Option */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="validateData"
                                    checked={restoreOptions.validateData}
                                    onCheckedChange={(checked) => setRestoreOptions(prev => ({ ...prev, validateData: !!checked }))}
                                />
                                <Label htmlFor="validateData">Validate data before restore</Label>
                            </div>

                            {/* Restore Button */}
                            <Button
                                onClick={handleRestore}
                                disabled={isRestoring || !restoreOptions.backupId}
                                className="w-full"
                            >
                                {isRestoring ? (
                                    <>
                                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                                        Restoring...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Restore Backup
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Backup History Tab */}
                <TabsContent value="history" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Backup History</CardTitle>
                            <CardDescription>
                                View and manage your backup files
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {backupJobs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No backup jobs found
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {backupJobs.map((job) => (
                                        <div
                                            key={job.id}
                                            className="flex items-center justify-between p-4 border rounded-lg"
                                        >
                                            <div className="flex items-center space-x-4">
                                                {getStatusIcon(job.status)}
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium">
                                                            {job.backupType.charAt(0).toUpperCase() + job.backupType.slice(1)} Backup
                                                        </span>
                                                        {getStatusBadge(job.status)}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {formatDate(job.createdAt)} •
                                                        {job.fileSizeBytes && ` ${formatFileSize(job.fileSizeBytes)}`}
                                                        {job.compressionRatio && ` • ${(job.compressionRatio * 100).toFixed(1)}% compressed`}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Tables: {job.tablesIncluded.join(', ')}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Records: {Object.entries(job.recordsCount).map(([table, count]) => `${table}: ${count}`).join(', ')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {job.status === 'completed' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleDownloadBackup(job.id)}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteBackup(job.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
