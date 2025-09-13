import * as React from "react";
import { cn } from "../../utils";
import { Download, FileText, CheckCircle, Clock, AlertTriangle, Eye, Package, Settings } from "lucide-react";

// SSOT Compliant Export Pack Builder Component
// Comprehensive and branded export pack generation

export interface ExportDocument {
    id: string;
    name: string;
    type: 'financial_statement' | 'trial_balance' | 'general_ledger' | 'supporting_schedule' | 'compliance_report' | 'custom';
    format: 'pdf' | 'excel' | 'csv';
    status: 'pending' | 'generating' | 'ready' | 'error';
    generatedAt?: string;
    generatedBy?: string;
    fileSize?: number;
    downloadUrl?: string;
    error?: string;
    required: boolean;
    description: string;
    parameters?: Record<string, any>;
}

export interface ExportPack {
    id: string;
    name: string;
    period: string;
    status: 'draft' | 'generating' | 'ready' | 'delivered';
    documents: ExportDocument[];
    createdAt: string;
    createdBy: string;
    generatedAt?: string;
    deliveredAt?: string;
    totalSize: number;
    branding: {
        companyName: string;
        logo?: string;
        colors: {
            primary: string;
            secondary: string;
        };
        footer?: string;
    };
    delivery: {
        method: 'download' | 'email' | 'ftp' | 'api';
        recipients?: string[];
        settings?: Record<string, any>;
    };
}

export interface ExportPackBuilderProps {
    currentPack?: ExportPack;
    availableDocuments: ExportDocument[];
    onGenerateDocument?: (documentId: string, parameters?: Record<string, any>) => Promise<void>;
    onGeneratePack?: (pack: Omit<ExportPack, 'id'>) => Promise<void>;
    onDownloadDocument?: (documentId: string) => Promise<void>;
    onDownloadPack?: (packId: string) => Promise<void>;
    onUpdatePack?: (packId: string, updates: Partial<ExportPack>) => Promise<void>;
    onPreviewDocument?: (documentId: string) => Promise<void>;
    className?: string;
}

