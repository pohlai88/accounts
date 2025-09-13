# App Shell — Application Shell Components

> **TL;DR**: Steve Jobs inspired application shell providing persistent structural skeleton with
> dock, command palette, universal inbox, and timeline drawer.  
> **Owner**: @aibos/ui-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Application shell structure and layout
- Dock navigation component
- Command palette for quick actions
- Universal inbox for notifications
- Timeline drawer for activity history
- Universal create for new items
- Status bar for system information
- Context-aware navigation

**Does NOT**:

- Handle business logic (delegated to @aibos/accounting)
- Manage data operations (delegated to @aibos/db)
- Process authentication (delegated to @aibos/auth)
- Generate reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/web, @aibos/mobile, external applications

## 2) Quick Links

- **Main Shell**: `AppShell.tsx`
- **Dock**: `Dock.tsx`
- **Command Palette**: `CommandPalette.tsx`
- **Universal Inbox**: `UniversalInbox.tsx`
- **Timeline Drawer**: `TimelineDrawer.tsx`
- **Universal Create**: `UniversalCreate.tsx`
- **Status Bar**: `StatusBar.tsx`

## 3) Getting Started

```typescript
import {
  AppShell,
  Dock,
  CommandPalette,
  UniversalInbox,
  TimelineDrawer,
  UniversalCreate,
  StatusBar,
} from "@aibos/ui/components/app-shell";

// Basic app shell
<AppShell
  currentContext="sell"
  onNavigate={(context) => console.log("Navigate to:", context)}
  onSearch={(query) => console.log("Search:", query)}
  onCommand={(command) => console.log("Command:", command)}
  onCreate={(action) => console.log("Create:", action)}
>
  <YourAppContent />
</AppShell>;
```

## 4) Architecture & Dependencies

**Dependencies**:

- React 18+ for component functionality
- @aibos/ui/utils for utility functions
- @aibos/ui/tokens for design tokens
- @aibos/ui/theme for theming

**Dependents**:

- @aibos/web for main application shell
- @aibos/mobile for mobile app shell
- External applications for shell integration

**Build Order**: Depends on @aibos/ui/tokens, @aibos/ui/theme, @aibos/ui/utils

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/ui dev
pnpm --filter @aibos/ui test
```

**Testing**:

```bash
pnpm --filter @aibos/ui test src/components/app-shell/
```

**Linting**:

```bash
pnpm --filter @aibos/ui lint src/components/app-shell/
```

**Type Checking**:

```bash
pnpm --filter @aibos/ui typecheck
```

## 6) API Surface

**Exports**:

### AppShell (`AppShell.tsx`)

- `AppShell` - Main application shell component
- `AppShellProps` - Props interface for AppShell

### Dock (`Dock.tsx`)

- `Dock` - Navigation dock component
- `DockProps` - Props interface for Dock

### CommandPalette (`CommandPalette.tsx`)

- `CommandPalette` - Command palette component
- `Command` - Command interface
- `CommandPaletteProps` - Props interface for CommandPalette

### UniversalInbox (`UniversalInbox.tsx`)

- `UniversalInbox` - Universal inbox component
- `UniversalInboxProps` - Props interface for UniversalInbox

### TimelineDrawer (`TimelineDrawer.tsx`)

- `TimelineDrawer` - Timeline drawer component
- `TimelineDrawerProps` - Props interface for TimelineDrawer

### UniversalCreate (`UniversalCreate.tsx`)

- `UniversalCreate` - Universal create component
- `UniversalCreateProps` - Props interface for UniversalCreate

### StatusBar (`StatusBar.tsx`)

- `StatusBar` - Status bar component
- `StatusBarProps` - Props interface for StatusBar

**Public Types**:

- `AppShellProps` - Main shell props
- `DockProps` - Dock component props
- `CommandPaletteProps` - Command palette props
- `UniversalInboxProps` - Universal inbox props
- `TimelineDrawerProps` - Timeline drawer props
- `UniversalCreateProps` - Universal create props
- `StatusBarProps` - Status bar props
- `Command` - Command interface

## 7) Performance & Monitoring

**Bundle Size**: ~15KB minified  
**Performance Budget**: <100ms for shell rendering, <50ms for navigation  
**Monitoring**: Performance monitoring for shell interactions

## 8) Security & Compliance

**Permissions**:

- Shell components require proper authentication
- Command execution requires authorization
- Navigation requires context permissions

**Data Handling**:

- All shell interactions validated and sanitized
- Secure command execution
- Audit trail for shell actions

**Compliance**:

- V1 compliance for shell operations
- SoD enforcement for shell access
- Security audit compliance

## 9) Usage Examples

### Basic App Shell

```typescript
import { AppShell } from "@aibos/ui/components/app-shell";

