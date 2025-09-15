import * as React from "react";
import { FileUpload } from "./FileUpload.js";
import { DocumentPreview } from "./DocumentPreview.js";
import { cn } from "./utils.js";

// SSOT Compliant Document Management Interface
// Uses semantic tokens throughout, no inline styles

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
  showSearch?: boolean;
  showFilters?: boolean;
  showUpload?: boolean;
  showPreview?: boolean;
  className?: string;
}

interface DocumentManagerState {
  searchQuery: string;
  selectedCategory: string;
  selectedStatus: string;
  selectedTags: string[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  selectedDocuments: Set<string>;
  previewDocument: DocumentItem | null;
  showPreview: boolean;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  onUpload,
  onDelete,
  onUpdate,
  onDownload,
  onPreview,
  showSearch = true,
  showFilters = true,
  showUpload = true,
  showPreview = true,
  className,
}) => {
  const [state, setState] = React.useState<DocumentManagerState>({
    searchQuery: "",
    selectedCategory: "all",
    selectedStatus: "all",
    selectedTags: [],
    sortBy: "createdAt",
    sortOrder: "desc",
    selectedDocuments: new Set(),
    previewDocument: null,
    showPreview: false,
  });

  // Filter and sort documents
  const filteredDocuments = React.useMemo(() => {
    let filtered = documents.filter(doc => {
      // Search filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        if (
          !doc.filename.toLowerCase().includes(query) &&
          !doc.originalFilename.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Category filter
      if (state.selectedCategory !== "all" && doc.category !== state.selectedCategory) {
        return false;
      }

      // Status filter
      if (state.selectedStatus !== "all" && doc.status !== state.selectedStatus) {
        return false;
      }

      // Tags filter
      if (state.selectedTags.length > 0) {
        const hasMatchingTag = state.selectedTags.some(tag => doc.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: any = a[state.sortBy as keyof DocumentItem];
      let bValue: any = b[state.sortBy as keyof DocumentItem];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (state.sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [documents, state]);

  // Get unique categories and tags
  const categories = React.useMemo(() => {
    const cats = new Set(documents.map(doc => doc.category));
    return Array.from(cats).sort();
  }, [documents]);

  const tags = React.useMemo(() => {
    const allTags = documents.flatMap(doc => doc.tags);
    return Array.from(new Set(allTags)).sort();
  }, [documents]);

  const statuses = React.useMemo(() => {
    const stats = new Set(documents.map(doc => doc.status));
    return Array.from(stats).sort();
  }, [documents]);

  // Event handlers
  const handleUpload = async (files: File[]) => {
    if (onUpload) {
      await onUpload(files);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (onDelete) {
      await onDelete(documentId);
    }
  };

  const handleDownload = async (documentId: string) => {
    if (onDownload) {
      await onDownload(documentId);
    }
  };

  const handlePreview = (document: DocumentItem) => {
    setState(prev => ({ ...prev, previewDocument: document, showPreview: true }));
    if (onPreview) {
      onPreview(document.id);
    }
  };

  const handleSelectDocument = (documentId: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedDocuments);
      if (newSelected.has(documentId)) {
        newSelected.delete(documentId);
      } else {
        newSelected.add(documentId);
      }
      return { ...prev, selectedDocuments: newSelected };
    });
  };

  const handleSelectAll = () => {
    setState(prev => ({
      ...prev,
      selectedDocuments:
        prev.selectedDocuments.size === filteredDocuments.length
          ? new Set()
          : new Set(filteredDocuments.map(doc => doc.id)),
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: "bg-[var(--sys-status-success)] text-white",
      pending: "bg-[var(--sys-status-warning)] text-white",
      rejected: "bg-[var(--sys-status-error)] text-white",
      archived: "bg-[var(--sys-bg-subtle)] text-[var(--sys-text-secondary)]",
    };

    return (
      <span
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-full",
          statusClasses[status as keyof typeof statusClasses] ||
          "bg-[var(--sys-bg-subtle)] text-[var(--sys-text-secondary)]",
        )}
      >
        {status}
      </span>
    );
  };

  // Render search and filters
  const renderSearchAndFilters = () => {
    if (!showSearch && !showFilters) return null;

    return (
      <div className="p-4 border-b border-[var(--sys-border-hairline)] bg-[var(--sys-bg-subtle)]">
        {/* Search */}
        {showSearch && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search documents..."
              value={state.searchQuery}
              onChange={e => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              aria-label="Search documents"
            />
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-4">
            <select
              value={state.selectedCategory}
              onChange={e => setState(prev => ({ ...prev, selectedCategory: e.target.value }))}
              className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={state.selectedStatus}
              onChange={e => setState(prev => ({ ...prev, selectedStatus: e.target.value }))}
              className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={state.sortBy}
              onChange={e => setState(prev => ({ ...prev, sortBy: e.target.value }))}
              className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              aria-label="Sort by"
            >
              <option value="createdAt">Date Created</option>
              <option value="filename">Filename</option>
              <option value="fileSize">File Size</option>
              <option value="category">Category</option>
            </select>

            <button
              onClick={() =>
                setState(prev => ({
                  ...prev,
                  sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
                }))
              }
              className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              aria-label={`Sort ${state.sortOrder === "asc" ? "descending" : "ascending"}`}
            >
              {state.sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render document list
  const renderDocumentList = () => {
    if (filteredDocuments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">📁</div>
          <div className="text-lg font-medium text-[var(--sys-text-primary)] mb-2">
            No documents found
          </div>
          <div className="text-sm text-[var(--sys-text-secondary)]">
            {state.searchQuery || state.selectedCategory !== "all" || state.selectedStatus !== "all"
              ? "Try adjusting your search or filters"
              : "Upload your first document to get started"}
          </div>
        </div>
      );
    }

    return (
      <div className="divide-y divide-[var(--sys-border-hairline)]">
        {/* Header */}
        <div className="px-4 py-3 bg-[var(--sys-bg-subtle)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={
                  state.selectedDocuments.size === filteredDocuments.length &&
                  filteredDocuments.length > 0
                }
                onChange={handleSelectAll}
                className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                aria-label="Select all documents"
              />
              <span className="text-sm font-medium text-[var(--sys-text-primary)]">
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""}
              </span>
            </div>
            {state.selectedDocuments.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--sys-text-secondary)]">
                  {state.selectedDocuments.size} selected
                </span>
                <button
                  onClick={() => {
                    state.selectedDocuments.forEach(id => handleDelete(id));
                    setState(prev => ({ ...prev, selectedDocuments: new Set() }));
                  }}
                  className="px-3 py-1 text-sm bg-[var(--sys-status-error)] text-white rounded hover:bg-[var(--sys-status-error)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-error)]"
                  aria-label="Delete selected documents"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Document items */}
        {filteredDocuments.map(document => (
          <div key={document.id} className="px-4 py-3 hover:bg-[var(--sys-bg-subtle)]">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={state.selectedDocuments.has(document.id)}
                onChange={() => handleSelectDocument(document.id)}
                className="h-4 w-4 text-[var(--sys-accent)] border-[var(--sys-border-hairline)] rounded focus:ring-[var(--sys-accent)]"
                aria-label={`Select ${document.filename}`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-lg">📄</div>
                  <div className="font-medium text-[var(--sys-text-primary)] truncate">
                    {document.filename}
                  </div>
                  {getStatusBadge(document.status)}
                </div>

                <div className="flex items-center gap-4 text-sm text-[var(--sys-text-secondary)]">
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>{document.category}</span>
                  <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                  {document.tags.length > 0 && (
                    <div className="flex gap-1">
                      {document.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-[var(--sys-bg-subtle)] rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {document.tags.length > 3 && (
                        <span className="text-xs">+{document.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {showPreview && (
                  <button
                    onClick={() => handlePreview(document)}
                    className="px-3 py-1 text-sm border border-[var(--sys-border-hairline)] rounded hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                    aria-label={`Preview ${document.filename}`}
                  >
                    Preview
                  </button>
                )}
                <button
                  onClick={() => handleDownload(document.id)}
                  className="px-3 py-1 text-sm bg-[var(--sys-accent)] text-white rounded hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                  aria-label={`Download ${document.filename}`}
                >
                  Download
                </button>
                <button
                  onClick={() => handleDelete(document.id)}
                  className="px-3 py-1 text-sm bg-[var(--sys-status-error)] text-white rounded hover:bg-[var(--sys-status-error)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-error)]"
                  aria-label={`Delete ${document.filename}`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg",
        className,
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--sys-border-hairline)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--sys-text-primary)]">Document Manager</h2>
          {showUpload && (
            <FileUpload
              onUpload={handleUpload}
              accept="*/*"
              multiple
              className="px-4 py-2 bg-[var(--sys-accent)] text-white rounded hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
            />
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {renderSearchAndFilters()}

      {/* Document List */}
      {renderDocumentList()}

      {/* Preview Modal */}
      {state.showPreview && state.previewDocument && (
        <DocumentPreview
          url={state.previewDocument.storageUrl}
          filename={state.previewDocument.filename}
          mimeType={state.previewDocument.mimeType}
          fileSize={state.previewDocument.fileSize}
          onClose={() => setState(prev => ({ ...prev, showPreview: false, previewDocument: null }))}
          onDownload={() => state.previewDocument && handleDownload(state.previewDocument.id)}
        />
      )}
    </div>
  );
};

export default DocumentManager;
