# Design Tokens Package

The `@aibos/tokens` package provides design tokens and theme configuration.

## Overview

This package includes:

- **Color Tokens** - Brand colors and semantic color system
- **Typography** - Font families, sizes, and weights
- **Spacing** - Consistent spacing scale
- **Breakpoints** - Responsive design breakpoints
- **Shadows** - Elevation and depth tokens

## Installation

```bash
pnpm add @aibos/tokens
```

## Usage

```typescript
import { colors, spacing, typography } from '@aibos/tokens';

const styles = {
  color: colors.primary[500],
  padding: spacing.md,
  fontSize: typography.sizes.body,
};
```

## Related

- [UI Components Package](./ui) - Components using these tokens
