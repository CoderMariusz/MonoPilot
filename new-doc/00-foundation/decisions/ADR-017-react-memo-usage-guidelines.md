# ADR-017: React.memo Usage Guidelines

**Status:** Accepted
**Date:** 2025-12-29
**Context:** Story 02.5b (BOM Items Phase 1B Refactoring)
**Deciders:** SENIOR-DEV, ARCHITECT

---

## Context and Problem Statement

During Phase 1B refactoring, we observed unnecessary re-renders in presentational components like `ConditionalFlagsSelect` and `ProductionLinesCheckbox`. These components render multiple checkboxes/badges and re-render whenever parent state changes, even when their props haven't changed.

**Problem:** React re-renders child components whenever parent re-renders, even if child props are unchanged. This can cause performance issues in:
- Forms with many fields
- Lists with many items
- Components with expensive render logic
- Interactive UIs with frequent state updates

**Question:** When and how should we use `React.memo` to optimize component rendering while maintaining code clarity and avoiding premature optimization?

---

## Decision Drivers

- **Performance:** Minimize unnecessary re-renders
- **User Experience:** Smooth, responsive UI interactions
- **Maintainability:** Clear when and why memo is used
- **Code Simplicity:** Avoid over-optimization
- **React Best Practices:** Follow React team recommendations

---

## Considered Options

### Option 1: No Memoization (Default React Behavior)
**Let React re-render everything**

```tsx
export function ConditionalFlagsSelect({ value, onChange }) {
  // Renders every time parent re-renders
  return (...)
}
```

**Pros:**
- Simplest approach
- No additional code
- Follows "render often, optimize later" philosophy

**Cons:**
- ❌ Poor performance with large lists (> 10 items)
- ❌ Unnecessary work on every parent re-render
- ❌ Can cause input lag in forms
- ❌ Wastes CPU cycles

**When to Use:** Simple components that render fast (< 1ms)

---

### Option 2: React.memo for ALL Components
**Memoize everything**

```tsx
export const Button = memo(function Button(props) {
  return <button {...props} />
})

export const Label = memo(function Label(props) {
  return <label {...props} />
})

// memo EVERYWHERE
```

**Pros:**
- Maximum performance optimization
- Prevents all unnecessary re-renders

**Cons:**
- ❌ Over-optimization (premature optimization is root of all evil)
- ❌ More code to maintain
- ❌ Memo overhead for simple components (can be slower)
- ❌ False sense of performance (memo has cost too)
- ❌ Harder to debug (props comparisons can be confusing)

**When to Use:** Never - this is over-engineering

---

### Option 3: Selective React.memo with Guidelines ✅ **SELECTED**
**Memoize specific components based on criteria**

```tsx
// Memoize: Multi-select with 5+ options
export const ConditionalFlagsSelect = memo(function ConditionalFlagsSelect(props) {
  // Renders 5 checkboxes + badges
  return (...)
})

// Don't memoize: Simple text input
export function TextInput({ value, onChange }) {
  // Just a single input element
  return <input value={value} onChange={onChange} />
}
```

**Pros:**
- ✅ Optimizes components that benefit most
- ✅ Avoids over-optimization
- ✅ Clear guidelines for when to use
- ✅ Measurable performance improvement

**Cons:**
- ⚠️ Requires judgment (mitigated by guidelines below)
- ⚠️ Need to ensure stable props (mitigated by hooks like useCallback)

---

### Option 4: useMemo for Sub-components
**Memoize JSX instead of components**

```tsx
export function ConditionalFlagsSelect({ value, onChange }) {
  const flagElements = useMemo(() => {
    return flags.map(flag => <Checkbox key={flag.id} {...flag} />)
  }, [flags])

  return <div>{flagElements}</div>
}
```

**Pros:**
- Granular control over what's memoized
- No need for separate memo wrapper

**Cons:**
- ❌ More complex code
- ❌ Less clear than component-level memo
- ❌ Doesn't prevent re-renders of parent

**When to Use:** Expensive calculations within component (not for preventing re-renders)

---

## Decision Outcome

**Chosen Option: Selective React.memo with Guidelines (Option 3)**

Use `React.memo` for specific component types based on clear criteria.

---

## Guidelines for React.memo Usage

### ✅ Use React.memo For:

#### 1. Multi-Select/Multi-Option Components
Components that render multiple child elements (checkboxes, radio buttons, badges)

