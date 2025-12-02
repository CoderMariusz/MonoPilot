# MonoPilot - AI Guide

## Priorytet: Efektywność Tokenów

### Zasady Podstawowe
- **NIE czytaj plików bez potrzeby** - użyj indeksów poniżej
- **NIE używaj Task/Explore** - najpierw Grep/Glob
- **NIE generuj długich odpowiedzi** - zwięźle i konkretnie
- **Pokazuj TYLKO zmiany**, nie cały plik
- **Używaj Haiku** dla prostych zadań (docs, review, testy)

---

## Quick Lookup - Zanim zaczniesz szukać

| Potrzebuję | Przeczytaj | NIE rób |
|------------|------------|---------|
| Gdzie jest plik/komponent? | `.claude/FILE-MAP.md` | Glob całego projektu |
| Jakie są tabele/pola? | `.claude/TABLES.md` | Czytaj migracje SQL |
| Wzorzec API/Component/Test | `.claude/PATTERNS.md` | Czytaj podobne pliki |
| Jak sformułować prompt? | `.claude/PROMPTS.md` | Zgadywać |
| Status projektu | `sprint-status.yaml` | Skanować docs/ |

---

## Quick Reference

### Stack
`Next.js 15` | `React` | `TypeScript` | `Tailwind` | `shadcn/ui` | `Supabase` | `pnpm`

### Struktura (zapamiętaj, nie skanuj)
```
apps/frontend/
  app/                    # Pages + API routes
  components/             # React components
  lib/supabase/           # client.ts, server.ts, migrations/
docs/sprint-artifacts/    # Sprint status + stories
.claude/                  # AI helper files
.bmad/                    # BMAD workflows
```

### Komendy
```bash
pnpm dev        # Dev server
pnpm build      # Build
pnpm type-check # TypeScript
pnpm test       # Playwright E2E
```

---

## Workflow: Zanim cokolwiek zrobisz

```
1. Użytkownik prosi o X
       ↓
2. Czy wiem gdzie to jest?
   NIE → Sprawdź FILE-MAP.md
   TAK → Idź dalej
       ↓
3. Czy potrzebuję schematu DB?
   TAK → Sprawdź TABLES.md (NIE czytaj migracji)
       ↓
4. Czy tworzę nowy API/Component/Test?
   TAK → Sprawdź PATTERNS.md
       ↓
5. Zrób zadanie, pokaż TYLKO diff
       ↓
6. Czy to story? → Update sprint-status.yaml
```

---

## Po każdym COMMICIE - Aktualizuj Status

### 1. Sprawdź co zrobiłeś
```bash
git log -1 --oneline
```

### 2. Zaktualizuj sprint-status.yaml
Lokalizacja: `docs/sprint-artifacts/sprint-status.yaml`

Statusy: `backlog` → `drafted` → `ready-for-dev` → `in-progress` → `review` → `done`

### 3. Jeśli story ukończone
- Update story file w `docs/sprint-artifacts/batch-XXX/stories/`
- Zmień status na `done` + data

---

## Kiedy czytać które pliki?

### FILE-MAP.md - Szukam lokalizacji
- Gdzie jest komponent X?
- Gdzie jest API dla Y?
- Jaka jest struktura modułu Z?

### TABLES.md - Potrzebuję schematu DB
- Jakie pola ma tabela X?
- Jaki jest typ kolumny Y?
- Jakie są relacje między tabelami?

### PATTERNS.md - Tworzę nowy element
- Nowy API endpoint
- Nowa migracja + RLS
- Nowy komponent z Supabase
- Nowy test E2E

### PROMPTS.md - Nie wiem jak sformułować
- Szablony promptów dla typowych zadań
- Quick fix, nowy endpoint, story implementation

---

## Optymalizacja Tokenów

| Zamiast | Użyj |
|---------|------|
| Task/Explore agent | Grep → Read znalezione |
| Czytaj migracje SQL | TABLES.md |
| Czytaj podobne pliki | PATTERNS.md |
| Czytaj cały stack | Grep błąd → Read plik |
| Code review workflow | `git diff --stat` |

---

## BMAD Workflows

### Używaj TYLKO gdy:
| Workflow | Kiedy |
|----------|-------|
| `workflow-status` | Sprawdzenie statusu projektu |
| `dev-story` | Implementacja całego story |
| `code-review` | Review DUŻYCH zmian (>5 plików) |

### NIE używaj gdy:
- Mała zmiana → po prostu zrób
- Bug fix → napraw bezpośrednio
- Docs → `/quick-docs`

---

## Quick Commands (Haiku)

- `/quick-docs` - Update dokumentacji
- `/quick-test` - Generowanie testów
- `/quick-review` - Szybkie code review

---

## Komunikacja

- **Polski** język
- **Zwięźle** - bez wyjaśnień
- **Tylko diff** - nie cały plik
- **Pytaj** - nie zgaduj

### Dobra odpowiedź:
```
Dodam endpoint.

apps/frontend/app/api/products/route.ts:15:
+ export async function POST(req: Request) { ... }

Gotowe.
```

---

## Index .claude/

| Plik | Kiedy czytać |
|------|--------------|
| `CLAUDE.md` | Zawsze załadowany |
| `FILE-MAP.md` | Szukam gdzie jest plik |
| `TABLES.md` | Potrzebuję DB schema |
| `PATTERNS.md` | Tworzę nowy API/component/test |
| `PROMPTS.md` | Szablony promptów |
| `WORKFLOW-GUIDE.md` | Multi-model setup |

---

**Pamiętaj: Najpierw sprawdź indeksy, potem szukaj. Każdy token kosztuje.**
