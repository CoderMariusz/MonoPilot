# General Rules - Planning & Execution

## Zasady planowania zadań w MonoPilot

### 1. Krótkie, zwięzłe zadania

- **Max 3 dni** na implementację jednego planu
- Jeśli zadanie jest większe → podziel na mniejsze plany (P0, P1, P2)
- Każdy plan = jeden jasny cel (np. "dodaj kolumnę X", "stwórz formularz Y")

### 2. Struktura planu

Każdy plan zawiera:
- **Brief** (5 zdań) - co robimy i dlaczego
- **Constraints** - co MUSI być zachowane (RLS, style UI, etc.)
- **File Plan** - które pliki będą zmienione
- **DB & RLS** - migracje i polityki bezpieczeństwa
- **Contracts** - interfejsy, DTO, API endpoints
- **Tests First** - testy PRZED implementacją
- **DoD** - kiedy uznajemy zadanie za skończone

### 3. RLS zawsze ON

- Wszystkie tabele mają włączone Row Level Security
- Każda operacja (SELECT, INSERT, UPDATE, DELETE) wymaga polityki RLS
- Testy muszą weryfikować działanie RLS

### 4. Filament-style UI

- Komponenty w stylu Filament: `<Resource>Table`, `<Resource>Modal`
- Spójny layout i nazewnictwo
- Standard: Create/Edit/List widoki

### 5. Plan ≠ Kod

- **Plan Mode** = tworzenie planu (blueprint, bez kodu)
- **Execute Mode** = implementacja według planu
- Plan zawiera OPIS i KONTRAKTY, nie kod

### 6. Tests First

- Piszemy testy PRZED implementacją
- Unit tests → Integration tests → UI tests
- Edge cases są częścią DoD

### 7. Conventional Commits

Każdy commit w formacie:
```
<type>(<scope>): <subject>

<body>
```

Typy:
- `feat`: nowa funkcjonalność
- `fix`: naprawa błędu
- `refactor`: refaktoryzacja bez zmiany funkcjonalności
- `test`: dodanie testów
- `docs`: dokumentacja
- `chore`: maintenance (npm, config)

Przykład:
```
feat(routing): add machine_id and expected_yield to operations

- Added machine_id field to routing_operations
- Added expected_yield_pct (0-100 range)
- Updated RoutingBuilder UI with selectors
```

### 8. Priorytety

- **P0** - Must have (blokuje dalsze prace, krytyczne)
- **P1** - Should have (ważne, ale nie blokuje)
- **P2** - Nice to have (można odłożyć)

### 9. Moduły

Kod jest podzielony na moduły:
- `PLAN` - Planowanie zamówień, demand
- `TECH` - Technical (BOM, routings, produkty)
- `PROD` - Produkcja (work orders, yield)
- `WH` - Magazyn (GRN, stock moves, LP)
- `SCN` - Terminal/Scanner (UI dla pracowników)
- `QA` - Quality (kontrola jakości)
- `SET` - Settings (konfiguracja, słowniki)

### 10. Typowa struktura plików

```
apps/frontend/
├── app/
│   └── <module>/          # strony Next.js
│       └── page.tsx
├── components/            # komponenty React
│   ├── <Resource>Table.tsx
│   ├── <Resource>Modal.tsx
│   └── <Component>.tsx
└── lib/
    ├── api/              # API calls do Supabase
    │   └── <resource>.ts
    ├── types.ts          # TypeScript interfaces
    └── supabase/
        └── migrations/   # SQL migrations
            └── NNN_<name>.sql
```

### 11. Workflow

1. **Plan Mode** → stwórz plan w `docs/plan/`
2. **Review** → sprawdź czy plan jest kompletny
3. **Execute Mode** → implementuj według planu
4. **Test** → uruchom testy (DoD)
5. **PR** → code review + merge
6. **Deploy** → wdrożenie na środowisko

### 12. DoD (Definition of Done)

Zadanie jest skończone gdy:
- [ ] Wszystkie testy przechodzą
- [ ] TypeScript kompiluje się bez błędów
- [ ] Linter przechodzi bez błędów
- [ ] RLS policies działają
- [ ] UI jest spójny z Filament-style
- [ ] Edge cases są obsłużone
- [ ] Commits są w formacie Conventional Commits
- [ ] Migracje mają UP i DOWN
- [ ] Error handling jest zaimplementowany

### 13. Best Practices

