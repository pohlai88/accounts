import { z } from "zod";

// D2 AR Invoice Contracts - Complete Implementation

// Customer Management
export const CreateCustomerReq = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  customerNumber: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  shippingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  currency: z.string().length(3),
  paymentTerms: z.enum(["NET_15", "NET_30", "NET_45", "NET_60", "COD", "PREPAID"]).default("NET_30"),
  creditLimit: z.number().nonnegative().default(0)
});

export const CreateCustomerRes = z.object({
  id: z.string().uuid(),
  customerNumber: z.string(),
  name: z.string(),
  currency: z.string(),
  paymentTerms: z.string(),
  creditLimit: z.number(),
  createdAt: z.string().datetime()
});

// Invoice Line Item
export const InvoiceLineReq = z.object({
  lineNumber: z.number().int().positive(),
  description: z.string().min(1).max(500),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative(),
  taxCode: z.string().optional(),
  revenueAccountId: z.string().uuid()
});

// Create Invoice
export const CreateInvoiceReq = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  customerId: z.string().uuid(),
  invoiceNumber: z.string().min(1).max(50),
  invoiceDate: z.string().date(),
  dueDate: z.string().date(),
  currency: z.string().length(3),
  exchangeRate: z.number().positive().default(1),
  description: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(InvoiceLineReq).min(1).max(100)
});

export const CreateInvoiceRes = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string(),
  customerId: z.string().uuid(),
  customerName: z.string(),
  invoiceDate: z.string().date(),
  dueDate: z.string().date(),
  currency: z.string(),
  subtotal: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  lines: z.array(z.object({
    id: z.string().uuid(),
    lineNumber: z.number(),
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    lineAmount: z.number(),
    taxAmount: z.number(),
    revenueAccountId: z.string().uuid()
  })),
  createdAt: z.string().datetime()
});

// Post Invoice to GL
export const PostInvoiceReq = z.object({
  tenantId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  postingDate: z.string().date().optional(), // Defaults to invoice date
  arAccountId: z.string().uuid(), // Accounts Receivable account
  description: z.string().optional()
});

export const PostInvoiceRes = z.object({
  invoiceId: z.string().uuid(),
  journalId: z.string().uuid(),
  journalNumber: z.string(),
  status: z.enum(["posted"]),
  totalDebit: z.number(),
  totalCredit: z.number(),
  lines: z.array(z.object({
    accountId: z.string().uuid(),
    accountName: z.string(),
    debit: z.number(),
    credit: z.number(),
    description: z.string()
  })),
  postedAt: z.string().datetime()
});

// Get Invoice
export const GetInvoiceRes = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  customerId: z.string().uuid(),
  customerName: z.string(),
  customerEmail: z.string().optional(),
  invoiceNumber: z.string(),
  invoiceDate: z.string().date(),
  dueDate: z.string().date(),
  currency: z.string(),
  exchangeRate: z.number(),
  subtotal: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  balanceAmount: z.number(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  description: z.string().optional(),
  notes: z.string().optional(),
  journalId: z.string().uuid().optional(),
  lines: z.array(z.object({
    id: z.string().uuid(),
    lineNumber: z.number(),
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    lineAmount: z.number(),
    taxCode: z.string().optional(),
    taxRate: z.number(),
    taxAmount: z.number(),
    revenueAccountId: z.string().uuid(),
    revenueAccountName: z.string()
  })),
  createdBy: z.string().uuid().optional(),
  postedBy: z.string().uuid().optional(),
  postedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// List Invoices
export const ListInvoicesReq = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  fromDate: z.string().date().optional(),
  toDate: z.string().date().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0)
});

export const ListInvoicesRes = z.object({
  invoices: z.array(z.object({
    id: z.string().uuid(),
    invoiceNumber: z.string(),
    customerId: z.string().uuid(),
    customerName: z.string(),
    invoiceDate: z.string().date(),
    dueDate: z.string().date(),
    currency: z.string(),
    totalAmount: z.number(),
    paidAmount: z.number(),
    balanceAmount: z.number(),
    status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
    createdAt: z.string().datetime()
  })),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean()
});

// Legacy - Keep for backward compatibility
export const ApproveInvoiceReq = z.object({
  tenantId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  idemKey: z.string()
});

export const ApproveInvoiceRes = z.object({
  id: z.string().uuid(),
  customerEmail: z.string().email().optional()
});

// Type exports
export type TCreateCustomerReq = z.infer<typeof CreateCustomerReq>;
export type TCreateCustomerRes = z.infer<typeof CreateCustomerRes>;
export type TInvoiceLineReq = z.infer<typeof InvoiceLineReq>;
export type TCreateInvoiceReq = z.infer<typeof CreateInvoiceReq>;
export type TCreateInvoiceRes = z.infer<typeof CreateInvoiceRes>;
export type TPostInvoiceReq = z.infer<typeof PostInvoiceReq>;
export type TPostInvoiceRes = z.infer<typeof PostInvoiceRes>;
export type TGetInvoiceRes = z.infer<typeof GetInvoiceRes>;
export type TListInvoicesReq = z.infer<typeof ListInvoicesReq>;
export type TListInvoicesRes = z.infer<typeof ListInvoicesRes>;
export type TApproveInvoiceReq = z.infer<typeof ApproveInvoiceReq>;
