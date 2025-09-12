import * as React from "react";
import { TOKENS } from "./tokens";
import { FileUpload } from "./FileUpload";
import { DocumentPreview } from "./DocumentPreview";

// V1 Compliance: Document Management Interface
// Categorization, tagging, search, filtering with accessibility

export interface DocumentItem {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  category: string;
  tags: string[];
  status: string;
  isPublic: boolean;
  uploadedBy: string;
  uploadedByName?: string;
  createdAt: string;
  updatedAt: string;
  storageUrl?: string;
  
  // OCR and processing
  ocrStatus?: string;
  ocrData?: Record<string, unknown>;
  
  // Approval workflow
  approvalStatus?: string;
  approvedBy?: string;
  approvedAt?: string;
  
  // Relationships
  relationships?: Array<{
    entityType: string;
    entityId: string;
    relationshipType: string;
    description?: string;
  }>;
}

export interface DocumentManagerProps {
  documents: DocumentItem[];
  onUpload?: (files: File[]) => Promise<void>;
  onDelete?: (documentId: string) => Promise<void>;
  onUpdate?: (documentId: string, updates: Partial<DocumentItem>) => Promise<void>;
  onDownload?: (documentId: string) => Promise<void>;
  onPreview?: (documentId: string) => void;
  
  // Configuration
  allowUpload?: boolean;
  allowDelete?: boolean;
  allowEdit?: boolean;
  categories?: string[];
  entityType?: string;
  entityId?: string;
  
  // UI customization
  className?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showBulkActions?: boolean;
  viewMode?: 'list' | 'grid' | 'table';
}

export interface DocumentManagerState {
  searchQuery: string;
  selectedCategory: string;
  selectedStatus: string;
  selectedTags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  selectedDocuments: Set<string>;
  previewDocument: DocumentItem | null;
  isUploading: boolean;
  viewMode: 'list' | 'grid' | 'table';
}

const DEFAULT_CATEGORIES = [
  'invoice',
  'receipt', 
  'contract',
  'report',
  'statement',
  'tax_document',
  'bank_document',
  'legal_document',
  'correspondence',
  'other'
];

const DEFAULT_STATUSES = ['active', 'archived', 'deleted', 'processing'];

