# DOC-255: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Empty States — User Experience Empty State Components

> **TL;DR**: Steve Jobs inspired empty state components for guiding users to their first action with
> elegant, inevitable design.  
> **Owner**: @aibos/ui-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Empty state component for general use
- Bill-specific empty state component
- Invoice-specific empty state component
- User guidance and onboarding
- First action prompting
- Elegant placeholder design

**Does NOT**:

- Handle business logic (delegated to @aibos/accounting)
- Manage data operations (delegated to @aibos/db)
- Process authentication (delegated to @aibos/auth)
- Generate reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/web, @aibos/mobile, external applications

## 2) Quick Links

- **Empty State**: `EmptyState.tsx`
- **Bill Empty State**: `BillEmptyState.tsx`
- **Invoice Empty State**: `InvoiceEmptyState.tsx`

## 3) Getting Started

```typescript
import {
  EmptyState,
  BillEmptyState,
  InvoiceEmptyState,
} from "@aibos/ui/components/empty-states";

// Basic empty state
<EmptyState
  icon={<FileText className="h-8 w-8" />}
  title="No documents yet"
  description="Get started by creating your first document"
  action={{
    label: "Create Document",
    onClick: () => console.log("Create clicked"),
    variant: "primary",
  }}
  className="max-w-md mx-auto"
/>;
```

## 4) Architecture & Dependencies

**Dependencies**:

- React 18+ for component functionality
- @aibos/ui/utils for utility functions
- @aibos/ui/tokens for design tokens
- @aibos/ui/theme for theming
- Lucide React for icons

**Dependents**:

- @aibos/web for empty state displays
- @aibos/mobile for mobile empty states
- External applications for empty state integration

**Build Order**: Depends on @aibos/ui/tokens, @aibos/ui/theme, @aibos/ui/utils

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/ui dev
pnpm --filter @aibos/ui test
```

**Testing**:

```bash
pnpm --filter @aibos/ui test src/components/empty-states/
```

**Linting**:

```bash
pnpm --filter @aibos/ui lint src/components/empty-states/
```

**Type Checking**:

```bash
pnpm --filter @aibos/ui typecheck
```

## 6) API Surface

**Exports**:

### EmptyState (`EmptyState.tsx`)

- `EmptyState` - General empty state component
- `EmptyStateProps` - Props interface for EmptyState

### BillEmptyState (`BillEmptyState.tsx`)

- `BillEmptyState` - Bill-specific empty state component
- `BillEmptyStateProps` - Props interface for BillEmptyState

### InvoiceEmptyState (`InvoiceEmptyState.tsx`)

- `InvoiceEmptyState` - Invoice-specific empty state component
- `InvoiceEmptyStateProps` - Props interface for InvoiceEmptyState

**Public Types**:

- `EmptyStateProps` - General empty state props
- `BillEmptyStateProps` - Bill empty state props
- `InvoiceEmptyStateProps` - Invoice empty state props
- `EmptyStateAction` - Empty state action interface

## 7) Performance & Monitoring

**Bundle Size**: ~5KB minified  
**Performance Budget**: <50ms for rendering, <25ms for interactions  
**Monitoring**: Performance monitoring for empty state interactions

## 8) Security & Compliance

**Permissions**:

- Empty states require proper authentication
- Action buttons require authorization
- User guidance requires context permissions

**Data Handling**:

- All empty state interactions validated and sanitized
- Secure action execution
- Audit trail for empty state actions

**Compliance**:

- V1 compliance for empty state operations
- SoD enforcement for empty state actions
- Security audit compliance

## 9) Usage Examples

### Basic Empty State

```typescript
import { EmptyState } from "@aibos/ui/components/empty-states";
import { FileText, Plus } from "lucide-react";

function MyEmptyState() {
  return (
    <EmptyState
      icon={<FileText className="h-8 w-8" />}
      title="No documents yet"
      description="Get started by creating your first document. This will help you organize your work and stay productive."
      action={{
        label: "Create Document",
        onClick: () => console.log("Create clicked"),
        variant: "primary",
      }}
      className="max-w-md mx-auto"
    />
  );
}
```

### Bill Empty State

```typescript
import { BillEmptyState } from "@aibos/ui/components/empty-states";

function MyBillEmptyState() {
  return (
    <BillEmptyState
      onCreateBill={() => console.log("Create bill clicked")}
      onImportBills={() => console.log("Import bills clicked")}
      onViewTutorial={() => console.log("View tutorial clicked")}
      className="max-w-lg mx-auto"
    />
  );
}
```

### Invoice Empty State

```typescript
import { InvoiceEmptyState } from "@aibos/ui/components/empty-states";

function MyInvoiceEmptyState() {
  return (
    <InvoiceEmptyState
      onCreateInvoice={() => console.log("Create invoice clicked")}
      onImportInvoices={() => console.log("Import invoices clicked")}
      onViewTutorial={() => console.log("View tutorial clicked")}
      className="max-w-lg mx-auto"
    />
  );
}
```

### Custom Empty State

```typescript
import { EmptyState } from "@aibos/ui/components/empty-states";
import { Users, Plus, ArrowRight } from "lucide-react";

