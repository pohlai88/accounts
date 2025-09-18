"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCardIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../Card.js";
import { Button } from "../../Button.js";
import { Input } from "../../Input.js";
import { Label } from "../../Label.js";
import { Alert } from "../../Alert.js";
import { Badge } from "../../Badge.js";
import { cn } from "../../utils.js";
import { monitoring } from "../../lib/monitoring.js";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  planType: "FREE" | "BASIC" | "PROFESSIONAL" | "ENTERPRISE";
  price: number;
  currency: string;
  billingCycle: "MONTHLY" | "YEARLY";
  features: Record<string, any>;
  limits: Record<string, any>;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "SUSPENDED";
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  autoRenew: boolean;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethodId?: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  [key: string]: unknown;
  updatedAt: string;
  plan: SubscriptionPlan;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "VOID";
  pdfUrl?: string;
  createdAt: string;
}

export interface SubscriptionManagementProps {
  tenantId: string;
  onPlanChange?: (planId: string) => Promise<void>;
  onBillingUpdate?: (billingData: Record<string, unknown>) => Promise<void>;
  onInvoiceDownload?: (invoiceId: string) => Promise<void>;
  className?: string;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const PLAN_TYPES = {
  FREE: { label: "Free", color: "gray", description: "Basic features for small businesses" },
  BASIC: { label: "Basic", color: "blue", description: "Essential accounting features" },
  PROFESSIONAL: { label: "Professional", color: "green", description: "Advanced features for growing businesses" },
  ENTERPRISE: { label: "Enterprise", color: "purple", description: "Full-featured solution for large organizations" },
};

const STATUS_COLORS = {
  ACTIVE: "green",
  CANCELLED: "red",
  EXPIRED: "gray",
  SUSPENDED: "yellow",
} as const;

const INVOICE_STATUS_COLORS = {
  PENDING: "yellow",
  PAID: "green",
  OVERDUE: "red",
  VOID: "gray",
} as const;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit?: () => void;
  onCancel?: () => void;
  onUpgrade?: () => void;
}