function MyApp() {
  const handleNavigate = (context: string) => {
    console.log("Navigate to:", context);
    // Handle navigation logic
  };

  const handleSearch = (query: string) => {
    console.log("Search:", query);
    // Handle search logic
  };

  const handleCommand = (command: Command) => {
    console.log("Command:", command);
    // Handle command execution
  };

  const handleCreate = (action: any) => {
    console.log("Create:", action);
    // Handle create action
  };

  return (
    <AppShell
      currentContext="sell"
      onNavigate={handleNavigate}
      onSearch={handleSearch}
      onCommand={handleCommand}
      onCreate={handleCreate}
    >
      <YourAppContent />
    </AppShell>
  );
}
```

### Dock Navigation

```typescript
import { Dock } from "@aibos/ui/components/app-shell";

function NavigationDock() {
  const dockItems = [
    { id: "sell", label: "Sell", icon: "InvoiceIcon", active: true },
    { id: "buy", label: "Buy", icon: "BillIcon", active: false },
    { id: "cash", label: "Cash", icon: "CashIcon", active: false },
    { id: "close", label: "Close", icon: "CloseIcon", active: false },
    { id: "reports", label: "Reports", icon: "ReportIcon", active: false },
    { id: "settings", label: "Settings", icon: "SettingsIcon", active: false },
  ];

  return (
    <Dock
      items={dockItems}
      onItemClick={(item) => console.log("Dock item clicked:", item)}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2"
    />
  );
}
```

### Command Palette

```typescript
import { CommandPalette, Command } from "@aibos/ui/components/app-shell";

function MyCommandPalette() {
  const commands: Command[] = [
    {
      id: "create-invoice",
      title: "Create Invoice",
      description: "Create a new customer invoice",
      icon: "InvoiceIcon",
      action: () => console.log("Create invoice"),
    },
    {
      id: "create-bill",
      title: "Create Bill",
      description: "Create a new vendor bill",
      icon: "BillIcon",
      action: () => console.log("Create bill"),
    },
    {
      id: "search-customers",
      title: "Search Customers",
      description: "Search for customers",
      icon: "SearchIcon",
      action: () => console.log("Search customers"),
    },
  ];

  return (
    <CommandPalette
      commands={commands}
      onCommand={(command) => command.action()}
      placeholder="Search commands..."
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
    />
  );
}
```

### Universal Inbox

```typescript
import { UniversalInbox } from "@aibos/ui/components/app-shell";

function MyUniversalInbox() {
  const inboxItems = [
    {
      id: "1",
      type: "notification",
      title: "New Invoice Created",
      description: "Invoice INV-001 has been created",
      timestamp: new Date(),
      unread: true,
    },
    {
      id: "2",
      type: "alert",
      title: "Payment Due Soon",
      description: "Payment for Bill BILL-002 is due in 3 days",
      timestamp: new Date(),
      unread: false,
    },
  ];

  return (
    <UniversalInbox
      items={inboxItems}
      onItemClick={(item) => console.log("Inbox item clicked:", item)}
      onMarkAsRead={(itemId) => console.log("Mark as read:", itemId)}
      className="fixed top-4 right-4 w-80 h-96"
    />
  );
}
```

### Timeline Drawer

```typescript
import { TimelineDrawer } from "@aibos/ui/components/app-shell";

function MyTimelineDrawer() {
  const timelineItems = [
    {
      id: "1",
      type: "activity",
      title: "Invoice Created",
      description: "Invoice INV-001 was created by John Doe",
      timestamp: new Date(),
      user: "John Doe",
      icon: "InvoiceIcon",
    },
    {
      id: "2",
      type: "activity",
      title: "Payment Received",
      description: "Payment of $1,000 received for Invoice INV-001",
      timestamp: new Date(),
      user: "System",
      icon: "PaymentIcon",
    },
  ];

  return (
    <TimelineDrawer
      items={timelineItems}
      onItemClick={(item) => console.log("Timeline item clicked:", item)}
      className="fixed right-0 top-0 h-full w-80"
    />
  );
}
```

### Universal Create

```typescript
import { UniversalCreate } from "@aibos/ui/components/app-shell";

