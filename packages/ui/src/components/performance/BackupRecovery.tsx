import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card';
import { Button } from '../../Button';
import { Badge } from '../../Badge';
import { Alert } from '../../Alert';
import { cn } from '../../utils';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Database,
    Download,
    HardDrive,
    RefreshCw,
    RotateCcw,
    Server,
    Shield,
    Upload,
    Zap,
    Calendar,
    FileText,
    Settings,
    Trash2
} from 'lucide-react';

interface BackupJob {
    id: string;
    name: string;
    type: 'full' | 'incremental' | 'differential';
    status: 'running' | 'completed' | 'failed' | 'scheduled';
    size: number;
    duration: number;
    createdAt: Date;
    completedAt?: Date;
    nextRun?: Date;
    retentionDays: number;
    location: string;
    encryption: boolean;
}

interface RecoveryPoint {
    id: string;
    name: string;
    timestamp: Date;
    size: number;
    type: 'full' | 'incremental' | 'differential';
    status: 'available' | 'corrupted' | 'expired';
    location: string;
    encryption: boolean;
}

interface DisasterRecoveryPlan {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'testing';
    rto: number; // Recovery Time Objective (minutes)
    rpo: number; // Recovery Point Objective (minutes)
    lastTested: Date;
    nextTest: Date;
    procedures: string[];
}

interface BackupRecoveryProps {
    backupJobs: BackupJob[];
    recoveryPoints: RecoveryPoint[];
    disasterRecoveryPlans: DisasterRecoveryPlan[];
    onRunBackup: (jobId: string) => void;
    onRestoreFromBackup: (recoveryPointId: string) => void;
    onTestDisasterRecovery: (planId: string) => void;
    onCreateBackupJob: () => void;
    onDeleteBackup: (backupId: string) => void;
}