export function DocumentManager({
  documents,
  onUpload,
  onDelete,
  onUpdate,
  onDownload,
  onPreview,
  allowUpload = true,
  allowDelete = true,
  allowEdit = true,
  categories = DEFAULT_CATEGORIES,
  entityType,
  entityId,
  className = "",
  showSearch = true,
  showFilters = true,
  showBulkActions = true,
  viewMode: initialViewMode = 'list'
}: DocumentManagerProps) {
  const [state, setState] = React.useState<DocumentManagerState>({
    searchQuery: '',
    selectedCategory: '',
    selectedStatus: '',
    selectedTags: [],
    sortBy: 'createdAt',
    sortOrder: 'desc',
    selectedDocuments: new Set(),
    previewDocument: null,
    isUploading: false,
    viewMode: initialViewMode
  });

  // Get all available tags from documents
  const availableTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach(doc => {
      doc.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [documents]);

  // Filter and sort documents
  const filteredDocuments = React.useMemo(() => {
    let filtered = documents.filter(doc => {
      // Search query filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        const searchableText = [
          doc.filename,
          doc.originalFilename,
          doc.category,
          ...(doc.tags || []),
          doc.uploadedByName || ''
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Category filter
      if (state.selectedCategory && doc.category !== state.selectedCategory) {
        return false;
      }

      // Status filter
      if (state.selectedStatus && doc.status !== state.selectedStatus) {
        return false;
      }

      // Tags filter
      if (state.selectedTags.length > 0) {
        const hasAllTags = state.selectedTags.every(tag => 
          doc.tags?.includes(tag)
        );
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: unknown = a[state.sortBy as keyof DocumentItem];
      let bValue: unknown = b[state.sortBy as keyof DocumentItem];

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aStr = aValue.toLowerCase();
        const bStr = bValue.toLowerCase();
        if (aStr < bStr) return state.sortOrder === 'asc' ? -1 : 1;
        if (aStr > bStr) return state.sortOrder === 'asc' ? 1 : -1;
        return 0;
      }

      // For non-string comparisons, convert to string for comparison
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      if (aStr < bStr) return state.sortOrder === 'asc' ? -1 : 1;
      if (aStr > bStr) return state.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [documents, state.searchQuery, state.selectedCategory, state.selectedStatus, state.selectedTags, state.sortBy, state.sortOrder]);

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    if (!onUpload) return;
    
    setState(prev => ({ ...prev, isUploading: true }));
    try {
      await onUpload(files);
    } finally {
      setState(prev => ({ ...prev, isUploading: false }));
    }
  };

  // Handle document selection
  const handleDocumentSelect = (documentId: string, selected: boolean) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedDocuments);
      if (selected) {
        newSelected.add(documentId);
      } else {
        newSelected.delete(documentId);
      }
      return { ...prev, selectedDocuments: newSelected };
    });
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedDocuments: selected 
        ? new Set(filteredDocuments.map(doc => doc.id))
        : new Set()
    }));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get file icon
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.startsWith('text/')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📋';
    return '📎';
  };

  // Render search and filters
  const renderSearchAndFilters = () => {
    if (!showSearch && !showFilters) return null;

    return (
      <div style={{
        padding: TOKENS.spacing.md,
        borderBottom: `1px solid ${TOKENS.colors.border}`,
        backgroundColor: TOKENS.colors.muted + '05'
      }}>
        {/* Search */}
        {showSearch && (
          <div style={{ marginBottom: TOKENS.spacing.md }}>
            <input
              type="text"
              placeholder="Search documents..."
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              style={{
                width: '100%',
                padding: TOKENS.spacing.sm,
                border: `1px solid ${TOKENS.colors.border}`,
                borderRadius: TOKENS.radius,
                fontSize: TOKENS.fontSize.sm,
                backgroundColor: TOKENS.colorBg,
                color: TOKENS.colors.foreground
              }}
              aria-label="Search documents"
            />
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div style={{
            display: 'flex',
            gap: TOKENS.spacing.md,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {/* Category filter */}
            <select
              value={state.selectedCategory}
              onChange={(e) => setState(prev => ({ ...prev, selectedCategory: e.target.value }))}
              style={{
                padding: TOKENS.spacing.sm,
                border: `1px solid ${TOKENS.colors.border}`,
                borderRadius: TOKENS.radius,
                fontSize: TOKENS.fontSize.sm,
                backgroundColor: TOKENS.colorBg,
                color: TOKENS.colors.foreground
              }}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={state.selectedStatus}
              onChange={(e) => setState(prev => ({ ...prev, selectedStatus: e.target.value }))}
              style={{
                padding: TOKENS.spacing.sm,
                border: `1px solid ${TOKENS.colors.border}`,
                borderRadius: TOKENS.radius,
                fontSize: TOKENS.fontSize.sm,
                backgroundColor: TOKENS.colorBg,
                color: TOKENS.colors.foreground
              }}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {DEFAULT_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={`${state.sortBy}-${state.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setState(prev => ({ 
                ...prev, 
                sortBy: sortBy || 'created_at', 
                sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
              }));
            }}
              style={{
                padding: TOKENS.spacing.sm,
                border: `1px solid ${TOKENS.colors.border}`,
                borderRadius: TOKENS.radius,
                fontSize: TOKENS.fontSize.sm,
                backgroundColor: TOKENS.colorBg,
                color: TOKENS.colors.foreground
              }}
              aria-label="Sort documents"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="filename-asc">Name A-Z</option>
              <option value="filename-desc">Name Z-A</option>
              <option value="fileSize-desc">Largest First</option>
              <option value="fileSize-asc">Smallest First</option>
            </select>

            {/* View mode toggle */}
            <div style={{
              display: 'flex',
              border: `1px solid ${TOKENS.colors.border}`,
              borderRadius: TOKENS.radius,
              overflow: 'hidden'
            }}>
              {(['list', 'grid', 'table'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setState(prev => ({ ...prev, viewMode: mode }))}
                  style={{
                    padding: TOKENS.spacing.sm,
                    border: 'none',
                    backgroundColor: state.viewMode === mode ? TOKENS.colors.primary : 'transparent',
                    color: state.viewMode === mode ? 'white' : TOKENS.colors.foreground,
                    fontSize: TOKENS.fontSize.sm,
                    cursor: 'pointer'
                  }}
                  aria-label={`${mode} view`}
                >
                  {mode === 'list' ? '☰' : mode === 'grid' ? '⊞' : '⊟'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active filters display */}
        {(state.selectedCategory || state.selectedStatus || state.selectedTags.length > 0) && (
          <div style={{
            marginTop: TOKENS.spacing.md,
            display: 'flex',
            gap: TOKENS.spacing.xs,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <span style={{ 
              fontSize: TOKENS.fontSize.sm,
              color: TOKENS.colors.muted 
            }}>
              Active filters:
            </span>
            
            {state.selectedCategory && (
              <span style={{
                padding: `${TOKENS.spacing.xs} ${TOKENS.spacing.sm}`,
                backgroundColor: TOKENS.colors.primary + '20',
                color: TOKENS.colors.primary,
                borderRadius: TOKENS.radius,
                fontSize: TOKENS.fontSize.xs,
                display: 'flex',
                alignItems: 'center',
                gap: TOKENS.spacing.xs
              }}>
                Category: {state.selectedCategory}
                <button
                  onClick={() => setState(prev => ({ ...prev, selectedCategory: '' }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  aria-label="Remove category filter"
                >
                  ✕
                </button>
              </span>
            )}
            
            {state.selectedStatus && (
              <span style={{
                padding: `${TOKENS.spacing.xs} ${TOKENS.spacing.sm}`,
                backgroundColor: TOKENS.colors.primary + '20',
                color: TOKENS.colors.primary,
                borderRadius: TOKENS.radius,
                fontSize: TOKENS.fontSize.xs,
                display: 'flex',
                alignItems: 'center',
                gap: TOKENS.spacing.xs
              }}>
                Status: {state.selectedStatus}
                <button
                  onClick={() => setState(prev => ({ ...prev, selectedStatus: '' }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  aria-label="Remove status filter"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render bulk actions
  const renderBulkActions = () => {
    if (!showBulkActions || state.selectedDocuments.size === 0) return null;

    return (
      <div style={{
        padding: TOKENS.spacing.md,
        borderBottom: `1px solid ${TOKENS.colors.border}`,
        backgroundColor: TOKENS.colors.primary + '10',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ 
          fontSize: TOKENS.fontSize.sm,
          color: TOKENS.colors.foreground 
        }}>
          {state.selectedDocuments.size} document(s) selected
        </span>
        
        <div style={{ display: 'flex', gap: TOKENS.spacing.sm }}>
          {allowDelete && (
            <button
              onClick={() => {
                // Handle bulk delete
                state.selectedDocuments.forEach(id => onDelete?.(id));
                setState(prev => ({ ...prev, selectedDocuments: new Set() }));
              }}
              style={{
                padding: `${TOKENS.spacing.xs} ${TOKENS.spacing.sm}`,
                backgroundColor: TOKENS.colors.destructive,
                color: 'white',
                border: 'none',
                borderRadius: TOKENS.radius,
                fontSize: TOKENS.fontSize.sm,
                cursor: 'pointer'
              }}
            >
              Delete Selected
            </button>
          )}
          
          <button
            onClick={() => setState(prev => ({ ...prev, selectedDocuments: new Set() }))}
            style={{
              padding: `${TOKENS.spacing.xs} ${TOKENS.spacing.sm}`,
              backgroundColor: 'transparent',
              color: TOKENS.colors.muted,
              border: `1px solid ${TOKENS.colors.border}`,
              borderRadius: TOKENS.radius,
              fontSize: TOKENS.fontSize.sm,
              cursor: 'pointer'
            }}
          >
            Clear Selection
          </button>
        </div>
      </div>
    );
  };

  // Render document list
  const renderDocumentList = () => {
    if (filteredDocuments.length === 0) {
      return (
        <div style={{
          padding: TOKENS.spacing.lg,
          textAlign: 'center',
          color: TOKENS.colors.muted
        }}>
          {documents.length === 0 ? (
            <>
              <div style={{ fontSize: '3rem', marginBottom: TOKENS.spacing.md }}>📁</div>
              <div style={{ fontSize: TOKENS.fontSize.base, marginBottom: TOKENS.spacing.sm }}>
                No documents uploaded yet
              </div>
              <div style={{ fontSize: TOKENS.fontSize.sm }}>
                {allowUpload ? 'Upload your first document to get started' : 'No documents available'}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2rem', marginBottom: TOKENS.spacing.md }}>🔍</div>
              <div style={{ fontSize: TOKENS.fontSize.base, marginBottom: TOKENS.spacing.sm }}>
                No documents match your filters
              </div>
              <div style={{ fontSize: TOKENS.fontSize.sm }}>
                Try adjusting your search or filter criteria
              </div>
            </>
          )}
        </div>
      );
    }

    const itemStyle = {
      padding: TOKENS.spacing.md,
      borderBottom: `1px solid ${TOKENS.colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: TOKENS.spacing.md,
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      ':hover': {
        backgroundColor: TOKENS.colors.muted + '10'
      }
    };

    return (
      <div>
        {/* Select all header */}
        {showBulkActions && (
          <div style={{
            padding: TOKENS.spacing.md,
            borderBottom: `1px solid ${TOKENS.colors.border}`,
            backgroundColor: TOKENS.colors.muted + '05',
            display: 'flex',
            alignItems: 'center',
            gap: TOKENS.spacing.md
          }}>
            <input
              type="checkbox"
              checked={state.selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              aria-label="Select all documents"
            />
            <span style={{ 
              fontSize: TOKENS.fontSize.sm,
              fontWeight: TOKENS.fontWeight.medium,
              color: TOKENS.colors.foreground 
            }}>
              Select All ({filteredDocuments.length})
            </span>
          </div>
        )}

        {/* Document items */}
        {filteredDocuments.map(doc => (
          <div
            key={doc.id}
            style={itemStyle}
            onClick={() => onPreview?.(doc.id)}
          >
            {showBulkActions && (
              <input
                type="checkbox"
                checked={state.selectedDocuments.has(doc.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleDocumentSelect(doc.id, e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${doc.filename}`}
              />
            )}
            
            <div style={{ fontSize: '1.5rem' }}>
              {getFileIcon(doc.mimeType)}
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: TOKENS.fontSize.base,
                fontWeight: TOKENS.fontWeight.medium,
                color: TOKENS.colors.foreground,
                marginBottom: TOKENS.spacing.xs,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {doc.filename}
              </div>
              
              <div style={{
                fontSize: TOKENS.fontSize.sm,
                color: TOKENS.colors.muted,
                display: 'flex',
                gap: TOKENS.spacing.md,
                flexWrap: 'wrap'
              }}>
                <span>{doc.category}</span>
                <span>{formatFileSize(doc.fileSize)}</span>
                <span>{formatDate(doc.createdAt)}</span>
                {doc.uploadedByName && <span>by {doc.uploadedByName}</span>}
              </div>
              
              {doc.tags && doc.tags.length > 0 && (
                <div style={{
                  marginTop: TOKENS.spacing.xs,
                  display: 'flex',
                  gap: TOKENS.spacing.xs,
                  flexWrap: 'wrap'
                }}>
                  {doc.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        padding: `2px ${TOKENS.spacing.xs}`,
                        backgroundColor: TOKENS.colors.primary + '20',
                        color: TOKENS.colors.primary,
                        borderRadius: TOKENS.radius,
                        fontSize: TOKENS.fontSize.xs
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              gap: TOKENS.spacing.xs
            }}>
              {onDownload && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(doc.id);
                  }}
                  style={{
                    padding: TOKENS.spacing.xs,
                    backgroundColor: 'transparent',
                    color: TOKENS.colors.muted,
                    border: `1px solid ${TOKENS.colors.border}`,
                    borderRadius: TOKENS.radius,
                    fontSize: TOKENS.fontSize.sm,
                    cursor: 'pointer'
                  }}
                  aria-label={`Download ${doc.filename}`}
                >
                  ⬇️
                </button>
              )}
              
              {allowDelete && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(doc.id);
                  }}
                  style={{
                    padding: TOKENS.spacing.xs,
                    backgroundColor: 'transparent',
                    color: TOKENS.colors.destructive,
                    border: `1px solid ${TOKENS.colors.destructive}`,
                    borderRadius: TOKENS.radius,
                    fontSize: TOKENS.fontSize.sm,
                    cursor: 'pointer'
                  }}
                  aria-label={`Delete ${doc.filename}`}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className} style={{
      border: `1px solid ${TOKENS.colors.border}`,
      borderRadius: TOKENS.radius,
      backgroundColor: TOKENS.colorBg,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: TOKENS.spacing.md,
        borderBottom: `1px solid ${TOKENS.colors.border}`,
        backgroundColor: TOKENS.colors.muted + '05',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: TOKENS.fontSize.base,
          fontWeight: TOKENS.fontWeight.medium,
          color: TOKENS.colors.foreground
        }}>
          Documents ({filteredDocuments.length})
        </h3>
        
        {allowUpload && (
          <div style={{ fontSize: TOKENS.fontSize.sm }}>
            {state.isUploading ? 'Uploading...' : 'Ready for upload'}
          </div>
        )}
      </div>

      {/* File Upload */}
      {allowUpload && (
        <div style={{ padding: TOKENS.spacing.md, borderBottom: `1px solid ${TOKENS.colors.border}` }}>
          <FileUpload
            onFileSelect={handleFileUpload}
            disabled={state.isUploading}
          />
        </div>
      )}

      {/* Search and Filters */}
      {renderSearchAndFilters()}

      {/* Bulk Actions */}
      {renderBulkActions()}

      {/* Document List */}
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {renderDocumentList()}
      </div>

      {/* Preview Modal */}
      {state.previewDocument && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: TOKENS.spacing.lg
        }}>
          <DocumentPreview
            url={state.previewDocument.storageUrl}
            filename={state.previewDocument.filename}
            mimeType={state.previewDocument.mimeType}
            fileSize={state.previewDocument.fileSize}
            onClose={() => setState(prev => ({ ...prev, previewDocument: null }))}
            onDownload={() => onDownload?.(state.previewDocument!.id)}
            maxWidth="90vw"
            maxHeight="90vh"
          />
        </div>
      )}
    </div>
  );
}

export default DocumentManager;
