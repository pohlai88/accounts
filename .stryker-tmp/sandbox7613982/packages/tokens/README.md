# DOC-249: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Tokens — Dual-Mode Design System

> **TL;DR**: Single source of truth for design decisions with dual-mode architecture. Provides
> aesthetic mode for beautiful design and accessibility mode for WCAG 2.2 AAA compliance.  
> **Owner**: @aibos/design-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Provides single source of truth for all design decisions
- Implements dual-mode design system (aesthetic + accessibility)
- Generates CSS variables for both design modes
- Creates Tailwind CSS preset for easy consumption
- Enforces WCAG 2.2 AAA compliance in accessibility mode
- Maintains Apple-inspired design language with AI-BOS branding
- Provides semantic tokens for consistent UI implementation

**Does NOT**:

- Implement UI components (delegated to @aibos/ui)
- Handle theme switching logic (delegated to consuming apps)
- Provide hardcoded color values (uses CSS variables)
- Manage user preferences (delegated to consuming apps)

**Consumers**: @aibos/ui, @aibos/web, @aibos/web-api, all frontend applications

## 2) Quick Links

- **Token Definitions**: `src/tokens.ts`
- **Main Export**: `src/index.ts`
- **Tailwind Preset**: `tailwind.preset.cjs`
- **Build Script**: `scripts/build-preset.cjs`
- **Architecture Guide**: `../docs/ARCHITECTURE.md`
- **Integration Strategy**: `../DRAFT_INTEGRATION STRATEGY.md`

## 3) Getting Started

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## 4) Architecture & Dependencies

**Dependencies**:

- `tailwindcss` - CSS framework integration

**Dependents**:

- `@aibos/ui` - UI component library
- `@aibos/web` - Frontend application
- All frontend applications requiring design tokens

**Build Order**: No dependencies, can be built independently

## 5) Development Workflow

**Local Dev**:

```bash
# Watch mode for development
pnpm build --watch

# Generate Tailwind preset
pnpm build
```

**Testing**:

```bash
# Type checking
pnpm typecheck

# Lint checking
pnpm lint
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

- Design mode definitions (aesthetic + accessibility)
- Semantic token definitions
- CSS variable generators
- Mode switching utilities
- TypeScript type definitions

**Public Types**:

- `DesignModes` - Design mode configuration type
- `SemanticTokens` - Semantic token definitions type
- `AccessibilityCssVars` - CSS variables type

**Configuration**:

- Dual-mode color palettes
- Semantic token mappings
- CSS variable generation
- Tailwind preset generation

## 7) Performance & Monitoring

**Bundle Size**:

- Target: <50KB for tokens package
- Optimized for tree-shaking
- Minimal dependencies for fast loading

**Performance Budget**:

- CSS variable generation: <1ms
- Mode switching: <5ms
- Bundle size: <50KB total

**Monitoring**:

- CSS variable usage analytics
- Mode switching performance
- Token consumption metrics
- Build time optimization

## 8) Security & Compliance

**Permissions**:

- No sensitive data in tokens
- Public design system values
- No authentication required

**Data Handling**:

- Immutable design token definitions
- CSS variable-based theming
- No user data processing

**Compliance**:

- WCAG 2.2 AAA compliance in accessibility mode
- Color contrast ratio validation
- Accessibility-first design principles

## 9) Design System Architecture

### **Dual-Mode Design Philosophy**

The design system implements two complete, optimized experiences:

- **Aesthetic Mode**: Beautiful, subtle, modern design for users who appreciate visual elegance
- **Accessibility Mode**: WCAG 2.2 AAA compliant design for users who need high contrast

### **Design Modes**

#### **Aesthetic Mode**

- Apple-inspired neutral palette with subtle gradients
- Glass materials and blur effects
- Generous spacing and luxurious feel
- AI-BOS brand colors (cyan primary, orange accent)

#### **Accessibility Mode**

- High contrast black and white palette
- Solid materials with no transparency
- Functional spacing for clarity
- WCAG AAA compliant contrast ratios (7:1+)

### **Semantic Token System**

- **System Colors**: Platform-semantic roles (text, background, fill, border)
- **Brand Colors**: AI-BOS signature colors (primary cyan, accent orange)
- **Status Colors**: Success, warning, error states
- **Materials**: Depth and elevation through opacity layers

## 10) Core Token Categories

### **Color Tokens**

- **Primary Colors**: AI-BOS signature cyan (#00D4FF)
- **Accent Colors**: AI-BOS accent orange (#FF6B35)
- **Neutral Palette**: Apple-inspired grayscale system
- **Status Colors**: Success, warning, error states
- **System Colors**: Semantic roles for text, background, fill

### **Typography Tokens**

- **Font Families**: Inter (sans), JetBrains Mono (mono)
- **Font Sizes**: 12px to 36px scale
- **Font Weights**: 400, 500, 600, 700
- **Line Heights**: Tight, normal, relaxed

### **Spacing Tokens**

- **Spacing Scale**: 4px to 80px (0.25rem to 5rem)
- **Consistent Scale**: Based on 4px grid system
- **Responsive Spacing**: Scales appropriately across breakpoints

### **Border Radius Tokens**

- **Radius Scale**: 2px to 16px
- **Consistent Scale**: Based on 2px increments
- **Full Radius**: 9999px for circular elements

### **Z-Index Tokens**

- **Layer System**: Dropdown (1000) to Toast (1070)
- **Consistent Stacking**: Prevents z-index conflicts
- **Semantic Naming**: Clear purpose for each layer

## 11) CSS Variable System

### **System Variables**

- `--sys-text-*` - Text color roles
- `--sys-bg-*` - Background color roles
- `--sys-fill-*` - Fill color roles
- `--sys-border-*` - Border color roles
- `--sys-accent` - System accent color

### **Brand Variables**

- `--brand-primary` - AI-BOS primary color
- `--brand-accent` - AI-BOS accent color
- `--brand-primary-pressed` - Pressed state color

### **Status Variables**

- `--sys-status-success` - Success state color
- `--sys-status-warning` - Warning state color
- `--sys-status-error` - Error state color

### **Material Variables**

- `--sys-material-*` - Opacity-based material layers
- Ultra-thin to thick opacity levels
- Disabled in accessibility mode

## 12) Usage Examples

### **Basic Token Usage**

```typescript
import { SEMANTIC_TOKENS, applyModeToDocument } from "@aibos/tokens";

