# Repository Guidelines

## Struktura projektu i modułów

- Monorepo na `pnpm workspaces`.
- `apps/frontend`: Next.js 15 + TypeScript (główna aplikacja UI).
- `packages/shared`: współdzielone typy/schematy TS (zod).
- `infra`: `docker-compose` (Postgres, Redis, Nginx; kontener frontend).
- `scripts`: skrypty pomocnicze (start dev, zwalnianie portu, runner E2E).
- Dokumentacja: kluczowe pliki w `docs/` (np. `11_PROJECT_STRUCTURE.md`, `API_REFERENCE.md`).

## Budowanie, testy i uruchamianie

- Instalacja: `pnpm install`
- Dev: `pnpm dev` lub `pnpm frontend:dev` (Next na `:5000`).
- Build/Start: `pnpm build` / `pnpm frontend:start`.
- Lint/format: `pnpm lint`, `pnpm lint:fix`, `pnpm format`, `pnpm format:check`.
- Typy: `pnpm type-check`; Supabase typy: `pnpm gen-types` (wymaga CLI i env).
- Testy: `pnpm test` (unit + krytyczne E2E), `pnpm test:unit`, `pnpm test:e2e:critical`.
- Pełne E2E/UI: `cd apps/frontend && pnpm test:e2e` lub `pnpm test:e2e:ui`.
- Windows: `scripts/start-dev.(bat|ps1)`, `scripts/kill-port-5000.(bat|ps1)`.

## Styl kodu i nazewnictwo

- `.editorconfig`: LF, 2 spacje; Prettier: 80 kolumn, średniki, pojedyncze cudzysłowy.
- ESLint: `next/core-web-vitals` + reguły TS; w frontendzie ostrzeżenia blokowane (`--max-warnings=0`).
- Nazwy: komponenty React PascalCase (`UserMenu.tsx`), hooki/moduły camelCase (`useAuth.ts`).
- Importy: preferuj alias `@/...` w frontendzie.

## Testowanie

- Unit: Vitest (`pnpm test:unit`), setup `apps/frontend/tests/vitest.setup.ts`.
- E2E: Playwright w `apps/frontend/e2e/*`; seed: `pnpm test:e2e:seed` (jeśli potrzebny).
- Pokrycie: cel ≥70% dla nowo/zmienionego kodu (zgodnie z progami w repo).

## Commity i Pull Requesty

- Konwencja: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`) ze scope (np. `feat(api): ...`).
- PR: opis celu/zakresu, powiązane issues, screenshoty UI. Checklist: `pnpm type-check`, `pnpm lint`, `pnpm test`, oraz (jeśli dotyczy) `pnpm test:e2e:critical`.
- Hooki: Husky uruchamia pre-commit i pre-push.
- Szablon PR: `.github/pull_request_template.md` (BMAD gates + minimal pass).

## BMAD: ramy pracy i jakość

- Stosujemy BMAD/BMM: `docs/BMAD_USAGE.md`, `.bmad/bmm/docs/*`.
- Komendy: `pnpm bmad:status`, `pnpm bmad:list`, `pnpm bmad:update`, lub `pnpm bmad <cmd>`.
- Workflow i bramki jakości: `docs/master_bmad.md` (QG‑DB, QG‑UI, QG‑PROC, itp.).

## Checklisty PR (BMAD Quality Gates)

- QG‑AUDIT → `docs/12_NIESPOJNOSCI_FIX_CHECKLIST.md`. Minimal pass: P0 zidentyfikowane i rozwiązane lub uzasadnione N/A.
- QG‑DB → `docs/09_DATABASE_SCHEMA.md`. Minimal pass: migracja + aktualizacja dokumentacji; PK/FK/indeksy i RLS zgodne.
- QG‑UI → `docs/03_APP_GUIDE.md`. Minimal pass: lint + type‑check bez ostrzeżeń, brak błędów w konsoli, krytyczne E2E zielone, kontrakt typów zgodny.
- QG‑PROC → `docs/02_BUSINESS_PROCESS_FLOWS.md`. Minimal pass: `pnpm test:e2e:critical` zielone; seed aktualny.
- QG‑TECH → `docs/06_TECHNICAL_MODULE.md`. Minimal pass: pola/relacje, routing, UoM zgodne; kluczowe ścieżki zweryfikowane.
- QG‑WH → `docs/07_WAREHOUSE_AND_SCANNER.md`. Minimal pass: Receive/Moves/Split/Merge/Pack przejrzane; ścieżki krytyczne zweryfikowane.

## Bezpieczeństwo i konfiguracja

- Nie commituj sekretów. Używaj `apps/frontend/.env.local` (szczegóły w `scripts/RUN_APP.md`).
- Wymagania: Node ≥ 20, pnpm ≥ 8.
