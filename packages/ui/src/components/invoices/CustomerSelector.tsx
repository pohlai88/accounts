import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, User, Mail, Phone, MapPin, Check } from "lucide-react";
import { cn } from "@aibos/ui/utils";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSelectorProps {
  className?: string;
  selectedCustomer?: Customer | null;
  onCustomerSelect?: (customer: Customer) => void;
  onCustomerCreate?: (customerData: Partial<Customer>) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  className,
  selectedCustomer,
  onCustomerSelect,
  onCustomerCreate,
  placeholder = "Search or select customer...",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock customers data
  const mockCustomers: Customer[] = [
    {
      id: "1",
      name: "Acme Corporation",
      email: "billing@acme.com",
      phone: "+1 (555) 123-4567",
      address: {
        street: "123 Business Ave",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA",
      },
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Tech Solutions Ltd",
      email: "accounts@techsolutions.com",
      phone: "+1 (555) 987-6543",
      address: {
        street: "456 Tech Street",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        country: "USA",
      },
      isActive: true,
      createdAt: "2024-01-02T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    },
    {
      id: "3",
      name: "Global Enterprises",
      email: "finance@global.com",
      phone: "+1 (555) 456-7890",
      address: {
        street: "789 Corporate Blvd",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
        country: "USA",
      },
      isActive: true,
      createdAt: "2024-01-03T00:00:00Z",
      updatedAt: "2024-01-03T00:00:00Z",
    },
    {
      id: "4",
      name: "Startup Inc",
      email: "billing@startup.com",
      phone: "+1 (555) 321-0987",
      address: {
        street: "321 Innovation Drive",
        city: "Austin",
        state: "TX",
        zipCode: "73301",
        country: "USA",
      },
      isActive: true,
      createdAt: "2024-01-04T00:00:00Z",
      updatedAt: "2024-01-04T00:00:00Z",
    },
  ];

  useEffect(() => {
    setCustomers(mockCustomers);
  }, []);

  // Filter customers based on search query
  const filteredCustomers = customers.filter(
    customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery),
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(true);
    setShowCreateForm(false);
  };

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect?.(customer);
    setSearchQuery(customer.name);
    setIsOpen(false);
    setShowCreateForm(false);
  };

  const handleCreateCustomer = () => {
    if (newCustomer.name && newCustomer.email) {
      const customerData: Customer = {
        id: Date.now().toString(),
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCustomers(prev => [customerData, ...prev]);
      onCustomerCreate?.(customerData);
      handleCustomerSelect(customerData);
    }
  };

  const handleNewCustomerChange = (field: string, value: string) => {
    setNewCustomer(prev => {
      if (field.startsWith("address.")) {
        const addressField = field.split(".")[1];
        return {
          ...prev,
          address: {
            ...prev.address,
            [addressField as keyof typeof prev.address]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const displayValue = selectedCustomer ? selectedCustomer.name : searchQuery;

  return (
    <div className={cn("relative", className)}>
      {/* Input */}
      <div className="relative">
        <label htmlFor="customer-selector" className="sr-only">
          Select customer
        </label>
        <input
          ref={inputRef}
          id="customer-selector"
          type="text"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          className="input w-full pl-10"
          aria-label="Search and select customer"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-describedby="customer-help"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary"
          aria-hidden="true"
        />
      </div>

      <div id="customer-help" className="sr-only">
        Type to search for existing customers or create a new one
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-sys-bg-raised border border-sys-border-hairline rounded-lg shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Customer options"
        >
          {!showCreateForm ? (
            <>
              {/* Customer List */}
              {filteredCustomers.length > 0 ? (
                <div className="p-2">
                  {filteredCustomers.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full text-left p-3 rounded-md hover:bg-sys-fill-low transition-colors focus:outline-none focus:ring-2 focus:ring-sys-accent focus:ring-offset-2"
                      role="option"
                      aria-selected={selectedCustomer?.id === customer.id}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center">
                            <User className="h-4 w-4 text-sys-text-primary" aria-hidden="true" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sys-text-primary truncate">
                              {customer.name}
                            </span>
                            {selectedCustomer?.id === customer.id && (
                              <Check className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3 text-sys-text-tertiary" aria-hidden="true" />
                              <span className="text-sm text-sys-text-secondary truncate">
                                {customer.email}
                              </span>
                            </div>
                            {customer.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone
                                  className="h-3 w-3 text-sys-text-tertiary"
                                  aria-hidden="true"
                                />
                                <span className="text-sm text-sys-text-secondary">
                                  {customer.phone}
                                </span>
                              </div>
                            )}
                          </div>
                          {customer.address && (
                            <div className="flex items-center space-x-1 mt-1">
                              <MapPin
                                className="h-3 w-3 text-sys-text-tertiary"
                                aria-hidden="true"
                              />
                              <span className="text-sm text-sys-text-tertiary truncate">
                                {customer.address.city}, {customer.address.state}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <User
                    className="h-8 w-8 text-sys-text-tertiary mx-auto mb-2"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-sys-text-secondary mb-3">No customers found</p>
                </div>
              )}

              {/* Create New Customer Button */}
              <div className="border-t border-sys-border-hairline p-2">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center space-x-2 p-3 rounded-md hover:bg-sys-fill-low transition-colors focus:outline-none focus:ring-2 focus:ring-sys-accent focus:ring-offset-2"
                  aria-label="Create new customer"
                >
                  <Plus className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                  <span className="text-brand-primary font-medium">Create new customer</span>
                </button>
              </div>
            </>
          ) : (
            /* Create Customer Form */
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-sys-text-primary">Create New Customer</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-ghost p-2"
                  aria-label="Cancel customer creation"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="new-customer-name"
                    className="block text-sm font-medium text-sys-text-primary mb-2"
                  >
                    Company Name *
                  </label>
                  <input
                    id="new-customer-name"
                    type="text"
                    placeholder="Enter company name"
                    value={newCustomer.name || ""}
                    onChange={e => handleNewCustomerChange("name", e.target.value)}
                    className="input w-full"
                    aria-label="Company name"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-customer-email"
                    className="block text-sm font-medium text-sys-text-primary mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    id="new-customer-email"
                    type="email"
                    placeholder="Enter email address"
                    value={newCustomer.email || ""}
                    onChange={e => handleNewCustomerChange("email", e.target.value)}
                    className="input w-full"
                    aria-label="Email address"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-customer-phone"
                    className="block text-sm font-medium text-sys-text-primary mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    id="new-customer-phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={newCustomer.phone || ""}
                    onChange={e => handleNewCustomerChange("phone", e.target.value)}
                    className="input w-full"
                    aria-label="Phone number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="new-customer-city"
                      className="block text-sm font-medium text-sys-text-primary mb-2"
                    >
                      City
                    </label>
                    <input
                      id="new-customer-city"
                      type="text"
                      placeholder="City"
                      value={newCustomer.address?.city || ""}
                      onChange={e => handleNewCustomerChange("address.city", e.target.value)}
                      className="input w-full"
                      aria-label="City"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-customer-state"
                      className="block text-sm font-medium text-sys-text-primary mb-2"
                    >
                      State
                    </label>
                    <input
                      id="new-customer-state"
                      type="text"
                      placeholder="State"
                      value={newCustomer.address?.state || ""}
                      onChange={e => handleNewCustomerChange("address.state", e.target.value)}
                      className="input w-full"
                      aria-label="State"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="btn btn-ghost"
                    aria-label="Cancel customer creation"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCustomer}
                    disabled={!newCustomer.name || !newCustomer.email}
                    className="btn btn-primary"
                    aria-label="Create customer"
                  >
                    Create Customer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