// Use semantic tokens in CSS
const styles = {
  color: SEMANTIC_TOKENS.semantic.text.primary,
  backgroundColor: SEMANTIC_TOKENS.semantic.bg.base,
  borderColor: SEMANTIC_TOKENS.semantic.border.hairline,
};

// Apply design mode to document
applyModeToDocument("aesthetic");
```

### **Tailwind CSS Integration**

```typescript
// tailwind.config.js
module.exports = {
  presets: [require("@aibos/tokens/tailwind.preset.cjs")],
  // ... rest of config
};
```

```html
<!-- Use semantic classes -->
<div class="bg-sys-bg-base text-sys-text-primary border-sys-border-hairline">
  <h1 class="text-sys-text-primary font-semibold">Title</h1>
  <p class="text-sys-text-secondary">Subtitle</p>
</div>
```

### **Mode Switching**

```typescript
import { toggleAccessibilityMode, isAccessibilityMode } from "@aibos/tokens";

// Toggle between modes
const currentMode = toggleAccessibilityMode();

// Check current mode
const isAccessibility = isAccessibilityMode();

// Initialize with default mode
initializeDesignMode("aesthetic");
```

### **CSS Variable Usage**

```css
/* Use CSS variables directly */
.my-component {
  color: var(--sys-text-primary);
  background-color: var(--sys-bg-base);
  border: 1px solid var(--sys-border-hairline);
}

/* Brand colors */
.brand-button {
  background-color: var(--brand-primary);
  color: var(--sys-text-primary);
}

.brand-button:hover {
  background-color: var(--brand-primary-pressed);
}
```

## 13) Troubleshooting

**Common Issues**:

- **Missing CSS Variables**: Ensure design mode is initialized
- **Mode Not Switching**: Check data-accessibility-mode attribute
- **Tailwind Classes Not Working**: Verify preset is properly imported
- **Color Contrast Issues**: Use accessibility mode for WCAG compliance

**Debug Mode**:

```bash
# Check if tokens are properly built
ls dist/

# Verify Tailwind preset generation
cat tailwind.preset.cjs
```

**Logs**:

- CSS variable application logs
- Mode switching events
- Token usage analytics
- Build process logs

## 14) Contributing

**Code Style**:

- Follow design system principles
- Maintain dual-mode consistency
- Use semantic naming conventions
- Document all new tokens

**Testing**:

- Test both design modes
- Validate WCAG compliance
- Test CSS variable generation
- Verify Tailwind preset generation

**Review Process**:

- All changes must maintain dual-mode support
- Breaking changes require major version bump
- Design changes need accessibility review
- Documentation must be updated

---

## 📚 **Additional Resources**

- [Project README](../README.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Integration Strategy](../DRAFT_INTEGRATION STRATEGY.md)
- [UI Package](../packages/ui/README.md)
- [Web App](../apps/web/README.md)

---

## 🔗 **Design Principles**

### **Accessibility First**

- WCAG 2.2 AAA compliance in accessibility mode
- High contrast ratios (7:1+)
- No compromise on accessibility
- Inclusive design for all users

### **Dual-Mode Architecture**

- Two complete, optimized experiences
- Aesthetic mode for visual elegance
- Accessibility mode for functional clarity
- Seamless mode switching

### **Semantic Token System**

- Platform-semantic roles
- No hardcoded color values
- CSS variable-based theming
- Consistent design language

### **Apple-Inspired Design**

- Clean, minimal aesthetic
- Subtle materials and effects
- Generous spacing
- Premium feel and quality

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