function SubscriptionCard({ subscription, onEdit, onCancel, onUpgrade }: SubscriptionCardProps) {
  const planInfo = PLAN_TYPES[subscription.plan.planType];
  const statusColor = STATUS_COLORS[subscription.status];

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilRenewal = () => {
    if (!subscription.nextBillingDate) return null;
    const nextDate = new Date(subscription.nextBillingDate);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilRenewal = getDaysUntilRenewal();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>{subscription.plan.name}</span>
              <Badge
                variant={statusColor === "green" ? "default" : statusColor === "yellow" ? "secondary" : "outline"}
                className="text-xs"
              >
                {subscription.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {planInfo.description} • {formatCurrency(subscription.plan.price, subscription.plan.currency)}/{subscription.plan.billingCycle.toLowerCase()}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <PencilIcon className="w-4 h-4" />
              </Button>
            )}
            {onUpgrade && subscription.plan.planType !== "ENTERPRISE" && (
              <Button size="sm" onClick={onUpgrade}>
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Subscription Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Start Date</Label>
              <p className="text-sm">{formatDate(subscription.startDate)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Next Billing</Label>
              <p className="text-sm">
                {subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : "N/A"}
                {daysUntilRenewal !== null && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({daysUntilRenewal} days)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Trial Information */}
          {subscription.trialEndsAt && (
            <Alert className="bg-blue-50 border-blue-200">
              <ClockIcon className="h-4 w-4 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  Trial ends on {formatDate(subscription.trialEndsAt)}
                </p>
              </div>
            </Alert>
          )}

          {/* Cancellation Information */}
          {subscription.cancelledAt && (
            <Alert className="bg-red-50 border-red-200">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  Cancelled on {formatDate(subscription.cancelledAt)}
                  {subscription.cancellationReason && (
                    <span className="block text-xs mt-1">
                      Reason: {subscription.cancellationReason}
                    </span>
                  )}
                </p>
              </div>
            </Alert>
          )}

          {/* Auto Renewal */}
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className={cn(
              "w-4 h-4",
              subscription.autoRenew ? "text-green-600" : "text-gray-400"
            )} />
            <span className="text-sm">
              {subscription.autoRenew ? "Auto-renewal enabled" : "Auto-renewal disabled"}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          {onCancel && subscription.status === "ACTIVE" && (
            <Button variant="destructive" size="sm" onClick={onCancel}>
              Cancel Subscription
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

interface InvoiceListProps {
  invoices: Invoice[];
  onDownload?: (invoiceId: string) => void;
  onView?: (invoiceId: string) => void;
}

function InvoiceList({ invoices, onDownload, onView }: InvoiceListProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No invoices found</h3>
          <p className="mt-2 text-gray-600">Invoices will appear here once your subscription is active.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => {
        const statusColor = INVOICE_STATUS_COLORS[invoice.status];
        return (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{invoice.invoiceNumber}</h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(invoice.invoiceDate)} • Due {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(invoice.amountDue, invoice.currency)}
                    </p>
                    <Badge
                      variant={statusColor === "green" ? "default" : statusColor === "yellow" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {invoice.status}
                    </Badge>
                  </div>

                  <div className="flex space-x-2">
                    {onView && (
                      <Button variant="ghost" size="sm" onClick={() => onView(invoice.id)}>
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    )}
                    {onDownload && invoice.pdfUrl && (
                      <Button variant="ghost" size="sm" onClick={() => onDownload(invoice.id)}>
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface BillingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingInfo: {
    billingAddress?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    taxId?: string;
    companyName?: string;
  };
  onSave: (data: Record<string, unknown>) => Promise<void>;
}

function BillingInfoModal({ isOpen, onClose, billingInfo, onSave }: BillingInfoModalProps) {
  const [formData, setFormData] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    taxId: "",
    companyName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (billingInfo) {
      setFormData({
        street: billingInfo.billingAddress?.street || "",
        city: billingInfo.billingAddress?.city || "",
        state: billingInfo.billingAddress?.state || "",
        postalCode: billingInfo.billingAddress?.postalCode || "",
        country: billingInfo.billingAddress?.country || "",
        taxId: billingInfo.taxId || "",
        companyName: billingInfo.companyName || "",
      });
    }
  }, [billingInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update billing information");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Update Billing Information</h3>

          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <div className="text-sm text-red-800">{error}</div>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Acme Corporation"
              />
            </div>

            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="123456789"
              />
            </div>

            <div>
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, street: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="NY"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="10001"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="United States"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Billing"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SubscriptionManagement({
  tenantId,
  onPlanChange,
  onBillingUpdate,
  onInvoiceDownload,
  className
}: SubscriptionManagementProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBillingModal, setShowBillingModal] = useState(false);

  // Fetch subscription data
  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/billing?tenantId=${tenantId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.title || "Failed to fetch subscription data");
      }

      const data = await response.json();
      setSubscription(data.data.subscription);
      setInvoices(data.data.invoices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch subscription data");
    } finally {
      setLoading(false);
    }
  };

  // Handle billing update
  const handleBillingUpdate = async (billingData: Record<string, unknown>) => {
    if (onBillingUpdate) {
      await onBillingUpdate(billingData);
      await fetchSubscriptionData(); // Refresh data
    }
  };

  // Handle invoice download
  const handleInvoiceDownload = async (invoiceId: string) => {
    if (onInvoiceDownload) {
      await onInvoiceDownload(invoiceId);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [tenantId]);

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <Alert className="bg-red-50 border-red-200">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </Alert>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Active Subscription</h3>
            <p className="mt-2 text-gray-600">You don't have an active subscription yet.</p>
            <Button className="mt-4">
              <PlusIcon className="w-4 h-4 mr-2" />
              Choose a Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subscription Management</h2>
          <p className="text-gray-600">Manage your subscription, billing, and invoices</p>
        </div>
        <Button onClick={() => setShowBillingModal(true)}>
          <PencilIcon className="w-4 h-4 mr-2" />
          Update Billing
        </Button>
      </div>

      {/* Subscription Card */}
      <SubscriptionCard
        subscription={subscription}
        onEdit={() => setShowBillingModal(true)}
        onCancel={async () => {
          if (window.confirm("Are you sure you want to cancel your subscription?")) {
            try {
              await fetch(`/api/billing/subscription/${subscription.id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              });
              await fetchSubscriptionData(); // Refresh data
              await monitoring.recordEvent('subscription_cancelled', { subscriptionId: subscription.id });
            } catch (error) {
              setError('Failed to cancel subscription');
            }
          }
        }}
        onUpgrade={async () => {
          try {
            const response = await fetch(`/api/billing/subscription/${subscription.id}/upgrade`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
              await fetchSubscriptionData(); // Refresh data
              await monitoring.recordEvent('subscription_upgrade_initiated', { subscriptionId: subscription.id });
            }
          } catch (error) {
            setError('Failed to upgrade subscription');
          }
        }}
      />

      {/* Invoices Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Billing History</h3>
        <InvoiceList
          invoices={invoices}
          onDownload={handleInvoiceDownload}
          onView={async (invoiceId) => {
            try {
              const response = await fetch(`/api/billing/invoices/${invoiceId}`);
              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoice-${invoiceId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                await monitoring.recordEvent('invoice_viewed', { invoiceId });
              }
            } catch (error) {
              setError('Failed to view invoice');
            }
          }}
        />
      </div>

      {/* Billing Info Modal */}
      <BillingInfoModal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        billingInfo={subscription}
        onSave={handleBillingUpdate}
      />
    </div>
  );
}

export default SubscriptionManagement;
