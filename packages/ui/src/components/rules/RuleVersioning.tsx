import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card';
import { Button } from '../../Button';
import { Badge } from '../../Badge';
import { Alert } from '../../Alert';
import { Input } from '../../Input';
import { cn } from '../../utils';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    Code,
    Database,
    Download,
    Eye,
    GitBranch,
    History,
    RotateCcw,
    Save,
    Settings,
    Trash2,
    Upload,
    User,
    Calendar,
    FileText,
    ArrowLeft,
    ArrowRight,
    GitMerge,
    Copy,
    Tag,
    AlertCircle
} from 'lucide-react';

interface RuleVersion {
    id: string;
    ruleId: string;
    version: number;
    name: string;
    description: string;
    conditions: any[];
    actions: any[];
    status: 'draft' | 'active' | 'archived';
    createdAt: Date;
    createdBy: string;
    changeLog: string;
    isActive: boolean;
    executionCount: number;
    successRate: number;
    averageExecutionTime: number;
    costPerExecution: number;
    parentVersionId?: string;
    tags: string[];
}

interface VersionDiff {
    field: string;
    oldValue: any;
    newValue: any;
    changeType: 'added' | 'removed' | 'modified';
}

interface RuleVersioningProps {
    versions: RuleVersion[];
    onCreateVersion: (ruleId: string, changeLog: string) => Promise<RuleVersion>;
    onActivateVersion: (versionId: string) => Promise<void>;
    onArchiveVersion: (versionId: string) => Promise<void>;
    onDeleteVersion: (versionId: string) => Promise<void>;
    onCompareVersions: (version1Id: string, version2Id: string) => Promise<VersionDiff[]>;
    onExportVersion: (versionId: string) => Promise<string>;
    onImportVersion: (ruleId: string, versionData: string) => Promise<RuleVersion>;
    onTagVersion: (versionId: string, tags: string[]) => Promise<void>;
    onViewVersionHistory: (ruleId: string) => void;
}