function CustomEmptyState() {
  return (
    <EmptyState
      icon={<Users className="h-12 w-12" />}
      title="No team members yet"
      description="Invite your team members to collaborate on projects and share resources."
      action={{
        label: "Invite Team Members",
        onClick: () => console.log("Invite clicked"),
        variant: "primary",
      }}
      className="max-w-lg mx-auto"
    />
  );
}
```

### Empty State with Multiple Actions

```typescript
import { EmptyState } from "@aibos/ui/components/empty-states";
import { FileText, Plus, Upload, BookOpen } from "lucide-react";

function MultiActionEmptyState() {
  return (
    <div className="max-w-2xl mx-auto">
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="No reports generated yet"
        description="Create your first report or import existing data to get started with analytics."
        className="mb-6"
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => console.log("Create report clicked")}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Report
        </button>

        <button
          onClick={() => console.log("Import data clicked")}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
        >
          <Upload className="h-4 w-4" />
          Import Data
        </button>

        <button
          onClick={() => console.log("View tutorial clicked")}
          className="flex items-center gap-2 px-4 py-2 bg-outline text-outline-foreground rounded-md hover:bg-outline/90"
        >
          <BookOpen className="h-4 w-4" />
          View Tutorial
        </button>
      </div>
    </div>
  );
}
```

### Contextual Empty States

```typescript
import { EmptyState } from "@aibos/ui/components/empty-states";
import { Search, Filter, RefreshCw } from "lucide-react";

function ContextualEmptyStates() {
  const [context, setContext] = useState("search");

  const getEmptyState = () => {
    switch (context) {
      case "search":
        return (
          <EmptyState
            icon={<Search className="h-8 w-8" />}
            title="No search results"
            description="Try adjusting your search terms or filters to find what you're looking for."
            action={{
              label: "Clear Filters",
              onClick: () => console.log("Clear filters clicked"),
              variant: "secondary",
            }}
          />
        );

      case "filter":
        return (
          <EmptyState
            icon={<Filter className="h-8 w-8" />}
            title="No items match your filters"
            description="Try removing some filters or adjusting your criteria to see more results."
            action={{
              label: "Reset Filters",
              onClick: () => console.log("Reset filters clicked"),
              variant: "secondary",
            }}
          />
        );

      case "loading":
        return (
          <EmptyState
            icon={<RefreshCw className="h-8 w-8 animate-spin" />}
            title="Loading data..."
            description="Please wait while we fetch your data."
          />
        );

      default:
        return null;
    }
  };

  return <div className="max-w-md mx-auto">{getEmptyState()}</div>;
}
```

### Empty State with Progress

```typescript
import { EmptyState } from "@aibos/ui/components/empty-states";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

function ProgressEmptyState() {
  const [progress, setProgress] = useState(0);

  const getProgressState = () => {
    if (progress === 0) {
      return {
        icon: <Clock className="h-8 w-8" />,
        title: "Getting started...",
        description:
          "We're setting up your workspace. This will only take a moment.",
        action: null,
      };
    } else if (progress < 100) {
      return {
        icon: <Clock className="h-8 w-8 animate-spin" />,
        title: "Setting up your workspace...",
        description: `Progress: ${progress}% complete`,
        action: null,
      };
    } else {
      return {
        icon: <CheckCircle className="h-8 w-8 text-green-500" />,
        title: "Setup complete!",
        description:
          "Your workspace is ready. You can now start creating content.",
        action: {
          label: "Get Started",
          onClick: () => console.log("Get started clicked"),
          variant: "primary",
        },
      };
    }
  };

  const state = getProgressState();

  return (
    <div className="max-w-md mx-auto">
      <EmptyState
        icon={state.icon}
        title={state.title}
        description={state.description}
        action={state.action}
        className="mb-4"
      />

      {progress > 0 && progress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

### Empty State with Error Handling

```typescript
import { EmptyState } from "@aibos/ui/components/empty-states";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

function ErrorEmptyState() {
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      // Simulate retry logic
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setRetrying(false);
    }
  };

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-8 w-8 text-red-500" />}
        title="Something went wrong"
        description="We encountered an error while loading your data. Please try again."
        action={{
          label: retrying ? "Retrying..." : "Try Again",
          onClick: handleRetry,
          variant: "primary",
        }}
        className="max-w-md mx-auto"
      />
    );
  }

  return (
    <EmptyState
      icon={<Home className="h-8 w-8" />}
      title="Welcome to your dashboard"
      description="This is where you'll see your data and analytics."
      action={{
        label: "Get Started",
        onClick: () => console.log("Get started clicked"),
        variant: "primary",
      }}
      className="max-w-md mx-auto"
    />
  );
}
```

## 10) Troubleshooting

**Common Issues**:

- **Empty State Not Rendering**: Check props and component structure
- **Actions Not Working**: Verify onClick handlers and event binding
- **Styling Issues**: Check className and theme configuration
- **Accessibility Problems**: Verify ARIA labels and keyboard navigation

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_EMPTY_STATES = "true";
```

**Logs**: Check browser console for empty state interaction logs

## 11) Contributing

**Code Style**:

- Follow React best practices
- Use descriptive component names
- Implement proper accessibility
- Document complex empty state logic

**Testing**:

- Test all empty state components
- Test action interactions
- Test responsive behavior
- Test accessibility features

**Review Process**:

- All empty state components must be validated
- UI/UX requirements must be met
- Performance must be optimized
- Accessibility must be verified

---

## 📚 **Additional Resources**

- [UI Package README](../../README.md)
- [Components README](../README.md)
- [App Shell Module](../app-shell/README.md)
- [Theme Module](../theme/README.md)
- [Web Package](../../../web/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
