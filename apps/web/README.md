# DOC-280: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/web

Next.js frontend application with React components for the AI-BOS Accounting SaaS platform.

## Overview

This application provides the frontend interface for the AI-BOS Accounting SaaS platform, featuring a modern React-based UI with comprehensive accounting functionality.

## Core Features

- **Modern UI**: React-based interface with Tailwind CSS
- **Responsive Design**: Mobile-first responsive design
- **Accessibility**: WCAG 2.2 AAA compliance
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Offline-first capabilities
- **Performance**: Optimized loading and smooth interactions
- **Multi-tenant**: Tenant switching and isolation
- **Dark Theme**: Dark-first theme implementation

## Technology Stack

- **Next.js 14**: React framework with App Router
- **React 18**: UI library with hooks and context
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type-safe development
- **TanStack Query**: Data fetching and caching
- **Zustand**: State management
- **Zod**: Runtime validation

## Pages and Routes

### Authentication
- `/login` - User login
- `/register` - User registration
- `/forgot-password` - Password reset
- `/reset-password` - Password reset confirmation

### Dashboard
- `/dashboard` - Main dashboard
- `/dashboard/overview` - Overview metrics
- `/dashboard/analytics` - Analytics and reports

### Invoices
- `/invoices` - Invoice list
- `/invoices/create` - Create invoice
- `/invoices/:id` - Invoice details
- `/invoices/:id/edit` - Edit invoice

### Bills
- `/bills` - Bill list
- `/bills/create` - Create bill
- `/bills/:id` - Bill details
- `/bills/:id/edit` - Edit bill

### Payments
- `/payments` - Payment list
- `/payments/create` - Create payment
- `/payments/:id` - Payment details

### Reports
- `/reports` - Reports dashboard
- `/reports/trial-balance` - Trial Balance
- `/reports/balance-sheet` - Balance Sheet
- `/reports/profit-loss` - Profit & Loss
- `/reports/cash-flow` - Cash Flow

### Settings
- `/settings` - General settings
- `/settings/profile` - User profile
- `/settings/company` - Company settings
- `/settings/tenants` - Tenant management

## Configuration

### Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature Flags
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

## Development

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Testing

```bash
# Run component tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

## Styling

### Tailwind CSS Configuration

```typescript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // AI-BOS brand colors
        ai: {
          solid: '#0056CC',
          muted: '#007AFF',
          subtle: 'rgba(0, 122, 255, 0.1)',
        },
        // Semantic colors
        bg: {
          base: '#000000',
          elevated: '#1A1A1A',
          muted: '#2A2A2A',
        },
        fg: {
          default: '#FFFFFF',
          muted: '#8A8A8A',
          subtle: '#6A8A8A',
        },
      },
    },
  },
  plugins: [],
};
```

## Performance Optimization

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';

// Lazy load components
const InvoiceForm = lazy(() => import('./InvoiceForm'));
const BillWorkflow = lazy(() => import('./BillWorkflow'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <InvoiceForm />
</Suspense>
```

### Image Optimization

```typescript
import Image from 'next/image';

// Optimized images
<Image
  src="/logo.png"
  alt="AI-BOS Logo"
  width={200}
  height={50}
  priority
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

## Accessibility

### WCAG 2.2 AAA Compliance

```typescript
// Accessible button component
<button
  type="button"
  aria-label="Create new invoice"
  aria-describedby="invoice-description"
  className="bg-ai-solid text-fg-inverted px-4 py-2 rounded-md hover:bg-ai-muted focus:outline-none focus:ring-2 focus:ring-border-focus"
>
  Create Invoice
</button>
```

## Error Handling

### Error Boundaries

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-fg-default">Something went wrong</h2>
        <p className="mt-2 text-fg-muted">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="mt-4 bg-ai-solid text-fg-inverted px-4 py-2 rounded-md hover:bg-ai-muted"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// Wrap components with error boundary
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <InvoiceForm />
</ErrorBoundary>
```

## Testing

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { InvoiceForm } from './InvoiceForm';

describe('InvoiceForm', () => {
  it('should render form fields', () => {
    render(<InvoiceForm />);
    
    expect(screen.getByLabelText('Customer Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Invoice' })).toBeInTheDocument();
  });
});
```

## Deployment

### Vercel Deployment

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

## Dependencies

- **@aibos/auth**: Authentication context
- **@aibos/contracts**: TypeScript type definitions
- **@aibos/tokens**: Design tokens
- **@aibos/ui**: React component library
- **@aibos/utils**: Shared utilities
- **@tanstack/react-query**: Data fetching
- **@tanstack/react-query-devtools**: Query devtools
- **date-fns**: Date utilities
- **next**: Next.js framework
- **react**: React library
- **zod**: Runtime validation

## Performance Considerations

- **Code Splitting**: Components are code-split for optimal loading
- **Image Optimization**: Images are optimized with Next.js Image
- **Caching**: API responses are cached with TanStack Query
- **Bundle Optimization**: Bundle size is optimized
- **Lazy Loading**: Components are lazy-loaded when needed

## Security Considerations

- **Input Validation**: All inputs are validated with Zod
- **XSS Protection**: User inputs are sanitized
- **CSRF Protection**: Forms include CSRF tokens
- **Content Security Policy**: Strict CSP headers
- **Secure Headers**: Security headers are configured

## Contributing

1. Follow the coding standards
2. Add tests for new components
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.