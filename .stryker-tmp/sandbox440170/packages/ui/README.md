# DOC-036: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# UI — Component Library & Design System

> **TL;DR**: Steve Jobs-inspired React component library with dual-mode design system, comprehensive
> accounting workflows, and WCAG 2.2 AAA accessibility compliance.  
> **Owner**: @aibos/ui-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Provides comprehensive React component library
- Implements dual-mode design system (aesthetic + accessibility)
- Delivers complete accounting workflow components (AR, AP, GL, reporting)
- Enforces WCAG 2.2 AAA compliance in accessibility mode
- Maintains Steve Jobs-inspired design philosophy
- Uses semantic tokens for consistent styling
- Provides mobile-first, responsive components

**Does NOT**:

- Implement business logic (delegated to @aibos/accounting)
- Handle API calls (delegated to @aibos/web-api)
- Manage authentication (delegated to @aibos/auth)
- Store data (delegated to @aibos/db)

**Consumers**: @aibos/web, @aibos/web-api, all frontend applications

## 2) Quick Links

- **Component Index**: `src/components/index.ts`
- **Design Guidelines**: `DESIGN_GUIDELINES.md`
- **Core Components**: `src/Button.tsx`, `src/Card.tsx`, `src/Input.tsx`
- **Typography**: `src/components/typography/Typography.tsx`
- **Theme System**: `src/components/theme/ThemeProvider.tsx`
- **Architecture Guide**: `../docs/ARCHITECTURE.md`
- **Integration Strategy**: `../DRAFT_INTEGRATION STRATEGY.md`

## 3) Getting Started

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Lint
pnpm lint
```

## 4) Architecture & Dependencies

**Dependencies**:

- `react` - React framework
- `@radix-ui/react-slot` - Radix UI primitives
- `class-variance-authority` - Component variant management
- `clsx` - Conditional class names
- `tailwind-merge` - Tailwind class merging
- `lucide-react` - Icon library
- `@aibos/auth` - Authentication utilities
- `@aibos/utils` - Shared utilities
- `@aibos/tokens` - Design tokens

**Dependents**:

- `@aibos/web` - Frontend application
- `@aibos/web-api` - API application
- All frontend applications requiring UI components

**Build Order**: Depends on @aibos/tokens, @aibos/auth, @aibos/utils

## 5) Development Workflow

**Local Dev**:

```bash
# Build with watch mode
pnpm build --watch

# Type check
pnpm typecheck
```

**Testing**:

```bash
# Lint checking
pnpm lint

# Type checking
pnpm typecheck
```

**Linting**:

```bash
# Check for linting errors
pnpm lint

