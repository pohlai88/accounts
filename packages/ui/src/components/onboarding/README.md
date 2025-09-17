# Tenant Onboarding Components

This directory contains components for tenant onboarding and user management workflows, designed with best practices from leading accounting platforms like Odoo, Zoho, QuickBooks, and Xero.

## Components

### TenantOnboarding

A comprehensive multi-step wizard for setting up new organizations with the following features:

#### Features

- **4-Step Wizard**: Organization → Company → Features → Team
- **Smart Validation**: Real-time form validation with helpful error messages
- **Feature Selection**: Choose which accounting features to enable
- **Team Invitation**: Invite team members during setup
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: WCAG 2.2 AAA compliant with proper ARIA labels

#### Usage

```tsx
import { TenantOnboarding } from "@aibos/ui/components/onboarding";

function SetupPage() {
  const handleComplete = async (data: TenantOnboardingData) => {
    // Create tenant, company, and invite users
    const tenant = await createTenant(data);
    const company = await createCompany(tenant.id, data);
    await inviteUsers(tenant.id, data.invitedUsers);
  };

  return <TenantOnboarding onComplete={handleComplete} onCancel={() => router.back()} />;
}
```

#### Props

```tsx
interface TenantOnboardingProps {
  onComplete: (data: TenantOnboardingData) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}
```

#### Data Structure

```tsx
interface TenantOnboardingData {
  // Step 1: Basic Information
  name: string;
  slug: string;
  industry: string;

  // Step 2: Company Setup
  companyName: string;
  companyCode: string;
  baseCurrency: string;
  fiscalYearEnd: string;

  // Step 3: Feature Selection
  features: {
    attachments: boolean;
    reports: boolean;
    ar: boolean;
    ap: boolean;
    je: boolean;
    regulated_mode: boolean;
  };

  // Step 4: User Invitation
  invitedUsers: Array<{
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  }>;
}
```

## Design Principles

### 1. Progressive Disclosure

- Information is revealed step by step to avoid overwhelming users
- Each step builds upon the previous one
- Clear progress indicators show completion status

### 2. Smart Defaults

- Sensible default values based on industry best practices
- Auto-generated slugs from organization names
- Recommended features pre-selected

### 3. Validation & Feedback

- Real-time validation with helpful error messages
- Clear success states and confirmation
- Graceful error handling with recovery options

### 4. Accessibility

- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## Integration with APIs

The component integrates with the following APIs:

- `POST /api/tenants` - Create new tenant
- `POST /api/companies` - Create company within tenant
- `POST /api/tenants/{id}/invite` - Invite team members

## Best Practices

### 1. Error Handling

```tsx
const handleComplete = async (data: TenantOnboardingData) => {
  try {
    await createTenant(data);
    // Success handling
  } catch (error) {
    // Show user-friendly error message
    setError(error.message);
  }
};
```

### 2. Loading States

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

// Show loading state during API calls
if (isSubmitting) {
  return <LoadingSpinner />;
}
```

### 3. Form Validation

```tsx
const validateStep = () => {
  const errors = {};
  if (!data.name.trim()) {
    errors.name = "Organization name is required";
  }
  return Object.keys(errors).length === 0;
};
```

## Styling

The component uses the design system tokens for consistent styling:

- `--sys-bg-primary` - Background colors
- `--sys-text-primary` - Text colors
- `--sys-border-hairline` - Border colors
- `--brand-primary` - Brand colors

## Testing

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { TenantOnboarding } from "./TenantOnboarding";

test("renders onboarding wizard", () => {
  render(<TenantOnboarding onComplete={jest.fn()} />);
  expect(screen.getByText("Organization Setup")).toBeInTheDocument();
});

test("validates required fields", async () => {
  render(<TenantOnboarding onComplete={jest.fn()} />);
  fireEvent.click(screen.getByText("Next"));
  expect(screen.getByText("Organization name is required")).toBeInTheDocument();
});
```

## Examples

See `TenantOnboarding.example.tsx` for a complete implementation example with API integration.