export const ExportPackBuilder: React.FC<ExportPackBuilderProps> = ({
    currentPack,
    availableDocuments,
    onGenerateDocument,
    onGeneratePack,
    onDownloadDocument,
    onDownloadPack,
    onUpdatePack,
    onPreviewDocument,
    className
}) => {
    const [selectedDocuments, setSelectedDocuments] = React.useState<Set<string>>(new Set());
    const [packName, setPackName] = React.useState('');
    const [showSettings, setShowSettings] = React.useState(false);
    const [showPreview, setShowPreview] = React.useState<string | null>(null);

    // Initialize selected documents from current pack
    React.useEffect(() => {
        if (currentPack) {
            setSelectedDocuments(new Set(currentPack.documents.map(d => d.id)));
            setPackName(currentPack.name);
        }
    }, [currentPack]);

    const getDocumentTypeIcon = (type: ExportDocument['type']) => {
        switch (type) {
            case 'financial_statement': return <FileText className="h-4 w-4 text-[var(--sys-accent)]" />;
            case 'trial_balance': return <FileText className="h-4 w-4 text-[var(--sys-status-success)]" />;
            case 'general_ledger': return <FileText className="h-4 w-4 text-[var(--sys-status-warning)]" />;
            case 'supporting_schedule': return <FileText className="h-4 w-4 text-[var(--sys-text-secondary)]" />;
            case 'compliance_report': return <AlertTriangle className="h-4 w-4 text-[var(--sys-status-error)]" />;
            case 'custom': return <Settings className="h-4 w-4 text-[var(--sys-text-tertiary)]" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const getStatusIcon = (status: ExportDocument['status']) => {
        switch (status) {
            case 'ready': return <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />;
            case 'generating': return <Clock className="h-4 w-4 text-[var(--sys-status-warning)]" />;
            case 'error': return <AlertTriangle className="h-4 w-4 text-[var(--sys-status-error)]" />;
            default: return <Clock className="h-4 w-4 text-[var(--sys-text-tertiary)]" />;
        }
    };

    const getStatusColor = (status: ExportDocument['status']) => {
        switch (status) {
            case 'ready': return 'bg-[var(--sys-status-success)] text-white';
            case 'generating': return 'bg-[var(--sys-status-warning)] text-white';
            case 'error': return 'bg-[var(--sys-status-error)] text-white';
            default: return 'bg-[var(--sys-bg-subtle)] text-[var(--sys-text-secondary)]';
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDocumentToggle = (documentId: string) => {
        const newSelected = new Set(selectedDocuments);
        if (newSelected.has(documentId)) {
            newSelected.delete(documentId);
        } else {
            newSelected.add(documentId);
        }
        setSelectedDocuments(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedDocuments.size === availableDocuments.length) {
            setSelectedDocuments(new Set());
        } else {
            setSelectedDocuments(new Set(availableDocuments.map(d => d.id)));
        }
    };

    const handleGenerateDocument = async (documentId: string) => {
        if (onGenerateDocument) {
            await onGenerateDocument(documentId);
        }
    };

    const handleGeneratePack = async () => {
        if (onGeneratePack && packName.trim() && selectedDocuments.size > 0) {
            const selectedDocs = availableDocuments.filter(d => selectedDocuments.has(d.id));
            await onGeneratePack({
                name: packName,
                period: '2024-01', // This should come from props
                status: 'draft',
                documents: selectedDocs,
                createdAt: new Date().toISOString(),
                createdBy: 'current-user', // This should come from auth context
                totalSize: 0,
                branding: {
                    companyName: 'AI-BOS Accounting',
                    colors: {
                        primary: 'var(--sys-accent)',
                        secondary: 'var(--sys-status-success)'
                    }
                },
                delivery: {
                    method: 'download'
                }
            });
        }
    };

    const handleDownloadDocument = async (documentId: string) => {
        if (onDownloadDocument) {
            await onDownloadDocument(documentId);
        }
    };

    const handleDownloadPack = async () => {
        if (currentPack && onDownloadPack) {
            await onDownloadPack(currentPack.id);
        }
    };

    const handlePreviewDocument = async (documentId: string) => {
        if (onPreviewDocument) {
            await onPreviewDocument(documentId);
            setShowPreview(documentId);
        }
    };

    const isPackReady = currentPack?.documents.every(d => d.status === 'ready');
    const hasRequiredDocuments = availableDocuments.filter(d => d.required).every(d => selectedDocuments.has(d.id));

    return (
        <div className={cn("bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg", className)}>
            {/* Header */}
            <div className="p-6 border-b border-[var(--sys-border-hairline)]">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-[var(--sys-text-primary)]">
                            Export Pack Builder
                        </h2>
                        <p className="text-[var(--sys-text-secondary)] mt-1">
                            Comprehensive and branded export pack generation
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowSettings(true)}
                            className="px-4 py-2 border border-[var(--sys-border-hairline)] rounded-md hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                            aria-label="Export settings"
                        >
                            <Settings className="h-4 w-4 mr-2 inline" />
                            Settings
                        </button>

                        {currentPack && isPackReady && (
                            <button
                                onClick={handleDownloadPack}
                                className="px-4 py-2 bg-[var(--sys-accent)] text-white rounded-md hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                aria-label="Download export pack"
                            >
                                <Package className="h-4 w-4 mr-2 inline" />
                                Download Pack
                            </button>
                        )}
                    </div>
                </div>

                {/* Pack Name */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                        Export Pack Name
                    </label>
                    <input
                        type="text"
                        value={packName}
                        onChange={(e) => setPackName(e.target.value)}
                        placeholder="Enter export pack name..."
                        className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                        aria-label="Export pack name"
                    />
                </div>

                {/* Current Pack Status */}
                {currentPack && (
                    <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-[var(--sys-text-primary)]">
                                {currentPack.name}
                            </h3>
                            <span className={cn(
                                "px-2 py-1 text-xs font-medium rounded-full",
                                currentPack.status === 'ready' ? 'bg-[var(--sys-status-success)] text-white' :
                                    currentPack.status === 'generating' ? 'bg-[var(--sys-status-warning)] text-white' :
                                        'bg-[var(--sys-bg-subtle)] text-[var(--sys-text-secondary)]'
                            )}>
                                {currentPack.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-[var(--sys-text-tertiary)]">Period:</span>
                                <div className="text-[var(--sys-text-primary)]">{currentPack.period}</div>
                            </div>
                            <div>
                                <span className="text-[var(--sys-text-tertiary)]">Documents:</span>
                                <div className="text-[var(--sys-text-primary)]">{currentPack.documents.length}</div>
                            </div>
                            <div>
                                <span className="text-[var(--sys-text-tertiary)]">Total Size:</span>
                                <div className="text-[var(--sys-text-primary)]">{formatFileSize(currentPack.totalSize)}</div>
                            </div>
                            <div>
                                <span className="text-[var(--sys-text-tertiary)]">Created:</span>
                                <div className="text-[var(--sys-text-primary)]">
                                    {new Date(currentPack.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Document Selection */}
            <div className="p-6 border-b border-[var(--sys-border-hairline)]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">
                        Select Documents
                    </h3>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={selectedDocuments.size === availableDocuments.length && availableDocuments.length > 0}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                            aria-label="Select all documents"
                        />
                        <span className="text-sm text-[var(--sys-text-secondary)]">
                            Select All ({availableDocuments.length})
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    {availableDocuments.map((document) => (
                        <div key={document.id} className="flex items-center gap-4 p-3 bg-[var(--sys-bg-subtle)] rounded-lg">
                            <input
                                type="checkbox"
                                checked={selectedDocuments.has(document.id)}
                                onChange={() => handleDocumentToggle(document.id)}
                                className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                                aria-label={`Select ${document.name}`}
                            />

                            <div className="flex items-center gap-2">
                                {getDocumentTypeIcon(document.type)}
                                {getStatusIcon(document.status)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-medium text-[var(--sys-text-primary)]">
                                        {document.name}
                                        {document.required && (
                                            <span className="ml-2 text-xs bg-[var(--sys-status-error)] text-white px-2 py-1 rounded">
                                                Required
                                            </span>
                                        )}
                                    </h4>
                                    <span className={cn(
                                        "px-2 py-1 text-xs font-medium rounded-full",
                                        getStatusColor(document.status)
                                    )}>
                                        {document.status.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-sm text-[var(--sys-text-secondary)]">
                                    {document.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-[var(--sys-text-tertiary)] mt-1">
                                    <span>{document.type.replace('_', ' ').toUpperCase()}</span>
                                    <span>{document.format.toUpperCase()}</span>
                                    {document.fileSize && (
                                        <span>{formatFileSize(document.fileSize)}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {document.status === 'pending' && (
                                    <button
                                        onClick={() => handleGenerateDocument(document.id)}
                                        className="px-3 py-1 text-sm bg-[var(--sys-accent)] text-white rounded hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                        aria-label={`Generate ${document.name}`}
                                    >
                                        Generate
                                    </button>
                                )}

                                {document.status === 'ready' && (
                                    <>
                                        <button
                                            onClick={() => handlePreviewDocument(document.id)}
                                            className="px-3 py-1 text-sm border border-[var(--sys-border-hairline)] rounded hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                            aria-label={`Preview ${document.name}`}
                                        >
                                            <Eye className="h-3 w-3 mr-1 inline" />
                                            Preview
                                        </button>
                                        <button
                                            onClick={() => handleDownloadDocument(document.id)}
                                            className="px-3 py-1 text-sm bg-[var(--sys-status-success)] text-white rounded hover:bg-[var(--sys-status-success)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-success)]"
                                            aria-label={`Download ${document.name}`}
                                        >
                                            <Download className="h-3 w-3 mr-1 inline" />
                                            Download
                                        </button>
                                    </>
                                )}

                                {document.status === 'error' && (
                                    <span className="text-xs text-[var(--sys-status-error)]">
                                        {document.error || 'Generation failed'}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-[var(--sys-text-secondary)]">
                        {selectedDocuments.size} of {availableDocuments.length} documents selected
                        {!hasRequiredDocuments && (
                            <span className="ml-2 text-[var(--sys-status-error)]">
                                (Missing required documents)
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleGeneratePack}
                            disabled={!packName.trim() || selectedDocuments.size === 0 || !hasRequiredDocuments}
                            className="px-6 py-2 bg-[var(--sys-accent)] text-white rounded-md hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Generate export pack"
                        >
                            <Package className="h-4 w-4 mr-2 inline" />
                            Generate Pack
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Dialog */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-6 max-w-4xl w-full mx-4 max-h-screen overflow-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--sys-text-primary)]">
                                Document Preview
                            </h3>
                            <button
                                onClick={() => setShowPreview(null)}
                                className="p-2 text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)] hover:bg-[var(--sys-bg-subtle)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                aria-label="Close preview"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="bg-[var(--sys-bg-subtle)] p-8 rounded-lg text-center">
                            <FileText className="h-16 w-16 text-[var(--sys-text-tertiary)] mx-auto mb-4" />
                            <p className="text-[var(--sys-text-secondary)]">
                                Document preview will be displayed here
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportPackBuilder;
