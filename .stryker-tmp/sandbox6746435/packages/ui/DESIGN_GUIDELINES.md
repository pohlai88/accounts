# AI-BOS Design Guidelines

## Steve Jobs Inspired Design System

> **"Simplicity is the ultimate sophistication"** - Steve Jobs

---

## 🎯 **Design Philosophy**

### **Core Principles**

1. **Simplicity is Sophistication**
   - Every pixel must serve a purpose
   - Remove everything unnecessary
   - Beauty emerges from function

2. **Form Follows Function**
   - Design for the user's task, not for showing off
   - Every element must have a reason
   - Functionality drives aesthetics

3. **Details Make the Design**
   - Typography is the voice of design
   - Spacing creates rhythm and harmony
   - Color has meaning and purpose

4. **Make It Obvious**
   - Users should never wonder what to do
   - Interactions must be clear and predictable
   - Hierarchy guides the user naturally

---

## 🎨 **Color System**

### **Primary Colors**

#### **Pure Black (`#000000`)**

- **Usage**: Primary background, Jobs' signature color
- **Semantic Token**: `bg-base`
- **Philosophy**: Maximum elegance through minimalism

#### **Pure White (`#FFFFFF`)**

- **Usage**: Primary text, maximum contrast
- **Semantic Token**: `fg-default`
- **Philosophy**: Perfect readability, timeless elegance

#### **Apple Blue (`#007AFF`)**

- **Usage**: Primary brand color, focus states
- **Semantic Token**: `ai-muted`
- **Philosophy**: Jobs' signature color, perfectly executed

### **Neutral Scale**

```css
neutral-0:   #000000  /* Pure black - Jobs' signature */
neutral-50:  #1A1A1A  /* Near black - subtle depth */
neutral-100: #2A2A2A  /* Dark gray - secondary surfaces */
neutral-200: #3A3A3A  /* Medium dark - subtle borders */
neutral-300: #4A4A4A  /* Medium - inactive elements */
neutral-400: #6A6A6A  /* Medium light - secondary text */
neutral-500: #8A8A8A  /* Light - tertiary text */
neutral-600: #AAAAAA  /* Lighter - subtle accents */
neutral-700: #CCCCCC  /* Very light - borders */
neutral-800: #E0E0E0  /* Lightest - subtle backgrounds */
neutral-900: #FFFFFF  /* Pure white - primary text */
```

### **State Colors (Essential Only)**

#### **Success (`#34C759`)**

- **Usage**: Success states, confirmations
- **Semantic Token**: `state-success`
- **Philosophy**: Apple Green - clear and obvious

#### **Warning (`#FF9500`)**

- **Usage**: Warnings, attention needed
- **Semantic Token**: `state-warning`
- **Philosophy**: Apple Orange - attention without alarm

#### **Danger (`#FF3B30`)**

- **Usage**: Errors, destructive actions
- **Semantic Token**: `state-danger`
- **Philosophy**: Apple Red - immediate attention

### **AI Brand Colors**

#### **Primary Actions (`#0056CC`)**

- **Usage**: Primary buttons, main CTAs
- **Semantic Token**: `ai-solid`
- **Philosophy**: Darker Apple Blue for emphasis

#### **Secondary Elements (`#007AFF`)**

- **Usage**: Links, secondary buttons, focus states
- **Semantic Token**: `ai-muted`
- **Philosophy**: Standard Apple Blue

#### **Subtle Backgrounds (`rgba(0, 122, 255, 0.1)`)**

- **Usage**: Hover states, subtle highlights
- **Semantic Token**: `ai-subtle`
- **Philosophy**: 10% opacity - minimal presence

---

## 📝 **Typography**

### **Font Stack**

```css
font-family:
  -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial,
  sans-serif;
```

### **Font Features**

