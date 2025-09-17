// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Star,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@aibos/ui/utils";

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  taxId?: string;
  paymentTerms: string;
  defaultCategory: string;
  isActive: boolean;
  isPreferred: boolean;
  totalSpent: number;
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorManagerProps {
  className?: string;
  onVendorSelect?: (vendor: Vendor) => void;
  onVendorCreate?: (vendorData: Partial<Vendor>) => void;
  onVendorUpdate?: (vendorId: string, vendorData: Partial<Vendor>) => void;
  onVendorDelete?: (vendorId: string) => void;
  isLoading?: boolean;
}

export const VendorManager: React.FC<VendorManagerProps> = ({
  className,
  onVendorSelect,
  onVendorCreate,
  onVendorUpdate,
  onVendorDelete,
  isLoading = false,
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "totalSpent" | "lastPaymentDate">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Mock vendors data
  const mockVendors: Vendor[] = [
    {
      id: "1",
      name: "Amazon Web Services",
      email: "billing@amazon.com",
      phone: "+1-206-266-1000",
      website: "https://aws.amazon.com",
      address: {
        street: "410 Terry Ave N",
        city: "Seattle",
        state: "WA",
        zipCode: "98109",
        country: "USA",
      },
      taxId: "91-1646860",
      paymentTerms: "Net 30",
      defaultCategory: "Cloud Services",
      isActive: true,
      isPreferred: true,
      totalSpent: 15420.5,
      lastPaymentDate: "2024-01-15T10:30:00Z",
      createdAt: "2023-06-01T00:00:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      name: "Office Depot",
      email: "orders@officedepot.com",
      phone: "+1-800-463-3768",
      website: "https://www.officedepot.com",
      address: {
        street: "6600 N Military Trail",
        city: "Boca Raton",
        state: "FL",
        zipCode: "33496",
        country: "USA",
      },
      taxId: "59-1234567",
      paymentTerms: "Net 15",
      defaultCategory: "Office Supplies",
      isActive: true,
      isPreferred: false,
      totalSpent: 2340.75,
      lastPaymentDate: "2024-01-10T14:20:00Z",
      createdAt: "2023-08-15T00:00:00Z",
      updatedAt: "2024-01-10T14:20:00Z",
    },
    {
      id: "3",
      name: "City Utilities",
      email: "billing@cityutilities.com",
      phone: "+1-417-863-9000",
      website: "https://www.cityutilities.net",
      address: {
        street: "301 E Central St",
        city: "Springfield",
        state: "MO",
        zipCode: "65801",
        country: "USA",
      },
      taxId: "43-1234567",
      paymentTerms: "Due on Receipt",
      defaultCategory: "Utilities",
      isActive: true,
      isPreferred: false,
      totalSpent: 1890.25,
      lastPaymentDate: "2024-01-05T09:15:00Z",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2024-01-05T09:15:00Z",
    },
  ];

  useEffect(() => {
    setVendors(mockVendors);
  }, []);

  const filteredVendors = vendors
    .filter(
      vendor =>
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.defaultCategory.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === "lastPaymentDate") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    if (onVendorSelect) {
      onVendorSelect(vendor);
    }
  };

  const handleVendorCreate = (vendorData: Partial<Vendor>) => {
    const newVendor: Vendor = {
      id: Date.now().toString(),
      name: vendorData.name || "",
      email: vendorData.email || "",
      phone: vendorData.phone,
      website: vendorData.website,
      address: vendorData.address,
      taxId: vendorData.taxId,
      paymentTerms: vendorData.paymentTerms || "Net 30",
      defaultCategory: vendorData.defaultCategory || "General",
      isActive: true,
      isPreferred: false,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...vendorData,
    };

    setVendors(prev => [...prev, newVendor]);
    setShowCreateForm(false);

    if (onVendorCreate) {
      onVendorCreate(newVendor);
    }
  };

  const handleVendorUpdate = (vendorId: string, vendorData: Partial<Vendor>) => {
    setVendors(prev =>
      prev.map(vendor =>
        vendor.id === vendorId
          ? { ...vendor, ...vendorData, updatedAt: new Date().toISOString() }
          : vendor,
      ),
    );
    setShowEditForm(false);

    if (onVendorUpdate) {
      onVendorUpdate(vendorId, vendorData);
    }
  };

  const handleVendorDelete = (vendorId: string) => {
    setVendors(prev => prev.filter(vendor => vendor.id !== vendorId));

    if (onVendorDelete) {
      onVendorDelete(vendorId);
    }
  };

  const togglePreferred = (vendorId: string) => {
    setVendors(prev =>
      prev.map(vendor =>
        vendor.id === vendorId ? { ...vendor, isPreferred: !vendor.isPreferred } : vendor,
      ),
    );
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sys-status-info/10 rounded-lg">
            <Building className="h-6 w-6 text-sys-status-info" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-sys-text-primary">Vendor Management</h1>
            <p className="text-sm text-sys-text-tertiary">
              Manage your vendor relationships and information
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
          aria-label="Add new vendor"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Vendor
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input w-full pl-10"
                aria-label="Search vendors"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary"
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="input"
              aria-label="Sort by"
            >
              <option value="name">Name</option>
              <option value="totalSpent">Total Spent</option>
              <option value="lastPaymentDate">Last Payment</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="btn btn-outline"
              aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {/* Vendors List */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <h3 className="text-lg font-medium text-sys-text-primary mb-4">
          Vendors ({filteredVendors.length})
        </h3>

        <div className="space-y-3">
          {filteredVendors.map(vendor => (
            <div
              key={vendor.id}
              className={cn(
                "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors",
                selectedVendor?.id === vendor.id
                  ? "border-sys-status-info bg-sys-status-info/5"
                  : "border-sys-border-hairline hover:border-sys-border-subtle",
              )}
              onClick={() => handleVendorSelect(vendor)}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-sys-fill-low rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-sys-text-tertiary" aria-hidden="true" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-sys-text-primary truncate">
                      {vendor.name}
                    </h4>
                    {vendor.isPreferred && (
                      <Star
                        className="h-4 w-4 text-sys-status-warning fill-current"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-sys-text-tertiary">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" aria-hidden="true" />
                      <span>{vendor.email}</span>
                    </div>
                    {vendor.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" aria-hidden="true" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    <span>{vendor.defaultCategory}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-sys-text-primary">
                    ${vendor.totalSpent.toFixed(2)}
                  </p>
                  <p className="text-xs text-sys-text-tertiary">
                    {vendor.lastPaymentDate
                      ? `Last: ${new Date(vendor.lastPaymentDate).toLocaleDateString()}`
                      : "No payments"}
                  </p>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      togglePreferred(vendor.id);
                    }}
                    className={cn(
                      "p-1 rounded",
                      vendor.isPreferred
                        ? "text-sys-status-warning hover:bg-sys-status-warning/10"
                        : "text-sys-text-tertiary hover:bg-sys-fill-low",
                    )}
                    aria-label={`${vendor.isPreferred ? "Remove from" : "Add to"} preferred vendors`}
                  >
                    <Star className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedVendor(vendor);
                      setShowEditForm(true);
                    }}
                    className="p-1 text-sys-text-tertiary hover:bg-sys-fill-low rounded"
                    aria-label={`Edit ${vendor.name}`}
                  >
                    <Edit className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleVendorDelete(vendor.id);
                    }}
                    className="p-1 text-sys-text-tertiary hover:bg-sys-status-error/10 hover:text-sys-status-error rounded"
                    aria-label={`Delete ${vendor.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVendors.length === 0 && (
          <div className="text-center py-8">
            <Building
              className="h-12 w-12 text-sys-text-tertiary mx-auto mb-4"
              aria-hidden="true"
            />
            <h3 className="text-lg font-medium text-sys-text-primary mb-2">No vendors found</h3>
            <p className="text-sm text-sys-text-tertiary mb-4">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Get started by adding your first vendor"}
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
              aria-label="Add first vendor"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Vendor
            </button>
          </div>
        )}
      </div>

      {/* Vendor Details */}
      {selectedVendor && (
        <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
          <h3 className="text-lg font-medium text-sys-text-primary mb-4">Vendor Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-sys-text-primary mb-2">
                  Contact Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-sys-text-tertiary" aria-hidden="true" />
                    <span className="text-sm text-sys-text-secondary">{selectedVendor.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-sys-text-tertiary" aria-hidden="true" />
                    <span className="text-sm text-sys-text-secondary">{selectedVendor.email}</span>
                  </div>
                  {selectedVendor.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-sys-text-tertiary" aria-hidden="true" />
                      <span className="text-sm text-sys-text-secondary">
                        {selectedVendor.phone}
                      </span>
                    </div>
                  )}
                  {selectedVendor.website && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-sys-text-secondary">
                        {selectedVendor.website}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedVendor.address && (
                <div>
                  <h4 className="text-sm font-medium text-sys-text-primary mb-2">Address</h4>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-sys-text-tertiary mt-0.5" aria-hidden="true" />
                    <div className="text-sm text-sys-text-secondary">
                      {selectedVendor.address.street && <div>{selectedVendor.address.street}</div>}
                      {selectedVendor.address.city && selectedVendor.address.state && (
                        <div>
                          {selectedVendor.address.city}, {selectedVendor.address.state}{" "}
                          {selectedVendor.address.zipCode}
                        </div>
                      )}
                      {selectedVendor.address.country && (
                        <div>{selectedVendor.address.country}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-sys-text-primary mb-2">
                  Business Information
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-sys-text-tertiary">Tax ID</span>
                    <p className="text-sm text-sys-text-secondary">
                      {selectedVendor.taxId || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-sys-text-tertiary">Payment Terms</span>
                    <p className="text-sm text-sys-text-secondary">{selectedVendor.paymentTerms}</p>
                  </div>
                  <div>
                    <span className="text-xs text-sys-text-tertiary">Default Category</span>
                    <p className="text-sm text-sys-text-secondary">
                      {selectedVendor.defaultCategory}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-sys-text-primary mb-2">Payment History</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-sys-text-tertiary">Total Spent</span>
                    <p className="text-sm font-medium text-sys-text-primary">
                      ${selectedVendor.totalSpent.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-sys-text-tertiary">Last Payment</span>
                    <p className="text-sm text-sys-text-secondary">
                      {selectedVendor.lastPaymentDate
                        ? new Date(selectedVendor.lastPaymentDate).toLocaleDateString()
                        : "No payments"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