export const RuleVersioning: React.FC<RuleVersioningProps> = ({
    versions,
    onCreateVersion,
    onActivateVersion,
    onArchiveVersion,
    onDeleteVersion,
    onCompareVersions,
    onExportVersion,
    onImportVersion,
    onTagVersion,
    onViewVersionHistory,
}) => {
    const [selectedRuleId, setSelectedRuleId] = useState<string>('');
    const [selectedVersion, setSelectedVersion] = useState<RuleVersion | null>(null);
    const [compareVersion, setCompareVersion] = useState<RuleVersion | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [versionDiffs, setVersionDiffs] = useState<VersionDiff[]>([]);
    const [newChangeLog, setNewChangeLog] = useState('');
    const [isCreatingVersion, setIsCreatingVersion] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredVersions = useMemo(() => {
        let filtered = versions;

        if (selectedRuleId) {
            filtered = filtered.filter(v => v.ruleId === selectedRuleId);
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(v => v.status === filterStatus);
        }

        if (searchTerm) {
            filtered = filtered.filter(v =>
                v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.changeLog.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered.sort((a, b) => b.version - a.version);
    }, [versions, selectedRuleId, filterStatus, searchTerm]);

    const uniqueRuleIds = useMemo(() => {
        return Array.from(new Set(versions.map(v => v.ruleId)));
    }, [versions]);

    const handleCreateVersion = useCallback(async () => {
        if (!selectedRuleId || !newChangeLog.trim()) return;

        setIsCreatingVersion(true);
        try {
            const newVersion = await onCreateVersion(selectedRuleId, newChangeLog);
            setNewChangeLog('');
            setSelectedVersion(newVersion);
        } catch (error) {
            console.error('Failed to create version:', error);
        } finally {
            setIsCreatingVersion(false);
        }
    }, [selectedRuleId, newChangeLog, onCreateVersion]);

    const handleCompareVersions = useCallback(async () => {
        if (!selectedVersion || !compareVersion) return;

        setIsComparing(true);
        try {
            const diffs = await onCompareVersions(selectedVersion.id, compareVersion.id);
            setVersionDiffs(diffs);
        } catch (error) {
            console.error('Failed to compare versions:', error);
        } finally {
            setIsComparing(false);
        }
    }, [selectedVersion, compareVersion, onCompareVersions]);

    const handleActivateVersion = useCallback(async (versionId: string) => {
        try {
            await onActivateVersion(versionId);
            setSelectedVersion(versions.find(v => v.id === versionId) || null);
        } catch (error) {
            console.error('Failed to activate version:', error);
        }
    }, [onActivateVersion, versions]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10';
            case 'draft': return 'text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10';
            case 'archived': return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
            default: return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
        }
    };

    const getChangeTypeColor = (changeType: string) => {
        switch (changeType) {
            case 'added': return 'text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10';
            case 'removed': return 'text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10';
            case 'modified': return 'text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10';
            default: return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
        }
    };

    const formatExecutionTime = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatCost = (cost: number) => {
        return `$${cost.toFixed(4)}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">Rule Versioning</h2>
                    <p className="text-[var(--sys-text-secondary)] mt-1">
                        Manage rule versions, compare changes, and track history
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        onClick={() => onViewVersionHistory(selectedRuleId)}
                        variant="outline"
                        className="flex items-center space-x-2"
                        disabled={!selectedRuleId}
                    >
                        <History className="h-4 w-4" />
                        <span>View History</span>
                    </Button>
                    <Button
                        onClick={() => {/* Import logic */ }}
                        variant="outline"
                        className="flex items-center space-x-2"
                    >
                        <Upload className="h-4 w-4" />
                        <span>Import</span>
                    </Button>
                </div>
            </div>

            {/* Filters and Controls */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-1">
                                Rule
                            </label>
                            <select
                                value={selectedRuleId}
                                onChange={(e) => setSelectedRuleId(e.target.value)}
                                className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                            >
                                <option value="">All Rules</option>
                                {uniqueRuleIds.map((ruleId) => (
                                    <option key={ruleId} value={ruleId}>
                                        {ruleId}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-1">
                                Status
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-1">
                                Search
                            </label>
                            <Input
                                type="text"
                                placeholder="Search versions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="flex items-end">
                            <Button
                                onClick={() => setIsCreatingVersion(true)}
                                disabled={!selectedRuleId}
                                className="w-full"
                            >
                                <GitBranch className="h-4 w-4 mr-2" />
                                Create Version
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create New Version */}
            {isCreatingVersion && (
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Version</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                                Change Log
                            </label>
                            <textarea
                                value={newChangeLog}
                                onChange={(e) => setNewChangeLog(e.target.value)}
                                placeholder="Describe what changed in this version..."
                                className="w-full h-24 px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                            />
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button
                                onClick={handleCreateVersion}
                                disabled={!newChangeLog.trim() || isCreatingVersion}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Create Version
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsCreatingVersion(false);
                                    setNewChangeLog('');
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Versions List */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <GitBranch className="h-5 w-5" />
                                <span>Versions ({filteredVersions.length})</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {filteredVersions.map((version) => (
                                <div
                                    key={version.id}
                                    className={cn(
                                        "p-3 border border-[var(--sys-border-hairline)] rounded-lg cursor-pointer transition-colors",
                                        selectedVersion?.id === version.id ? "bg-[var(--sys-fill-low)] border-[var(--sys-accent)]" : "hover:bg-[var(--sys-fill-low)]"
                                    )}
                                    onClick={() => setSelectedVersion(version)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <h4 className="font-medium text-[var(--sys-text-primary)]">v{version.version}</h4>
                                            {version.isActive && (
                                                <Badge className="text-xs bg-[var(--sys-status-success)]/10 text-[var(--sys-status-success)]">
                                                    Active
                                                </Badge>
                                            )}
                                        </div>
                                        <Badge className={cn("text-xs", getStatusColor(version.status))}>
                                            {version.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-[var(--sys-text-secondary)] mb-2">{version.name}</p>
                                    <p className="text-xs text-[var(--sys-text-tertiary)] mb-2">{version.changeLog}</p>
                                    <div className="flex items-center justify-between text-xs text-[var(--sys-text-tertiary)]">
                                        <span>{version.createdAt.toLocaleDateString()}</span>
                                        <span>{version.createdBy}</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Version Details */}
                <div className="lg:col-span-2">
                    {selectedVersion ? (
                        <div className="space-y-6">
                            {/* Version Header */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center space-x-2">
                                            <GitBranch className="h-5 w-5" />
                                            <span>Version {selectedVersion.version}</span>
                                            <Badge className={cn("text-xs", getStatusColor(selectedVersion.status))}>
                                                {selectedVersion.status}
                                            </Badge>
                                        </CardTitle>
                                        <div className="flex items-center space-x-2">
                                            {!selectedVersion.isActive && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleActivateVersion(selectedVersion.id)}
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-1" />
                                                    Activate
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onExportVersion(selectedVersion.id)}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-[var(--sys-text-primary)] mb-1">{selectedVersion.name}</h4>
                                        <p className="text-sm text-[var(--sys-text-secondary)]">{selectedVersion.description}</p>
                                    </div>

                                    <div>
                                        <h5 className="text-sm font-medium text-[var(--sys-text-primary)] mb-2">Change Log</h5>
                                        <p className="text-sm text-[var(--sys-text-secondary)] bg-[var(--sys-fill-low)] p-3 rounded-lg">
                                            {selectedVersion.changeLog}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <div className="text-sm font-medium text-[var(--sys-text-primary)]">Created</div>
                                            <div className="text-sm text-[var(--sys-text-secondary)]">
                                                {selectedVersion.createdAt.toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-[var(--sys-text-primary)]">Created By</div>
                                            <div className="text-sm text-[var(--sys-text-secondary)]">{selectedVersion.createdBy}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-[var(--sys-text-primary)]">Executions</div>
                                            <div className="text-sm text-[var(--sys-text-secondary)]">{selectedVersion.executionCount}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-[var(--sys-text-primary)]">Success Rate</div>
                                            <div className="text-sm text-[var(--sys-text-secondary)]">{selectedVersion.successRate}%</div>
                                        </div>
                                    </div>

                                    {selectedVersion.tags.length > 0 && (
                                        <div>
                                            <h5 className="text-sm font-medium text-[var(--sys-text-primary)] mb-2">Tags</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedVersion.tags.map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        <Tag className="h-3 w-3 mr-1" />
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Version Comparison */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <GitMerge className="h-5 w-5" />
                                        <span>Compare Versions</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <select
                                            value={compareVersion?.id || ''}
                                            onChange={(e) => setCompareVersion(versions.find(v => v.id === e.target.value) || null)}
                                            className="flex-1 px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                        >
                                            <option value="">Select version to compare</option>
                                            {versions
                                                .filter(v => v.ruleId === selectedVersion.ruleId && v.id !== selectedVersion.id)
                                                .map((version) => (
                                                    <option key={version.id} value={version.id}>
                                                        v{version.version} - {version.name}
                                                    </option>
                                                ))}
                                        </select>
                                        <Button
                                            onClick={handleCompareVersions}
                                            disabled={!compareVersion || isComparing}
                                        >
                                            <GitMerge className="h-4 w-4 mr-2" />
                                            {isComparing ? 'Comparing...' : 'Compare'}
                                        </Button>
                                    </div>

                                    {versionDiffs.length > 0 && (
                                        <div className="space-y-3">
                                            <h5 className="text-sm font-medium text-[var(--sys-text-primary)]">Differences</h5>
                                            {versionDiffs.map((diff, index) => (
                                                <div key={index} className="p-3 border border-[var(--sys-border-hairline)] rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-[var(--sys-text-primary)]">{diff.field}</span>
                                                        <Badge className={cn("text-xs", getChangeTypeColor(diff.changeType))}>
                                                            {diff.changeType}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <div className="text-[var(--sys-text-secondary)] mb-1">Old Value:</div>
                                                            <div className="bg-[var(--sys-fill-low)] p-2 rounded text-[var(--sys-text-primary)]">
                                                                {JSON.stringify(diff.oldValue, null, 2)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[var(--sys-text-secondary)] mb-1">New Value:</div>
                                                            <div className="bg-[var(--sys-fill-low)] p-2 rounded text-[var(--sys-text-primary)]">
                                                                {JSON.stringify(diff.newValue, null, 2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Version Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Version Actions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => onExportVersion(selectedVersion.id)}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Export
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {/* Copy logic */ }}
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => onTagVersion(selectedVersion.id, [...selectedVersion.tags, 'new-tag'])}
                                        >
                                            <Tag className="h-4 w-4 mr-2" />
                                            Add Tag
                                        </Button>
                                        {selectedVersion.status !== 'archived' && (
                                            <Button
                                                variant="outline"
                                                onClick={() => onArchiveVersion(selectedVersion.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Archive
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <GitBranch className="h-12 w-12 text-[var(--sys-text-tertiary)] mb-4" />
                                <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-2">
                                    No Version Selected
                                </h3>
                                <p className="text-[var(--sys-text-secondary)] text-center">
                                    Select a version from the list to view its details and compare with other versions.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
