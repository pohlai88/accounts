# Utils — UI Utility Functions

> **TL;DR**: Essential utility functions for the UI component library, providing class name
> management, conditional styling, and Tailwind CSS optimization.  
> **Owner**: @aibos/ui-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Provides utility functions for UI component development
- Manages class name combination and conditional styling
- Optimizes Tailwind CSS class merging
- Handles conditional class name logic
- Provides type-safe utility functions

**Does NOT**:

- Implement business logic (delegated to @aibos/accounting)
- Handle database operations (delegated to @aibos/db)
- Provide API endpoints (implemented by @aibos/web-api)
- Manage authentication (delegated to @aibos/auth)

**Consumers**: @aibos/ui components, @aibos/web, external applications

## 2) Quick Links

- **Main Export**: `index.ts`
- **Class Name Utility**: `cn.ts`
- **UI Package**: `../README.md`
- **Design Guidelines**: `../DESIGN_GUIDELINES.md`
- **Tokens Package**: `../../tokens/README.md`

## 3) Getting Started

```typescript
import { cn } from '@aibos/ui/utils';

// Basic usage
const className = cn('base-class', 'conditional-class', {
  'active-class': isActive,
  'disabled-class': isDisabled,
});

// With Tailwind classes
const buttonClass = cn(
  'px-4 py-2 rounded-md',
  'bg-brand-solid text-fg-on-brand',
  'hover:bg-brand-solid/90',
  {
    'opacity-50 cursor-not-allowed': isDisabled,
    'ring-2 ring-brand-solid': isActive,
  }
);
```

## 4) Utility Functions

### **Class Name Utility (`cn.ts`)**

**Purpose**: Combines `clsx` and `tailwind-merge` for optimal class name handling

**Features**:

- **Conditional Classes**: Support for conditional class application
- **Tailwind Optimization**: Automatic Tailwind class merging and deduplication
- **Type Safety**: Full TypeScript support with proper typing
- **Performance**: Optimized for runtime performance

**Implementation**:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## 5) Usage Examples

### **Basic Class Combination**

```typescript
import { cn } from '@aibos/ui/utils';

// Simple class combination
const baseClass = cn('px-4', 'py-2', 'rounded-md');
// Result: 'px-4 py-2 rounded-md'

// With conditional classes
const buttonClass = cn('px-4 py-2 rounded-md', {
  'bg-blue-500': variant === 'primary',
  'bg-gray-500': variant === 'secondary',
  'opacity-50': isDisabled,
});
```

### **Tailwind Class Optimization**

```typescript
import { cn } from '@aibos/ui/utils';

// Tailwind class merging and deduplication
const optimizedClass = cn(
  'px-4 py-2', // Base padding
  'px-6', // Override padding-x
  'bg-blue-500', // Base background
  'bg-red-500', // Override background
  'hover:bg-blue-600', // Hover state
  'hover:bg-red-600' // Override hover state
);
// Result: 'py-2 px-6 bg-red-500 hover:bg-red-600'
```

### **Component Props Integration**

```typescript
import { cn } from "@aibos/ui/utils";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        // Base styles
        "px-4 py-2 rounded-md font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",

        // Variant styles
        {
          "bg-brand-solid text-fg-on-brand hover:bg-brand-solid/90":
            variant === "primary",
          "bg-gray-500 text-white hover:bg-gray-600": variant === "secondary",
          "bg-red-500 text-white hover:bg-red-600": variant === "danger",
        },

        // Size styles
        {
          "px-2 py-1 text-sm": size === "sm",
          "px-4 py-2 text-base": size === "md",
          "px-6 py-3 text-lg": size === "lg",
        },

        // State styles
        {
          "opacity-50 cursor-not-allowed": disabled,
          "cursor-pointer": !disabled,
        },

        // Custom className
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
};
```

### **Semantic Token Integration**

```typescript
import { cn } from '@aibos/ui/utils';

// Using semantic tokens with cn
const cardClass = cn(
  'bg-bg-default', // Semantic background
  'border-border-subtle', // Semantic border
  'text-fg-default', // Semantic text color
  'rounded-lg', // Semantic border radius
  'shadow-sm', // Semantic shadow
  'p-6', // Semantic padding
  {
    'border-brand-solid': isSelected,
    'shadow-md': isHovered,
    'opacity-75': isDisabled,
  }
);
```

