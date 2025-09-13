import * as React from "react";
import { cn } from "./utils";

// SSOT Compliant Document Preview Component
// Uses semantic tokens throughout, no inline styles

export interface DocumentPreviewProps {
  file?: File;
  url?: string;
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  onClose?: () => void;
  onDownload?: () => void;
  className?: string;
  maxWidth?: string;
  maxHeight?: string;
}

export function DocumentPreview({
  file,
  url,
  filename,
  mimeType,
  fileSize,
  onClose,
  onDownload,
  className = "",
  maxWidth = "800px",
  maxHeight = "600px"
}: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  // Determine file type and create preview URL
  React.useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (url) {
      setPreviewUrl(url);
    }
  }, [file, url]);

  const displayFilename = filename || file?.name || "Unknown file";
  const displayMimeType = mimeType || file?.type || "application/octet-stream";
  const displayFileSize = fileSize || file?.size || 0;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    return '📄';
  };

  const canPreview = () => {
    const previewableTypes = [
      'image/',
      'video/',
      'audio/',
      'application/pdf',
      'text/'
    ];
    return previewableTypes.some(type => displayMimeType.startsWith(type));
  };

  const renderPreview = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-4xl mb-2">❌</div>
          <div className="text-[var(--sys-text-primary)] font-medium mb-1">
            Preview Error
          </div>
          <div className="text-sm text-[var(--sys-text-secondary)]">
            {error}
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--sys-accent)] mb-2"></div>
          <div className="text-[var(--sys-text-primary)] font-medium">
            Loading preview...
          </div>
        </div>
      );
    }

    if (!canPreview()) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-6xl mb-4">{getFileIcon(displayMimeType)}</div>
          <div className="text-[var(--sys-text-primary)] font-medium mb-2">
            {displayFilename}
          </div>
          <div className="text-sm text-[var(--sys-text-secondary)]">
            Preview not available for this file type
          </div>
        </div>
      );
    }

    // Image preview
    if (displayMimeType.startsWith('image/')) {
      return (
        <img
          src={previewUrl}
          alt={displayFilename}
          className="max-w-full max-h-full object-contain"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError('Failed to load image');
          }}
        />
      );
    }

    // Video preview
    if (displayMimeType.startsWith('video/')) {
      return (
        <video
          src={previewUrl}
          controls
          className="max-w-full max-h-full"
          onLoadStart={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError('Failed to load video');
          }}
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    // Audio preview
    if (displayMimeType.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-6xl mb-4">🎵</div>
          <audio
            src={previewUrl}
            controls
            className="w-full max-w-md"
            onLoadStart={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load audio');
            }}
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    // PDF preview (iframe)
    if (displayMimeType === 'application/pdf') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          title={displayFilename}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError('Failed to load PDF');
          }}
        />
      );
    }

    // Text preview
    if (displayMimeType.startsWith('text/')) {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          title={displayFilename}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError('Failed to load text file');
          }}
        />
      );
    }

    return null;
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50",
      className
    )}>
      <div
        className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg shadow-lg max-w-4xl max-h-screen w-full mx-4 flex flex-col"
        style={{ maxWidth, maxHeight }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--sys-border-hairline)]">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getFileIcon(displayMimeType)}</div>
            <div>
              <h2 id="preview-title" className="text-lg font-semibold text-[var(--sys-text-primary)]">
                {displayFilename}
              </h2>
              <div className="text-sm text-[var(--sys-text-secondary)]">
                {displayMimeType} • {formatFileSize(displayFileSize)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="px-3 py-2 bg-[var(--sys-accent)] text-white rounded hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                aria-label={`Download ${displayFilename}`}
              >
                Download
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)] hover:bg-[var(--sys-bg-subtle)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                aria-label="Close preview"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="flex items-center justify-center min-h-96">
            {renderPreview()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--sys-border-hairline)] bg-[var(--sys-bg-subtle)]">
          <div className="flex items-center justify-between text-sm text-[var(--sys-text-secondary)]">
            <div>
              File: {displayFilename}
            </div>
            <div>
              Size: {formatFileSize(displayFileSize)} • Type: {displayMimeType}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentPreview;