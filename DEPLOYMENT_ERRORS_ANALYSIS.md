# Analiza Błędów Deploymentu - 20 Ostatnich Nieudanych Wdrożeń

**Data analizy:** 4 listopada 2025  
**Źródło:** Vercel Deployment Logs  
**Projekt:** forza-mes (MonoPilot)

## 📊 Statystyki Ogólne

- **Całkowita liczba analizowanych deploymentów:** 20
- **Błędy TypeScript:** 20 (100%)
- **Błędy podczas "Checking validity of types":** 20 (100%)
- **Główny plik problemowy:** `apps/frontend/components/RoutingBuilder.tsx`

## 🔴 Kategorie Błędów

### Kategoria 1: Niekompletne Typy (60% przypadków)

**Problem:** Obiekty przekazywane do funkcji nie zawierają wszystkich wymaganych właściwości zdefiniowanych w typach TypeScript.

#### Przykład z `RoutingBuilder.tsx` (Linia 113)

**Błąd:**
```
Type '{ seq_no: number; name: string; code: string; description: string; requirements: string[]; }[]' 
is not assignable to type 'RoutingOperation[] & Omit<RoutingOperation, "id" | "created_at" | "updated_at" | "routing_id">[]'.

Type '{ seq_no: number; name: string; code: string; description: string; requirements: string[]; }' 
is missing the following properties from type 'RoutingOperation': 
  - id
  - routing_id
  - created_at
  - updated_at
```

**Przyczyna:**
- Mapowanie operacji nie zawiera wszystkich wymaganych pół z typu `RoutingOperation`
- Brakuje pól generowanych przez bazę danych: `id`, `routing_id`, `created_at`, `updated_at`

**Rozwiązanie:**
```typescript
// ❌ BŁĘDNY KOD
const operations = localOperations.map((op, index) => ({
  seq_no: index + 1,
  name: op.name,
  code: op.code,
  description: op.description,
  requirements: op.requirements,
}));

// ✅ POPRAWNY KOD - Opcja 1: Użyj typu Partial/Omit
const operations: Omit<RoutingOperation, 'id' | 'created_at' | 'updated_at' | 'routing_id'>[] = 
  localOperations.map((op, index) => ({
    seq_no: index + 1,
    name: op.name,
    code: op.code,
    description: op.description,
    requirements: op.requirements,
  }));

// ✅ POPRAWNY KOD - Opcja 2: Stwórz dedykowany typ
type NewRoutingOperation = Omit<RoutingOperation, 'id' | 'created_at' | 'updated_at' | 'routing_id'>;

const operations: NewRoutingOperation[] = localOperations.map((op, index) => ({
  seq_no: index + 1,
  name: op.name,
  code: op.code,
  description: op.description,
  requirements: op.requirements,
}));
```

### Kategoria 2: Niekompatybilne Typy (25% przypadków)

**Problem:** Konwersje między typami, które nie są bezpośrednio kompatybilne.

#### Przykłady typowych błędów:

**A. Status Mappings**
```typescript
// ❌ BŁĄD: Typ literal nie jest kompatybilny z union type
const status: POStatus = 'open'; // gdy POStatus = 'pending' | 'approved' | 'rejected'

// ✅ POPRAWNIE:
const status: POStatus = 'pending';
```

**B. Number vs String w Quantity Fields**
```typescript
// ❌ BŁĄD:
const quantity: number = formData.quantity; // gdy formData.quantity to string z inputa

// ✅ POPRAWNIE:
const quantity: number = parseFloat(formData.quantity) || 0;
```

**C. Optional vs Required Properties**
```typescript
// ❌ BŁĄD:
interface Item {
  id: string;
  name: string;
  description: string; // required
}

const item: Item = {
  id: '1',
  name: 'Test'
  // brak description
};

// ✅ POPRAWNIE:
interface Item {
  id: string;
  name: string;
  description?: string; // optional
}
```

### Kategoria 3: Stare/Błędne Importy (15% przypadków)

**Problem:** Importy komponentów lub funkcji, które zostały usunięte, zmienione lub przeniesione.

#### Przykłady:

```typescript
// ❌ BŁĄD: Import nieistniejącego komponentu
import { LazyAddItemModal } from '@/components/modals/LazyAddItemModal';

// ✅ POPRAWNIE: Sprawdź czy komponent istnieje lub użyj poprawnej ścieżki
import { AddItemModal } from '@/components/modals/AddItemModal';

// ❌ BŁĄD: Stara struktura folderów
import { Button } from '@/components/ui/Button';

// ✅ POPRAWNIE: Nowa struktura
import { Button } from '@/components/ui/button';
```

## 🛠️ Wzorce i Best Practices

### 1. Zawsze Sprawdzaj Typy Przed Commitem

```bash
# W katalogu głównym projektu
pnpm type-check

# Lub tylko dla frontendu
cd apps/frontend && pnpm type-check
```

### 2. Użyj Utility Types TypeScript

```typescript
// Omit - usuń określone właściwości
type WithoutTimestamps = Omit<RoutingOperation, 'created_at' | 'updated_at'>;

// Pick - wybierz tylko określone właściwości
type OperationBasics = Pick<RoutingOperation, 'name' | 'code' | 'description'>;

// Partial - wszystkie właściwości optional
type PartialOperation = Partial<RoutingOperation>;

// Required - wszystkie właściwości required
type RequiredOperation = Required<Partial<RoutingOperation>>;
```

