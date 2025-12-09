# Frontend Templates

## Component Documentation Template

```markdown
# Component: {ComponentName}

## Overview
{Brief description of what this component does}

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| {prop} | {type} | Yes/No | {default} | {description} |

## Usage

### Basic Usage
```tsx
<ComponentName prop1="value" />
```

### With All Props
```tsx
<ComponentName
  prop1="value"
  prop2={123}
  onAction={() => handleAction()}
/>
```

## States

### Loading State
{Description and visual}

### Error State
{Description and visual}

### Empty State
{Description and visual}

### Success State
{Description and visual}

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| onAction | `{ id: string }` | {when triggered} |

## Accessibility

- [ ] Keyboard navigable
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Focus management handled
- [ ] Color contrast compliant

## Styling

### CSS Classes
| Class | Purpose |
|-------|---------|
| `.component-root` | Root container |
| `.component-header` | Header section |

### CSS Variables
| Variable | Default | Purpose |
|----------|---------|---------|
| `--component-bg` | `#fff` | Background color |

## Testing

### Test Cases
- [ ] Renders with required props
- [ ] Handles user interactions
- [ ] Shows loading state
- [ ] Shows error state
- [ ] Accessible via keyboard
```

---

## Page/Screen Template

```markdown
# Page: {PageName}

## Route
`/path/to/page`

## Purpose
{What this page does, user goal}

## Components Used
| Component | Purpose |
|-----------|---------|
| {ComponentName} | {purpose} |

## Data Requirements

### Fetched Data
| Data | Source | Loading Strategy |
|------|--------|------------------|
| {data} | API endpoint | On mount / Lazy |

### User Input
| Field | Type | Validation |
|-------|------|------------|
| {field} | {type} | {rules} |

## State Management
| State | Type | Purpose |
|-------|------|---------|
| {state} | {type} | {purpose} |

## User Flows

### Happy Path
1. User lands on page
2. Data loads
3. User interacts with {element}
4. System responds with {response}
5. User sees {outcome}

### Error Path
1. User lands on page
2. Data fails to load
3. Error message displayed
4. User can retry

## API Integration
| Action | Endpoint | Method |
|--------|----------|--------|
| Load data | `/api/resource` | GET |
| Submit form | `/api/resource` | POST |

## Responsive Behavior
| Breakpoint | Layout Changes |
|------------|----------------|
| Mobile (<768px) | {changes} |
| Tablet (768-1024px) | {changes} |
| Desktop (>1024px) | {changes} |
```

---

## Form Handling Template

```markdown
# Form: {FormName}

## Purpose
{What this form collects/does}

## Fields

| Field | Type | Required | Validation | Error Message |
|-------|------|----------|------------|---------------|
| {field} | text | Yes | min:3, max:100 | "{field} must be 3-100 characters" |
| {field} | email | Yes | valid email | "Please enter a valid email" |
| {field} | select | No | one of options | "Please select an option" |

## Validation Schema
```typescript
const schema = {
  field1: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
};
```

## Submission

### On Submit
1. Validate all fields
2. Show loading state
3. Call API endpoint
4. Handle response (success/error)
5. Show feedback to user

### Success Handling
- Show success message
- Redirect to {page} OR
- Reset form OR
- Close modal

### Error Handling
| Error Type | User Feedback |
|------------|---------------|
| Validation error | Show field-level errors |
| Server error | Show general error message |
| Network error | Show retry option |

## Accessibility
- [ ] Labels linked to inputs
- [ ] Error messages announced
- [ ] Submit button disabled during loading
- [ ] Focus moves to first error on validation fail
```

---

## State Management Template

```markdown
# State: {StateName}

## Purpose
{What this state manages}

## Shape
```typescript
interface {State}State {
  data: {DataType}[] | null;
  loading: boolean;
  error: string | null;
  selectedId: string | null;
}

const initialState: {State}State = {
  data: null,
  loading: false,
  error: null,
  selectedId: null
};
```

## Actions

| Action | Payload | Effect |
|--------|---------|--------|
| FETCH_START | none | Set loading true |
| FETCH_SUCCESS | data[] | Set data, loading false |
| FETCH_ERROR | error string | Set error, loading false |
| SELECT | id string | Set selectedId |

## Selectors

| Selector | Returns | Usage |
|----------|---------|-------|
| selectAll | data[] | List all items |
| selectById | data \| undefined | Get single item |
| selectLoading | boolean | Check loading state |
| selectError | string \| null | Get error message |

## Side Effects

| Trigger | Effect | Outcome |
|---------|--------|---------|
| Component mount | Fetch data | Data loaded |
| User action | API call | State updated |
```

---

## Frontend Code Patterns

### Component Structure Pattern
```tsx
// Imports
import React, { useState, useEffect } from 'react';
import styles from './Component.module.css';

// Types
interface ComponentProps {
  id: string;
  title: string;
  onAction?: (id: string) => void;
}

// Component
export function Component({ id, title, onAction }: ComponentProps) {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effects
  useEffect(() => {
    // Setup logic
    return () => {
      // Cleanup logic
    };
  }, []);

  // Handlers
  const handleClick = () => {
    onAction?.(id);
  };

  // Render helpers
  const renderContent = () => {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    return <div>{title}</div>;
  };

  // Main render
  return (
    <div className={styles.container}>
      {renderContent()}
      <button onClick={handleClick}>Action</button>
    </div>
  );
}
```

### Custom Hook Pattern
```tsx
function useResource(id: string) {
  const [data, setData] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await api.getResource(id);
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [id]);

  return { data, loading, error };
}
```

### Form Handling Pattern
```tsx
function useForm<T>(initialValues: T, validate: (values: T) => Errors) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof T) => {
    setTouched(prev => new Set(prev).add(field as string));
    const fieldErrors = validate(values);
    setErrors(fieldErrors);
  };

  const handleSubmit = async (onSubmit: (values: T) => Promise<void>) => {
    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  };
}
```

### Error Boundary Pattern
```tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, info);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Accessibility Pattern
```tsx
// Button with proper accessibility
<button
  onClick={handleClick}
  disabled={isLoading}
  aria-busy={isLoading}
  aria-label={ariaLabel}
>
  {isLoading ? <Spinner aria-hidden="true" /> : null}
  <span>{buttonText}</span>
</button>

// Form field with accessibility
<div role="group" aria-labelledby="field-label">
  <label id="field-label" htmlFor="field-input">
    {label}
    {required && <span aria-hidden="true">*</span>}
  </label>
  <input
    id="field-input"
    type="text"
    value={value}
    onChange={handleChange}
    aria-invalid={!!error}
    aria-describedby={error ? 'field-error' : undefined}
    required={required}
  />
  {error && (
    <span id="field-error" role="alert" aria-live="polite">
      {error}
    </span>
  )}
</div>

// Modal with focus trap
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">{title}</h2>
  <p id="modal-description">{description}</p>
  {/* Focus trap implementation */}
</div>
```

### Responsive Pattern
```css
/* Mobile-first approach */
.container {
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
    flex-direction: row;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### Loading States Pattern
```tsx
function DataDisplay({ isLoading, error, data }) {
  // Loading state
  if (isLoading) {
    return (
      <div role="status" aria-live="polite">
        <Skeleton count={3} />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div role="alert" className="error-container">
        <ErrorIcon aria-hidden="true" />
        <p>{error.message}</p>
        <button onClick={retry}>Try again</button>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <EmptyIcon aria-hidden="true" />
        <p>No items found</p>
        <button onClick={createNew}>Create your first item</button>
      </div>
    );
  }

  // Success state
  return (
    <ul>
      {data.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```
