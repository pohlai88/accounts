[**AI-BOS Accounts API Documentation**](../../README.md)

***

[AI-BOS Accounts API Documentation](../../README.md) / @aibos/tokens

# DOC-294: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/tokens

Design tokens and theming system for the AI-BOS Accounting SaaS platform.

## Installation

```bash
pnpm add @aibos/tokens
```

## Core Features

- **Design Tokens**: Semantic color, spacing, and typography tokens
- **Theme Support**: Light and dark theme support
- **CSS Variables**: CSS custom properties for theming
- **TypeScript Types**: Type-safe token usage
- **Tailwind Integration**: Seamless Tailwind CSS integration
- **Accessibility**: WCAG 2.2 AAA compliant color contrast
- **Consistency**: Consistent design system across all components

## Quick Start

```typescript
import { tokens, themes, createTheme } from "@aibos/tokens";

// Use design tokens
const buttonStyle = {
  backgroundColor: tokens.colors.ai.solid,
  color: tokens.colors.fg.inverted,
  padding: tokens.spacing.md,
  borderRadius: tokens.radius.md
};

// Apply theme
const theme = createTheme('dark');
document.documentElement.style.setProperty('--color-bg-base', theme.colors.bg.base);
```

## Design Tokens

### Color Tokens

```typescript
import { tokens } from "@aibos/tokens";

// Background colors
tokens.colors.bg.base        // #000000 - Pure black
tokens.colors.bg.elevated    // #1A1A1A - Cards, modals
tokens.colors.bg.muted       // #2A2A2A - Subtle backgrounds

// Text colors
tokens.colors.fg.default     // #FFFFFF - Primary text
tokens.colors.fg.muted       // #8A8A8A - Secondary text
tokens.colors.fg.subtle      // #6A8A8A - Tertiary text
tokens.colors.fg.inverted    // #000000 - Text on dark

// AI Brand colors
tokens.colors.ai.solid       // #0056CC - Primary actions
tokens.colors.ai.muted       // #007AFF - Secondary elements
tokens.colors.ai.subtle      // rgba(0, 122, 255, 0.1) - Subtle backgrounds

// State colors
tokens.colors.state.success  // #34C759 - Success states
tokens.colors.state.warning  // #FF9500 - Warning states
tokens.colors.state.danger   // #FF3B30 - Error states

// Border colors
tokens.colors.border.subtle  // #3A3A3A - Subtle borders
tokens.colors.border.strong  // #4A4A4A - Strong borders
tokens.colors.border.focus   // #007AFF - Focus rings
```

### Spacing Tokens

```typescript
import { tokens } from "@aibos/tokens";

tokens.spacing.xs  // 0.25rem - 4px - minimal spacing
tokens.spacing.sm  // 0.5rem - 8px - small spacing
tokens.spacing.md  // 1rem - 16px - standard spacing
tokens.spacing.lg  // 1.5rem - 24px - large spacing
tokens.spacing.xl  // 2rem - 32px - extra large spacing
tokens.spacing.2xl // 3rem - 48px - section spacing
tokens.spacing.3xl // 4rem - 64px - page spacing
```

### Typography Tokens

```typescript
import { tokens } from "@aibos/tokens";

// Font sizes
tokens.typography.size.xs    // 0.75rem - 12px - captions
tokens.typography.size.sm   // 0.875rem - 14px - supporting info
tokens.typography.size.base  // 1rem - 16px - body text
tokens.typography.size.lg   // 1.125rem - 18px - important text
tokens.typography.size.xl   // 1.25rem - 20px - component titles
tokens.typography.size.2xl  // 1.5rem - 24px - subsection headers
tokens.typography.size.3xl  // 1.875rem - 30px - section headers
tokens.typography.size.4xl  // 2.25rem - 36px - hero headings

// Font weights
tokens.typography.weight.normal   // 400 - body text
tokens.typography.weight.medium   // 500 - emphasized text
tokens.typography.weight.semibold // 600 - headings
tokens.typography.weight.bold     // 700 - hero text

// Line heights
tokens.typography.lineHeight.tight   // 1.25 - tight line height
tokens.typography.lineHeight.normal  // 1.5 - normal line height
tokens.typography.lineHeight.relaxed // 1.75 - relaxed line height
```