```css
font-feature-settings:
  "kern" 1,
  "liga" 1,
  "calt" 1;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### **Typography Scale**

| Size        | Token            | Usage                  | Philosophy                       |
| ----------- | ---------------- | ---------------------- | -------------------------------- |
| `text-4xl`  | `font.size.4xl`  | Hero headings          | Maximum impact, minimum words    |
| `text-3xl`  | `font.size.3xl`  | Section headers        | Strong presence, clear hierarchy |
| `text-2xl`  | `font.size.2xl`  | Subsection headers     | Clear structure                  |
| `text-xl`   | `font.size.xl`   | Component titles       | Enhanced readability             |
| `text-lg`   | `font.size.lg`   | Important body text    | Enhanced readability             |
| `text-base` | `font.size.base` | Standard body text     | Foundation of readability        |
| `text-sm`   | `font.size.sm`   | Supporting information | Present but not prominent        |
| `text-xs`   | `font.size.xs`   | Captions, metadata     | Minimal presence                 |

### **Font Weights**

| Weight                | Usage           | Philosophy           |
| --------------------- | --------------- | -------------------- |
| `font-normal` (400)   | Body text       | Standard readability |
| `font-medium` (500)   | Emphasized text | Subtle emphasis      |
| `font-semibold` (600) | Headings        | Clear hierarchy      |
| `font-bold` (700)     | Hero text       | Maximum impact       |

---

## 📏 **Spacing System**

### **Spacing Scale**

```css
space-0:  0        /* No spacing */
space-1:  0.25rem  /* 4px - minimal spacing */
space-2:  0.5rem   /* 8px - small spacing */
space-3:  0.75rem  /* 12px - medium spacing */
space-4:  1rem     /* 16px - standard spacing */
space-5:  1.25rem  /* 20px - large spacing */
space-6:  1.5rem   /* 24px - extra large spacing */
space-8:  2rem     /* 32px - section spacing */
```

### **Spacing Philosophy**

- **Consistent Rhythm**: All spacing follows the 4px base unit
- **Harmonious Proportions**: Each step feels natural and balanced
- **Purposeful Spacing**: Every space serves a functional purpose

---

## 🔲 **Border Radius**

### **Radius Scale**

```css
radius-sm:  0.375rem  /* 6px - subtle rounding */
radius-md:  0.5rem    /* 8px - standard rounding */
radius-lg:  0.75rem   /* 12px - prominent rounding */
```

### **Usage Guidelines**

- **Small (`sm`)**: Subtle elements, form inputs
- **Medium (`md`)**: Standard components, buttons
- **Large (`lg`)**: Prominent elements, cards

---

## 🎭 **Interactive States**

### **Hover States**

```css
hover: bg-interactive-hover; /* #2A2A2A - subtle but clear */
```

- **Philosophy**: Obvious but not overwhelming
- **Usage**: All interactive elements

### **Active States**

```css
active: bg-interactive-active; /* #3A3A3A - clear feedback */
```

- **Philosophy**: Immediate visual feedback
- **Usage**: Buttons, links, interactive elements

### **Focus States**

```css
focus:border-border-focus     /* #007AFF - Apple Blue */
focus:outline-2px solid #007AFF
```

- **Philosophy**: Accessibility and clarity
- **Usage**: All focusable elements

### **Disabled States**

```css
disabled:bg-interactive-disabled  /* #4A4A4A - obvious disabled */
disabled:opacity-50
```

- **Philosophy**: Clear visual indication
- **Usage**: Disabled buttons, form inputs

---

## 🧩 **Component Guidelines**

### **Buttons**

#### **Primary Button**

```css
bg-ai-solid text-fg-inverted hover:bg-ai-muted
```

- **Usage**: Main actions, CTAs
- **Philosophy**: Obvious primary action

#### **Secondary Button**

```css
border border-border-strong text-fg-default hover:bg-interactive-hover
```

- **Usage**: Secondary actions
- **Philosophy**: Clear hierarchy

#### **Ghost Button**

```css
text-fg-default hover:bg-interactive-hover
```

- **Usage**: Tertiary actions
- **Philosophy**: Minimal presence

#### **Destructive Button**

```css
bg-danger text-fg-inverted hover:bg-danger/90
```

- **Usage**: Destructive actions
- **Philosophy**: Clear warning

### **Form Elements**

#### **Input Fields**

```css
bg-bg-base border border-border-subtle focus:border-border-focus
```

- **Philosophy**: Clear boundaries, obvious focus

#### **Labels**

```css
text-fg-default font-medium
```

- **Philosophy**: Clear hierarchy, obvious purpose

#### **Placeholders**

```css
placeholder-fg-muted
```

- **Philosophy**: Subtle guidance, not competing

### **Cards**

#### **Standard Card**

```css
bg-bg-elevated border border-border-subtle rounded-lg
```

- **Philosophy**: Subtle elevation, clear boundaries

#### **Card Content**

```css
p-6 space-y-4
```

- **Philosophy**: Generous spacing, easy scanning

---

## 🎨 **Layout Principles**

### **Grid System**

- **Maximum Width**: `max-w-6xl` (1152px)
- **Container Padding**: `px-6` (24px)
- **Section Spacing**: `py-12` (48px)

### **Content Hierarchy**

1. **Hero Section**: Maximum impact, single message
2. **Section Headers**: Clear structure, obvious purpose
3. **Content Blocks**: Generous spacing, easy scanning
4. **Supporting Elements**: Subtle presence, not competing

### **White Space Philosophy**

- **Generous Spacing**: Let content breathe
- **Purposeful Gaps**: Every space serves a function
- **Visual Rhythm**: Consistent spacing creates harmony

---

## 🚫 **Anti-Patterns (What NOT to Do)**

### **Color Anti-Patterns**

- ❌ **Multiple brand colors** - Jobs would say "Pick ONE color"
- ❌ **Arbitrary colors** - Every color must have meaning
- ❌ **Low contrast** - Maximum readability is essential
- ❌ **Color bloat** - Only essential colors

### **Typography Anti-Patterns**

- ❌ **Multiple font families** - Consistency is key
- ❌ **Arbitrary font sizes** - Follow the scale
- ❌ **Poor hierarchy** - Clear structure is essential
- ❌ **Hard to read** - Typography serves function

### **Spacing Anti-Patterns**

- ❌ **Inconsistent spacing** - Rhythm creates harmony
- ❌ **Arbitrary spacing** - Follow the scale
- ❌ **Cramped layouts** - Generous spacing is elegant
- ❌ **Random gaps** - Every space serves a purpose

### **Interaction Anti-Patterns**

- ❌ **Unclear hover states** - Make it obvious
- ❌ **Missing focus states** - Accessibility is essential
- ❌ **Confusing interactions** - Users should never wonder
- ❌ **Inconsistent behavior** - Predictable interactions

---

## 🛠 **Implementation Guidelines**

### **Token Usage**

- **Always use semantic tokens** - Never hardcode colors
- **Follow the naming convention** - `bg-`, `fg-`, `ai-`, `state-`
- **Use the spacing scale** - `space-1` through `space-8`
- **Apply consistent radius** - `radius-sm`, `radius-md`, `radius-lg`

### **Component Development**

1. **Start with function** - What does it need to do?
2. **Apply Jobs principles** - Simplicity, clarity, purpose
3. **Use semantic tokens** - Consistent with design system
4. **Test interactions** - Make sure they're obvious
5. **Validate accessibility** - Focus states, contrast, readability

### **Code Examples**

#### **Button Component**

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus",
  {
    variants: {
      variant: {
        primary: "bg-ai-solid text-fg-inverted hover:bg-ai-muted",
        secondary: "border border-border-strong text-fg-default hover:bg-interactive-hover",
        ghost: "text-fg-default hover:bg-interactive-hover",
        destructive: "bg-danger text-fg-inverted hover:bg-danger/90",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
```

