# Web App — Frontend Application

> **TL;DR**: Next.js 14 frontend application with dark-first theme, SSOT-compliant design system,
> and admin configuration interface.  
> **Owner**: @aibos/frontend-team • **Status**: experimental • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Provides the main user interface for the AIBOS accounting platform
- Implements dark-first theme with WCAG 2.2 AAA accessibility compliance
- Serves admin configuration pages with feature flags and policy settings
- Communicates with backend via BFF (web-api) using contract-first approach
- Uses semantic tokens from @aibos/tokens for consistent styling

**Does NOT**:

- Handle business logic (lives in @aibos/accounting package)
- Manage authentication/authorization (lives in @aibos/auth package)
- Store data directly (communicates via BFF to @aibos/db)
- Process background jobs (handled by @aibos/worker service)

**Consumers**: End users, administrators, accounting professionals

## 2) Quick Links

- **Contracts/Types**: `packages/contracts/src/`
- **UI Components**: `packages/ui/src/components/`
- **Design Tokens**: `packages/tokens/src/`
- **Design Guidelines**: `packages/ui/DESIGN_GUIDELINES.md`
- **Architecture Guide**: `../docs/ARCHITECTURE.md`
- **Integration Strategy**: `../DRAFT_INTEGRATION STRATEGY.md`

## 3) Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## 4) Architecture & Dependencies

**Dependencies**:

- `@aibos/ui` - Shared UI components and design system
- `@aibos/utils` - Shared utility functions
- `@aibos/auth` - Authentication and authorization
- `@aibos/contracts` - API contracts and types
- `@aibos/tokens` - Design tokens for theming
- `next` - React framework
- `react` & `react-dom` - UI library
- `zod` - Schema validation

**Dependents**: None (this is a leaf application)

**Build Order**: Depends on all packages being built first (enforced by Turborepo)

## 5) Development Workflow

**Local Dev**:

```bash
# Start with hot reload
pnpm dev

# Access at http://localhost:3000
# Admin area at http://localhost:3000/admin
```

**Testing**:

```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
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

- Next.js App Router pages and layouts
- Server Actions for form handling
- Client components for interactive UI

**Public Types**:

- Page props and server action parameters
- Form schemas using Zod validation
- Component prop interfaces

**Configuration**:

- Next.js configuration in `next.config.mjs`
- Tailwind CSS configuration
- TypeScript configuration

## 7) Performance & Monitoring

**Bundle Size**:

- Target: <350ms response time
- Bundle size: ~716KB (as per Kernel-UI v2.0 standards)
- Optimized with Next.js 14 App Router

**Performance Budget**:

- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1

**Monitoring**:

- Axiom integration for observability
- Performance metrics via Next.js built-in analytics
- Error tracking and user experience monitoring

## 8) Security & Compliance

**Permissions**:

- Admin routes protected by authentication middleware
- Feature flags control access to specific functionality
- Row Level Security (RLS) enforced at database level

**Data Handling**:

- No direct database access (BFF pattern)
- All data validated through Zod schemas
- Server Actions for secure form processing

**Compliance**:

- WCAG 2.2 AAA accessibility compliance
- Dark-first theme with high contrast support
- Semantic HTML and ARIA labels throughout

## 9) Troubleshooting

**Common Issues**:

- **Build failures**: Check that all workspace packages are built first
- **Styling issues**: Verify semantic tokens are properly imported
- **Type errors**: Ensure contracts package is up to date

**Debug Mode**:

```bash
# Enable Next.js debug mode
DEBUG=next:* pnpm dev

# Enable React strict mode for development
NODE_ENV=development pnpm dev
```

**Logs**:

- Development logs in terminal
- Production logs via Axiom dashboard
- Error boundaries capture React errors

## 10) Contributing

**Code Style**:

- Follow the design system guidelines in `packages/ui/DESIGN_GUIDELINES.md`
- Use semantic tokens exclusively (no hardcoded values)
- Implement both aesthetic and accessibility modes for components
- Follow Steve Jobs-inspired design principles

**Testing**:

- Write unit tests for all components
- Test both aesthetic and accessibility modes
- Ensure WCAG 2.2 AAA compliance
- Test with keyboard navigation and screen readers

**Review Process**:

- All changes must maintain SSOT compliance
- Design system consistency is mandatory
- Accessibility review required for UI changes
- Performance impact must be considered

---

## 📚 **Additional Resources**

- [Project README](../README.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Design Guidelines](../packages/ui/DESIGN_GUIDELINES.md)
- [Integration Strategy](../DRAFT_INTEGRATION STRATEGY.md)
- [UI Package Documentation](../packages/ui/README.md)

---

## 🎨 **Design System Integration**

This application serves as the primary implementation of the AIBOS design system, featuring:

- **Dual-Mode Design**: Both aesthetic and accessibility modes
- **Semantic Tokens**: All styling uses `@aibos/tokens` package
- **Dark-First Theme**: Optimized for dark mode with accessibility support
- **WCAG 2.2 AAA**: Full compliance in accessibility mode
- **Steve Jobs Philosophy**: Simplicity, clarity, and purposeful design

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