```tsx
export const ConditionalFlagsSelect = memo(function ConditionalFlagsSelect(props) {
  // Renders 5+ checkboxes + badges
  // Benefits: Prevents re-rendering 5+ elements
})

export const ProductionLinesCheckbox = memo(function ProductionLinesCheckbox(props) {
  // Renders N production line checkboxes
  // Benefits: Prevents re-rendering entire list
})
```

**Criteria:**
- Renders ≥ 5 similar child elements
- Child elements have interactive state (checkboxes, toggles)
- Props change infrequently

---

#### 2. List Item Components
Components rendered multiple times in a list

```tsx
export const BOMItemRow = memo(function BOMItemRow({ item, onEdit, onDelete }) {
  // Rendered 50+ times in BOM items list
  // Benefits: Prevents re-rendering unchanged rows
})

export const ByproductRow = memo(function ByproductRow(props) {
  // Rendered in byproducts table
  // Benefits: Only changed rows re-render
})
```

**Criteria:**
- Rendered in `.map()` loop
- List has ≥ 10 items
- Items don't change frequently

---

#### 3. Complex Render Logic
Components with expensive render calculations

```tsx
export const AllergenMatrix = memo(function AllergenMatrix({ bom, allergens }) {
  // Calculates allergen inheritance (expensive)
  // Benefits: Avoids recalculating unless bom/allergens change
})
```

**Criteria:**
- Render time > 16ms (1 frame)
- Complex calculations in render
- Props change infrequently

---

#### 4. Modal/Dialog Components
Full-screen overlays that are conditionally rendered

```tsx
export const BOMBulkImportModal = memo(function BOMBulkImportModal(props) {
  // Large modal with file upload, progress, etc.
  // Benefits: Doesn't re-render when parent changes
})
```

**Criteria:**
- Conditionally rendered (`isOpen && <Modal />`)
- Large component tree
- Contains forms/inputs

---

### ❌ Don't Use React.memo For:

#### 1. Simple Components
Components that render fast (< 1ms)

```tsx
// DON'T memo simple components
export function Label({ children }) {
  return <label>{children}</label>
}

export function Badge({ text }) {
  return <span className="badge">{text}</span>
}
```

**Reason:** Memo overhead > benefit

---

#### 2. Components with Unstable Props
Components receiving new functions/objects on every render

```tsx
// DON'T memo - onChange is new function every render
export function TextInput({ value, onChange }) {
  return <input value={value} onChange={onChange} />
}

// Parent
function Parent() {
  return <TextInput onChange={(e) => setX(e.target.value)} />  // New function every render!
}
```

**Reason:** Props change every render, memo does nothing

**Fix:** Use `useCallback` in parent:
```tsx
function Parent() {
  const handleChange = useCallback((e) => setX(e.target.value), [])
  return <TextInput onChange={handleChange} />  // Stable prop, memo works!
}
```

---

#### 3. Container/Page Components
Top-level components that manage state

```tsx
// DON'T memo pages/containers
export function BOMItemsPage() {
  const [items, setItems] = useState([])
  // ... lots of state
  return (...)
}
```

**Reason:** These components re-render intentionally when state changes

---

#### 4. Components That Always Re-render
Components with props that change frequently

```tsx
// DON'T memo - currentTime changes every second
export function Clock({ currentTime }) {
  return <div>{currentTime}</div>
}
```

**Reason:** Props change frequently, memo does nothing

---

## Implementation Patterns

### Pattern 1: Named Function Export (Recommended)

```tsx
export const ConditionalFlagsSelect = memo(function ConditionalFlagsSelect({
  value,
  onChange,
  disabled = false,
}: ConditionalFlagsSelectProps) {
  // Component logic
})
```

**Benefits:**
- Named function for React DevTools
- Export const for tree-shaking
- TypeScript inference works

---

### Pattern 2: Custom Comparison (Advanced)

```tsx
export const BOMItemRow = memo(
  function BOMItemRow({ item, index }) {
    // Component logic
  },
  (prevProps, nextProps) => {
    // Custom comparison: only re-render if item changed
    return prevProps.item.id === nextProps.item.id &&
           prevProps.item.quantity === nextProps.item.quantity
  }
)
```

**Use When:**
- Default shallow comparison isn't sufficient
- Props contain complex objects
- Need to compare specific fields only

**Warning:** Custom comparison can be error-prone. Use sparingly.

---

### Pattern 3: With useCallback for Stable Props

