# DOC-040: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Close — Month-End Close Management Components

> **TL;DR**: Comprehensive month-end close management components for period closing, accrual
> helpers, adjusting entries, and close workflow orchestration.  
> **Owner**: @aibos/ui-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Month-end close workflow orchestration
- Close room management and collaboration
- Close checklist and task management
- Lock states and period management
- Accrual helpers and calculations
- Adjusting entries creation
- Export pack builder for close documentation

**Does NOT**:

- Handle business logic (delegated to @aibos/accounting)
- Manage data operations (delegated to @aibos/db)
- Process authentication (delegated to @aibos/auth)
- Generate reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/web, @aibos/mobile, external close management applications

## 2) Quick Links

- **Close Workflow**: `CloseWorkflow.tsx`
- **Close Room**: `CloseRoom.tsx`
- **Close Checklist**: `CloseChecklist.tsx`
- **Lock States**: `LockStates.tsx`
- **Accrual Helpers**: `AccrualHelpers.tsx`
- **Adjusting Entries**: `AdjustingEntries.tsx`
- **Export Pack Builder**: `ExportPackBuilder.tsx`

## 3) Getting Started

```typescript
import {
  CloseWorkflow,
  CloseRoom,
  CloseChecklist,
  LockStates,
  AccrualHelpers,
  AdjustingEntries,
  ExportPackBuilder,
} from "@aibos/ui/components/close";

// Basic close workflow
<CloseWorkflow
  workflowData={closeWorkflowData}
  onStepChange={(stepId, data) => console.log("Step changed:", stepId, data)}
  onStepComplete={(stepId) => console.log("Step completed:", stepId)}
  className="max-w-6xl mx-auto"
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

- @aibos/web for close management interface
- @aibos/mobile for mobile close management
- External close management applications

**Build Order**: Depends on @aibos/ui/tokens, @aibos/ui/theme, @aibos/ui/utils

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/ui dev
pnpm --filter @aibos/ui test
```

**Testing**:

```bash
pnpm --filter @aibos/ui test src/components/close/
```

**Linting**:

```bash
pnpm --filter @aibos/ui lint src/components/close/
```

**Type Checking**:

```bash
pnpm --filter @aibos/ui typecheck
```

## 6) API Surface

**Exports**:

### CloseWorkflow (`CloseWorkflow.tsx`)

- `CloseWorkflow` - Main close workflow component
- `CloseWorkflowProps` - Props interface for CloseWorkflow
- `CloseWorkflowData` - Close workflow data interface
- `CloseStep` - Close step interface

### CloseRoom (`CloseRoom.tsx`)

- `CloseRoom` - Close room collaboration component
- `CloseRoomProps` - Props interface for CloseRoom

### CloseChecklist (`CloseChecklist.tsx`)

- `CloseChecklist` - Close checklist component
- `CloseChecklistProps` - Props interface for CloseChecklist

### LockStates (`LockStates.tsx`)

- `LockStates` - Lock states management component
- `LockStatesProps` - Props interface for LockStates

### AccrualHelpers (`AccrualHelpers.tsx`)

- `AccrualHelpers` - Accrual helpers component
- `AccrualHelpersProps` - Props interface for AccrualHelpers

### AdjustingEntries (`AdjustingEntries.tsx`)

- `AdjustingEntries` - Adjusting entries component
- `AdjustingEntriesProps` - Props interface for AdjustingEntries

### ExportPackBuilder (`ExportPackBuilder.tsx`)

- `ExportPackBuilder` - Export pack builder component
- `ExportPackBuilderProps` - Props interface for ExportPackBuilder

**Public Types**:

- `CloseWorkflowData` - Close workflow data structure
- `CloseStep` - Close step structure
- `CloseRoomData` - Close room data structure
- `ChecklistItem` - Checklist item structure
- `LockState` - Lock state structure
- `AccrualData` - Accrual data structure
- `AdjustingEntry` - Adjusting entry structure
- `ExportPack` - Export pack structure

## 7) Performance & Monitoring

**Bundle Size**: ~20KB minified  
**Performance Budget**: <200ms for workflow rendering, <100ms for step operations  
**Monitoring**: Performance monitoring for close operations

## 8) Security & Compliance

**Permissions**:

- Close operations require proper authentication
- Period locking requires authorization
- Export operations require security clearance

**Data Handling**:

- All close data validated and sanitized
- Secure period management
- Audit trail for close operations

**Compliance**:

- V1 compliance for close operations
- SoD enforcement for close management
- Security audit compliance

## 9) Usage Examples

### Close Workflow

