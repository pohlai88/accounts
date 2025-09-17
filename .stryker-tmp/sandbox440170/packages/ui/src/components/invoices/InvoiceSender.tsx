// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Send,
  Mail,
  MessageSquare,
  Copy,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Share2,
  Clock,
  User,
  Calendar,
} from "lucide-react";
import { cn } from "@aibos/ui/utils";

export interface InvoiceSenderProps {
  className?: string;
  invoiceId: string;
  invoiceNumber: string;
  customerEmail: string;
  customerName: string;
  invoiceAmount: number;
  dueDate: string;
  onSend?: (method: "email" | "whatsapp" | "link", data: any) => void;
  onCopyLink?: (link: string) => void;
  isLoading?: boolean;
}

const sendMethods = {
  email: {
    label: "Email",
    icon: Mail,
    description: "Send invoice via email",
    color: "text-sys-status-info bg-sys-status-info/10",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: MessageSquare,
    description: "Send invoice via WhatsApp",
    color: "text-sys-status-success bg-sys-status-success/10",
  },
  link: {
    label: "Share Link",
    icon: Share2,
    description: "Copy shareable link",
    color: "text-brand-primary bg-brand-primary/10",
  },
};

export const InvoiceSender: React.FC<InvoiceSenderProps> = ({
  className,
  invoiceId,
  invoiceNumber,
  customerEmail,
  customerName,
  invoiceAmount,
  dueDate,
  onSend,
  onCopyLink,
  isLoading = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<"email" | "whatsapp" | "link">("email");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [sendHistory, setSendHistory] = useState<any[]>([]);

  // Generate share link
  useEffect(() => {
    const baseUrl = window.location.origin;
    setShareLink(`${baseUrl}/invoice/${invoiceId}`);
  }, [invoiceId]);

  // Set default email subject and message
  useEffect(() => {
    setEmailSubject(`Invoice ${invoiceNumber} from AI-BOS`);
    setEmailMessage(`Dear ${customerName},

Please find attached your invoice ${invoiceNumber} for ${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(invoiceAmount)}.

Payment is due by ${new Date(dueDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}.

You can view and pay this invoice online at: ${shareLink}

Thank you for your business!

Best regards,
AI-BOS Team`);

    setWhatsappMessage(`Hi ${customerName}! 

Your invoice ${invoiceNumber} for ${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(invoiceAmount)} is ready.

Due date: ${new Date(dueDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}

View and pay online: ${shareLink}

Thanks!`);
  }, [invoiceNumber, customerName, invoiceAmount, dueDate, shareLink]);

  // Mock send history
  const mockSendHistory = [
    {
      id: "1",
      method: "email",
      recipient: customerEmail,
      status: "sent",
      timestamp: "2024-01-15T11:15:00Z",
      subject: emailSubject,
    },
    {
      id: "2",
      method: "email",
      recipient: customerEmail,
      status: "delivered",
      timestamp: "2024-01-15T11:16:00Z",
      subject: emailSubject,
    },
  ];

  useEffect(() => {
    setSendHistory(mockSendHistory);
  }, []);

  const handleSend = () => {
    const sendData: any = {
      invoiceId,
      invoiceNumber,
      customerEmail,
      customerName,
      method: selectedMethod,
      timestamp: new Date().toISOString(),
    };

    switch (selectedMethod) {
      case "email":
        sendData.subject = emailSubject;
        sendData.message = emailMessage;
        break;
      case "whatsapp":
        sendData.message = whatsappMessage;
        break;
      case "link":
        sendData.link = shareLink;
        break;
    }

    onSend?.(selectedMethod, sendData);

    // Add to send history
    const historyItem = {
      id: Date.now().toString(),
      recipient: selectedMethod === "link" ? "Shared Link" : customerEmail,
      status: "sent",
      ...sendData,
    };

    setSendHistory(prev => [historyItem, ...prev]);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setIsLinkCopied(true);
    onCopyLink?.(shareLink);

    setTimeout(() => {
      setIsLinkCopied(false);
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-4 bg-sys-fill-low rounded w-32"></div>
            <div className="h-8 bg-sys-fill-low rounded w-48"></div>
            <div className="h-4 bg-sys-fill-low rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-sys-text-primary">Send Invoice</h2>
          <p className="text-sys-text-secondary mt-1">
            Send invoice {invoiceNumber} to {customerName}
          </p>
        </div>
        <div className="text-sm text-sys-text-tertiary">
          {formatCurrency(invoiceAmount)} • Due {formatDate(dueDate)}
        </div>
      </div>

      {/* Send Methods */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <h3 className="text-lg font-medium text-sys-text-primary mb-4">Choose Send Method</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(sendMethods).map(([method, config]) => {
            const MethodIcon = config.icon;
            const isSelected = selectedMethod === method;

            return (
              <button
                key={method}
                onClick={() => setSelectedMethod(method as any)}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-left",
                  isSelected
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-sys-border-hairline hover:border-sys-border-medium",
                )}
                aria-label={`Select ${config.label} as send method`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center",
                      config.color,
                    )}
                  >
                    <MethodIcon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="font-medium text-sys-text-primary">{config.label}</span>
                </div>
                <p className="text-sm text-sys-text-secondary">{config.description}</p>
              </button>
            );
          })}
        </div>

        {/* Method-specific content */}
        {selectedMethod === "email" && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email-subject"
                className="block text-sm font-medium text-sys-text-primary mb-2"
              >
                Email Subject
              </label>
              <input
                id="email-subject"
                type="text"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className="input w-full"
                aria-label="Email subject line"
              />
            </div>

            <div>
              <label
                htmlFor="email-message"
                className="block text-sm font-medium text-sys-text-primary mb-2"
              >
                Email Message
              </label>
              <textarea
                id="email-message"
                value={emailMessage}
                onChange={e => setEmailMessage(e.target.value)}
                rows={8}
                className="input w-full resize-none"
                aria-label="Email message body"
              />
            </div>

            <div className="flex items-center space-x-2 text-sm text-sys-text-secondary">
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span>To: {customerEmail}</span>
            </div>
          </div>
        )}

        {selectedMethod === "whatsapp" && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="whatsapp-message"
                className="block text-sm font-medium text-sys-text-primary mb-2"
              >
                WhatsApp Message
              </label>
              <textarea
                id="whatsapp-message"
                value={whatsappMessage}
                onChange={e => setWhatsappMessage(e.target.value)}
                rows={6}
                className="input w-full resize-none"
                aria-label="WhatsApp message"
              />
            </div>

            <div className="flex items-center space-x-2 text-sm text-sys-text-secondary">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              <span>To: {customerName}</span>
            </div>
          </div>
        )}

        {selectedMethod === "link" && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="share-link"
                className="block text-sm font-medium text-sys-text-primary mb-2"
              >
                Shareable Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="share-link"
                  type="text"
                  value={shareLink}
                  readOnly
                  className="input flex-1"
                  aria-label="Shareable invoice link"
                />
                <button
                  onClick={handleCopyLink}
                  className={cn(
                    "btn btn-secondary flex items-center space-x-2",
                    isLinkCopied && "bg-sys-status-success text-sys-text-primary",
                  )}
                  aria-label="Copy shareable link"
                >
                  {isLinkCopied ? (
                    <>
                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-sys-bg-subtle border border-sys-border-hairline rounded-lg p-4">
              <h4 className="text-sm font-medium text-sys-text-primary mb-2">Link Preview</h4>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-brand-primary flex items-center justify-center">
                  <Eye className="h-5 w-5 text-sys-text-primary" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-medium text-sys-text-primary">
                    Invoice {invoiceNumber}
                  </div>
                  <div className="text-xs text-sys-text-secondary">
                    {formatCurrency(invoiceAmount)} • Due {formatDate(dueDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <div className="flex items-center justify-end space-x-3 mt-6">
          <button
            onClick={handleSend}
            className="btn btn-primary flex items-center space-x-2"
            aria-label={`Send invoice via ${sendMethods[selectedMethod].label}`}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>Send {sendMethods[selectedMethod].label}</span>
          </button>
        </div>
      </div>

      {/* Send History */}
      {sendHistory.length > 0 && (
        <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
          <h3 className="text-lg font-medium text-sys-text-primary mb-4">Send History</h3>

          <div className="space-y-3">
            {sendHistory.map(item => {
              const method = sendMethods[item.method as keyof typeof sendMethods];
              const MethodIcon = method.icon;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-sys-border-hairline rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        method.color,
                      )}
                    >
                      <MethodIcon className="h-4 w-4" aria-hidden="true" />
                    </div>

                    <div>
                      <div className="text-sm font-medium text-sys-text-primary">
                        {method.label}
                      </div>
                      <div className="text-xs text-sys-text-secondary">{item.recipient}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          item.status === "sent"
                            ? "bg-sys-status-info"
                            : item.status === "delivered"
                              ? "bg-sys-status-success"
                              : "bg-sys-status-error",
                        )}
                      ></div>
                      <span className="text-xs text-sys-text-secondary">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
