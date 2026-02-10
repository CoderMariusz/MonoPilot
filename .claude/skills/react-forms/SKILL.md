---
name: react-forms
description: Apply when building forms with validation, handling form state, or integrating with validation libraries like Zod.
---

## When to Use

Apply when building forms with validation, handling form state, or integrating with validation libraries like Zod.

## Patterns

### Pattern 1: React Hook Form Basic
```typescript
// Source: https://react-hook-form.com/get-started
import { useForm } from 'react-hook-form';

interface FormData {
  email: string;
  password: string;
}

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email', { required: 'Email required' })} />
      {errors.email && <span>{errors.email.message}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Pattern 2: Zod Integration
```typescript
// Source: https://react-hook-form.com/get-started#SchemaValidation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
});

type FormData = z.infer<typeof schema>;

function Form() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  // ...
}
```

### Pattern 3: Controlled Input with Validation
```typescript
// Source: https://react.dev/reference/react-dom/components/input
const [value, setValue] = useState('');
const [error, setError] = useState('');

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newValue = e.target.value;
  setValue(newValue);
  setError(newValue.length < 3 ? 'Min 3 chars' : '');
};

return (
  <>
    <input value={value} onChange={handleChange} />
    {error && <span className="error">{error}</span>}
  </>
);
```

### Pattern 4: Field Array (Dynamic Fields)
```typescript
// Source: https://react-hook-form.com/docs/usefieldarray
import { useFieldArray, useForm } from 'react-hook-form';

function DynamicForm() {
  const { control, register } = useForm({
    defaultValues: { items: [{ name: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  return (
    <>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`items.${index}.name`)} />
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => append({ name: '' })}>Add</button>
    </>
  );
}
```

## Anti-Patterns

- **Controlled inputs without need** - Use uncontrolled (register) for performance
- **Validation on every keystroke** - Use `mode: 'onBlur'` or `onSubmit`
- **No error states shown** - Always display validation feedback
- **Missing form reset** - Call `reset()` after successful submit

## Verification Checklist

- [ ] Form has proper validation schema (Zod preferred)
- [ ] Error messages displayed near inputs
- [ ] Submit button disabled during loading
- [ ] Form resets or redirects after success
- [ ] Accessible: labels, aria-invalid, focus management

## MonoPilot: ShadCN Form Pattern

MonoPilot uses react-hook-form + zodResolver + ShadCN UI Form components:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: { code: '', name: '' }
})

// Mutation via TanStack Query hook
const createMutation = useCreateSupplier()
const onSubmit = async (data: FormData) => {
  try {
    await createMutation.mutateAsync(data)
    toast({ title: 'Success', description: 'Created.' })
    onClose()
  } catch (error) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' })
  }
}

// JSX: Form → FormField → FormItem → FormControl → Input
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <FormField control={form.control} name="code" render={({ field }) => (
      <FormItem>
        <FormLabel>Code</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
    <Button type="submit" disabled={createMutation.isPending}>Save</Button>
  </form>
</Form>
```
