# Component: {Component Name}

## Component Info
| Field | Value |
|-------|-------|
| Type | {Button / Input / Card / Modal / etc.} |
| Used In | {Screen names where used} |
| Design System | {reference if exists} |

## Purpose
{What this component does and when to use it}

---

## Variants

| Variant | Use Case | Visual |
|---------|----------|--------|
| Primary | Main actions | Filled, brand color |
| Secondary | Alternative actions | Outlined |
| Tertiary | Low emphasis | Text only |
| Destructive | Dangerous actions | Red/warning color |

---

## States

### Default
```
┌─────────────────┐
│   Button Text   │
└─────────────────┘
```
| Property | Value |
|----------|-------|
| Background | primary-500 |
| Text | white |
| Border | none |
| Border radius | 8dp |

### Hover (Desktop)
| Property | Value |
|----------|-------|
| Background | primary-600 |
| Cursor | pointer |
| Transition | 150ms ease |

### Pressed / Active
| Property | Value |
|----------|-------|
| Background | primary-700 |
| Scale | 0.98 |

### Focused
| Property | Value |
|----------|-------|
| Outline | 2dp solid focus-color |
| Outline offset | 2dp |

### Disabled
| Property | Value |
|----------|-------|
| Background | gray-200 |
| Text | gray-400 |
| Cursor | not-allowed |
| Opacity | 0.6 |

### Loading
```
┌─────────────────┐
│   ◠ Loading...  │
└─────────────────┘
```
| Property | Value |
|----------|-------|
| Spinner | 16x16dp, left of text |
| Interaction | disabled |

---

## Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| Small (sm) | 32dp | 12dp horizontal | 14sp |
| Medium (md) | 40dp | 16dp horizontal | 16sp |
| Large (lg) | 48dp | 20dp horizontal | 18sp |

---

## Props (for Frontend)

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| variant | 'primary' \| 'secondary' \| 'tertiary' | 'primary' | No | Visual style |
| size | 'sm' \| 'md' \| 'lg' | 'md' | No | Component size |
| disabled | boolean | false | No | Disable interactions |
| loading | boolean | false | No | Show loading state |
| fullWidth | boolean | false | No | Stretch to container |
| leftIcon | ReactNode | - | No | Icon before text |
| rightIcon | ReactNode | - | No | Icon after text |
| onClick | () => void | - | Yes* | Click handler |

*Required unless disabled or loading

---

## Accessibility

### ARIA
| Attribute | Value |
|-----------|-------|
| role | button |
| aria-disabled | {disabled state} |
| aria-busy | {loading state} |
| aria-label | {if icon-only} |

### Keyboard
| Key | Action |
|-----|--------|
| Enter | Activate |
| Space | Activate |
| Tab | Focus next |
| Shift+Tab | Focus previous |

### Screen Reader
- Announces: "{Button text}, button"
- If disabled: "{Button text}, button, disabled"
- If loading: "{Button text}, button, loading"

---

## Usage Examples

### Basic
```jsx
<Button onClick={handleClick}>
  Click me
</Button>
```

### With Icon
```jsx
<Button
  leftIcon={<PlusIcon />}
  onClick={handleCreate}
>
  Create New
</Button>
```

### Loading State
```jsx
<Button
  loading={isSubmitting}
  onClick={handleSubmit}
>
  Submit
</Button>
```

### Destructive
```jsx
<Button
  variant="destructive"
  onClick={handleDelete}
>
  Delete
</Button>
```

---

## Do's and Don'ts

### Do
- Use clear, action-oriented labels ("Save", "Submit", "Create")
- Provide loading feedback for async actions
- Maintain consistent sizing within a view
- Use appropriate variant for action importance

### Don't
- Use vague labels ("Click here", "OK")
- Disable without explanation
- Mix sizes randomly
- Use destructive variant for non-destructive actions

---

## Related Components
- IconButton: Icon-only variant
- ButtonGroup: Multiple related buttons
- LinkButton: Navigation styled as button

---

## Notes
{Implementation notes, edge cases, or design rationale}