### **Responsive Design**

```typescript
import { cn } from '@aibos/ui/utils';

// Responsive classes with cn
const responsiveClass = cn(
  'grid grid-cols-1', // Mobile: 1 column
  'md:grid-cols-2', // Tablet: 2 columns
  'lg:grid-cols-3', // Desktop: 3 columns
  'gap-4', // Base gap
  'md:gap-6', // Larger gap on tablet+
  'lg:gap-8', // Even larger gap on desktop
  {
    'grid-cols-2': forceTwoColumns,
    'grid-cols-4': forceFourColumns,
  }
);
```

### **Dark Mode Support**

```typescript
import { cn } from '@aibos/ui/utils';

// Dark mode classes with cn
const themeClass = cn(
  'bg-white text-gray-900', // Light mode
  'dark:bg-gray-900 dark:text-white', // Dark mode
  'border-gray-200', // Light mode border
  'dark:border-gray-700', // Dark mode border
  {
    'bg-blue-50 dark:bg-blue-900': isHighlighted,
    'text-blue-600 dark:text-blue-400': isActive,
  }
);
```

## 6) Advanced Usage Patterns

### **Component Variant System**

```typescript
import { cn } from '@aibos/ui/utils';

// Advanced variant system with cn
const getVariantClasses = (variant: string, size: string, state: string) => {
  return cn(
    // Base classes
    'inline-flex items-center justify-center font-medium transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',

    // Variant mapping
    {
      'bg-brand-solid text-fg-on-brand': variant === 'primary',
      'bg-gray-100 text-gray-900': variant === 'secondary',
      'bg-transparent border border-gray-300': variant === 'outline',
      'bg-red-500 text-white': variant === 'danger',
    },

    // Size mapping
    {
      'px-2 py-1 text-xs': size === 'xs',
      'px-3 py-1.5 text-sm': size === 'sm',
      'px-4 py-2 text-base': size === 'md',
      'px-6 py-3 text-lg': size === 'lg',
    },

    // State mapping
    {
      'opacity-50 cursor-not-allowed': state === 'disabled',
      'cursor-pointer hover:opacity-90': state === 'enabled',
      'animate-pulse': state === 'loading',
    }
  );
};
```

### **Conditional Styling Logic**

```typescript
import { cn } from '@aibos/ui/utils';

// Complex conditional styling
const getComplexClasses = (props: {
  isActive: boolean;
  isDisabled: boolean;
  isError: boolean;
  isSuccess: boolean;
  size: 'sm' | 'md' | 'lg';
  variant: 'primary' | 'secondary';
}) => {
  return cn(
    // Base classes
    'px-4 py-2 rounded-md font-medium transition-all duration-200',

    // Size classes
    {
      'px-2 py-1 text-sm': props.size === 'sm',
      'px-4 py-2 text-base': props.size === 'md',
      'px-6 py-3 text-lg': props.size === 'lg',
    },

    // Variant classes
    {
      'bg-brand-solid text-fg-on-brand': props.variant === 'primary',
      'bg-gray-100 text-gray-900': props.variant === 'secondary',
    },

    // State classes (with priority)
    {
      'opacity-50 cursor-not-allowed': props.isDisabled,
      'bg-red-500 text-white': props.isError && !props.isDisabled,
      'bg-green-500 text-white': props.isSuccess && !props.isDisabled,
      'ring-2 ring-brand-solid': props.isActive && !props.isDisabled,
    },

    // Hover states (only when not disabled)
    !props.isDisabled && {
      'hover:opacity-90': props.variant === 'primary',
      'hover:bg-gray-200': props.variant === 'secondary',
    }
  );
};
```

## 7) Performance Considerations

### **Optimization Benefits**

- **Tailwind Deduplication**: Removes duplicate Tailwind classes
- **Class Merging**: Combines conflicting classes intelligently
- **Runtime Performance**: Optimized for fast execution
- **Bundle Size**: Minimal impact on bundle size

### **Best Practices**

