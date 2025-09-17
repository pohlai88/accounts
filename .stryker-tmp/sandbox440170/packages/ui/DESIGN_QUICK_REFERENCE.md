# AI-BOS Design Quick Reference

## Steve Jobs Inspired Design System

> **Quick reference for developers** - All essential tokens and patterns

---

## 🎨 **Essential Color Tokens**

### **Backgrounds**

```css
bg-bg-base        /* #000000 - Pure black */
bg-bg-elevated    /* #1A1A1A - Cards, modals */
bg-bg-muted       /* #2A2A2A - Subtle backgrounds */
```

### **Text Colors**

```css
text-fg-default   /* #FFFFFF - Primary text */
text-fg-muted     /* #8A8A8A - Secondary text */
text-fg-subtle    /* #6A6A6A - Tertiary text */
text-fg-inverted  /* #000000 - Text on dark */
```

### **AI Brand Colors**

```css
bg-ai-solid       /* #0056CC - Primary actions */
bg-ai-muted       /* #007AFF - Secondary elements */
bg-ai-subtle      /* rgba(0, 122, 255, 0.1) - Subtle backgrounds */
```

### **State Colors**

```css
bg-success        /* #34C759 - Success states */
bg-warning        /* #FF9500 - Warning states */
bg-danger         /* #FF3B30 - Error states */
```

### **Borders**

```css
border-border-subtle  /* #3A3A3A - Subtle borders */
border-border-strong  /* #4A4A4A - Strong borders */
border-border-focus   /* #007AFF - Focus rings */
```

---

## 📝 **Typography Scale**

```css
text-4xl    /* 2.25rem - Hero headings */
text-3xl    /* 1.875rem - Section headers */
text-2xl    /* 1.5rem - Subsection headers */
text-xl     /* 1.25rem - Component titles */
text-lg     /* 1.125rem - Important body text */
text-base   /* 1rem - Standard body text */
text-sm     /* 0.875rem - Supporting information */
text-xs     /* 0.75rem - Captions, metadata */
```

### **Font Weights**

```css
font-normal    /* 400 - Body text */
font-medium    /* 500 - Emphasized text */
font-semibold  /* 600 - Headings */
font-bold      /* 700 - Hero text */
```

---

## 📏 **Spacing Scale**

```css
space-0: 0        /* No spacing */
space-1: 0.25rem  /* 4px - minimal */
space-2: 0.5rem   /* 8px - small */
space-3: 0.75rem  /* 12px - medium */
space-4: 1rem     /* 16px - standard */
space-5: 1.25rem  /* 20px - large */
space-6: 1.5rem   /* 24px - extra large */
space-8: 2rem     /* 32px - section */
```

---

## 🔲 **Border Radius**

```css
rounded-sm   /* 0.375rem - subtle */
rounded-md   /* 0.5rem - standard */
rounded-lg   /* 0.75rem - prominent */
```

---

## 🎭 **Interactive States**

### **Hover States**

```css
hover:bg-interactive-hover   /* #2A2A2A */
hover:bg-ai-muted           /* #007AFF */
hover:bg-interactive-hover  /* #2A2A2A */
```

### **Focus States**

```css
focus:border-border-focus    /* #007AFF */
focus:outline-2px solid #007AFF
```

### **Active States**

```css
active: bg-interactive-active; /* #3A3A3A */
```

### **Disabled States**

```css
disabled:bg-interactive-disabled /* #4A4A4A */
disabled:opacity-50
```

---

## 🧩 **Component Patterns**

### **Primary Button**

```css
bg-ai-solid text-fg-inverted hover:bg-ai-muted px-4 py-2 rounded-md transition-colors
```

### **Secondary Button**

```css
border border-border-strong text-fg-default hover:bg-interactive-hover px-4 py-2 rounded-md transition-colors
```

### **Ghost Button**

```css
text-fg-default hover:bg-interactive-hover px-4 py-2 rounded-md transition-colors
```

### **Destructive Button**

```css
bg-danger text-fg-inverted hover:bg-danger/90 px-4 py-2 rounded-md transition-colors
```

### **Input Field**

```css
bg-bg-base border border-border-subtle focus:border-border-focus px-3 py-2 rounded-md text-fg-default placeholder-fg-muted
```

### **Card**

```css
bg-bg-elevated border border-border-subtle rounded-lg p-6
```

### **Form Label**

```css
text-fg-default font-medium text-sm mb-2
```

---

## 🎯 **Layout Patterns**

### **Container**

```css
max-w-6xl mx-auto px-6
```

### **Section Spacing**

```css
py-12  /* 48px vertical spacing */
```

### **Content Spacing**

```css
space-y-4  /* 16px between children */
space-y-6  /* 24px between children */
space-y-8  /* 32px between children */
```

### **Grid Layouts**

```css
grid grid-cols-1 md:grid-cols-2 gap-6
grid grid-cols-2 md:grid-cols-4 gap-4
```

---

## 🚫 **Common Mistakes**

### **❌ Don't Do This**

```css
/* Hardcoded colors */
bg-blue-500
text-gray-600
border-red-400

/* Arbitrary spacing */
p-7
m-13
gap-9

/* Multiple brand colors */
bg-green-500
bg-purple-600
bg-yellow-400

/* Inconsistent typography */
text-5xl
text-7xl
font-black
```

### **✅ Do This Instead**

```css
/* Semantic tokens */
bg-ai-solid
text-fg-muted
border-border-subtle

/* Consistent spacing */
p-6
m-4
gap-4

/* Single brand color */
bg-ai-solid
bg-ai-muted
bg-ai-subtle

/* Consistent typography */
text-4xl
text-3xl
font-bold
```

---

## 🛠 **Development Workflow**

### **1. Start with Function**

- What does this component need to do?
- What's the primary action?
- What's the hierarchy?

### **2. Apply Jobs Principles**

- Is it simple and obvious?
- Does every element serve a purpose?
- Is the interaction clear?

### **3. Use Semantic Tokens**

- Never hardcode colors
- Follow the spacing scale
- Use consistent typography

### **4. Test Interactions**

- Hover states work?
- Focus states visible?
- Disabled states obvious?

### **5. Validate Accessibility**

- Sufficient contrast?
- Keyboard navigation?
- Screen reader friendly?

---

## 📋 **Code Review Checklist**

- [ ] Using semantic tokens only?
- [ ] Following spacing scale?
- [ ] Consistent typography?
- [ ] Clear interactions?
- [ ] Accessible focus states?
- [ ] Simple and obvious?
- [ ] Follows Jobs philosophy?

---

## 🎨 **Design System Packages**

### **@aibos/tokens**

- All color tokens
- Typography scale
- Spacing system
- Border radius

### **@aibos/ui**

- Button components
- Form elements
- Card components
- Layout utilities

### **Compliance Checker**

```bash
pnpm check:tokens
```

---

**Remember**: _"Simplicity is the ultimate sophistication"_ - Steve Jobs

Every line of CSS should serve a purpose. Every color should have meaning. Every interaction should
be obvious.

---

_For complete guidelines, see [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md)_