function MyUniversalCreate() {
  const createActions = [
    {
      id: "create-invoice",
      title: "Create Invoice",
      description: "Create a new customer invoice",
      icon: "InvoiceIcon",
      action: () => console.log("Create invoice"),
    },
    {
      id: "create-bill",
      title: "Create Bill",
      description: "Create a new vendor bill",
      icon: "BillIcon",
      action: () => console.log("Create bill"),
    },
    {
      id: "create-customer",
      title: "Create Customer",
      description: "Add a new customer",
      icon: "CustomerIcon",
      action: () => console.log("Create customer"),
    },
  ];

  return (
    <UniversalCreate
      actions={createActions}
      onAction={(action) => action.action()}
      className="fixed bottom-20 right-4"
    />
  );
}
```

### Status Bar

```typescript
import { StatusBar } from "@aibos/ui/components/app-shell";

function MyStatusBar() {
  const statusItems = [
    {
      id: "connection",
      label: "Connected",
      status: "success",
      icon: "CheckIcon",
    },
    {
      id: "sync",
      label: "Synced",
      status: "success",
      icon: "SyncIcon",
    },
    {
      id: "notifications",
      label: "3 New",
      status: "warning",
      icon: "BellIcon",
    },
  ];

  return (
    <StatusBar
      items={statusItems}
      onItemClick={(item) => console.log("Status item clicked:", item)}
      className="fixed bottom-0 left-0 right-0 h-8"
    />
  );
}
```

### Advanced Shell Configuration

```typescript
import { AppShell } from "@aibos/ui/components/app-shell";

function AdvancedAppShell() {
  const [currentContext, setCurrentContext] = useState("sell");
  const [showInbox, setShowInbox] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const handleNavigate = (context: string) => {
    setCurrentContext(context);
    // Handle navigation logic
  };

  const handleSearch = (query: string) => {
    // Handle search logic
    console.log("Search:", query);
  };

  const handleCommand = (command: Command) => {
    // Handle command execution
    console.log("Command:", command);
    setShowCommandPalette(false);
  };

  const handleCreate = (action: any) => {
    // Handle create action
    console.log("Create:", action);
  };

  return (
    <AppShell
      currentContext={currentContext}
      onNavigate={handleNavigate}
      onSearch={handleSearch}
      onCommand={handleCommand}
      onCreate={handleCreate}
      className="min-h-screen bg-background"
    >
      <YourAppContent />

      {showInbox && (
        <UniversalInbox
          onClose={() => setShowInbox(false)}
          className="fixed top-0 right-0 h-full w-80"
        />
      )}

      {showTimeline && (
        <TimelineDrawer
          onClose={() => setShowTimeline(false)}
          className="fixed top-0 right-0 h-full w-80"
        />
      )}

      {showCommandPalette && (
        <CommandPalette
          onClose={() => setShowCommandPalette(false)}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
      )}
    </AppShell>
  );
}
```

## 10) Troubleshooting

**Common Issues**:

- **Shell Not Rendering**: Check React version and dependencies
- **Navigation Not Working**: Verify onNavigate prop and context handling
- **Command Palette Not Opening**: Check keyboard shortcuts and event handlers
- **Inbox Not Updating**: Verify data flow and state management

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_APP_SHELL = 'true';
```

**Logs**: Check browser console for shell interaction logs

## 11) Contributing

**Code Style**:

- Follow React best practices
- Use descriptive component names
- Implement proper prop validation
- Document complex shell logic

**Testing**:

- Test all shell components
- Test navigation and command execution
- Test responsive behavior
- Test accessibility features

**Review Process**:

- All shell components must be validated
- UI/UX requirements must be met
- Performance must be optimized
- Accessibility must be verified

---

## 📚 **Additional Resources**

- [UI Package README](../../README.md)
- [Components README](../README.md)
- [Theme Module](../theme/README.md)
- [Typography Module](../typography/README.md)
- [Web Package](../../../web/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
