import * as React from "react";
import { TOKENS } from "./tokens";

// V1 Compliance: Document Preview Component
// Supports multiple file types with accessibility and dark-theme first design

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

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Get file type category
  const getFileTypeCategory = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('text/')) return 'text';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
    return 'other';
  };

  // Get file icon
  const getFileIcon = (mimeType: string): string => {
    const category = getFileTypeCategory(mimeType);
    switch (category) {
      case 'image': return '🖼️';
      case 'pdf': return '📄';
      case 'text': return '📝';
      case 'spreadsheet': return '📊';
      case 'document': return '📋';
      default: return '📎';
    }
  };

  // Render preview content based on file type
  const renderPreviewContent = () => {
    if (!previewUrl) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: TOKENS.colors.muted
        }}>
          <div style={{ fontSize: '3rem', marginBottom: TOKENS.spacing.sm }}>
            {getFileIcon(displayMimeType)}
          </div>
          <div>No preview available</div>
        </div>
      );
    }

    const category = getFileTypeCategory(displayMimeType);

    switch (category) {
      case 'image':
        return (
          <img
            src={previewUrl}
            alt={displayFilename}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: TOKENS.radius
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError('Failed to load image');
              setIsLoading(false);
            }}
          />
        );

      case 'pdf':
        return (
          <iframe
            src={previewUrl}
            title={displayFilename}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: TOKENS.radius
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError('Failed to load PDF');
              setIsLoading(false);
            }}
          />
        );

      case 'text':
        return (
          <div style={{
            width: '100%',
            height: '100%',
            padding: TOKENS.spacing.md,
            backgroundColor: TOKENS.colors.muted + '10',
            borderRadius: TOKENS.radius,
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: TOKENS.fontSize.sm,
            lineHeight: '1.5'
          }}>
            <TextFilePreview url={previewUrl} />
          </div>
        );

      default:
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            padding: TOKENS.spacing.lg,
            backgroundColor: TOKENS.colors.muted + '10',
            borderRadius: TOKENS.radius,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: TOKENS.spacing.sm }}>
              {getFileIcon(displayMimeType)}
            </div>
            <div style={{ 
              fontSize: TOKENS.fontSize.base,
              fontWeight: TOKENS.fontWeight.medium,
              color: TOKENS.colors.foreground,
              marginBottom: TOKENS.spacing.xs
            }}>
              {displayFilename}
            </div>
            <div style={{ 
              fontSize: TOKENS.fontSize.sm,
              color: TOKENS.colors.muted,
              marginBottom: TOKENS.spacing.sm
            }}>
              {displayMimeType} • {formatFileSize(displayFileSize)}
            </div>
            <div style={{ 
              fontSize: TOKENS.fontSize.sm,
              color: TOKENS.colors.muted
            }}>
              Preview not available for this file type
            </div>
          </div>
        );
    }
  };

  const containerStyles = {
    maxWidth,
    maxHeight,
    border: `1px solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.radius,
    backgroundColor: TOKENS.colorBg,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const
  };

  const headerStyles = {
    padding: TOKENS.spacing.md,
    borderBottom: `1px solid ${TOKENS.colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: TOKENS.colors.muted + '05'
  };

  const contentStyles = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: TOKENS.spacing.md,
    minHeight: '200px',
    position: 'relative' as const
  };

  return (
    <div className={className} style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: TOKENS.fontSize.base,
            fontWeight: TOKENS.fontWeight.medium,
            color: TOKENS.colors.foreground,
            marginBottom: TOKENS.spacing.xs,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {displayFilename}
          </div>
          <div style={{ 
            fontSize: TOKENS.fontSize.sm,
            color: TOKENS.colors.muted
          }}>
            {displayMimeType} • {formatFileSize(displayFileSize)}
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: TOKENS.spacing.sm,
          marginLeft: TOKENS.spacing.md
        }}>
          {onDownload && (
            <button
              onClick={onDownload}
              style={{
                padding: `${TOKENS.spacing.xs} ${TOKENS.spacing.sm}`,
                backgroundColor: TOKENS.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: TOKENS.radius,
                fontSize: TOKENS.fontSize.sm,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: TOKENS.spacing.xs
              }}
              aria-label={`Download ${displayFilename}`}
            >
              ⬇️ Download
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: TOKENS.spacing.xs,
                backgroundColor: 'transparent',
                color: TOKENS.colors.muted,
                border: `1px solid ${TOKENS.colors.border}`,
                borderRadius: TOKENS.radius,
                fontSize: TOKENS.fontSize.sm,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px'
              }}
              aria-label="Close preview"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={contentStyles}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: TOKENS.colors.muted
          }}>
            Loading...
          </div>
        )}
        
        {error ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: TOKENS.colors.destructive,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: TOKENS.spacing.sm }}>⚠️</div>
            <div>{error}</div>
          </div>
        ) : (
          renderPreviewContent()
        )}
      </div>
    </div>
  );
}

// Text file preview component
function TextFilePreview({ url }: { url: string }) {
  const [content, setContent] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    if (!url) return;

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch file');
        return response.text();
      })
      .then(text => {
        // Limit content length for performance
        const maxLength = 10000;
        const truncated = text.length > maxLength ? text.substring(0, maxLength) + '\n\n... (content truncated)' : text;
        setContent(truncated);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  if (loading) return <div>Loading text content...</div>;
  if (error) return <div style={{ color: TOKENS.colors.destructive }}>Error: {error}</div>;

  return (
    <pre style={{
      margin: 0,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      color: TOKENS.colors.foreground
    }}>
      {content}
    </pre>
  );
}

export default DocumentPreview;
