[**AI-BOS Accounts API Documentation**](../../README.md)

***

[AI-BOS Accounts API Documentation](../../README.md) / @aibos/ui

# DOC-295: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/ui

React component library with comprehensive design system and accessibility compliance for the AI-BOS Accounting SaaS platform.

## Installation

```bash
pnpm add @aibos/ui
```

## Core Features

- **Design System**: Semantic tokens, consistent API, theme support
- **Accessibility**: WCAG 2.2 AAA compliance, screen reader support
- **Business Components**: Invoice, bill, payment, and reporting components
- **Performance**: Web Vitals integration, error boundaries, offline support
- **Responsive**: Mobile-first design with breakpoint system

## Quick Start

```typescript
import { 
  Button, 
  Card, 
  Input, 
  InvoiceForm,
  ErrorBoundary,
  AccessibilityProvider
} from "@aibos/ui";

// Basic components
<Button variant="primary">Create Invoice</Button>
<Card>
  <CardHeader>
    <CardTitle>Invoice Details</CardTitle>
  </CardHeader>
  <CardContent>
    <Input label="Customer Name" required />
  </CardContent>
</Card>

// Business components
<InvoiceForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>

// Error handling
<ErrorBoundary fallback={<ErrorFallback />}>
  <YourComponent />
</ErrorBoundary>

// Accessibility
<AccessibilityProvider>
  <App />
</AccessibilityProvider>
```

## Component Categories

### Core Components
- `Button`, `Card`, `Input`, `Badge`, `Alert`, `Label`
- `Modal`, `Drawer`, `Toast`, `LoadingSpinner`
- `Table`, `DataTable`, `Pagination`, `Tabs`

### Business Components
- `InvoiceForm`, `BillWorkflow`, `PaymentProcessing`
- `ChartOfAccounts`, `TrialBalance`, `FinancialReports`
- `UserManagement`, `TenantOnboarding`

### Common Components
- `ErrorBoundary`, `AccessibilityProvider`, `ResponsiveProvider`
- `OfflineIndicator`, `PerformanceMonitor`

## Hooks

```typescript
import { 
  useAuth,
  useAccessibility,
  useResponsive,
  useErrorHandler,
  usePerformance
} from "@aibos/ui";

const { user, login, logout } = useAuth();
const { preferences, updatePreference } = useAccessibility();
const { breakpoint, isMobile } = useResponsive();
```

## Design System

### Color Tokens

```typescript
import { colors } from "@aibos/ui";

// Background colors
colors.bg.base        // #000000 - Pure black
colors.bg.elevated    // #1A1A1A - Cards, modals
colors.bg.muted       // #2A2A2A - Subtle backgrounds

// Text colors
colors.fg.default     // #FFFFFF - Primary text
colors.fg.muted       // #8A8A8A - Secondary text
colors.fg.subtle      // #6A8A8A - Tertiary text

// AI Brand colors
colors.ai.solid       // #0056CC - Primary actions
colors.ai.muted       // #007AFF - Secondary elements
colors.ai.subtle      // rgba(0, 122, 255, 0.1) - Subtle backgrounds
```

### Typography Scale

```typescript
import { typography } from "@aibos/ui";

// Font sizes
typography.size.xl    // 2.25rem - Hero headings
typography.size.lg    // 1.875rem - Section headers
typography.size.md    // 1.5rem - Subsection headers
typography.size.base  // 1rem - Standard body text
typography.size.sm    // 0.875rem - Supporting information

// Font weights
typography.weight.normal   // 400 - Body text
typography.weight.medium   // 500 - Emphasized text
typography.weight.semibold // 600 - Headings
typography.weight.bold     // 700 - Hero text
```

### Spacing System

```typescript
import { spacing } from "@aibos/ui";

spacing.xs  // 0.25rem - 4px - minimal spacing
spacing.sm  // 0.5rem - 8px - small spacing
spacing.md  // 1rem - 16px - standard spacing
spacing.lg  // 1.5rem - 24px - large spacing
spacing.xl  // 2rem - 32px - extra large spacing
```

## Component Examples

### Button Component

```typescript
import { Button } from "@aibos/ui";

// Primary button
<Button variant="primary" size="md">
  Create Invoice
</Button>

// Secondary button
<Button variant="secondary" size="sm">
  Cancel
</Button>

// Destructive button
<Button variant="destructive" size="lg">
  Delete Invoice
</Button>

// Loading state
<Button variant="primary" loading>
  Processing...
</Button>
```

### Card Component

```typescript
import { Card, CardHeader, CardContent, CardFooter } from "@aibos/ui";

<Card>
  <CardHeader>
    <CardTitle>Invoice Details</CardTitle>
    <CardDescription>
      Create a new invoice for your customer
    </CardDescription>
  </CardHeader>
  <CardContent>
    <InvoiceForm onSubmit={handleSubmit} />
  </CardContent>
  <CardFooter>
    <Button variant="primary">Save Invoice</Button>
    <Button variant="secondary">Cancel</Button>
  </CardFooter>
</Card>
```

### Input Component

```typescript
import { Input, Label } from "@aibos/ui";

<div className="space-y-2">
  <Label htmlFor="customer-name">Customer Name</Label>
  <Input
    id="customer-name"
    placeholder="Enter customer name"
    required
    error={errors.customerName}
  />
</div>
```