- **DRY** (Don't Repeat Yourself) - unikaj duplikacji
- **KISS** (Keep It Simple, Stupid) - prostota > złożoność
- **YAGNI** (You Aren't Gonna Need It) - nie implementuj "na zapas"
- **Single Responsibility** - jedna funkcja = jeden cel
- **Type Safety** - TypeScript everywhere, no `any`

### 14. Error Handling

```typescript
try {
  const result = await API.someOperation();
  showToast('Success message', 'success');
} catch (error: any) {
  console.error('Error:', error);
  showToast(error.message || 'Failed to ...', 'error');
}
```

### 15. Loading States

Każda async operacja powinna mieć loading state:
```typescript
const [loading, setLoading] = useState(false);

async function handleSubmit() {
  setLoading(true);
  try {
    await API.create(data);
  } finally {
    setLoading(false);
  }
}
```

### 16. Naming Conventions

- **Komponenty**: PascalCase (`RoutingBuilder`, `WorkOrdersTable`)
- **Funkcje**: camelCase (`handleSubmit`, `fetchData`)
- **Pliki**: kebab-case (`routing-builder.tsx`, `work-orders.ts`)
- **Typy**: PascalCase (`RoutingOperation`, `WorkOrder`)
- **API**: PascalCase class + camelCase methods (`RoutingsAPI.getAll()`)
- **Baza danych**: snake_case (`routing_operations`, `work_orders`)

### 17. File Naming

- Components: `<ComponentName>.tsx`
- Pages: `page.tsx` (Next.js app router)
- API: `<resource>.ts`
- Types: `types.ts` lub `<resource>.types.ts`
- Migrations: `NNN_description_snake_case.sql`

### 18. Comments

- Komentarze w języku **angielskim**
- Dokumentacja w `docs/` może być po polsku lub angielsku
- Komentuj "dlaczego", nie "co" (kod sam pokazuje "co")

```typescript
// Good
// Validate sequence numbers to prevent duplicates in routing
if (seqNumbers.length !== uniqueSeqNumbers.size) {
  throw new Error('Sequence numbers must be unique');
}

// Bad
// Check if seqNumbers length is not equal to uniqueSeqNumbers size
```

### 19. Dependency Management

- Używaj `pnpm` (nie npm ani yarn)
- Dependencies w `package.json` (root i workspace)
- Unikaj dodawania nowych zależności bez uzasadnienia

### 20. Git Workflow

```bash
# 1. Stwórz branch z numerem planu
git checkout -b feat/003-wo-made-progress-p0

# 2. Implementuj według planu
# ... edycja plików ...

# 3. Commituj z Conventional Commits
git commit -m "feat(prod): add made and progress columns to WO table"

# 4. Push i PR
git push origin feat/003-wo-made-progress-p0
```

---

## Przykład: Od planu do implementacji

### Plan (docs/plan/003--PROD--wo-made-progress--p0.md)
```yaml
---
id: 003
title: Work Orders - Made/Progress columns
module: PROD
priority: P0
status: draft
---

## Brief
Dodaj kolumny Made i Progress do listy Work Orders...
(5 zdań)

## File Plan
- apps/frontend/components/WorkOrdersTable.tsx (modify)
- apps/frontend/lib/api/workOrders.ts (modify)
```

### Implementacja

```bash
# 1. Przeczytaj plan
cursor docs/plan/003--PROD--wo-made-progress--p0.md

# 2. Execute mode - implementuj
# Cursor zaczyna od testów (Tests First)
# Następnie implementuje według File Plan
# Na końcu weryfikuje DoD

# 3. Commit
git commit -m "feat(prod): add made/progress columns to work orders

- Added madeQty and progressPct to WorkOrder interface
- Updated WorkOrdersTable to display new columns
- Added progress bar UI component
- Handles edge case: plannedQty=0 → progress=0
- All tests passing

Closes #003"
```

---

## Kiedy używać Plan Mode vs Execute Mode

### Plan Mode
- Tworzysz nowy plan
- Analizujesz wymagania
- Definiujesz kontrakt i DoD
- Zastanawiasz się "co i jak"

### Execute Mode
- Implementujesz istniejący plan
- Piszesz kod
- Piszesz testy
- Wykonujesz zadanie step-by-step

**Reguła:** Najpierw Plan, potem Execute. Bez planu = chaos.

---

## Skrócona checklistka (tl;dr)

✅ Plan krótki (max 3 dni)  
✅ Brief = 5 zdań  
✅ RLS ON zawsze  
✅ Filament-style UI  
✅ Tests First  
✅ Conventional Commits  
✅ DoD = gdy wszystko działa i przechodzi  
✅ Plan ≠ Kod (plan to blueprint)  
✅ TypeScript strict mode  
✅ Error handling + loading states  
✅ Realne ścieżki plików