export const BackupRecovery: React.FC<BackupRecoveryProps> = ({
    backupJobs,
    recoveryPoints,
    disasterRecoveryPlans,
    onRunBackup,
    onRestoreFromBackup,
    onTestDisasterRecovery,
    onCreateBackupJob,
    onDeleteBackup,
}) => {
    const [selectedBackupType, setSelectedBackupType] = useState<string>('all');
    const [selectedRecoveryStatus, setSelectedRecoveryStatus] = useState<string>('all');

    const getBackupStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10';
            case 'running': return 'text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10';
            case 'failed': return 'text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10';
            case 'scheduled': return 'text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10';
            default: return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
        }
    };

    const getRecoveryStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10';
            case 'corrupted': return 'text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10';
            case 'expired': return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
            default: return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
        }
    };

    const getPlanStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10';
            case 'testing': return 'text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10';
            case 'inactive': return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
            default: return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
        }
    };

    const formatFileSize = (bytes: number) => {
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    const filteredBackupJobs = selectedBackupType === 'all'
        ? backupJobs
        : backupJobs.filter(job => job.type === selectedBackupType);

    const filteredRecoveryPoints = selectedRecoveryStatus === 'all'
        ? recoveryPoints
        : recoveryPoints.filter(point => point.status === selectedRecoveryStatus);

    const totalBackups = backupJobs.length;
    const successfulBackups = backupJobs.filter(job => job.status === 'completed').length;
    const failedBackups = backupJobs.filter(job => job.status === 'failed').length;
    const runningBackups = backupJobs.filter(job => job.status === 'running').length;
    const totalRecoveryPoints = recoveryPoints.length;
    const availableRecoveryPoints = recoveryPoints.filter(point => point.status === 'available').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">Backup & Disaster Recovery</h2>
                    <p className="text-[var(--sys-text-secondary)] mt-1">
                        Comprehensive backup management and disaster recovery planning
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        onClick={onCreateBackupJob}
                        className="flex items-center space-x-2"
                    >
                        <Upload className="h-4 w-4" />
                        <span>Create Backup Job</span>
                    </Button>
                </div>
            </div>

            {/* Backup Alerts */}
            {failedBackups > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <div>
                        <h4 className="font-medium">Backup Failures Detected</h4>
                        <p className="text-sm">
                            {failedBackups} backup jobs have failed and require immediate attention.
                        </p>
                    </div>
                </Alert>
            )}

            {/* Backup Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Total Backups</div>
                            <Database className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {totalBackups}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            {successfulBackups} successful
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Running</div>
                            <RefreshCw className="h-4 w-4 text-[var(--sys-status-info)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-status-info)]">
                            {runningBackups}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            Currently processing
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Failed</div>
                            <AlertTriangle className="h-4 w-4 text-[var(--sys-status-error)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-status-error)]">
                            {failedBackups}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            Need attention
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Recovery Points</div>
                            <Shield className="h-4 w-4 text-[var(--sys-status-success)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {totalRecoveryPoints}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            {availableRecoveryPoints} available
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Backup Jobs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Database className="h-5 w-5" />
                        <span>Backup Jobs</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Backup Filter */}
                        <div className="flex items-center space-x-4">
                            <select
                                value={selectedBackupType}
                                onChange={(e) => setSelectedBackupType(e.target.value)}
                                className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                aria-label="Filter by backup type"
                            >
                                <option value="all">All Types</option>
                                <option value="full">Full Backup</option>
                                <option value="incremental">Incremental</option>
                                <option value="differential">Differential</option>
                            </select>
                        </div>

                        {/* Backup Jobs List */}
                        <div className="space-y-3">
                            {filteredBackupJobs.map((job) => (
                                <div key={job.id} className="p-4 border border-[var(--sys-border-hairline)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center space-x-2">
                                                <Database className="h-4 w-4" />
                                                <div>
                                                    <h4 className="font-medium text-[var(--sys-text-primary)]">{job.name}</h4>
                                                    <p className="text-sm text-[var(--sys-text-secondary)]">
                                                        {job.type.charAt(0).toUpperCase() + job.type.slice(1)} backup |
                                                        Size: {formatFileSize(job.size)} |
                                                        Duration: {formatDuration(job.duration)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getBackupStatusColor(job.status))}>
                                                {job.status.toUpperCase()}
                                            </div>
                                            {job.encryption && (
                                                <Badge variant="outline" className="text-xs">
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    Encrypted
                                                </Badge>
                                            )}
                                            {job.status === 'scheduled' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onRunBackup(job.id)}
                                                    className="flex items-center space-x-1"
                                                >
                                                    <RefreshCw className="h-3 w-3" />
                                                    <span>Run Now</span>
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onDeleteBackup(job.id)}
                                                className="text-[var(--sys-status-error)] hover:text-[var(--sys-status-error)]/80"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-[var(--sys-text-tertiary)]">
                                        Created: {job.createdAt.toLocaleString()} |
                                        Location: {job.location} |
                                        Retention: {job.retentionDays} days
                                        {job.nextRun && ` | Next run: ${job.nextRun.toLocaleString()}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recovery Points */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <RotateCcw className="h-5 w-5" />
                        <span>Recovery Points</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Recovery Filter */}
                        <div className="flex items-center space-x-4">
                            <select
                                value={selectedRecoveryStatus}
                                onChange={(e) => setSelectedRecoveryStatus(e.target.value)}
                                className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                aria-label="Filter by recovery status"
                            >
                                <option value="all">All Statuses</option>
                                <option value="available">Available</option>
                                <option value="corrupted">Corrupted</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>

                        {/* Recovery Points List */}
                        <div className="space-y-3">
                            {filteredRecoveryPoints.map((point) => (
                                <div key={point.id} className="p-4 border border-[var(--sys-border-hairline)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center space-x-2">
                                                <HardDrive className="h-4 w-4" />
                                                <div>
                                                    <h4 className="font-medium text-[var(--sys-text-primary)]">{point.name}</h4>
                                                    <p className="text-sm text-[var(--sys-text-secondary)]">
                                                        {point.type.charAt(0).toUpperCase() + point.type.slice(1)} backup |
                                                        Size: {formatFileSize(point.size)} |
                                                        Created: {point.timestamp.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getRecoveryStatusColor(point.status))}>
                                                {point.status.toUpperCase()}
                                            </div>
                                            {point.encryption && (
                                                <Badge variant="outline" className="text-xs">
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    Encrypted
                                                </Badge>
                                            )}
                                            {point.status === 'available' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onRestoreFromBackup(point.id)}
                                                    className="flex items-center space-x-1"
                                                >
                                                    <RotateCcw className="h-3 w-3" />
                                                    <span>Restore</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-[var(--sys-text-tertiary)]">
                                        Location: {point.location}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Disaster Recovery Plans */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Disaster Recovery Plans</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {disasterRecoveryPlans.map((plan) => (
                            <div key={plan.id} className="p-4 border border-[var(--sys-border-hairline)] rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getPlanStatusColor(plan.status))}>
                                            {plan.status.toUpperCase()}
                                        </div>
                                        <h4 className="font-medium text-[var(--sys-text-primary)]">{plan.name}</h4>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => onTestDisasterRecovery(plan.id)}
                                        disabled={plan.status === 'testing'}
                                        className="flex items-center space-x-1"
                                    >
                                        <Zap className="h-3 w-3" />
                                        <span>Test Plan</span>
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                                            {plan.rto}m
                                        </div>
                                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                                            Recovery Time Objective
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                                            {plan.rpo}m
                                        </div>
                                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                                            Recovery Point Objective
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                                            {plan.procedures.length}
                                        </div>
                                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                                            Procedures
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h5 className="font-medium text-[var(--sys-text-primary)]">Recovery Procedures:</h5>
                                    <ul className="space-y-1">
                                        {plan.procedures.map((procedure, index) => (
                                            <li key={index} className="text-sm text-[var(--sys-text-secondary)] flex items-start space-x-2">
                                                <span className="text-[var(--sys-text-tertiary)]">{index + 1}.</span>
                                                <span>{procedure}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-4 pt-4 border-t border-[var(--sys-border-hairline)] text-xs text-[var(--sys-text-tertiary)]">
                                    Last tested: {plan.lastTested.toLocaleDateString()} |
                                    Next test: {plan.nextTest.toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Backup Recommendations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Zap className="h-5 w-5" />
                        <span>Backup Best Practices</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-[var(--sys-text-primary)]">Backup Strategy</h4>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">3-2-1 Rule</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">3 copies, 2 different media, 1 offsite</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">Regular Testing</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">Test restore procedures monthly</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">Encryption</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">Encrypt all backup data</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">Automated Scheduling</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">Schedule regular automated backups</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-[var(--sys-text-primary)]">Disaster Recovery</h4>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">RTO & RPO Planning</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">Define recovery time and point objectives</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">Documentation</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">Maintain detailed recovery procedures</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">Team Training</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">Train staff on recovery procedures</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">Regular Drills</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">Conduct disaster recovery drills</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