### Border Radius Tokens

```typescript
import { tokens } from "@aibos/tokens";

tokens.radius.sm  // 0.375rem - 6px - subtle rounding
tokens.radius.md  // 0.5rem - 8px - standard rounding
tokens.radius.lg  // 0.75rem - 12px - prominent rounding
tokens.radius.xl  // 1rem - 16px - large rounding
tokens.radius.full // 9999px - fully rounded
```

## Theme System

### Theme Creation

```typescript
import { createTheme, themes } from "@aibos/tokens";

// Use predefined theme
const darkTheme = themes.dark;
const lightTheme = themes.light;

// Create custom theme
const customTheme = createTheme({
  colors: {
    bg: {
      base: '#000000',
      elevated: '#1A1A1A',
      muted: '#2A2A2A'
    },
    fg: {
      default: '#FFFFFF',
      muted: '#8A8A8A',
      subtle: '#6A8A8A'
    },
    ai: {
      solid: '#0056CC',
      muted: '#007AFF',
      subtle: 'rgba(0, 122, 255, 0.1)'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
});
```

### Theme Application

```typescript
import { applyTheme } from "@aibos/tokens";

// Apply theme to document
applyTheme(document.documentElement, 'dark');

// Apply theme to specific element
const element = document.getElementById('app');
applyTheme(element, 'light');

// Apply custom theme
applyTheme(document.documentElement, customTheme);
```

## CSS Variables

### CSS Custom Properties

```css
/* Background colors */
--color-bg-base: #000000;
--color-bg-elevated: #1A1A1A;
--color-bg-muted: #2A2A2A;

/* Text colors */
--color-fg-default: #FFFFFF;
--color-fg-muted: #8A8A8A;
--color-fg-subtle: #6A8A8A;

/* AI Brand colors */
--color-ai-solid: #0056CC;
--color-ai-muted: #007AFF;
--color-ai-subtle: rgba(0, 122, 255, 0.1);

/* Spacing */
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;

/* Typography */
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
--font-size-xl: 1.25rem;

/* Border radius */
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
```

### CSS Usage

```css
/* Use CSS variables */
.button {
  background-color: var(--color-ai-solid);
  color: var(--color-fg-inverted);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
}

.card {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}
```

## Tailwind Integration

### Tailwind Configuration

```typescript
// tailwind.config.js
import { tokens } from "@aibos/tokens";

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
          solid: tokens.colors.ai.solid,
          muted: tokens.colors.ai.muted,
          subtle: tokens.colors.ai.subtle,
        },
        // Semantic colors
        bg: {
          base: tokens.colors.bg.base,
          elevated: tokens.colors.bg.elevated,
          muted: tokens.colors.bg.muted,
        },
        fg: {
          default: tokens.colors.fg.default,
          muted: tokens.colors.fg.muted,
          subtle: tokens.colors.fg.subtle,
        },
        // State colors
        success: tokens.colors.state.success,
        warning: tokens.colors.state.warning,
        danger: tokens.colors.state.danger,
      },
      spacing: {
        xs: tokens.spacing.xs,
        sm: tokens.spacing.sm,
        md: tokens.spacing.md,
        lg: tokens.spacing.lg,
        xl: tokens.spacing.xl,
      },
      fontSize: {
        xs: tokens.typography.size.xs,
        sm: tokens.typography.size.sm,
        base: tokens.typography.size.base,
        lg: tokens.typography.size.lg,
        xl: tokens.typography.size.xl,
      },
      borderRadius: {
        sm: tokens.radius.sm,
        md: tokens.radius.md,
        lg: tokens.radius.lg,
      },
    },
  },
  plugins: [],
};
```

### Tailwind Usage

