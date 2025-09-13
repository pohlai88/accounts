# UI Components Package

The `@aibos/ui` package provides a comprehensive React component library and design system.

## Overview

This package includes:

- **React Components** - Pre-built, accessible UI components
- **Design System** - Consistent styling and theming
- **TypeScript Support** - Full type safety and IntelliSense
- **Dark Mode** - Built-in dark theme support
- **Accessibility** - WCAG 2.2 AAA compliant

## Installation

```bash
pnpm add @aibos/ui
```

## Quick Start

```typescript
import { Button, Card, Input } from '@aibos/ui'

function App() {
  return (
    <Card>
      <Input placeholder="Enter your name" />
      <Button variant="primary">Submit</Button>
    </Card>
  )
}
```

## API Reference

For detailed API documentation, see the [UI Components API](/api/ui).

## Related

- [UI Components API](/api/ui) - Complete API reference
- [Design Tokens Package](./tokens) - Design system tokens