### DataTable Component

```typescript
import { DataTable } from "@aibos/ui";

const columns = [
  { key: "id", label: "ID" },
  { key: "customer", label: "Customer" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" }
];

<DataTable
  data={invoices}
  columns={columns}
  onRowClick={handleRowClick}
  pagination={{
    pageSize: 10,
    total: invoices.length
  }}
/>
```

## Business Components

### InvoiceForm

```typescript
import { InvoiceForm } from "@aibos/ui";

<InvoiceForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  initialData={invoiceData}
  validationSchema={invoiceSchema}
  loading={isSubmitting}
/>
```

### BillWorkflow

```typescript
import { BillWorkflow } from "@aibos/ui";

<BillWorkflow
  billId={billId}
  onStatusChange={handleStatusChange}
  onApproval={handleApproval}
  onRejection={handleRejection}
/>
```

### PaymentProcessing

```typescript
import { PaymentProcessing } from "@aibos/ui";

<PaymentProcessing
  paymentId={paymentId}
  onAllocation={handleAllocation}
  onCompletion={handleCompletion}
/>
```

## Accessibility Features

### Screen Reader Support

```typescript
import { AccessibilityProvider } from "@aibos/ui";

<AccessibilityProvider
  screenReader={true}
  highContrast={false}
  reducedMotion={false}
>
  <App />
</AccessibilityProvider>
```

### Keyboard Navigation

```typescript
import { useKeyboardNavigation } from "@aibos/ui";

const { navigate, focusNext, focusPrevious } = useKeyboardNavigation();

// Handle keyboard navigation
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Tab") {
      focusNext();
    } else if (event.key === "Shift+Tab") {
      focusPrevious();
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, []);
```

## Performance Optimization

### Error Boundaries

```typescript
import { ErrorBoundary } from "@aibos/ui";

<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, errorInfo) => {
    console.error("Component error:", error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from "@aibos/ui";

<PerformanceMonitor
  onMetric={(metric) => {
    console.log("Performance metric:", metric);
  }}
>
  <YourComponent />
</PerformanceMonitor>
```

## Responsive Design

### Breakpoint System

```typescript
import { useResponsive } from "@aibos/ui";

const { breakpoint, isMobile, isTablet, isDesktop } = useResponsive();

// Conditional rendering based on screen size
{isMobile ? (
  <MobileInvoiceForm />
) : (
  <DesktopInvoiceForm />
)}
```

### Responsive Components

```typescript
import { ResponsiveProvider } from "@aibos/ui";

<ResponsiveProvider
  breakpoints={{
    mobile: 768,
    tablet: 1024,
    desktop: 1280
  }}
>
  <App />
</ResponsiveProvider>
```

## Configuration

### Theme Configuration

```typescript
import { ThemeProvider } from "@aibos/ui";

<ThemeProvider
  theme={{
    colors: {
      primary: "#007AFF",
      secondary: "#0056CC"
    },
    spacing: {
      base: 16
    }
  }}
>
  <App />
</ThemeProvider>
```

### Feature Flags

```typescript
import { FeatureProvider } from "@aibos/ui";

<FeatureProvider
  features={{
    darkMode: true,
    animations: true,
    offlineMode: false
  }}
>
  <App />
</FeatureProvider>
```

## Testing

```bash
# Run component tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run visual regression tests
pnpm test:visual
```

## Dependencies

- **@aibos/tokens**: Design tokens and theming
- **@aibos/utils**: Shared utilities
- **@aibos/auth**: Authentication context
- **@heroicons/react**: Icon library
- **@radix-ui/react-slot**: Primitive components
- **class-variance-authority**: Component variants
- **clsx**: Conditional class names
- **lucide-react**: Additional icons
- **tailwind-merge**: Tailwind class merging
- **web-vitals**: Performance monitoring
- **zustand**: State management

## Performance Considerations

- **Code Splitting**: Components are code-split for optimal loading
- **Tree Shaking**: Unused components are eliminated from bundles
- **Memoization**: Expensive components use React.memo
- **Virtual Scrolling**: Large lists use virtual scrolling
- **Lazy Loading**: Images and heavy components are lazy-loaded

## Security

- **XSS Protection**: All user inputs are sanitized
- **CSRF Protection**: Forms include CSRF tokens
- **Content Security Policy**: Strict CSP headers
- **Input Validation**: All inputs are validated with Zod

## Error Handling

```typescript
import { ErrorHandler } from "@aibos/ui";

const errorHandler = new ErrorHandler({
  onError: (error, context) => {
    console.error("UI Error:", error, context);
  },
  fallback: <ErrorFallback />
});
```

## Contributing

1. Follow the coding standards
2. Add tests for new components
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.

## Modules

- [](README.md)
- [Alert](Alert/README.md)
- [Badge](Badge/README.md)
- [Button](Button/README.md)
- [Card](Card/README.md)
- [components/member-management](components/member-management/README.md)
- [components/tenant-switcher](components/tenant-switcher/README.md)
- [hooks/use-tenant-management](hooks/use-tenant-management/README.md)
- [Input](Input/README.md)
- [Label](Label/README.md)
- [types](types/README.md)
- [utils](utils/README.md)