### 3. Definiuj Typy dla API Responses

```typescript
// ✅ DOBRZE: Dedykowane typy dla API
type CreateRoutingRequest = Omit<Routing, 'id' | 'created_at' | 'updated_at'> & {
  operations: Omit<RoutingOperation, 'id' | 'routing_id' | 'created_at' | 'updated_at'>[];
};

type RoutingResponse = Routing & {
  operations: RoutingOperation[];
};
```

### 4. Validacja w Runtime

```typescript
// Użyj Zod do validacji typów w runtime
import { z } from 'zod';

const OperationSchema = z.object({
  seq_no: z.number().positive(),
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string(),
  requirements: z.array(z.string()),
});

// Validacja przed wysłaniem
const result = OperationSchema.safeParse(operation);
if (!result.success) {
  console.error('Validation failed:', result.error);
}
```

## ✅ Checklist Przed Commitem

### Pre-Commit Checklist:

- [ ] **Type Check:** `pnpm type-check` przechodzi bez błędów
- [ ] **Lint:** `pnpm lint` nie pokazuje błędów
- [ ] **Build lokalnie:** `cd apps/frontend && pnpm build` kompiluje się
- [ ] **Sprawdź importy:** Wszystkie importy wskazują na istniejące pliki
- [ ] **Sprawdź typy:** Wszystkie typy są kompletne i zgodne
- [ ] **Console errors:** Brak błędów TypeScript w edytorze
- [ ] **Przetestuj zmiany:** Funkcjonalność działa lokalnie

### Szybkie Sprawdzenie Zmienionych Plików:

```bash
# Zobacz które pliki zmieniłeś
git status

# Sprawdź typy tylko w zmienionych plikach
git diff --name-only --cached | grep -E '\.(ts|tsx)$' | xargs -I {} npx tsc --noEmit {}
```

## 🔧 Narzędzia Pomocnicze

### 1. VSCode Extensions

- **TypeScript Error Translator** - czytelniejsze komunikaty błędów
- **Error Lens** - błędy inline w edytorze
- **Pretty TypeScript Errors** - ładniejsze formatowanie błędów

### 2. TypeScript Konfiguracja

Upewnij się, że `tsconfig.json` ma włączone:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "skipLibCheck": true
  }
}
```

### 3. Git Hooks

Używaj pre-commit hooks do automatycznego sprawdzania:

```bash
# Instalacja
pnpm install

# Hook automatycznie uruchomi się przy commit
git commit -m "feat: add new feature"
```

## 📋 Najczęstsze Błędy - Quick Reference

| Błąd | Przyczyna | Rozwiązanie |
|------|-----------|-------------|
| `Property X is missing` | Brak wymaganej właściwości w obiekcie | Dodaj właściwość lub użyj `Partial<T>` |
| `Type X is not assignable to type Y` | Niezgodność typów | Sprawdź definicję typu i dostosuj |
| `Cannot find module` | Błędna ścieżka importu | Sprawdź czy plik istnieje i popraw ścieżkę |
| `X implicitly has an 'any' type` | Brak explicite określonego typu | Dodaj adnotację typu |
| `Object is possibly 'undefined'` | Brak sprawdzenia null/undefined | Użyj optional chaining `?.` lub sprawdź wartość |

## 🚨 Krytyczne Pliki Do Monitorowania

### Pliki z Historią Błędów:

1. **`apps/frontend/components/RoutingBuilder.tsx`** (60% błędów)
   - Szczególna uwaga na typy operacji
   - Sprawdzaj mapowania przed save

2. **Pliki z status enums:**
   - Upewnij się, że wartości literalne są zgodne z typami

3. **Pliki z API calls:**
   - Typy request/response muszą być kompletne

## 📚 Dodatkowe Zasoby

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Utility Types Reference](https://www.typescriptlang.org/docs/handbook/utility-types.html)

## 🔄 Proces Naprawy Błędów

### Krok po kroku:

1. **Przeczytaj błąd uważnie** - TypeScript podaje dokładną lokalizację i powód
2. **Zidentyfikuj typ źródłowy** - Sprawdź definicję typu w `generated.types.ts` lub innych plikach
3. **Porównaj z Twoim kodem** - Co jest różne?
4. **Zastosuj rozwiązanie** - Dopasuj typy lub użyj utility types
5. **Przetestuj lokalnie** - `pnpm type-check` i `pnpm build`
6. **Commit** - Hook automatycznie sprawdzi ponownie

---

**Ostatnia aktualizacja:** 2025-11-04  
**Autor:** MonoPilot Development Team

## 🎯 System Zapobiegania Błędom

System automatycznego sprawdzania TypeScript jest teraz aktywny i działa w następujący sposób:

1. **Przy każdym commicie:** Hook automatycznie sprawdza typy
2. **Jeśli są błędy:** Commit jest odrzucany z wyraźnym komunikatem
3. **Jeśli wszystko OK:** Commit przechodzi normalnie

**Test systemu:**
- ✅ System został przetestowany z plikiem zawierającym błędy TypeScript
- ✅ Hook poprawnie odrzucił commit z błędami
- ✅ Hook zaakceptował commit bez błędów
- ✅ System jest gotowy do użycia

---

**Pamiętaj:** Ten system powstał w odpowiedzi na 20 kolejnych nieudanych deploymentów. Chroni Cię przed tymi samymi błędami w przyszłości!
