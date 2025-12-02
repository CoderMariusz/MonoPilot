# MonoPilot - AI Guide

## Priorytet: Efektywność Tokenów

### Zasady Podstawowe
- **NIE czytaj plików bez potrzeby** - pytaj o lokalizację
- **NIE używaj Task/Explore** - najpierw Grep/Glob
- **NIE generuj długich odpowiedzi** - zwięźle i konkretnie
- **Pokazuj TYLKO zmiany**, nie cały plik
- **Używaj Haiku** dla prostych zadań (docs, review, testy)

---

## Quick Reference

### Stack
`Next.js 15` | `React` | `TypeScript` | `Tailwind` | `shadcn/ui` | `Supabase` | `pnpm`

### Struktura
```
apps/frontend/src/     # Next.js App Router
  app/                 # Routes + API
  components/          # React components
  lib/supabase/        # client.ts + server.ts
docs/sprint-artifacts/ # Sprint status + stories
.bmad/                 # BMAD workflows
```

### Komendy
```bash
pnpm dev        # Dev server
pnpm build      # Build
pnpm type-check # TypeScript
pnpm test       # Playwright E2E
```

---

## Po każdym COMMICIE - Aktualizuj Status

### 1. Sprawdź co zrobiłeś
```bash
git log -1 --oneline
```

### 2. Zaktualizuj sprint-status.yaml
Lokalizacja: `docs/sprint-artifacts/sprint-status.yaml`

Statusy story:
- `backlog` → `drafted` → `ready-for-dev` → `in-progress` → `review` → `done`

**Przykład zmiany:**
```yaml
# PRZED
4-1-production-dashboard: ready-for-dev

# PO (gdy ukończone)
4-1-production-dashboard: done
```

### 3. Jeśli story ukończone - Update story file
Lokalizacja: `docs/sprint-artifacts/batch-XXX/stories/`
- Zmień status na `done`
- Dodaj datę ukończenia

---

## Quick Status Check

**Aby sprawdzić aktualny status projektu:**
```bash
# Szybki podgląd sprint-status
cat docs/sprint-artifacts/sprint-status.yaml | head -60
```

**Lub użyj workflow:**
`/bmad:bmm:workflows:workflow-status`

---

## Optymalizacja Tokenów

### 1. Szukanie kodu
```
❌ Task/Explore agent
✅ Grep pattern → Read TYLKO znalezione pliki
```

### 2. Baza danych
```
❌ Czytaj migracje
✅ mcp__supabase__list_tables lub mcp__supabase__execute_sql
```

### 3. Wzorce kodu
```
❌ Czytaj podobne pliki
✅ Przeczytaj .claude/PATTERNS.md (tylko gdy tworzysz nowy API/component/test)
```

### 4. Debugowanie
```
❌ Czytaj cały stack
✅ Grep błąd → Read TYLKO plik z błędem
```

### 5. Code review
```
❌ /bmad:bmm:workflows:code-review (dla małych zmian)
✅ git diff --stat, git diff [plik]
```

---

## Kiedy czytać PATTERNS.md?

Przeczytaj `.claude/PATTERNS.md` TYLKO gdy:
- [ ] Tworzysz **nowy API endpoint**
- [ ] Tworzysz **nową migrację/RLS**
- [ ] Tworzysz **nowy komponent z Supabase**
- [ ] Piszesz **nowe testy E2E**

W innych przypadkach - NIE czytaj.

---

## BMAD Workflows

### Używaj TYLKO gdy potrzebujesz:
| Workflow | Kiedy |
|----------|-------|
| `workflow-status` | Sprawdzenie statusu projektu |
| `dev-story` | Implementacja całego story |
| `code-review` | Review DUŻYCH zmian (>5 plików) |
| `sprint-planning` | Planowanie sprintu |

### NIE używaj gdy:
- Mała zmiana (1-2 pliki) → po prostu zrób
- Prosty bug fix → po prostu napraw
- Dokumentacja → ręcznie lub `/quick-docs`

---

## Quick Commands (Haiku-friendly)

Dla prostych zadań użyj Haiku:
- `/quick-docs` - Update dokumentacji
- `/quick-test` - Generowanie testów
- `/quick-review` - Szybkie code review

---

## Komunikacja

- Odpowiedzi w **języku polskim**
- **Zwięźle** - bez zbędnych wyjaśnień
- Pokazuj **tylko diff**, nie cały plik
- **Pytaj** zamiast zgadywać

### Dobra odpowiedź:
```
Dodam endpoint.

apps/frontend/src/app/api/products/route.ts:15:
+ export async function POST(req: Request) { ... }

Gotowe.
```

### Zła odpowiedź:
```
Oczywiście! Najpierw przeczytam całą strukturę...
[czyta 10 plików]
Oto pełna implementacja z komentarzami...
[300 linii]
```

---

## Index Plików Projektu

### Dokumentacja
| Plik | Opis |
|------|------|
| `docs/sprint-artifacts/sprint-status.yaml` | Aktualny status wszystkich stories |
| `docs/sprint-artifacts/batch-*/` | Batche z stories |
| `.claude/PATTERNS.md` | Wzorce kodu (API, RLS, Component, Test) |
| `.claude/WORKFLOW-GUIDE.md` | Multi-model workflow (Haiku/Sonnet/Opus) |

### Konfiguracja
| Plik | Opis |
|------|------|
| `apps/frontend/package.json` | Dependencies |
| `playwright.config.ts` | E2E config |
| `supabase/` | Migracje i konfiguracja |

---

**Pamiętaj: Każdy token kosztuje. Pytaj, nie zgaduj. Czytaj minimum.**