#### **Card Component**

```tsx
<div className="bg-bg-elevated border border-border-subtle rounded-lg p-6">
  <h3 className="text-lg font-semibold text-fg-default mb-3">Card Title</h3>
  <p className="text-fg-muted mb-4">Card content with clear hierarchy and generous spacing.</p>
  <button className="bg-ai-solid text-fg-inverted px-4 py-2 rounded-md hover:bg-ai-muted transition-colors">
    Action
  </button>
</div>
```

---

## 🎯 **Design Review Checklist**

### **Before Implementation**

- [ ] Does every element serve a purpose?
- [ ] Is the hierarchy clear and obvious?
- [ ] Are interactions predictable and obvious?
- [ ] Does it follow the Jobs philosophy?

### **During Development**

- [ ] Using semantic tokens only?
- [ ] Following the spacing scale?
- [ ] Applying consistent typography?
- [ ] Testing all interactive states?

### **Before Release**

- [ ] Maximum contrast for readability?
- [ ] Clear focus states for accessibility?
- [ ] Consistent with design system?
- [ ] Simple and sophisticated?

---

## 📚 **Resources**

### **Inspiration**

- **Apple Human Interface Guidelines** - The foundation of our philosophy
- **Steve Jobs Design Quotes** - Core principles and philosophy
- **Apple Design History** - Evolution of simplicity and elegance

### **Tools**

- **Design Tokens** - `@aibos/tokens` package
- **Component Library** - `@aibos/ui` package
- **Compliance Checker** - `pnpm check:tokens`

### **References**

- **Color Contrast Checker** - Ensure accessibility
- **Typography Scale** - Consistent sizing
- **Spacing Calculator** - Harmonious proportions

---

## 🏆 **Success Metrics**

### **Design Quality**

- **Simplicity Score** - How well does it follow Jobs' principles?
- **Consistency Score** - How well does it follow the system?
- **Accessibility Score** - How well does it serve all users?
- **Elegance Score** - How sophisticated does it feel?

### **User Experience**

- **Clarity** - Users understand immediately
- **Efficiency** - Users accomplish tasks quickly
- **Satisfaction** - Users feel the quality
- **Accessibility** - All users can use it effectively

---

**Remember**: _"Simplicity is the ultimate sophistication"_ - Steve Jobs

Every design decision should be evaluated against this principle. If it doesn't serve the user's
purpose, remove it. If it's not obvious, make it clearer. If it's not elegant, simplify it.

---

_This document is the single source of truth for AI-BOS design. All developers must follow these
guidelines to maintain consistency and quality._
