---
name: tailwind-patterns
version: 1.0.0
tokens: ~650
confidence: high
sources:
  - https://tailwindcss.com/docs/reusing-styles
  - https://tailwindcss.com/docs/responsive-design
last_validated: 2025-01-10
next_review: 2025-01-24
tags: [tailwind, css, styling, frontend]
---

## When to Use

Apply when styling components with Tailwind CSS: responsive design, component patterns, and class organization.

## Patterns

### Pattern 1: Responsive Design
```tsx
// Source: https://tailwindcss.com/docs/responsive-design
// Mobile-first: default → sm → md → lg → xl → 2xl
<div className="
  w-full          // Mobile: full width
  md:w-1/2        // Tablet: half width
  lg:w-1/3        // Desktop: third width
  p-4 md:p-6 lg:p-8
">
  Content
</div>

// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Pattern 2: Component Variants with CVA
```typescript
// Source: https://cva.style/docs
import { cva, type VariantProps } from 'class-variance-authority';

const button = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

interface ButtonProps extends VariantProps<typeof button> {
  children: React.ReactNode;
}

export function Button({ variant, size, children }: ButtonProps) {
  return <button className={button({ variant, size })}>{children}</button>;
}
```

### Pattern 3: Class Merging with cn()
```typescript
// Source: https://tailwindcss.com/docs/reusing-styles
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage - later classes override earlier
<div className={cn(
  'p-4 bg-white rounded',
  isActive && 'bg-blue-100',
  className // Allow override from props
)} />
```

### Pattern 4: Common Layout Patterns
```tsx
// Centered container
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

// Flexbox centering
<div className="flex items-center justify-center min-h-screen">

// Sticky header
<header className="sticky top-0 z-50 bg-white/80 backdrop-blur">

// Card pattern
<div className="rounded-lg border bg-card p-6 shadow-sm">

// Truncate text
<p className="truncate">Long text...</p>
<p className="line-clamp-2">Two lines max...</p>
```

### Pattern 5: Dark Mode
```tsx
// Source: https://tailwindcss.com/docs/dark-mode
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <h1 className="text-black dark:text-white">Title</h1>
  <p className="text-gray-600 dark:text-gray-400">Description</p>
</div>
```

## Anti-Patterns

- **Inline style attribute** - Use Tailwind classes instead
- **@apply everywhere** - Only for truly repeated patterns
- **Fighting Tailwind** - Use custom CSS sparingly
- **No responsive design** - Always consider mobile first

## Verification Checklist

- [ ] Mobile-first responsive classes
- [ ] CVA for component variants
- [ ] cn() for class merging
- [ ] Dark mode support where needed
- [ ] Consistent spacing scale (p-4, p-6, p-8)
