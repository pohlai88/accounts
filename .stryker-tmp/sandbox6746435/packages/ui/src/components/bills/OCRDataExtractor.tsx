// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  RefreshCw,
} from "lucide-react";
import { cn } from "@aibos/ui/utils";

export interface OCRExtractedData {
  vendor: string;
  amount: number;
  date: string;
  invoiceNumber: string;
  confidence: number;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  taxAmount?: number;
  totalAmount?: number;
}

export interface OCRProcessingResult {
  id: string;
  fileName: string;
  status: "processing" | "completed" | "failed";
  extractedData?: OCRExtractedData;
  error?: string;
  processedAt: string;
  confidence: number;
}

export interface OCRDataExtractorProps {
  className?: string;
  onDataExtracted?: (data: OCRExtractedData) => void;
  onProcessingComplete?: (result: OCRProcessingResult) => void;
  isLoading?: boolean;
}

export const OCRDataExtractor: React.FC<OCRDataExtractorProps> = ({
  className,
  onDataExtracted,
  onProcessingComplete,
  isLoading = false,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingResults, setProcessingResults] = useState<OCRProcessingResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Mock OCR processing function
  const processOCR = async (file: File): Promise<OCRProcessingResult> => {
    const result: OCRProcessingResult = {
      id: Date.now().toString() + Math.random(),
      fileName: file.name,
      status: "processing",
      processedAt: new Date().toISOString(),
      confidence: 0,
    };

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock extracted data based on file name
    const mockData: OCRExtractedData = {
      vendor: file.name.includes("amazon")
        ? "Amazon Web Services"
        : file.name.includes("office")
          ? "Office Depot"
          : file.name.includes("utilities")
            ? "City Utilities"
            : "Vendor Name",
      amount: Math.floor(Math.random() * 5000) + 100,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]!,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`,
      confidence: 0.85 + Math.random() * 0.15,
      lineItems: [
        {
          description: "Service or Product",
          quantity: 1,
          unitPrice: Math.floor(Math.random() * 1000) + 50,
          total: Math.floor(Math.random() * 1000) + 50,
        },
      ],
      taxAmount: Math.floor(Math.random() * 100) + 10,
      totalAmount: Math.floor(Math.random() * 5000) + 100,
    };

    return {
      ...result,
      status: "completed",
      extractedData: mockData,
      confidence: mockData.confidence,
    };
  };

  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    setUploadedFiles(prev => [...prev, ...fileArray]);

    setIsProcessing(true);

    for (const file of fileArray) {
      try {
        const result = await processOCR(file);
        setProcessingResults(prev => [...prev, result]);

        if (result.extractedData && onDataExtracted) {
          onDataExtracted(result.extractedData);
        }

        if (onProcessingComplete) {
          onProcessingComplete(result);
        }
      } catch (error) {
        const errorResult: OCRProcessingResult = {
          id: Date.now().toString() + Math.random(),
          fileName: file.name,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          processedAt: new Date().toISOString(),
          confidence: 0,
        };
        setProcessingResults(prev => [...prev, errorResult]);
      }
    }

    setIsProcessing(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const reprocessFile = async (fileName: string) => {
    const file = uploadedFiles.find(f => f.name === fileName);
    if (!file) return;

    setIsProcessing(true);
    try {
      const result = await processOCR(file);
      setProcessingResults(prev => prev.map(r => (r.fileName === fileName ? result : r)));

      if (result.extractedData && onDataExtracted) {
        onDataExtracted(result.extractedData);
      }
    } catch (error) {
      const errorResult: OCRProcessingResult = {
        id: Date.now().toString() + Math.random(),
        fileName: file.name,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        processedAt: new Date().toISOString(),
        confidence: 0,
      };
      setProcessingResults(prev => prev.map(r => (r.fileName === fileName ? errorResult : r)));
    }
    setIsProcessing(false);
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
    setProcessingResults(prev => prev.filter(r => r.fileName !== fileName));
  };

  const getStatusIcon = (status: OCRProcessingResult["status"]) => {
    switch (status) {
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-sys-status-info" aria-hidden="true" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-sys-status-success" aria-hidden="true" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-sys-status-error" aria-hidden="true" />;
    }
  };

  const getStatusColor = (status: OCRProcessingResult["status"]) => {
    switch (status) {
      case "processing":
        return "text-sys-status-info bg-sys-status-info/10";
      case "completed":
        return "text-sys-status-success bg-sys-status-success/10";
      case "failed":
        return "text-sys-status-error bg-sys-status-error/10";
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-4 bg-sys-fill-low rounded w-32"></div>
            <div className="h-8 bg-sys-fill-low rounded w-full"></div>
            <div className="h-4 bg-sys-fill-low rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-sys-status-info/10 rounded-lg">
          <Eye className="h-6 w-6 text-sys-status-info" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-sys-text-primary">OCR Data Extraction</h2>
          <p className="text-sm text-sys-text-tertiary">
            Upload bills and receipts for automatic data extraction
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive ? "border-sys-status-info bg-sys-status-info/5" : "border-sys-border-subtle",
            isProcessing && "opacity-50 pointer-events-none",
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 text-sys-text-tertiary mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-sys-text-primary mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-sm text-sys-text-secondary mb-4">
            Supports PDF, JPG, PNG, DOC, DOCX files up to 10MB
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={e => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            id="ocr-file-upload"
            disabled={isProcessing}
            aria-label="Upload files for OCR processing"
          />
          <label htmlFor="ocr-file-upload" className="btn btn-primary cursor-pointer">
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Processing...
              </>
            ) : (
              "Choose Files"
            )}
          </label>
        </div>
      </div>

      {/* Processing Results */}
      {processingResults.length > 0 && (
        <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
          <h3 className="text-lg font-medium text-sys-text-primary mb-4">Processing Results</h3>
          <div className="space-y-4">
            {processingResults.map(result => (
              <div key={result.id} className="border border-sys-border-hairline rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-sys-text-tertiary" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-sys-text-primary">{result.fileName}</p>
                      <p className="text-xs text-sys-text-tertiary">
                        Processed: {new Date(result.processedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getStatusColor(result.status),
                      )}
                    >
                      {result.status.replace("_", " ")}
                    </span>
                    {getStatusIcon(result.status)}
                  </div>
                </div>

                {result.status === "completed" && result.extractedData && (
                  <div className="bg-sys-fill-low rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-sys-text-tertiary mb-1">Vendor</p>
                        <p className="text-sm font-medium text-sys-text-primary">
                          {result.extractedData.vendor}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-sys-text-tertiary mb-1">Amount</p>
                        <p className="text-sm font-medium text-sys-text-primary">
                          ${result.extractedData.amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-sys-text-tertiary mb-1">Date</p>
                        <p className="text-sm font-medium text-sys-text-primary">
                          {new Date(result.extractedData.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-sys-text-tertiary mb-1">Confidence</p>
                        <p className="text-sm font-medium text-sys-text-primary">
                          {(result.extractedData.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {result.extractedData.lineItems &&
                      result.extractedData.lineItems.length > 0 && (
                        <div>
                          <p className="text-xs text-sys-text-tertiary mb-2">Line Items</p>
                          <div className="space-y-1">
                            {result.extractedData.lineItems.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-sys-text-secondary">{item.description}</span>
                                <span className="text-sys-text-primary">
                                  ${item.total.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          result.extractedData && onDataExtracted?.(result.extractedData)
                        }
                        className="btn btn-outline btn-sm"
                        aria-label={`Use extracted data from ${result.fileName}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                        Use This Data
                      </button>
                      <button
                        onClick={() => reprocessFile(result.fileName)}
                        className="btn btn-outline btn-sm"
                        disabled={isProcessing}
                        aria-label={`Reprocess ${result.fileName}`}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                        Reprocess
                      </button>
                    </div>
                  </div>
                )}

                {result.status === "failed" && result.error && (
                  <div className="bg-sys-status-error/10 border border-sys-status-error/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-sys-status-error" aria-hidden="true" />
                      <span className="text-sm text-sys-status-error">{result.error}</span>
                    </div>
                    <button
                      onClick={() => reprocessFile(result.fileName)}
                      className="btn btn-outline btn-sm mt-2"
                      disabled={isProcessing}
                      aria-label={`Retry processing ${result.fileName}`}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                      Retry
                    </button>
                  </div>
                )}

                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => removeFile(result.fileName)}
                    className="btn btn-outline btn-sm"
                    aria-label={`Remove ${result.fileName}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-sys-fill-low border border-sys-border-hairline rounded-lg p-4">
        <h4 className="text-sm font-medium text-sys-text-primary mb-2">
          Tips for better OCR results:
        </h4>
        <ul className="text-xs text-sys-text-secondary space-y-1">
          <li>• Ensure documents are clear and well-lit</li>
          <li>• Avoid shadows or glare on the document</li>
          <li>• Use high-resolution images when possible</li>
          <li>• Make sure text is readable and not blurry</li>
        </ul>
      </div>
    </div>
  );
};