```typescript
import { CloseWorkflow, CloseWorkflowData } from "@aibos/ui/components/close";

function MyCloseWorkflow() {
  const closeWorkflowData: CloseWorkflowData = {
    currentPeriod: {
      id: "2024-01",
      name: "January 2024",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      status: "closing",
    },
    steps: [
      {
        id: "close-room",
        title: "Close Room",
        description: "Set up close room and assign tasks",
        component: "close-room",
        status: "completed",
        required: true,
        estimatedHours: 2,
        actualHours: 1.5,
        completedAt: "2024-01-31T09:00:00Z",
        completedBy: "John Doe",
        dependencies: [],
      },
      {
        id: "checklist",
        title: "Close Checklist",
        description: "Complete close checklist items",
        component: "checklist",
        status: "in_progress",
        required: true,
        estimatedHours: 4,
        dependencies: ["close-room"],
      },
    ],
    currentStepId: "checklist",
    progress: {
      completedSteps: 1,
      totalSteps: 6,
      totalHours: 24,
      actualHours: 1.5,
    },
  };

  return (
    <CloseWorkflow
      workflowData={closeWorkflowData}
      onStepChange={(stepId, data) =>
        console.log("Step changed:", stepId, data)
      }
      onStepComplete={(stepId) => console.log("Step completed:", stepId)}
      className="max-w-6xl mx-auto"
    />
  );
}
```

### Close Room

```typescript
import { CloseRoom } from "@aibos/ui/components/close";

function MyCloseRoom() {
  const closeRoomData = {
    period: {
      id: "2024-01",
      name: "January 2024",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    },
    participants: [
      { id: "1", name: "John Doe", role: "Controller", status: "active" },
      { id: "2", name: "Jane Smith", role: "Accountant", status: "active" },
      { id: "3", name: "Bob Johnson", role: "Analyst", status: "away" },
    ],
    tasks: [
      {
        id: "1",
        title: "Review AR Aging",
        assignee: "Jane Smith",
        status: "completed",
      },
      {
        id: "2",
        title: "Reconcile Bank Accounts",
        assignee: "Bob Johnson",
        status: "in_progress",
      },
    ],
  };

  return (
    <CloseRoom
      data={closeRoomData}
      onTaskUpdate={(taskId, updates) =>
        console.log("Task updated:", taskId, updates)
      }
      onParticipantUpdate={(participantId, updates) =>
        console.log("Participant updated:", participantId, updates)
      }
      className="max-w-4xl mx-auto"
    />
  );
}
```

### Close Checklist

```typescript
import { CloseChecklist } from "@aibos/ui/components/close";

function MyCloseChecklist() {
  const checklistItems = [
    {
      id: "1",
      title: "Review AR Aging",
      description: "Review and analyze accounts receivable aging report",
      status: "completed",
      assignee: "Jane Smith",
      dueDate: "2024-01-31",
      completedAt: "2024-01-30T15:30:00Z",
    },
    {
      id: "2",
      title: "Reconcile Bank Accounts",
      description: "Reconcile all bank accounts for the period",
      status: "in_progress",
      assignee: "Bob Johnson",
      dueDate: "2024-01-31",
      completedAt: null,
    },
  ];

  return (
    <CloseChecklist
      items={checklistItems}
      onItemUpdate={(itemId, updates) =>
        console.log("Item updated:", itemId, updates)
      }
      onItemComplete={(itemId) => console.log("Item completed:", itemId)}
      className="max-w-4xl mx-auto"
    />
  );
}
```

### Lock States

```typescript
import { LockStates } from "@aibos/ui/components/close";

function MyLockStates() {
  const lockStates = [
    {
      id: "gl",
      name: "General Ledger",
      status: "unlocked",
      lockedAt: null,
      lockedBy: null,
      canLock: true,
    },
    {
      id: "ar",
      name: "Accounts Receivable",
      status: "locked",
      lockedAt: "2024-01-31T16:00:00Z",
      lockedBy: "John Doe",
      canLock: false,
    },
    {
      id: "ap",
      name: "Accounts Payable",
      status: "unlocked",
      lockedAt: null,
      lockedBy: null,
      canLock: true,
    },
  ];

  return (
    <LockStates
      states={lockStates}
      onLock={(stateId) => console.log("Lock state:", stateId)}
      onUnlock={(stateId) => console.log("Unlock state:", stateId)}
      className="max-w-2xl mx-auto"
    />
  );
}
```

### Accrual Helpers

```typescript
import { AccrualHelpers } from "@aibos/ui/components/close";

function MyAccrualHelpers() {
  const accrualData = [
    {
      id: "1",
      type: "expense",
      description: "Utilities Accrual",
      amount: 5000,
      account: "Expenses:Utilities",
      period: "2024-01",
      status: "pending",
    },
    {
      id: "2",
      type: "revenue",
      description: "Service Revenue Accrual",
      amount: 8000,
      account: "Revenue:Services",
      period: "2024-01",
      status: "completed",
    },
  ];

  return (
    <AccrualHelpers
      data={accrualData}
      onAccrualCreate={(accrual) => console.log("Accrual created:", accrual)}
      onAccrualUpdate={(accrualId, updates) =>
        console.log("Accrual updated:", accrualId, updates)
      }
      onAccrualPost={(accrualId) => console.log("Accrual posted:", accrualId)}
      className="max-w-4xl mx-auto"
    />
  );
}
```

### Adjusting Entries