```tsx
// Parent component
function BOMItemsTable({ items }) {
  const handleEdit = useCallback((id: string) => {
    // Edit logic
  }, [])  // Empty deps = stable function

  const handleDelete = useCallback((id: string) => {
    // Delete logic
  }, [])  // Empty deps = stable function

  return (
    <>
      {items.map(item => (
        <BOMItemRow
          key={item.id}
          item={item}
          onEdit={handleEdit}  // Stable prop
          onDelete={handleDelete}  // Stable prop
        />
      ))}
    </>
  )
}

// Child component (memoized)
export const BOMItemRow = memo(function BOMItemRow({ item, onEdit, onDelete }) {
  // Only re-renders when item changes (onEdit/onDelete are stable)
})
```

---

## Performance Measurement

### Before Adding Memo
1. Open React DevTools Profiler
2. Record interaction (e.g., typing in form)
3. Check "Committed at" time for components
4. Look for components re-rendering unnecessarily

### After Adding Memo
1. Repeat same interaction
2. Verify memoized components show "Did not render" or reduced renders
3. Check overall interaction time improved

### Example Measurement (ConditionalFlagsSelect)

**Before memo:**
```
Typing in form field:
- ConditionalFlagsSelect: 5.2ms (renders every keystroke)
- Total interaction: 18ms
```

**After memo:**
```
Typing in form field:
- ConditionalFlagsSelect: Did not render
- Total interaction: 12ms (33% faster)
```

---

## TypeScript Considerations

### Type Inference Works

```tsx
interface Props {
  value: string
  onChange: (value: string) => void
}

export const MyComponent = memo(function MyComponent({ value, onChange }: Props) {
  // TypeScript infers types correctly
})

// Usage
<MyComponent value="test" onChange={(v) => console.log(v)} />  // ✅ Type-safe
```

### Generic Components

```tsx
export const Select = memo(function Select<T>({ options, value, onChange }: SelectProps<T>) {
  // Generic memo component
}) as <T>(props: SelectProps<T>) => JSX.Element

// Works with generics!
<Select<string> options={['a', 'b']} value="a" onChange={setVal} />
```

---

## Testing Considerations

### Memo Doesn't Affect Tests

```tsx
// Component with memo
export const Button = memo(function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>
})

// Test works identically
it('should call onClick when clicked', () => {
  const handleClick = vi.fn()
  render(<Button onClick={handleClick}>Click</Button>)
  fireEvent.click(screen.getByText('Click'))
  expect(handleClick).toHaveBeenCalled()
})
```

**Note:** Tests verify behavior, not implementation. Memo is invisible to tests.

---

## Consequences

### Positive

- ✅ **Performance:** Measurable improvement in forms/lists
- ✅ **User Experience:** Smoother interactions, no input lag
- ✅ **Selective:** Only optimize components that benefit
- ✅ **Standard Pattern:** Widely used in React community
- ✅ **Easy to Add/Remove:** Non-breaking change

### Negative

- ⚠️ **Requires Stable Props:** Need to use useCallback/useMemo in parent
- ⚠️ **Additional Code:** One extra line per component
- ⚠️ **Debugging:** Props comparisons can be confusing

### Neutral

- 🔷 Need to measure performance to verify benefit
- 🔷 Requires understanding of React rendering

---

## Compliance Checklist

Before adding `React.memo`:

- [ ] Component renders ≥ 5 similar elements OR is in a list OR has expensive render
- [ ] Props change infrequently (not on every parent render)
- [ ] Parent uses `useCallback`/`useMemo` for function/object props
- [ ] Measured performance improvement (React DevTools Profiler)

If all checked, add memo. Otherwise, skip.

---

## Migration Strategy

### Phase 1: High-Impact Components (Story 02.5b)
- ✅ `ConditionalFlagsSelect` (5 checkboxes)
- ⏸️ `ProductionLinesCheckbox` (N checkboxes)
- ⏸️ `BOMByproductsSection` (table rows)

### Phase 2: List Items (Future)
- `BOMItemRow` (rendered 50+ times)
- `ProductRow` (rendered 100+ times)
- `OperationRow` (rendered 20+ times)

### Phase 3: Modals (Future)
- `BOMBulkImportModal`
- `ProductFormModal`
- `OperationFormModal`

---

## Related Decisions

- **ADR-015:** Centralized Constants Pattern (stable props enable memo)
- **ADR-016:** CSV Parsing Utility Pattern (BulkImportModal memo candidate)

---

## References

- [React: memo API](https://react.dev/reference/react/memo)
- [React: When to use memo](https://react.dev/learn/react-memo)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools#profiler)
- [Kent C. Dodds: When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)

---

**Reviewed by:** ARCHITECT
**Approved by:** TECH-LEAD
**Implementation:** Story 02.5b (Phase 1B Refactoring)