# Auto-fix where possible
pnpm lint --fix
```

**Type Checking**:

```bash
# TypeScript compilation check
pnpm typecheck
```

## 6) API Surface

**Exports**:

- Core UI components (Button, Input, Card, Badge, Alert)
- Typography components (H1-H6, Body, Caption, Link)
- Theme system (ThemeProvider, ThemeToggle)
- Workflow components (Invoice, Bill, Cash, Close, Reports)
- Enterprise components (Multi-company, User roles, COA)
- Mobile components (Offline, PWA, Background sync)
- Performance components (Monitoring, Security, Backup)

**Public Types**:

- Component prop interfaces
- Theme context types
- Design mode types
- Accessibility types

**Configuration**:

- Dual-mode design system
- Semantic token integration
- WCAG compliance settings
- Mobile-first responsive design

## 7) Performance & Monitoring

**Bundle Size**:

- Target: <500KB for UI library
- Optimized for tree-shaking
- Lazy loading for workflow components
- Minimal dependencies for fast loading

**Performance Budget**:

- Component render: <16ms (60fps)
- Theme switching: <5ms
- Bundle size: <500KB total
- Mobile performance: <100ms interaction

**Monitoring**:

- Component usage analytics
- Theme switching performance
- Accessibility compliance metrics
- Mobile performance monitoring

## 8) Security & Compliance

**Permissions**:

- No sensitive data in components
- Props-based data handling
- No authentication logic
- Secure by default

**Data Handling**:

- Props-based data flow
- No internal state for sensitive data
- Controlled component patterns
- Type-safe prop interfaces

**Compliance**:

- WCAG 2.2 AAA compliance in accessibility mode
- Keyboard navigation support
- Screen reader compatibility
- Color contrast validation

## 9) Design System Architecture

### **Steve Jobs Design Philosophy**

- **Simplicity is Sophistication**: Every pixel serves a purpose
- **Form Follows Function**: Design for user tasks, not aesthetics
- **Details Make the Design**: Typography, spacing, and color matter
- **Make It Obvious**: Clear interactions and predictable hierarchy

### **Dual-Mode Design System**

- **Aesthetic Mode**: Beautiful, subtle, Apple-inspired design
- **Accessibility Mode**: WCAG 2.2 AAA compliant, high contrast
- **Seamless Switching**: Runtime mode switching without reload
- **Consistent Experience**: Same functionality, different presentation

### **Component Architecture**

- **Atomic Design**: Atoms, molecules, organisms, templates
- **Composition Pattern**: Small, composable components
- **Variant System**: CVA-based component variants
- **Semantic Tokens**: CSS variable-based theming

## 10) Core Component Categories

### **Foundation Components**

- **Button**: Primary, secondary, ghost, destructive variants
- **Input**: Text, email, password, number inputs
- **Label**: Form labels with accessibility support
- **Card**: Container with header, content, footer
- **Badge**: Status indicators and labels
- **Alert**: Success, warning, error notifications

### **Typography Components**

- **H1-H6**: Heading hierarchy with semantic tokens
- **Body**: Paragraph text with proper line height
- **Caption**: Small text for labels and descriptions
- **Link**: Accessible link components

### **Layout Components**

- **AppShell**: Main application layout
- **StatusBar**: Application status display
- **Dock**: Navigation dock
- **CommandPalette**: Universal command interface

### **Workflow Components**

- **Invoice Workflow**: Complete AR invoice management
- **Bill Workflow**: Complete AP bill management
- **Cash Workflow**: Banking and reconciliation
- **Close Workflow**: Month-end closing process
- **Reports Workflow**: Financial reporting suite

## 11) Workflow Component Suites

### **Invoice Management (AR)**

- `InvoiceWorkflow` - Complete invoice management
- `InvoiceForm` - Invoice creation and editing
- `InvoiceList` - Invoice listing and filtering
- `CustomerSelector` - Customer selection interface
- `PaymentCapture` - Payment processing
- `InvoiceSender` - Email and delivery
- `PaymentReminders` - Automated reminders
- `InvoiceStatusTimeline` - Status tracking

### **Bill Management (AP)**

- `BillWorkflow` - Complete bill management
- `BillForm` - Bill creation and editing
- `OCRDataExtractor` - Document processing
- `ApprovalWorkflow` - Multi-level approvals
- `PaymentProcessor` - Payment processing
- `VendorManager` - Vendor management
- `ExpenseCategorizer` - Expense categorization

### **Cash Management**

- `CashWorkflow` - Complete cash management
- `BankConnection` - Bank account integration
- `TransactionImport` - Bank feed import
- `ReconciliationCanvas` - Bank reconciliation
- `RuleEngine` - Automated categorization
- `BankFeedManagement` - Feed configuration
- `CashFlowAnalysis` - Cash flow reporting

### **Month-End Close**

- `CloseWorkflow` - Complete closing process
- `CloseRoom` - Collaborative closing workspace
- `CloseChecklist` - Closing task management
- `LockStates` - Period locking controls
- `AccrualHelpers` - Accrual entry tools
- `AdjustingEntries` - Adjusting journal entries
- `ExportPackBuilder` - Export package creation

### **Financial Reporting**

- `ReportsWorkflow` - Complete reporting suite
- `ProfitLossReport` - P&L statement
- `BalanceSheetReport` - Balance sheet
- `CashFlowStatement` - Cash flow statement
- `TrialBalance` - Trial balance report
- `ARAgingReport` - AR aging analysis
- `APAgingReport` - AP aging analysis
- `CustomReportBuilder` - Custom report creation

## 12) Enterprise Components

### **Multi-Company Management**

- `EnterpriseWorkflow` - Enterprise-level workflows
- `MultiCompanyManager` - Multi-company administration
- `UserRolesManager` - User role management
- `ChartOfAccountsManager` - COA administration
- `CompanySettingsManager` - Company configuration

### **Performance & Security**

- `PerformanceSecurityWorkflow` - Performance monitoring
- `PerformanceMonitor` - Real-time performance metrics
- `SecurityAudit` - Security compliance auditing
- `DataEncryption` - Data encryption management
- `BackupRecovery` - Backup and recovery tools
- `MonitoringAlerting` - System monitoring
- `LoadTesting` - Performance testing tools

### **Mobile & Offline**

- `MobileOfflineWorkflow` - Mobile offline capabilities
- `OfflineManager` - Offline data management
- `ConflictResolver` - Data conflict resolution
- `BackgroundSync` - Background synchronization
- `MobileWorkflows` - Mobile-optimized workflows
- `ProgressiveWebApp` - PWA functionality

## 13) Usage Examples

### **Basic Component Usage**

```tsx
import { Button, Card, Input, Label } from "@aibos/ui";

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="customer">Customer</Label>
            <Input id="customer" placeholder="Select customer" />
          </div>
          <Button>Create Invoice</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### **Theme Integration**