```typescript
import { AdjustingEntries } from "@aibos/ui/components/close";

function MyAdjustingEntries() {
  const adjustingEntries = [
    {
      id: "1",
      date: "2024-01-31",
      description: "Depreciation Adjustment",
      debitAccount: "Expenses:Depreciation",
      creditAccount: "Accumulated Depreciation",
      amount: 2000,
      status: "draft",
    },
    {
      id: "2",
      date: "2024-01-31",
      description: "Prepaid Insurance Adjustment",
      debitAccount: "Expenses:Insurance",
      creditAccount: "Prepaid Insurance",
      amount: 500,
      status: "posted",
    },
  ];

  return (
    <AdjustingEntries
      entries={adjustingEntries}
      onEntryCreate={(entry) => console.log("Entry created:", entry)}
      onEntryUpdate={(entryId, updates) =>
        console.log("Entry updated:", entryId, updates)
      }
      onEntryPost={(entryId) => console.log("Entry posted:", entryId)}
      className="max-w-4xl mx-auto"
    />
  );
}
```

### Export Pack Builder

```typescript
import { ExportPackBuilder } from "@aibos/ui/components/close";

function MyExportPackBuilder() {
  const exportPack = {
    id: "2024-01-close",
    name: "January 2024 Close Pack",
    period: "2024-01",
    documents: [
      { id: "1", name: "Trial Balance", type: "pdf", status: "ready" },
      { id: "2", name: "Balance Sheet", type: "pdf", status: "ready" },
      { id: "3", name: "P&L Statement", type: "pdf", status: "ready" },
    ],
    status: "building",
  };

  return (
    <ExportPackBuilder
      pack={exportPack}
      onPackUpdate={(pack) => console.log("Pack updated:", pack)}
      onDocumentAdd={(document) => console.log("Document added:", document)}
      onPackExport={(packId) => console.log("Pack exported:", packId)}
      className="max-w-4xl mx-auto"
    />
  );
}
```

### Advanced Close Management

```typescript
import {
  CloseWorkflow,
  CloseRoom,
  CloseChecklist,
  LockStates,
  AccrualHelpers,
  AdjustingEntries,
  ExportPackBuilder,
} from "@aibos/ui/components/close";

function AdvancedCloseManagement() {
  const [currentStep, setCurrentStep] = useState("close-room");
  const [workflowData, setWorkflowData] = useState(null);
  const [closeRoomData, setCloseRoomData] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);

  const handleStepChange = (stepId: string, data: any) => {
    setCurrentStep(stepId);
    setWorkflowData(data);
  };

  const handleStepComplete = (stepId: string) => {
    console.log("Step completed:", stepId);
    // Handle step completion
  };

  const handleTaskUpdate = (taskId: string, updates: any) => {
    console.log("Task updated:", taskId, updates);
    // Handle task update
  };

  const handleItemUpdate = (itemId: string, updates: any) => {
    console.log("Item updated:", itemId, updates);
    // Handle checklist item update
  };

  return (
    <div className="max-w-7xl mx-auto">
      <CloseWorkflow
        workflowData={workflowData}
        onStepChange={handleStepChange}
        onStepComplete={handleStepComplete}
        className="mb-8"
      />

      {currentStep === "close-room" && (
        <CloseRoom
          data={closeRoomData}
          onTaskUpdate={handleTaskUpdate}
          className="mb-8"
        />
      )}

      {currentStep === "checklist" && (
        <CloseChecklist
          items={checklistItems}
          onItemUpdate={handleItemUpdate}
          className="mb-8"
        />
      )}

      {currentStep === "lock-states" && (
        <LockStates
          states={[]}
          onLock={(stateId) => console.log("Lock state:", stateId)}
          className="mb-8"
        />
      )}

      {currentStep === "accruals" && (
        <AccrualHelpers
          data={[]}
          onAccrualCreate={(accrual) =>
            console.log("Accrual created:", accrual)
          }
          className="mb-8"
        />
      )}

      {currentStep === "adjusting-entries" && (
        <AdjustingEntries
          entries={[]}
          onEntryCreate={(entry) => console.log("Entry created:", entry)}
          className="mb-8"
        />
      )}

      {currentStep === "export-pack" && (
        <ExportPackBuilder
          pack={{}}
          onPackUpdate={(pack) => console.log("Pack updated:", pack)}
          className="mb-8"
        />
      )}
    </div>
  );
}
```

## 10) Troubleshooting

**Common Issues**:

- **Workflow Not Loading**: Check workflow data format and step configuration
- **Close Room Not Updating**: Verify participant and task data
- **Checklist Not Saving**: Check item validation and data persistence
- **Lock States Not Working**: Verify permissions and state management

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_CLOSE = "true";
```

**Logs**: Check browser console for close operation logs

## 11) Contributing

**Code Style**:

- Follow React best practices
- Use descriptive component names
- Implement proper workflow validation
- Document complex close logic

**Testing**:

- Test all close components
- Test workflow orchestration
- Test collaboration features
- Test export functionality

**Review Process**:

- All close components must be validated
- UI/UX requirements must be met
- Performance must be optimized
- Security must be verified

---

## 📚 **Additional Resources**

- [UI Package README](../../README.md)
- [Components README](../README.md)
- [App Shell Module](../app-shell/README.md)
- [Accounting Package](../../../accounting/README.md)
- [Web Package](../../../web/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
