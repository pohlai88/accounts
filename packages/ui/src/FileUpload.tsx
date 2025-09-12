import * as React from "react";
import { TOKENS } from "./tokens";

// V1 Compliance: File Upload Component with Drag-and-Drop
// Follows token-based design system, dark-theme first, WCAG 2.2 AAA

export interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
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

  // File validation
  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { valid, errors };
    }

    for (const file of files) {
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
        continue;
      }

      // Check file type if accept is specified
      if (accept && accept !== "*/*") {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type.match(type.replace('*', '.*'));
        });

        if (!isAccepted) {
          errors.push(`${file.name}: File type not supported`);
          continue;
        }
      }

      valid.push(file);
    }

    return { valid, errors };
  };

  // Handle file selection
  const handleFileSelect = (files: File[]) => {
    const { valid, errors } = validateFiles(files);
    
    setState(prev => ({
      ...prev,
      selectedFiles: valid,
      errors
    }));

    if (valid.length > 0) {
      onFileSelect(valid);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setState(prev => ({ ...prev, isDragOver: true }));
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set isDragOver to false if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setState(prev => ({ ...prev, isDragOver: false }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setState(prev => ({ ...prev, isDragOver: false }));
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  // File input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileSelect(files);
    }
  };

  // Click to select files
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      handleClick();
    }
  };

  // Progress update effect
  React.useEffect(() => {
    if (onUploadProgress) {
      onUploadProgress(state.uploadProgress);
    }
  }, [state.uploadProgress, onUploadProgress]);

  const baseStyles = {
    border: `2px dashed ${state.isDragOver ? TOKENS.colors.primary : TOKENS.colors.border}`,
    borderRadius: TOKENS.radius,
    padding: TOKENS.spacing.lg,
    textAlign: 'center' as const,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    backgroundColor: state.isDragOver 
      ? `${TOKENS.colors.primary}10` 
      : disabled 
        ? TOKENS.colors.muted 
        : 'transparent',
    opacity: disabled ? 0.6 : 1,
    outline: 'none',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: TOKENS.spacing.sm
  };

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
        aria-label="File upload input"
      />
      
      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        style={baseStyles}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={`Upload files. ${multiple ? 'Multiple files' : 'Single file'} supported. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`}
        aria-describedby="file-upload-help"
      >
        {children || (
          <>
            <div style={{ 
              fontSize: '2rem', 
              color: TOKENS.colors.muted,
              marginBottom: TOKENS.spacing.xs 
            }}>
              📁
            </div>
            <div style={{ 
              fontSize: TOKENS.fontSize.base,
              fontWeight: TOKENS.fontWeight.medium,
              color: TOKENS.colors.foreground,
              marginBottom: TOKENS.spacing.xs
            }}>
              {state.isDragOver ? 'Drop files here' : 'Drag & drop files here'}
            </div>
            <div style={{ 
              fontSize: TOKENS.fontSize.sm,
              color: TOKENS.colors.muted 
            }}>
              or click to browse
            </div>
          </>
        )}
      </div>

      {/* Help text */}
      <div 
        id="file-upload-help"
        style={{ 
          fontSize: TOKENS.fontSize.xs,
          color: TOKENS.colors.muted,
          marginTop: TOKENS.spacing.xs,
          textAlign: 'center' as const
        }}
      >
        {multiple ? `Up to ${maxFiles} files` : 'Single file'}, 
        max {Math.round(maxSize / 1024 / 1024)}MB each
      </div>

      {/* Upload progress */}
      {state.isUploading && (
        <div style={{ marginTop: TOKENS.spacing.sm }}>
          <div style={{ 
            fontSize: TOKENS.fontSize.sm,
            color: TOKENS.colors.foreground,
            marginBottom: TOKENS.spacing.xs
          }}>
            Uploading... {Math.round(state.uploadProgress)}%
          </div>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: TOKENS.colors.muted,
            borderRadius: TOKENS.radius,
            overflow: 'hidden'
          }}>
            <div
              style={{
                width: `${state.uploadProgress}%`,
                height: '100%',
                backgroundColor: TOKENS.colors.primary,
                transition: 'width 0.3s ease-in-out'
              }}
              role="progressbar"
              aria-valuenow={state.uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Upload progress: ${Math.round(state.uploadProgress)}%`}
            />
          </div>
        </div>
      )}

      {/* Selected files */}
      {state.selectedFiles.length > 0 && (
        <div style={{ marginTop: TOKENS.spacing.sm }}>
          <div style={{ 
            fontSize: TOKENS.fontSize.sm,
            fontWeight: TOKENS.fontWeight.medium,
            color: TOKENS.colors.foreground,
            marginBottom: TOKENS.spacing.xs
          }}>
            Selected Files ({state.selectedFiles.length})
          </div>
          <div style={{ 
            maxHeight: '120px',
            overflowY: 'auto',
            border: `1px solid ${TOKENS.colors.border}`,
            borderRadius: TOKENS.radius,
            padding: TOKENS.spacing.xs
          }}>
            {state.selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: TOKENS.spacing.xs,
                  borderBottom: index < state.selectedFiles.length - 1 ? `1px solid ${TOKENS.colors.border}` : 'none'
                }}
              >
                <div style={{ 
                  fontSize: TOKENS.fontSize.sm,
                  color: TOKENS.colors.foreground,
                  flex: 1,
                  textAlign: 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {file.name}
                </div>
                <div style={{ 
                  fontSize: TOKENS.fontSize.xs,
                  color: TOKENS.colors.muted,
                  marginLeft: TOKENS.spacing.sm
                }}>
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {state.errors.length > 0 && (
        <div style={{ marginTop: TOKENS.spacing.sm }}>
          <div style={{ 
            fontSize: TOKENS.fontSize.sm,
            fontWeight: TOKENS.fontWeight.medium,
            color: TOKENS.colors.destructive,
            marginBottom: TOKENS.spacing.xs
          }}>
            Upload Errors
          </div>
          <div style={{ 
            padding: TOKENS.spacing.sm,
            backgroundColor: `${TOKENS.colors.destructive}10`,
            border: `1px solid ${TOKENS.colors.destructive}`,
            borderRadius: TOKENS.radius
          }}>
            {state.errors.map((error, index) => (
              <div
                key={index}
                style={{
                  fontSize: TOKENS.fontSize.sm,
                  color: TOKENS.colors.destructive,
                  marginBottom: index < state.errors.length - 1 ? TOKENS.spacing.xs : 0
                }}
              >
                • {error}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export for convenience
export default FileUpload;
