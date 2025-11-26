# MonoPilot - Optymalizacja Tokenów

## Priorytet: Efektywność i Minimalizacja Kosztów

### Podstawowe Zasady
- **NIE czytaj plików bez wyraźnej potrzeby** - zawsze pytaj czy plik jest potrzebny
- **NIE używaj Task/Explore agent** bez konieczności - najpierw użyj Grep/Glob
- **NIE generuj długich odpowiedzi** - bądź zwięzły i konkretny
- **NIE powtarzaj kodu** - pokaż tylko zmienione fragmenty
- **Używaj Haiku** dla prostych zadań zamiast Sonnet

### Stack Technologiczny (NIE czytaj tych plików bez pytania)
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Deployment**: Vercel
- **Testing**: Playwright (E2E), Vitest (Unit)
- **Package Manager**: pnpm

### Struktura Projektu - Zapamiętaj (NIE skanuj bez potrzeby)
```
apps/frontend/       # Główna aplikacja Next.js
  src/
    app/            # App Router (Next.js 15)
    components/     # Komponenty React
    lib/            # Utilities, Supabase client
    types/          # TypeScript types
    hooks/          # React hooks
scripts/            # Skrypty migracji/seeding
__tests__/          # Testy (unit + E2E)
supabase/           # Konfiguracja Supabase
.bmad/              # BMAD Method workflow files
```

### Kluczowe Komendy (Użyj TYLKO gdy potrzeba)
```bash
pnpm dev              # Start dev server
pnpm build            # Build produkcyjny
pnpm type-check       # TypeScript check
pnpm test             # Run tests
pnpm test:unit        # Unit tests only
pnpm test:e2e         # E2E tests only
```

### MCP Servers - Dostępne (NIE listuj bez pytania)
- **Supabase**: Migracje, SQL, tables, logs, advisors
- **Vercel**: Deployments, projekty, logi buildów

### Optymalizacja Workflow

#### 1. Zamiast czytać wiele plików:
❌ NIE: Read każdego pliku osobno
✅ TAK: Grep pattern w całym projekcie, Read TYLKO znalezione

#### 2. Przy migracjach bazy:
❌ NIE: Czytaj wszystkie poprzednie migracje
✅ TAK: Użyj `mcp__supabase__list_tables` i `mcp__supabase__execute_sql`

#### 3. Przy dodawaniu komponentów:
❌ NIE: Czytaj wszystkie podobne komponenty
✅ TAK: Pytaj o lokalizację, czytaj TYLKO jeden przykład

#### 4. Przy debugowaniu:
❌ NIE: Czytaj cały stack trace i wszystkie pliki
✅ TAK: Znajdź błąd Grep, czytaj TYLKO plik z błędem

#### 5. Przy code review:
❌ NIE: Używaj `/bmad:bmm:workflows:code-review` dla małych zmian
✅ TAK: Przejrzyj tylko zmienione linie z `git diff`

### RLS Policies - Zapamiętaj Pattern
Wszystkie tabele mają standardowy pattern RLS:
```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Standard policies (authenticated users)
CREATE POLICY "Enable read for authenticated users"
  ON table_name FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON table_name FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON table_name FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON table_name FOR DELETE
  TO authenticated
  USING (true);
```
**NIE czytaj istniejących migracji** - użyj tego wzorca.

### API Routes Pattern - Zapamiętaj
```typescript
// apps/frontend/src/app/api/[resource]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('table_name')
    .select('*')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```
**NIE czytaj innych routes** - użyj tego wzorca.

### Component Pattern - Zapamiętaj
```typescript
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Component() {
  const [data, setData] = useState([])
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data } = await supabase.from('table').select('*')
    setData(data || [])
  }

  return <div>{/* UI */}</div>
}
```
**NIE czytaj innych komponentów** - użyj tego wzorca.

### Gdy NIE wiesz - PYTAJ, NIE szukaj
Jeśli nie znasz:
- Struktury bazy danych → PYTAJ użytkownika
- Nazwy komponentu → PYTAJ gdzie jest
- Business logic → PYTAJ o wymagania

### BMAD Workflows - Użyj TYLKO gdy użytkownik prosi
- `/bmad:bmm:workflows:workflow-status` - Status projektu
- `/bmad:bmm:workflows:code-review` - Code review (TYLKO dla dużych zmian)
- `/bmad:bmm:workflows:sprint-planning` - Sprint planning
- **Inne workflows** - TYLKO na wyraźne żądanie

### Komunikacja
- Odpowiedzi ZAWSZE w języku polskim
- Maksymalnie zwięźle
- Bez powtarzania kodu użytkownika
- Bez niepotrzebnych wyjaśnień
- Pokazuj TYLKO zmiany, nie cały plik

### Przykład Dobrej Odpowiedzi
```
Dodam endpoint dla produktów.

Zmiany w apps/frontend/src/app/api/products/route.ts:15-20:
+ export async function POST(request: Request) {
+   const body = await request.json()
+   // ... implementacja
+ }

Gotowe. Endpoint dostępny pod /api/products.
```

### Przykład Złej Odpowiedzi (UNIKAJ)
```
Oczywiście! Najpierw przeczytam strukturę projektu...
[czyta 10 plików]
Teraz przeanalizuję podobne endpointy...
[czyta kolejne 5 plików]
Oto pełna implementacja z wyjaśnieniami...
[300 linii kodu z komentarzami]
```

---

**Pamiętaj**: Każdy token kosztuje. Pytaj, nie zgaduj. Czytaj minimum, pisz konkretnie.
