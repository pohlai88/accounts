# UI Components API

This page contains the complete API documentation for the `@aibos/ui` package.

## Overview

The UI Components API provides a comprehensive React component library built with:

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Full type safety and IntelliSense support
- **Tailwind CSS** - Utility-first styling with design tokens
- **Radix UI** - Accessible, unstyled components
- **Framer Motion** - Smooth animations and transitions

## Installation

```bash
pnpm add @aibos/ui
```

## Core Components

### Layout Components

#### `Button`

A versatile button component with multiple variants and sizes.

**Props:**

- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean
- `loading`: boolean

**Example:**

```typescript
import { Button } from '@aibos/ui'

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>
```

#### `Card`

A flexible container component for content grouping.

**Props:**

- `variant`: 'default' | 'outlined' | 'elevated'
- `padding`: 'sm' | 'md' | 'lg'

### Form Components

#### `Input`

A styled input component with validation support.

**Props:**

- `type`: HTML input types
- `error`: string | boolean
- `helperText`: string
- `required`: boolean

#### `Select`

A customizable select dropdown component.

**Props:**

- `options`: SelectOption[]
- `placeholder`: string
- `multiple`: boolean
- `searchable`: boolean

### Data Display

#### `Table`

A responsive table component with sorting and filtering.

**Props:**

- `columns`: TableColumn[]
- `data`: any[]
- `sortable`: boolean
- `filterable`: boolean

#### `Modal`

A modal dialog component with backdrop and animations.

**Props:**

- `open`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'

## Design System

### Colors

The design system uses a comprehensive color palette:

- **Primary**: Blue variants for main actions
- **Secondary**: Gray variants for secondary actions
- **Success**: Green variants for positive states
- **Warning**: Yellow variants for caution states
- **Error**: Red variants for error states

### Typography

- **Headings**: 6 levels (h1-h6) with consistent spacing
- **Body**: Multiple sizes and weights for content
- **Code**: Monospace font for code snippets

### Spacing

Consistent spacing scale based on 4px units:

- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px

## Theming

### Dark Mode

All components support dark mode out of the box:

```typescript
import { ThemeProvider } from '@aibos/ui'

<ThemeProvider theme="dark">
  <App />
</ThemeProvider>
```

### Custom Themes

Create custom themes by extending the base theme:

```typescript
const customTheme = {
  colors: {
    primary: '#your-color',
  },
};
```

## Accessibility

All components follow WCAG 2.2 AAA guidelines:

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and roles
- **Color Contrast**: Meets AAA contrast requirements
- **Focus Management**: Clear focus indicators

## Examples

See the [UI Components Package documentation](../packages/ui) for comprehensive examples and usage
patterns.

## Related

- [UI Components Package](../packages/ui) - Package overview and setup
- [Design Tokens Package](../packages/tokens) - Design system tokens
- [Utilities API](./utils) - Helper functions