```tsx
import { ThemeProvider, ThemeToggle } from "@aibos/ui";

function App() {
  return (
    <ThemeProvider defaultMode="aesthetic">
      <div className="min-h-screen bg-sys-bg-base">
        <header className="flex justify-between items-center p-4">
          <h1 className="text-sys-text-primary">AI-BOS</h1>
          <ThemeToggle />
        </header>
        {/* App content */}
      </div>
    </ThemeProvider>
  );
}
```

### **Workflow Component Usage**

```tsx
import { InvoiceWorkflow, BillWorkflow, CashWorkflow } from "@aibos/ui";

function AccountingDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <InvoiceWorkflow />
      <BillWorkflow />
      <CashWorkflow />
    </div>
  );
}
```

### **Typography Usage**

```tsx
import { H1, H2, Body, Caption, Link } from "@aibos/ui";

function Document() {
  return (
    <article>
      <H1>Document Title</H1>
      <H2>Section Heading</H2>
      <Body>
        This is the main content with proper typography.
        <Link href="/more">Learn more</Link>
      </Body>
      <Caption>Last updated: September 13, 2025</Caption>
    </article>
  );
}
```

## 14) Troubleshooting

**Common Issues**:

- **Components Not Styling**: Ensure ThemeProvider is wrapping your app
- **Accessibility Mode Not Working**: Check data-accessibility-mode attribute
- **TypeScript Errors**: Verify all required props are provided
- **Theme Switching Issues**: Ensure tokens package is properly installed

**Debug Mode**:

```bash
# Check component exports
ls src/components/

# Verify theme provider
cat src/components/theme/ThemeProvider.tsx
```

**Logs**:

- Component render logs
- Theme switching events
- Accessibility compliance warnings
- Performance metrics

## 15) Contributing

**Code Style**:

- Follow Steve Jobs design principles
- Maintain dual-mode consistency
- Use semantic tokens for styling
- Document all component props

**Testing**:

- Test both design modes
- Validate WCAG compliance
- Test mobile responsiveness
- Verify accessibility features

**Review Process**:

- All changes must maintain dual-mode support
- Breaking changes require major version bump
- Design changes need accessibility review
- Documentation must be updated

---

## 📚 **Additional Resources**

- [Project README](../README.md)
- [Design Guidelines](DESIGN_GUIDELINES.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Integration Strategy](../DRAFT_INTEGRATION STRATEGY.md)
- [Tokens Package](../packages/tokens/README.md)

---

## 🔗 **Design Principles**

### **Steve Jobs Philosophy**

- Simplicity is the ultimate sophistication
- Form follows function
- Details make the design
- Make it obvious

### **Dual-Mode Architecture**

- Aesthetic mode for visual elegance
- Accessibility mode for functional clarity
- Seamless mode switching
- Consistent user experience

### **Component Composition**

- Small, composable components
- Variant-based styling
- Semantic token integration
- Mobile-first responsive design

### **Accessibility First**

- WCAG 2.2 AAA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast support

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
