# Responsive Design Checklist

> Używane przez: FRONTEND-DEV, QA-AGENT, UX-DESIGNER

## Breakpoints Standard

```css
/* Mobile First Approach */

/* Base styles = Mobile (320px+) */
.component {
  padding: 1rem;
  font-size: 1rem;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .component {
    padding: 1.5rem;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .component {
    padding: 2rem;
    max-width: 1200px;
  }
}

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
  .component {
    max-width: 1400px;
  }
}
```

## Device Targets

| Device | Width | Test Priority |
|--------|-------|---------------|
| Mobile S | 320px | Must |
| Mobile M | 375px | Must |
| Mobile L | 425px | Should |
| Tablet | 768px | Must |
| Laptop | 1024px | Must |
| Desktop | 1440px | Should |
| 4K | 2560px | Could |

## Testing Checklist per Breakpoint

### Mobile (320-767px)
- [ ] Touch targets min 44x44px
- [ ] No horizontal scroll
- [ ] Readable text without zoom (min 16px)
- [ ] Navigation accessible (hamburger menu works)
- [ ] Forms usable (inputs not cut off)
- [ ] Images scale properly
- [ ] Modals fit screen

### Tablet (768-1023px)
- [ ] Layout adapts (2-column where appropriate)
- [ ] Navigation transition (hamburger vs full menu)
- [ ] Tables scrollable or reformatted
- [ ] Adequate spacing (not too cramped, not too sparse)

### Desktop (1024px+)
- [ ] Content width reasonable (max-width)
- [ ] Multi-column layouts work
- [ ] Hover states implemented
- [ ] Navigation fully visible
- [ ] No wasted whitespace

## Common Responsive Patterns

### Stack → Row
```css
.container {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .container {
    flex-direction: row;
  }
}
```

### Hide/Show Elements
```css
.mobile-only {
  display: block;
}
.desktop-only {
  display: none;
}

@media (min-width: 1024px) {
  .mobile-only { display: none; }
  .desktop-only { display: block; }
}
```

### Responsive Typography
```css
html {
  font-size: 14px;
}

@media (min-width: 768px) {
  html { font-size: 16px; }
}

@media (min-width: 1024px) {
  html { font-size: 18px; }
}

/* Use rem for all sizes */
h1 { font-size: 2rem; }
p { font-size: 1rem; }
```

### Responsive Images
```html
<picture>
  <source media="(min-width: 1024px)" srcset="large.jpg">
  <source media="(min-width: 768px)" srcset="medium.jpg">
  <img src="small.jpg" alt="Description">
</picture>
```

```css
img {
  max-width: 100%;
  height: auto;
}
```

### Responsive Tables
```css
/* Option 1: Horizontal scroll */
.table-container {
  overflow-x: auto;
}

/* Option 2: Stack on mobile */
@media (max-width: 767px) {
  table, thead, tbody, tr, td, th {
    display: block;
  }
  td::before {
    content: attr(data-label);
    font-weight: bold;
  }
}
```

## Units Guide

| Use Case | Unit | Example |
|----------|------|---------|
| Font size | rem | `font-size: 1.25rem` |
| Spacing | rem | `padding: 1rem` |
| Border | px | `border: 1px solid` |
| Container width | % + max-width | `width: 100%; max-width: 1200px` |
| Icons | em (scales with text) | `width: 1.5em` |

## Testing Tools

### Browser DevTools
```
Chrome: Cmd/Ctrl + Shift + M (Device Mode)
- Select device presets
- Test custom dimensions
- Throttle network/CPU
```

### Viewport Testing Script
```javascript
// Quick responsive test in console
const breakpoints = [320, 375, 768, 1024, 1440];
breakpoints.forEach(width => {
  window.resizeTo(width, 800);
  console.log(`Testing ${width}px...`);
  // Check for overflow
  if (document.body.scrollWidth > width) {
    console.warn(`Horizontal overflow at ${width}px!`);
  }
});
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Fixed widths | Use %, max-width, flex |
| Tiny touch targets | Min 44x44px, 8px spacing |
| Horizontal scroll | Check overflow, use responsive images |
| Text too small on mobile | Min 16px, use rem |
| Desktop-first CSS | Refactor to mobile-first |
| Testing only one device | Test at least 320, 768, 1024 |

## Quick Validation

Before marking responsive as done:
1. [ ] Tested at 320px (smallest mobile)
2. [ ] Tested at 768px (tablet)
3. [ ] Tested at 1024px (desktop)
4. [ ] No horizontal scrollbar at any size
5. [ ] All text readable without zoom
6. [ ] All touch targets accessible
7. [ ] Images don't break layout
