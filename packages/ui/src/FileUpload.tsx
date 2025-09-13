import * as React from "react";
import { cn } from "./utils";

// SSOT Compliant File Upload Component with Drag-and-Drop
// Uses semantic tokens throughout, no inline styles

export interface FileUploadProps {
  onFileSelect?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (results: Array<{ success: boolean; filename: string; error?: string }>) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface FileUploadState {
  isDragOver: boolean;
  isUploading: boolean;
  uploadProgress: number;
  selectedFiles: File[];
  errors: string[];
}

export function FileUpload({
  onFileSelect,
  onUpload,
  onUploadProgress,
  onUploadComplete,
  accept = "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt",
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10,
  disabled = false,
  className = "",
  children
}: FileUploadProps) {
  const [state, setState] = React.useState<FileUploadState>({
    isDragOver: false,
    isUploading: false,
    uploadProgress: 0,
    selectedFiles: [],
    errors: []
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dropZoneRef = React.useRef<HTMLDivElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFiles = (files: FileList | File[]): { validFiles: File[]; errors: string[] } => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Check file count
    if (fileArray.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
    }

    // Check each file
    fileArray.forEach((file, index) => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name} is too large (max ${formatFileSize(maxSize)})`);
        return;
      }

      // Check file type if accept is specified
      if (accept && accept !== "*/*") {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const mimeType = file.type;

        const isAccepted = acceptedTypes.some(acceptedType => {
          if (acceptedType.startsWith('.')) {
            return fileExtension === acceptedType;
          } else if (acceptedType.includes('*')) {
            return mimeType.startsWith(acceptedType.replace('*', ''));
          } else {
            return mimeType === acceptedType;
          }
        });

        if (!isAccepted) {
          errors.push(`${file.name} is not an accepted file type`);
          return;
        }
      }

      validFiles.push(file);
    });

    return { validFiles, errors };
  };

  const handleFiles = async (files: FileList | File[]) => {
    const { validFiles, errors } = validateFiles(files);

    if (errors.length > 0) {
      setState(prev => ({ ...prev, errors }));
      return;
    }

    setState(prev => ({ ...prev, selectedFiles: validFiles, errors: [] }));

    if (onFileSelect) {
      onFileSelect(validFiles);
    }

    if (onUpload) {
      setState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }));

      try {
        await onUpload(validFiles);
        setState(prev => ({ ...prev, isUploading: false, uploadProgress: 100 }));

        if (onUploadComplete) {
          onUploadComplete(validFiles.map(file => ({ success: true, filename: file.name })));
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          isUploading: false,
          errors: [`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }));

        if (onUploadComplete) {
          onUploadComplete(validFiles.map(file => ({
            success: false,
            filename: file.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          })));
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setState(prev => ({ ...prev, isDragOver: true }));
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setState(prev => ({ ...prev, isDragOver: false }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    setState(prev => ({ ...prev, isDragOver: false }));

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = (index: number) => {
    setState(prev => ({
      ...prev,
      selectedFiles: prev.selectedFiles.filter((_, i) => i !== index)
    }));
  };

  const clearFiles = () => {
    setState(prev => ({
      ...prev,
      selectedFiles: [],
      errors: []
    }));
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          state.isDragOver
            ? "border-[var(--sys-accent)] bg-[var(--sys-accent)]/10"
            : "border-[var(--sys-border-hairline)] hover:border-[var(--sys-accent)] hover:bg-[var(--sys-bg-subtle)]",
          disabled && "opacity-50 cursor-not-allowed",
          state.isUploading && "pointer-events-none"
        )}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="File upload area"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
          aria-label="File upload input"
        />

        {state.isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--sys-accent)] mx-auto"></div>
            <div className="text-[var(--sys-text-primary)] font-medium">
              Uploading... {state.uploadProgress}%
            </div>
            <div className="w-full bg-[var(--sys-bg-subtle)] rounded-full h-2">
              <div
                className="bg-[var(--sys-accent)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <div>
              <div className="text-lg font-medium text-[var(--sys-text-primary)] mb-1">
                {children || "Drop files here or click to browse"}
              </div>
              <div className="text-sm text-[var(--sys-text-secondary)]">
                {accept === "*/*" ? "Any file type" : `Accepted: ${accept}`} •
                Max size: {formatFileSize(maxSize)} •
                Max files: {maxFiles}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Files */}
      {state.selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--sys-text-primary)]">
              Selected Files ({state.selectedFiles.length})
            </h3>
            <button
              onClick={clearFiles}
              className="text-sm text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] rounded"
              aria-label="Clear all files"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {state.selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[var(--sys-bg-subtle)] rounded">
                <div className="flex items-center gap-3">
                  <div className="text-lg">📄</div>
                  <div>
                    <div className="text-sm font-medium text-[var(--sys-text-primary)]">
                      {file.name}
                    </div>
                    <div className="text-xs text-[var(--sys-text-secondary)]">
                      {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-[var(--sys-text-secondary)] hover:text-[var(--sys-status-error)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-error)] rounded"
                  aria-label={`Remove ${file.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {state.errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {state.errors.map((error, index) => (
            <div key={index} className="p-3 bg-[var(--sys-status-error)]/10 border border-[var(--sys-status-error)]/20 rounded text-sm text-[var(--sys-status-error)]">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;