```typescript
// Use Tailwind classes with tokens
<button className="bg-ai-solid text-fg-inverted px-md py-sm rounded-md hover:bg-ai-muted">
  Create Invoice
</button>

<div className="bg-bg-elevated border border-border-subtle rounded-lg p-lg">
  <h2 className="text-xl font-semibold text-fg-default mb-md">Card Title</h2>
  <p className="text-fg-muted">Card content with consistent spacing and colors.</p>
</div>
```

## TypeScript Integration

### Type Definitions

```typescript
import { TokenTypes } from "@aibos/tokens";

// Type-safe token usage
const buttonColor: TokenTypes.Color = tokens.colors.ai.solid;
const buttonPadding: TokenTypes.Spacing = tokens.spacing.md;
const buttonRadius: TokenTypes.Radius = tokens.radius.md;

// Theme type
const theme: TokenTypes.Theme = {
  colors: {
    bg: {
      base: '#000000',
      elevated: '#1A1A1A',
      muted: '#2A2A2A'
    },
    fg: {
      default: '#FFFFFF',
      muted: '#8A8A8A',
      subtle: '#6A8A8A'
    }
  }
};
```

### Token Validation

```typescript
import { validateToken, TokenValidator } from "@aibos/tokens";

// Validate token
const isValid = validateToken('color', 'ai.solid');
if (isValid) {
  console.log('Valid token');
}

// Token validator
const validator = new TokenValidator();
const validation = validator.validateColor('ai.solid');
if (validation.isValid) {
  console.log('Color token is valid:', validation.value);
}
```

## Accessibility

### Color Contrast

```typescript
import { getContrastRatio, isAccessible } from "@aibos/tokens";

// Check color contrast
const contrastRatio = getContrastRatio(
  tokens.colors.fg.default,
  tokens.colors.bg.base
);

const isAccessibleContrast = isAccessible(
  tokens.colors.fg.default,
  tokens.colors.bg.base
);

if (isAccessibleContrast) {
  console.log('Colors meet WCAG 2.2 AAA standards');
}
```

### Accessibility Utilities

```typescript
import { getAccessibleColor, getHighContrastColor } from "@aibos/tokens";

// Get accessible color variant
const accessibleColor = getAccessibleColor(
  tokens.colors.ai.solid,
  tokens.colors.bg.base
);

// Get high contrast color
const highContrastColor = getHighContrastColor(
  tokens.colors.fg.default,
  tokens.colors.bg.base
);
```

## Configuration

### Token Configuration

```typescript
const tokenConfig = {
  colors: {
    ai: {
      solid: '#0056CC',
      muted: '#007AFF',
      subtle: 'rgba(0, 122, 255, 0.1)'
    },
    bg: {
      base: '#000000',
      elevated: '#1A1A1A',
      muted: '#2A2A2A'
    },
    fg: {
      default: '#FFFFFF',
      muted: '#8A8A8A',
      subtle: '#6A8A8A'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  typography: {
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem'
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  }
};
```

## Testing

```bash
# Run token tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run accessibility tests
pnpm test:accessibility
```

## Dependencies

- **typescript**: Type definitions
- **color-contrast**: Color contrast calculations
- **css-vars**: CSS variable utilities

## Performance Considerations

- **Token Caching**: Tokens are cached for performance
- **CSS Variables**: Efficient CSS custom properties
- **Tree Shaking**: Unused tokens are eliminated
- **Bundle Size**: Minimal bundle size impact

## Security

- **Input Validation**: Token values are validated
- **Type Safety**: TypeScript ensures type safety
- **Accessibility**: WCAG 2.2 AAA compliance
- **Contrast**: Automatic contrast validation

## Error Handling

```typescript
import { TokenError, ValidationError } from "@aibos/tokens";

try {
  const token = tokens.colors.ai.solid;
} catch (error) {
  if (error instanceof TokenError) {
    // Handle token errors
    console.error("Token error:", error.message);
  } else if (error instanceof ValidationError) {
    // Handle validation errors
    console.error("Validation error:", error.message);
  }
}
```

## Contributing

1. Follow the coding standards
2. Add tests for new tokens
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.

## Modules

- [](README.md)
- [types](types/README.md)
