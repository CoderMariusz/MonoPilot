# Wireframe: {Screen Name}

## Screen Info
| Field | Value |
|-------|-------|
| Feature | {feature_name} |
| Story | {N}.{M} |
| Platform | {web / mobile / both} |
| AC Addressed | {acceptance criteria this screen implements} |

## Screen Purpose
{Brief description of what user accomplishes on this screen}

---

## Layout (ASCII)

```
+-------------------------------------+
|  [<-]  Screen Title            [*]  |  <- Header
+-----------+-------------------------+
|                                     |
|  +-----------------------------+    |
|  |   Hero / Banner             |    |  <- Optional hero
|  +-----------------------------+    |
|                                     |
|  Section Title                      |
|  +---------+ +---------+            |
|  | Card 1  | | Card 2  |  -->       |  <- Horizontal scroll
|  +---------+ +---------+            |
|                                     |
|  +-----------------------------+    |
|  |  List Item 1            [>] |    |
|  +-----------------------------+    |
|  |  List Item 2            [>] |    |
|  +-----------------------------+    |
|                                     |
|        [ Primary Action ]           |  <- CTA
|                                     |
+-----------+-------------------------+
|  [Home]  [Search]  [+]  [Profile]   |  <- Bottom nav
+-------------------------------------+
```

---

## Component Specifications

### Header
| Property | Value |
|----------|-------|
| Height | 56dp |
| Back button | Left, 24x24dp |
| Title | Center, 18sp bold |
| Action | Right, 24x24dp |

### Cards
| Property | Value |
|----------|-------|
| Size | 120w x 140h dp |
| Border radius | 12dp |
| Padding | 12dp |
| Shadow | elevation 2 |

### List Items
| Property | Value |
|----------|-------|
| Height | 56dp min |
| Padding | 16dp horizontal |
| Chevron | 24x24dp right |
| Divider | 1dp, 10% opacity |

### Primary Button
| Property | Value |
|----------|-------|
| Height | 48dp |
| Width | Full width - 32dp margin |
| Border radius | 8dp |
| Font | 16sp bold |

---

## Interactions

### Tap Actions
| Element | Action | Destination |
|---------|--------|-------------|
| Back | Navigate back | Previous screen |
| Card | View detail | {DetailScreen} |
| List item | View detail | {DetailScreen} |
| Primary button | Submit/Action | {NextScreen} |

### Gestures
| Gesture | Area | Action |
|---------|------|--------|
| Swipe left/right | Cards | Scroll carousel |
| Pull down | Content area | Refresh data |
| Long press | List item | Context menu |

### Animations
| Trigger | Animation | Duration |
|---------|-----------|----------|
| Screen enter | Slide from right | 300ms |
| Card tap | Scale to 0.95 | 100ms |
| Button tap | Ripple effect | 200ms |

---

## States

### Loading
```
+-------------------------------------+
|  [<-]  Screen Title            [*]  |
+-------------------------------------+
|  +-----------------------------+    |
|  |  [################     ]    |    |  <- Skeleton
|  +-----------------------------+    |
|  +--------+ +--------+ +--------+   |
|  |  ████  | |  ████  | |  ████  |   |  <- Skeleton cards
|  +--------+ +--------+ +--------+   |
+-------------------------------------+
```

### Empty
```
+-------------------------------------+
|  [<-]  Screen Title            [*]  |
+-------------------------------------+
|                                     |
|           [illustration]            |
|                                     |
|          No items yet               |
|     Tap + to create your first      |
|                                     |
|          [ Get Started ]            |
+-------------------------------------+
```

### Error
```
+-------------------------------------+
|  [<-]  Screen Title            [*]  |
+-------------------------------------+
|                                     |
|            [error icon]             |
|                                     |
|       Something went wrong          |
|      Please try again later         |
|                                     |
|             [ Retry ]               |
+-------------------------------------+
```

---

## Accessibility

### Touch Targets
- All interactive elements: min 48x48dp
- Spacing between targets: min 8dp

### Screen Reader Labels
| Element | Label | Hint |
|---------|-------|------|
| Back button | "Go back" | "Returns to previous screen" |
| Card | "{Title}, {Value}" | "Double tap to view details" |
| List item | "{Title}" | "Double tap to open" |

### Color Contrast
- Body text: 4.5:1 minimum (AA)
- Large text (18sp+): 3:1 minimum
- Interactive elements: visually distinct

### Focus Order
1. Header elements (left → right)
2. Main content (top → bottom)
3. Primary action
4. Bottom navigation (left → right)

---

## Responsive Behavior

| Breakpoint | Changes |
|------------|---------|
| Mobile (<768px) | Single column, bottom nav |
| Tablet (768-1024px) | 2-column grid, side nav |
| Desktop (>1024px) | 3-column grid, top nav |

---

## Notes
{Any additional implementation notes}
