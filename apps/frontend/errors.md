# TypeScript Error Patterns - Fix Guide

## 1. Brakujące `await` przed `createServerSupabase()`

**Błąd:**
```
Property 'auth' does not exist on type 'Promise<SupabaseClient>'
```

**Przyczyna:** `createServerSupabase()` zwraca Promise, nie SupabaseClient

**Fix:**
```typescript
// ❌ Źle
const supabase = createServerSupabase()

// ✅ Dobrze
const supabase = await createServerSupabase()
```

## 2. Brakująca walidacja błędów auth

**Błąd:** Brak sprawdzenia `authError` z `getUser()`

**Fix:**
```typescript
// ❌ Źle
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// ✅ Dobrze
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

## 3. Nullable fields - Zod schema vs TypeScript interface

**Błąd:**
```
Type 'string | null' is not assignable to type 'string | undefined'
```

**Przyczyna:** Kolumny DB z `TEXT` (bez NOT NULL) mogą być `null`, ale TypeScript ma tylko `undefined`

**Fix:**
```typescript
// Zod schema
notes: z.string().optional().nullable()  // ✅ Dodaj .nullable()

// TypeScript interface
notes?: string | null  // ✅ Dodaj | null
```

## 4. Zod default values w formularzach

**Błąd:**
```
Type 'Resolver<...>' is not assignable to type 'Resolver<...>'
Type 'number | undefined' is not assignable to type 'number'
```

**Przyczyna:** `z.infer` zwraca OUTPUT type (po defaults), a form potrzebuje INPUT type (przed defaults)

**Fix:**
```typescript
// Schema
status: z.enum(['active', 'inactive']).optional().default('active')  // ✅ Dodaj .optional() przed .default()

// Type export
export type CreateInput = z.input<typeof schema>  // ✅ Użyj z.input zamiast z.infer
```

## 5. HTML Input nie akceptuje `null`

**Błąd:**
```
Type 'string | null | undefined' is not assignable to type 'string | undefined'
Type 'null' is not assignable
```

**Przyczyna:** React `<Input>` i `<Textarea>` nie akceptują `null`, tylko `string | undefined`

**Fix:**
```typescript
<Textarea
  {...field}
  value={field.value ?? ''}  // ✅ Konwertuj null na empty string
/>
```

## 6. Implicit 'any' type w indexed access

**Błąd:**
```
Element implicitly has an 'any' type because expression of type 'any' can't be used to index
```

**Fix:**
```typescript
// ❌ Źle
function Component({ group }: { group: any }) {
  const colors = { ... }
  return colors[group.category]  // Błąd: any type
}

// ✅ Dobrze
function Component({ group }: { group: ProductGroup }) {
  const colors: Record<ProductGroup['category'], string> = { ... }
  return colors[group.category]  // ✅ Type-safe
}
```

## 7. Literal type vs null assignment

**Błąd:**
```
Type '"pending"' is not assignable to type 'null'
```

**Fix:**
```typescript
// ❌ Źle
approval_status: null  // TypeScript infers type as literal 'null'

// ✅ Dobrze
approval_status: null as string | null  // Type assertion
```

## 8. Test comparisons z niemożliwymi typami

**Błąd:**
```
This comparison appears to be unintentional because the types '"backward"' and '"forward"' have no overlap
```

**Fix:**
```typescript
// ❌ Źle
const direction = 'backward'  // Literal type 'backward'
if (direction === 'forward')  // Zawsze false

// ✅ Dobrze
const direction: 'forward' | 'backward' = 'backward'  // Union type
// LUB
const direction = 'backward' as const
const result = childId  // Bezpośrednie przypisanie bez warunku
```

## 9. Vitest config - brakujący moduł vite

**Błąd:**
```
Cannot find module 'vite' or its corresponding type declarations
```

**Fix:**
```typescript
// ❌ Źle
import { loadEnv } from 'vite'
export default ({ mode }) => { ... }

// ✅ Dobrze
import { defineConfig } from 'vitest/config'
export default defineConfig({ ... })
```

## 10. Supabase client tworzony na module-level

**Błąd:**
```
Error: supabaseUrl is required.
```

**Przyczyna:** Tworzenie Supabase clienta na top-level (poza funkcją) - podczas build time env vars mogą nie być dostępne

**Fix:**
```typescript
// ❌ Źle
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  // użycie supabase
}

// ✅ Dobrze
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Config error' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  // użycie supabase
}
```

## Checklist przed deploymentem

- [ ] Sprawdź czy wszystkie `createServerSupabase()` mają `await`
- [ ] Sprawdź czy wszystkie `getUser()` sprawdzają `authError`
- [ ] Sprawdź czy nullable fields w DB mają `| null` w TypeScript
- [ ] Sprawdź czy schematy z `.default()` mają `.optional()` przed
- [ ] Sprawdź czy form types używają `z.input` zamiast `z.infer`
- [ ] Sprawdź czy HTML inputs konwertują `null` na `''`
- [ ] Uruchom `pnpm type-check` przed merge
