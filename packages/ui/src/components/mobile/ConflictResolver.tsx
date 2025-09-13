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
    Eye,
    GitBranch,
    RefreshCw,
    Save,
    Trash2,
    User,
    Zap,
    ArrowRight,
    ArrowLeft,
    Merge,
    Split
} from 'lucide-react';

interface Conflict {
    id: string;
    entity: string;
    entityId: string;
    field: string;
    localValue: any;
    serverValue: any;
    conflictType: 'field' | 'deletion' | 'creation';
    timestamp: Date;
    localTimestamp: Date;
    serverTimestamp: Date;
    localUser: string;
    serverUser: string;
    description: string;
}

interface ConflictResolution {
    conflictId: string;
    resolution: 'local' | 'server' | 'merge' | 'custom';
    customValue?: any;
    reason: string;
}

interface ConflictResolverProps {
    conflicts: Conflict[];
    onResolveConflict: (resolution: ConflictResolution) => void;
    onResolveAllConflicts: (resolutions: ConflictResolution[]) => void;
    onViewEntity: (entity: string, entityId: string) => void;
    onIgnoreConflict: (conflictId: string) => void;
}

export const ConflictResolver: React.FC<ConflictResolverProps> = ({
    conflicts,
    onResolveConflict,
    onResolveAllConflicts,
    onViewEntity,
    onIgnoreConflict,
}) => {
    const [selectedConflicts, setSelectedConflicts] = useState<Set<string>>(new Set());
    const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map());
    const [showResolved, setShowResolved] = useState(false);

    const getConflictTypeColor = (type: string) => {
        switch (type) {
            case 'field': return 'text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10';
            case 'deletion': return 'text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10';
            case 'creation': return 'text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10';
            default: return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
        }
    };

    const getConflictTypeIcon = (type: string) => {
        switch (type) {
            case 'field': return GitBranch;
            case 'deletion': return Trash2;
            case 'creation': return Database;
            default: return AlertTriangle;
        }
    };

    const formatTimestamp = (date: Date) => {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSelectConflict = (conflictId: string) => {
        const newSelected = new Set(selectedConflicts);
        if (newSelected.has(conflictId)) {
            newSelected.delete(conflictId);
        } else {
            newSelected.add(conflictId);
        }
        setSelectedConflicts(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedConflicts.size === conflicts.length) {
            setSelectedConflicts(new Set());
        } else {
            setSelectedConflicts(new Set(conflicts.map(c => c.id)));
        }
    };

    const handleResolutionChange = (conflictId: string, resolution: ConflictResolution) => {
        const newResolutions = new Map(resolutions);
        newResolutions.set(conflictId, resolution);
        setResolutions(newResolutions);
    };

    const handleResolveSelected = () => {
        const selectedResolutions = Array.from(selectedConflicts)
            .map(conflictId => resolutions.get(conflictId))
            .filter(Boolean) as ConflictResolution[];

        onResolveAllConflicts(selectedResolutions);
        setSelectedConflicts(new Set());
        setResolutions(new Map());
    };

    const handleResolveSingle = (conflictId: string) => {
        const resolution = resolutions.get(conflictId);
        if (resolution) {
            onResolveConflict(resolution);
            setResolutions(prev => {
                const newMap = new Map(prev);
                newMap.delete(conflictId);
                return newMap;
            });
        }
    };

    const filteredConflicts = showResolved
        ? conflicts
        : conflicts.filter(c => !resolutions.has(c.id));

    const hasResolutions = Array.from(resolutions.values()).length > 0;
    const allSelectedHaveResolutions = Array.from(selectedConflicts).every(id => resolutions.has(id));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">Conflict Resolution</h2>
                    <p className="text-[var(--sys-text-secondary)] mt-1">
                        Resolve data conflicts between local and server versions
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        onClick={handleResolveSelected}
                        disabled={selectedConflicts.size === 0 || !allSelectedHaveResolutions}
                        className="flex items-center space-x-2"
                    >
                        <CheckCircle className="h-4 w-4" />
                        <span>Resolve Selected ({selectedConflicts.size})</span>
                    </Button>
                </div>
            </div>

            {/* Conflict Summary */}
            {conflicts.length > 0 && (
                <Alert variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <div>
                        <h4 className="font-medium">Data Conflicts Detected</h4>
                        <p className="text-sm">
                            {conflicts.length} conflicts need resolution. Review each conflict and choose how to resolve them.
                        </p>
                    </div>
                </Alert>
            )}

            {/* Conflict Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Total Conflicts</div>
                            <AlertTriangle className="h-4 w-4 text-[var(--sys-status-warning)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {conflicts.length}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            Need resolution
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Selected</div>
                            <CheckCircle className="h-4 w-4 text-[var(--sys-status-info)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-status-info)]">
                            {selectedConflicts.size}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            Ready to resolve
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Resolved</div>
                            <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-status-success)]">
                            {resolutions.size}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            Pending sync
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Field Conflicts</div>
                            <GitBranch className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {conflicts.filter(c => c.conflictType === 'field').length}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            Most common
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Conflict List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <GitBranch className="h-5 w-5" />
                        <span>Conflicts</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedConflicts.size === conflicts.length && conflicts.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-[var(--sys-border-hairline)]"
                                        aria-label="Select all conflicts"
                                    />
                                    <span className="text-sm text-[var(--sys-text-secondary)]">Select All</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={showResolved}
                                        onChange={(e) => setShowResolved(e.target.checked)}
                                        className="rounded border-[var(--sys-border-hairline)]"
                                        aria-label="Show resolved conflicts"
                                    />
                                    <span className="text-sm text-[var(--sys-text-secondary)]">Show Resolved</span>
                                </label>
                            </div>
                        </div>

                        {/* Conflicts List */}
                        <div className="space-y-3">
                            {filteredConflicts.map((conflict) => {
                                const ConflictIcon = getConflictTypeIcon(conflict.conflictType);
                                const resolution = resolutions.get(conflict.id);
                                const isSelected = selectedConflicts.has(conflict.id);

                                return (
                                    <div key={conflict.id} className="p-4 border border-[var(--sys-border-hairline)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors">
                                        <div className="flex items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectConflict(conflict.id)}
                                                className="mt-1 rounded border-[var(--sys-border-hairline)]"
                                                aria-label={`Select conflict ${conflict.id}`}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <ConflictIcon className="h-4 w-4" />
                                                    <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getConflictTypeColor(conflict.conflictType))}>
                                                        {conflict.conflictType.toUpperCase()}
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {conflict.entity}
                                                    </Badge>
                                                </div>

                                                <h4 className="font-medium text-[var(--sys-text-primary)] mb-1">
                                                    {conflict.description}
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div className="p-3 bg-[var(--sys-fill-low)] rounded-lg">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <User className="h-3 w-3 text-[var(--sys-text-tertiary)]" />
                                                            <span className="text-xs font-medium text-[var(--sys-text-secondary)]">Local Version</span>
                                                        </div>
                                                        <p className="text-sm text-[var(--sys-text-primary)] font-mono">
                                                            {JSON.stringify(conflict.localValue, null, 2)}
                                                        </p>
                                                        <p className="text-xs text-[var(--sys-text-tertiary)] mt-1">
                                                            {conflict.localUser} • {formatTimestamp(conflict.localTimestamp)}
                                                        </p>
                                                    </div>

                                                    <div className="p-3 bg-[var(--sys-fill-low)] rounded-lg">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <Database className="h-3 w-3 text-[var(--sys-text-tertiary)]" />
                                                            <span className="text-xs font-medium text-[var(--sys-text-secondary)]">Server Version</span>
                                                        </div>
                                                        <p className="text-sm text-[var(--sys-text-primary)] font-mono">
                                                            {JSON.stringify(conflict.serverValue, null, 2)}
                                                        </p>
                                                        <p className="text-xs text-[var(--sys-text-tertiary)] mt-1">
                                                            {conflict.serverUser} • {formatTimestamp(conflict.serverTimestamp)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Resolution Options */}
                                                <div className="space-y-3">
                                                    <h5 className="font-medium text-[var(--sys-text-primary)]">Resolution:</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        <Button
                                                            variant={resolution?.resolution === 'local' ? 'primary' : 'outline'}
                                                            size="sm"
                                                            onClick={() => handleResolutionChange(conflict.id, {
                                                                conflictId: conflict.id,
                                                                resolution: 'local',
                                                                reason: 'Keep local version'
                                                            })}
                                                            className="justify-start"
                                                        >
                                                            <ArrowLeft className="h-3 w-3 mr-2" />
                                                            Keep Local
                                                        </Button>
                                                        <Button
                                                            variant={resolution?.resolution === 'server' ? 'primary' : 'outline'}
                                                            size="sm"
                                                            onClick={() => handleResolutionChange(conflict.id, {
                                                                conflictId: conflict.id,
                                                                resolution: 'server',
                                                                reason: 'Use server version'
                                                            })}
                                                            className="justify-start"
                                                        >
                                                            <ArrowRight className="h-3 w-3 mr-2" />
                                                            Use Server
                                                        </Button>
                                                        <Button
                                                            variant={resolution?.resolution === 'merge' ? 'primary' : 'outline'}
                                                            size="sm"
                                                            onClick={() => handleResolutionChange(conflict.id, {
                                                                conflictId: conflict.id,
                                                                resolution: 'merge',
                                                                reason: 'Merge both versions'
                                                            })}
                                                            className="justify-start"
                                                        >
                                                            <Merge className="h-3 w-3 mr-2" />
                                                            Merge Both
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => onIgnoreConflict(conflict.id)}
                                                            className="justify-start text-[var(--sys-text-tertiary)]"
                                                        >
                                                            <Trash2 className="h-3 w-3 mr-2" />
                                                            Ignore
                                                        </Button>
                                                    </div>
                                                </div>

                                                {resolution && (
                                                    <div className="mt-3 p-2 bg-[var(--sys-status-success)]/10 border border-[var(--sys-status-success)]/20 rounded-lg">
                                                        <div className="flex items-center space-x-2">
                                                            <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                                                            <span className="text-sm font-medium text-[var(--sys-status-success)]">
                                                                Resolution: {resolution.resolution}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-[var(--sys-text-secondary)] mt-1">
                                                            {resolution.reason}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col space-y-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onViewEntity(conflict.entity, conflict.entityId)}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                                {resolution && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleResolveSingle(conflict.id)}
                                                        className="flex items-center space-x-1"
                                                    >
                                                        <Save className="h-3 w-3" />
                                                        <span>Resolve</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filteredConflicts.length === 0 && (
                            <div className="text-center py-8">
                                <CheckCircle className="h-12 w-12 text-[var(--sys-status-success)] mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-2">No Conflicts</h3>
                                <p className="text-[var(--sys-text-secondary)]">
                                    {showResolved ? 'No resolved conflicts to show.' : 'All conflicts have been resolved!'}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Conflict Resolution Help */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Zap className="h-5 w-5" />
                        <span>Resolution Guidelines</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-[var(--sys-text-primary)]">Resolution Types</h4>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <ArrowLeft className="h-4 w-4 text-[var(--sys-status-info)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">Keep Local</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">Use your local changes and overwrite server</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <ArrowRight className="h-4 w-4 text-[var(--sys-status-warning)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">Use Server</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">Discard local changes and use server version</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Merge className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">Merge Both</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">Combine both versions intelligently</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-[var(--sys-text-primary)]">Best Practices</h4>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">Review Carefully</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">Examine both versions before deciding</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">Consider Context</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">Think about which version is more recent/accurate</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--sys-text-primary)]">Document Decisions</p>
                                        <p className="text-xs text-[var(--sys-text-secondary)]">Add reasons for your resolution choices</p>
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