```typescript
// ✅ Good: Use cn for complex conditional logic
const className = cn('base-class', {
  'conditional-class': condition,
  'another-class': anotherCondition,
});

// ✅ Good: Combine with semantic tokens
const semanticClass = cn('bg-bg-default text-fg-default', 'border-border-subtle rounded-lg', {
  'border-brand-solid': isSelected,
});

// ❌ Avoid: Overusing cn for simple cases
const simpleClass = cn('px-4', 'py-2'); // Just use 'px-4 py-2'

// ❌ Avoid: Complex nested conditionals
const complexClass = cn(
  'base',
  condition1 && condition2 && 'class1',
  condition3 || condition4 ? 'class2' : 'class3'
);
```

## 8) Type Safety

### **TypeScript Support**

```typescript
import { cn } from '@aibos/ui/utils';
import { type ClassValue } from 'clsx';

// Full TypeScript support
const className: string = cn('px-4', 'py-2', { 'bg-blue-500': true });

// With custom types
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  className?: ClassValue;
}

const getButtonClasses = (props: ButtonProps): string => {
  return cn(
    'px-4 py-2 rounded-md',
    {
      'bg-blue-500': props.variant === 'primary',
      'bg-gray-500': props.variant === 'secondary',
    },
    {
      'px-2 py-1': props.size === 'sm',
      'px-6 py-3': props.size === 'lg',
    },
    props.className
  );
};
```

## 9) Integration with Design System

### **Semantic Token Usage**

```typescript
import { cn } from '@aibos/ui/utils';

// Using semantic tokens with cn
const componentClass = cn(
  // Background tokens
  'bg-bg-default',
  'hover:bg-bg-hover',

  // Text tokens
  'text-fg-default',
  'text-fg-muted',

  // Border tokens
  'border-border-subtle',
  'rounded-lg',

  // Spacing tokens
  'p-6',
  'space-y-4',

  // Conditional semantic tokens
  {
    'bg-brand-solid text-fg-on-brand': isPrimary,
    'bg-danger-solid text-fg-on-danger': isDanger,
    'border-brand-solid': isSelected,
  }
);
```

### **Accessibility Integration**

```typescript
import { cn } from '@aibos/ui/utils';

// Accessibility-focused class combination
const accessibleClass = cn(
  'focus:outline-none focus:ring-2 focus:ring-brand-solid',
  'aria-disabled:opacity-50 aria-disabled:cursor-not-allowed',
  'aria-selected:bg-brand-solid aria-selected:text-fg-on-brand',
  {
    'sr-only': isScreenReaderOnly,
    'not-sr-only': !isScreenReaderOnly,
  }
);
```

## 10) Troubleshooting

**Common Issues**:

- **Class Conflicts**: Check for conflicting Tailwind classes
- **Conditional Logic**: Verify conditional class logic
- **Type Errors**: Ensure proper TypeScript typing
- **Performance**: Avoid overusing cn for simple cases

**Debug Tips**:

```typescript
// Debug class generation
const debugClass = cn('base-class', { 'conditional-class': someCondition }, 'another-class');

console.log('Generated class:', debugClass);
// Output: 'base-class conditional-class another-class'
```

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex logic

**Testing**:

- Test all utility functions
- Validate class name generation
- Test edge cases and conditions
- Verify TypeScript types

**Review Process**:

- All utilities must be type-safe
- Performance impact must be minimal
- Documentation must be comprehensive
- Tests must cover all scenarios

---

## 📚 **Additional Resources**

- [UI Package README](../README.md)
- [Design Guidelines](../DESIGN_GUIDELINES.md)
- [Tokens Package](../../tokens/README.md)
- [Component Examples](../components/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 🔗 **Utility Principles**

### **Simplicity**

- Easy to use and understand
- Minimal API surface
- Clear function names
- Intuitive behavior

### **Performance**

- Optimized for runtime
- Minimal bundle impact
- Efficient class merging
- Fast execution

### **Type Safety**

- Full TypeScript support
- Proper type inference
- Compile-time validation
- IntelliSense support

### **Integration**

- Seamless Tailwind integration
- Design system compatibility
- Component library support
- Framework agnostic

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
