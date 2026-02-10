---
name: react-hooks
description: Apply when managing state, side effects, context, or refs in React functional components. **React 19+ Note**: React 19.x introduced new hooks for forms/actions (useActionState, useOptimistic, useFormStatus) and effect events (useEffectEvent in 19.2). Core hooks (useState, useEffect, useCallback, etc.) remain unchanged.
---

## When to Use

Apply when managing state, side effects, context, or refs in React functional components.

**React 19+ Note**: React 19.x introduced new hooks for forms/actions (useActionState, useOptimistic, useFormStatus) and effect events (useEffectEvent in 19.2). Core hooks (useState, useEffect, useCallback, etc.) remain unchanged.

## Patterns

### Pattern 1: useState with Objects
```typescript
// Source: https://react.dev/reference/react/useState
interface FormState {
  name: string;
  email: string;
}

const [form, setForm] = useState<FormState>({ name: '', email: '' });

// Update single field (immutable)
setForm(prev => ({ ...prev, name: 'John' }));
```

### Pattern 2: useEffect Cleanup
```typescript
// Source: https://react.dev/reference/react/useEffect
useEffect(() => {
  const controller = new AbortController();

  async function fetchData() {
    const res = await fetch(url, { signal: controller.signal });
    setData(await res.json());
  }
  fetchData();

  return () => controller.abort(); // Cleanup
}, [url]);
```

### Pattern 3: useCallback for Stable References
```typescript
// Source: https://react.dev/reference/react/useCallback
const handleSubmit = useCallback((data: FormData) => {
  onSubmit(data);
}, [onSubmit]); // Only recreate if onSubmit changes

// Use in child: <Form onSubmit={handleSubmit} />
```

### Pattern 4: useMemo for Expensive Computations
```typescript
// Source: https://react.dev/reference/react/useMemo
const sortedItems = useMemo(() => {
  return items
    .filter(item => item.active)
    .sort((a, b) => a.name.localeCompare(b.name));
}, [items]); // Recompute only when items change
```

### Pattern 5: Custom Hook Pattern
```typescript
// Source: https://react.dev/learn/reusing-logic-with-custom-hooks
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// Usage
const debouncedSearch = useDebounce(searchTerm, 300);
```

### Pattern 6: useRef for DOM Access
```typescript
// Source: https://react.dev/reference/react/useRef
const inputRef = useRef<HTMLInputElement>(null);

const focusInput = () => {
  inputRef.current?.focus();
};

return <input ref={inputRef} />;
```

### Pattern 7: useActionState for Forms (React 19+)
```typescript
// Source: https://react.dev/blog/2024/12/05/react-19
import { useActionState } from 'react';

async function submitForm(prevState: any, formData: FormData) {
  const name = formData.get('name');
  // Perform async operation
  return { success: true, name };
}

function MyForm() {
  const [state, action, isPending] = useActionState(submitForm, null);

  return (
    <form action={action}>
      <input name="name" disabled={isPending} />
      <button disabled={isPending}>Submit</button>
      {state?.success && <p>Success: {state.name}</p>}
    </form>
  );
}
```

### Pattern 8: useEffectEvent for Non-Reactive Logic (React 19.2+)
```typescript
// Source: https://react.dev/reference/react/useEffectEvent
import { useEffect, useEffectEvent } from 'react';

function Chat({ roomId, theme }) {
  // Event function always sees latest theme, but doesn't trigger effect
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme);
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('connected', onConnected);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // Only re-run when roomId changes
}
```

## Anti-Patterns

- **Hooks in conditions/loops** - Call hooks at top level only
- **Missing dependencies** - Include all values used in effect/callback
- **Over-using useMemo/useCallback** - Use only when performance matters (profile first)
- **Mutating state directly** - Always use setter, spread for objects/arrays
- **Async function as useEffect callback** - Define async function inside, then call it

## Verification Checklist

- [ ] Hooks at component top level (not in conditions)
- [ ] All dependencies listed in dependency arrays
- [ ] useEffect has cleanup for subscriptions/timers
- [ ] Custom hooks start with `use` prefix
- [ ] No direct state mutation
- [ ] useEffectEvent excluded from dependency arrays (React 19.2+)
