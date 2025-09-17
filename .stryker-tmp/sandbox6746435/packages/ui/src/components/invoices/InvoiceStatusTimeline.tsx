// @ts-nocheck
import React from "react";
import {
  FileText,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Download,
  MessageSquare,
  Calendar,
  User,
} from "lucide-react";
import { cn } from "@aibos/ui/utils";

export interface TimelineEvent {
  id: string;
  type: "created" | "sent" | "viewed" | "paid" | "overdue" | "reminder_sent" | "downloaded";
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  metadata?: Record<string, any>;
}

export interface InvoiceStatusTimelineProps {
  className?: string;
  invoiceId: string;
  events?: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
}

const eventConfig = {
  created: {
    label: "Invoice Created",
    icon: FileText,
    color: "text-sys-text-tertiary bg-sys-fill-low",
    dotColor: "bg-sys-text-tertiary",
  },
  sent: {
    label: "Invoice Sent",
    icon: Send,
    color: "text-sys-status-info bg-sys-status-info/10",
    dotColor: "bg-sys-status-info",
  },
  viewed: {
    label: "Invoice Viewed",
    icon: Eye,
    color: "text-sys-status-success bg-sys-status-success/10",
    dotColor: "bg-sys-status-success",
  },
  paid: {
    label: "Payment Received",
    icon: CheckCircle,
    color: "text-sys-status-success bg-sys-status-success/10",
    dotColor: "bg-sys-status-success",
  },
  overdue: {
    label: "Invoice Overdue",
    icon: AlertCircle,
    color: "text-sys-status-error bg-sys-status-error/10",
    dotColor: "bg-sys-status-error",
  },
  reminder_sent: {
    label: "Reminder Sent",
    icon: MessageSquare,
    color: "text-sys-status-warning bg-sys-status-warning/10",
    dotColor: "bg-sys-status-warning",
  },
  downloaded: {
    label: "Invoice Downloaded",
    icon: Download,
    color: "text-sys-text-tertiary bg-sys-fill-low",
    dotColor: "bg-sys-text-tertiary",
  },
};

export const InvoiceStatusTimeline: React.FC<InvoiceStatusTimelineProps> = ({
  className,
  invoiceId,
  events = [],
  onEventClick,
}) => {
  // Mock timeline events
  const mockEvents: TimelineEvent[] = [
    {
      id: "1",
      type: "created",
      title: "Invoice Created",
      description: "Invoice INV-2024-001 was created and saved as draft",
      timestamp: "2024-01-15T10:30:00Z",
      user: "John Doe",
      metadata: {
        invoiceNumber: "INV-2024-001",
        amount: 2500.0,
        customer: "Acme Corporation",
      },
    },
    {
      id: "2",
      type: "sent",
      title: "Invoice Sent",
      description: "Invoice was sent to billing@acme.com via email",
      timestamp: "2024-01-15T11:15:00Z",
      user: "John Doe",
      metadata: {
        recipient: "billing@acme.com",
        method: "email",
        deliveryStatus: "delivered",
      },
    },
    {
      id: "3",
      type: "viewed",
      title: "Invoice Viewed",
      description: "Customer viewed the invoice online",
      timestamp: "2024-01-15T14:22:00Z",
      metadata: {
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0...",
        location: "New York, NY",
      },
    },
    {
      id: "4",
      type: "reminder_sent",
      title: "Payment Reminder Sent",
      description: "Payment reminder sent via email",
      timestamp: "2024-01-25T09:00:00Z",
      user: "System",
      metadata: {
        recipient: "billing@acme.com",
        method: "email",
        reminderType: "first_reminder",
      },
    },
    {
      id: "5",
      type: "paid",
      title: "Payment Received",
      description: "Payment of $2,500.00 received via credit card",
      timestamp: "2024-01-28T16:45:00Z",
      metadata: {
        amount: 2500.0,
        method: "credit_card",
        reference: "TXN-123456789",
        processor: "Stripe",
      },
    },
  ];

  const displayEvents = events.length > 0 ? events : mockEvents;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Group events by date
  const groupedEvents = displayEvents.reduce(
    (groups, event) => {
      const date = new Date(event.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
      return groups;
    },
    {} as Record<string, TimelineEvent[]>,
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-sys-text-primary">Invoice Timeline</h2>
          <p className="text-sys-text-secondary mt-1">
            Track the complete lifecycle of this invoice
          </p>
        </div>
        <div className="text-sm text-sys-text-tertiary">{displayEvents.length} events</div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <div key={date} className="space-y-4">
            {/* Date Header */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-sys-bg-subtle border border-sys-border-hairline flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-sys-text-tertiary" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-sys-text-primary">
                  {getRelativeTime(dayEvents[0]?.timestamp || "")}
                </h3>
                <p className="text-xs text-sys-text-tertiary">
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Events for this date */}
            <div className="ml-6 space-y-3">
              {dayEvents.map((event, index) => {
                const config = eventConfig[event.type];
                const EventIcon = config.icon;
                const isLast = index === dayEvents.length - 1;

                return (
                  <div key={event.id} className="relative">
                    {/* Timeline Line */}
                    {!isLast && (
                      <div className="absolute left-4 top-8 w-0.5 h-8 bg-sys-border-hairline"></div>
                    )}

                    {/* Event */}
                    <div
                      className={cn(
                        "flex items-start space-x-4 p-4 rounded-lg border border-sys-border-hairline bg-sys-bg-raised hover:border-sys-border-medium transition-colors cursor-pointer",
                        onEventClick && "hover:shadow-sm",
                      )}
                      onClick={() => onEventClick?.(event)}
                    >
                      {/* Event Icon */}
                      <div className="flex-shrink-0">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            config.color,
                          )}
                        >
                          <EventIcon className="h-4 w-4" aria-hidden="true" />
                        </div>
                      </div>

                      {/* Event Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-sys-text-primary">
                            {event.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-sys-text-tertiary">
                              {formatDate(event.timestamp)}
                            </span>
                            {event.user && (
                              <div className="flex items-center space-x-1">
                                <User
                                  className="h-3 w-3 text-sys-text-tertiary"
                                  aria-hidden="true"
                                />
                                <span className="text-xs text-sys-text-tertiary">{event.user}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-sys-text-secondary mb-2">{event.description}</p>

                        {/* Metadata */}
                        {event.metadata && (
                          <div className="space-y-1">
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center space-x-2 text-xs text-sys-text-tertiary"
                              >
                                <span className="font-medium capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}:
                                </span>
                                <span>
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {displayEvents.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-sys-text-tertiary mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-sys-text-primary mb-2">No events yet</h3>
          <p className="text-sys-text-secondary">
            Timeline events will appear here as the invoice progresses through its lifecycle
          </p>
        </div>
      )}
    </div>
  );
};
