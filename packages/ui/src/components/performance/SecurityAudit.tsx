import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card';
import { Button } from '../../Button';
import { Badge } from '../../Badge';
import { Alert } from '../../Alert';
import { cn } from '../../utils';
import {
    AlertTriangle,
    CheckCircle,
    Eye,
    FileText,
    Lock,
    Shield,
    ShieldAlert,
    ShieldCheck,
    User,
    Zap,
    RefreshCw,
    Download,
    ExternalLink
} from 'lucide-react';

interface SecurityVulnerability {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    cve?: string;
    cvssScore?: number;
    affectedComponents: string[];
    remediation: string;
    status: 'open' | 'in-progress' | 'resolved' | 'false-positive';
    discoveredAt: Date;
    resolvedAt?: Date;
}

interface SecurityCompliance {
    standard: string;
    status: 'compliant' | 'non-compliant' | 'partial';
    score: number;
    lastAudit: Date;
    nextAudit: Date;
    issues: string[];
}

interface SecurityAuditProps {
    vulnerabilities: SecurityVulnerability[];
    compliance: SecurityCompliance[];
    onRunAudit: () => void;
    onResolveVulnerability: (vulnerabilityId: string) => void;
    onGenerateReport: () => void;
    onExportFindings: () => void;
}

export const SecurityAudit: React.FC<SecurityAuditProps> = ({
    vulnerabilities,
    compliance,
    onRunAudit,
    onResolveVulnerability,
    onGenerateReport,
    onExportFindings,
}) => {
    const [isRunningAudit, setIsRunningAudit] = useState(false);
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    const handleRunAudit = async () => {
        setIsRunningAudit(true);
        await onRunAudit();
        setIsRunningAudit(false);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10';
            case 'high': return 'text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10';
            case 'medium': return 'text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10';
            case 'low': return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
            default: return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return ShieldAlert;
            case 'high': return AlertTriangle;
            case 'medium': return Shield;
            case 'low': return ShieldCheck;
            default: return Shield;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10';
            case 'in-progress': return 'text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10';
            case 'open': return 'text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10';
            case 'false-positive': return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
            default: return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
        }
    };

    const getComplianceColor = (status: string) => {
        switch (status) {
            case 'compliant': return 'text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10';
            case 'partial': return 'text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10';
            case 'non-compliant': return 'text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10';
            default: return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
        }
    };

    const filteredVulnerabilities = vulnerabilities.filter(vuln => {
        const severityMatch = selectedSeverity === 'all' || vuln.severity === selectedSeverity;
        const statusMatch = selectedStatus === 'all' || vuln.status === selectedStatus;
        return severityMatch && statusMatch;
    });

    const criticalVulnerabilities = vulnerabilities.filter(v => v.severity === 'critical' && v.status === 'open');
    const highVulnerabilities = vulnerabilities.filter(v => v.severity === 'high' && v.status === 'open');
    const totalVulnerabilities = vulnerabilities.length;
    const openVulnerabilities = vulnerabilities.filter(v => v.status === 'open').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">Security Audit</h2>
                    <p className="text-[var(--sys-text-secondary)] mt-1">
                        Comprehensive security assessment and vulnerability management
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        onClick={handleRunAudit}
                        disabled={isRunningAudit}
                        className="flex items-center space-x-2"
                    >
                        <RefreshCw className={cn("h-4 w-4", isRunningAudit && "animate-spin")} />
                        <span>Run Audit</span>
                    </Button>
                    <Button
                        onClick={onGenerateReport}
                        variant="outline"
                        className="flex items-center space-x-2"
                    >
                        <FileText className="h-4 w-4" />
                        <span>Generate Report</span>
                    </Button>
                    <Button
                        onClick={onExportFindings}
                        variant="outline"
                        className="flex items-center space-x-2"
                    >
                        <Download className="h-4 w-4" />
                        <span>Export</span>
                    </Button>
                </div>
            </div>

            {/* Critical Alerts */}
            {criticalVulnerabilities.length > 0 && (
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <div>
                        <h4 className="font-medium">Critical Security Vulnerabilities Detected</h4>
                        <p className="text-sm">
                            {criticalVulnerabilities.length} critical vulnerabilities require immediate attention.
                        </p>
                    </div>
                </Alert>
            )}

            {/* Security Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Total Vulnerabilities</div>
                            <Shield className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {totalVulnerabilities}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            {openVulnerabilities} open
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Critical</div>
                            <ShieldAlert className="h-4 w-4 text-[var(--sys-status-error)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-status-error)]">
                            {criticalVulnerabilities.length}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            Immediate action required
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">High Priority</div>
                            <AlertTriangle className="h-4 w-4 text-[var(--sys-status-warning)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-status-warning)]">
                            {highVulnerabilities.length}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            Address within 7 days
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Compliance Score</div>
                            <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {compliance.length > 0 ? Math.round(compliance.reduce((acc, c) => acc + c.score, 0) / compliance.length) : 0}%
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            Average across standards
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Compliance Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <ShieldCheck className="h-5 w-5" />
                        <span>Compliance Status</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {compliance.map((item) => (
                            <div key={item.standard} className="flex items-center justify-between p-4 border border-[var(--sys-border-hairline)] rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getComplianceColor(item.status))}>
                                        {item.status.toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-[var(--sys-text-primary)]">{item.standard}</h4>
                                        <p className="text-sm text-[var(--sys-text-secondary)]">
                                            Score: {item.score}% | Last audit: {item.lastAudit.toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Badge variant="outline">
                                        {item.issues.length} issues
                                    </Badge>
                                    <Button size="sm" variant="outline">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Vulnerability Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Vulnerability Management</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="flex items-center space-x-4">
                            <select
                                value={selectedSeverity}
                                onChange={(e) => setSelectedSeverity(e.target.value)}
                                className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                aria-label="Filter by severity"
                            >
                                <option value="all">All Severities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                aria-label="Filter by status"
                            >
                                <option value="all">All Statuses</option>
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="false-positive">False Positive</option>
                            </select>
                        </div>

                        {/* Vulnerabilities List */}
                        <div className="space-y-3">
                            {filteredVulnerabilities.map((vulnerability) => {
                                const SeverityIcon = getSeverityIcon(vulnerability.severity);
                                return (
                                    <div key={vulnerability.id} className="p-4 border border-[var(--sys-border-hairline)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <SeverityIcon className="h-4 w-4" />
                                                    <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getSeverityColor(vulnerability.severity))}>
                                                        {vulnerability.severity.toUpperCase()}
                                                    </div>
                                                    <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(vulnerability.status))}>
                                                        {vulnerability.status.replace('-', ' ').toUpperCase()}
                                                    </div>
                                                    {vulnerability.cve && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {vulnerability.cve}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <h4 className="font-medium text-[var(--sys-text-primary)] mb-1">
                                                    {vulnerability.title}
                                                </h4>
                                                <p className="text-sm text-[var(--sys-text-secondary)] mb-2">
                                                    {vulnerability.description}
                                                </p>
                                                <div className="flex items-center space-x-4 text-xs text-[var(--sys-text-tertiary)]">
                                                    <span>Discovered: {vulnerability.discoveredAt.toLocaleDateString()}</span>
                                                    <span>Components: {vulnerability.affectedComponents.join(', ')}</span>
                                                    {vulnerability.cvssScore && (
                                                        <span>CVSS: {vulnerability.cvssScore}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 ml-4">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onResolveVulnerability(vulnerability.id)}
                                                    disabled={vulnerability.status === 'resolved'}
                                                >
                                                    {vulnerability.status === 'resolved' ? 'Resolved' : 'Resolve'}
                                                </Button>
                                                <Button size="sm" variant="ghost">
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Security Recommendations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Zap className="h-5 w-5" />
                        <span>Security Recommendations</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <h4 className="font-medium text-[var(--sys-text-primary)]">Immediate Actions</h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                                    <span>Update all dependencies to latest versions</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                                    <span>Enable two-factor authentication</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                                    <span>Implement rate limiting on API endpoints</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                                    <span>Enable security headers (CSP, HSTS, etc.)</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-medium text-[var(--sys-text-primary)]">Long-term Improvements</h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                                    <span>Implement automated security scanning</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                                    <span>Conduct regular penetration testing</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                                    <span>Implement security monitoring and alerting</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                                    <span>Establish incident response procedures</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
