# Struktura Projektu MonoPilot

Ten dokument opisuje strukturę katalogów i plików projektu MonoPilot.

## 📁 Struktura Główna

```
MonoPilot/
├── apps/                          # Aplikacje monorepo
│   ├── backend/                   # Backend (przyszłość)
│   │   └── scripts/               # Skrypty backendowe
│   └── frontend/                  # Aplikacja Next.js 15
├── docs/                          # Dokumentacja projektu
├── packages/                      # Współdzielone pakiety
│   └── shared/                    # Wspólne typy i schematy
├── scripts/                       # Skrypty pomocnicze
├── infra/                         # Konfiguracja infrastruktury
├── attached_assets/               # Zasoby pomocnicze
├── package.json                   # Konfiguracja głównego workspace
├── pnpm-workspace.yaml           # Konfiguracja pnpm workspace
└── pnpm-lock.yaml                # Lockfile zależności
```

## 📱 Frontend (`apps/frontend/`)

### Struktura Aplikacji Next.js

```
apps/frontend/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Grupa routingu autoryzacji
│   │   ├── layout.tsx            # Layout dla stron autoryzacji
│   │   ├── login/                 # Strona logowania
│   │   └── signup/                # Strona rejestracji
│   ├── admin/                     # Panel administracyjny
│   ├── api/                       # API Routes (Next.js)
│   │   ├── audit/                 # Endpointy audytu
│   │   ├── exports/               # Eksport danych (XLSX)
│   │   ├── health/                # Health check
│   │   ├── planning/              # API modułu planowania
│   │   ├── production/            # API modułu produkcji
│   │   ├── scanner/               # API skanera
│   │   └── technical/             # API modułu technicznego
│   ├── bom-history/               # Historia BOM
│   ├── planning/                  # Moduł planowania
│   ├── production/                # Moduł produkcji
│   ├── scanner/                   # Moduł skanera
│   │   ├── pack/                  # Pakowanie
│   │   └── process/                # Przetwarzanie
│   ├── settings/                  # Ustawienia
│   ├── technical/                 # Moduł techniczny
│   │   └── bom/                   # BOM
│   ├── warehouse/                 # Magazyn
│   ├── error.tsx                  # Strona błędów
│   ├── globals.css                # Globalne style CSS
│   ├── layout.tsx                 # Główny layout aplikacji
│   ├── loading.tsx                # Komponent ładowania
│   └── page.tsx                   # Strona główna
├── components/                    # Komponenty React
│   ├── layout/                    # Komponenty layoutu
│   ├── bom/                       # Komponenty BOM
│   ├── scanner/                   # Komponenty skanera
│   ├── lazy/                      # Lazy-loaded komponenty
│   └── [70+ plików .tsx]          # Komponenty funkcjonalne
├── lib/                           # Biblioteki i utilities
│   ├── api/                       # Klienty API
│   │   ├── __tests__/             # Testy API
│   │   ├── allergens.ts           # API alergenów
│   │   ├── asns.ts                # API ASN
│   │   ├── audit.ts               # API audytu
│   │   ├── bomHistory.ts          # API historii BOM
│   │   ├── boms.ts                # API BOM
│   │   ├── config.ts              # Konfiguracja API
│   │   ├── consume.ts             # API konsumpcji
│   │   ├── index.ts                # Eksport główny
│   │   ├── licensePlates.ts       # API tablic rejestracyjnych
│   │   ├── locations.ts           # API lokalizacji
│   │   ├── machines.ts            # API maszyn
│   │   ├── products.ts            # API produktów
│   │   ├── purchaseOrders.ts      # API zamówień zakupowych
│   │   ├── routingOperationNames.ts # API nazw operacji routingu
│   │   ├── routings.ts            # API routingu
│   │   ├── suppliers.ts           # API dostawców
│   │   ├── taxCodes.ts            # API kodów podatkowych
│   │   ├── traceability.ts        # API śledzenia
│   │   ├── transferOrders.ts      # API zleceń transferowych
│   │   ├── users.ts               # API użytkowników
│   │   ├── warehouses.ts          # API magazynów
│   │   ├── workOrders.ts          # API zleceń produkcyjnych
│   │   └── yield.ts               # API wydajności
│   ├── auth/                      # Autoryzacja
│   │   ├── AuthContext.tsx        # Context autoryzacji
│   │   └── auth.ts                # Funkcje autoryzacji
│   ├── hooks/                      # Custom React hooks
│   │   └── useSupabaseData.ts     # Hook do danych Supabase
│   ├── planning/                  # Utilities planowania
│   ├── scanner/                   # Utilities skanera
│   ├── supabase/                  # Konfiguracja Supabase
│   │   ├── migrations/            # Migracje bazy danych
│   │   │   ├── 001_*.sql          # Migracje schematu
│   │   │   ├── 002_*.sql          # Migracje RLS
│   │   │   └── [85+ migracji]     # Historia migracji
│   │   ├── seed/                  # Seed data
│   │   ├── tests/                 # Testy SQL
│   │   ├── client-browser.ts      # Klient Supabase (browser)
│   │   ├── client.ts              # Klient Supabase (server)
│   │   ├── generated.types.ts     # Wygenerowane typy
│   │   ├── middleware.ts           # Middleware Supabase
│   │   ├── schema.sql             # Główny schemat SQL
│   │   └── server.ts              # Server-side Supabase
│   ├── utils/                     # Utilities pomocnicze
│   ├── validation/                 # Walidacja danych
│   ├── exports/                   # Eksport danych
│   ├── clientState.ts             # Stan klienta (state management)
│   ├── shared-types.ts            # Współdzielone typy
│   ├── types.ts                   # Główne typy TypeScript
│   └── toast.tsx                  # Komponent powiadomień
├── __tests__/                     # Testy jednostkowe
│   ├── api/                       # Testy API
│   ├── components/                # Testy komponentów
│   ├── lib/                       # Testy bibliotek
│   ├── purchaseOrders.test.ts    # Testy zamówień zakupowych
│   └── transferOrders.test.ts     # Testy zleceń transferowych
├── e2e/                           # Testy end-to-end (Playwright)
│   ├── accessibility/             # Testy dostępności
│   ├── admin/                     # Testy admina
│   ├── auth/                      # Testy autoryzacji
│   ├── bom/                       # Testy BOM
│   ├── components/                # Testy komponentów
│   ├── error-handling/            # Testy obsługi błędów
│   ├── fixtures/                 # Dane testowe
│   ├── integration/               # Testy integracyjne
│   ├── performance/               # Testy wydajności
│   ├── planning/                  # Testy planowania
│   ├── production/                # Testy produkcji
│   ├── scanner/                   # Testy skanera
│   ├── settings/                  # Testy ustawień
│   ├── utils/                     # Utilities testowe
│   └── warehouse/                 # Testy magazynu
├── scripts/                        # Skrypty pomocnicze
│   └── [43 pliki .js/.ts]         # Różne skrypty
├── tests/                         # Konfiguracja testów
│   ├── global-setup.ts            # Setup globalny
│   └── vitest.setup.ts            # Setup Vitest
├── middleware.ts                   # Next.js middleware
├── next.config.ts                  # Konfiguracja Next.js
├── tailwind.config.ts              # Konfiguracja Tailwind CSS
├── tsconfig.json                   # Konfiguracja TypeScript
├── vitest.config.ts                # Konfiguracja Vitest
├── playwright.config.ts            # Konfiguracja Playwright
├── package.json                    # Zależności projektu
└── vercel.json                     # Konfiguracja Vercel
```

## 📚 Dokumentacja (`docs/`)

```
docs/
├── 01_SYSTEM_OVERVIEW.md           # Przegląd systemu
├── 02_BUSINESS_PROCESS_FLOWS.md    # Procesy biznesowe
├── 03_APP_GUIDE.md                 # Przewodnik aplikacji
├── 04_PLANNING_MODULE.md           # Moduł planowania
├── 05_PRODUCTION_MODULE.md         # Moduł produkcji
├── 06_TECHNICAL_MODULE.md          # Moduł techniczny
├── 07_WAREHOUSE_AND_SCANNER.md     # Magazyn i skaner
├── 08_SETTINGS_AND_CONFIG.md       # Ustawienia i konfiguracja
├── 09_DATABASE_SCHEMA.md           # Schemat bazy danych
├── 10_AI_HELPER_GUIDE.md           # Przewodnik dla AI
├── 11_PROJECT_STRUCTURE.md         # Ten dokument
├── architecture_agent.md            # Dokumentacja architektury
├── qa_agent.md                     # Dokumentacja QA
├── master_bmad.md                  # Master BMAD
├── QUICK_PO_ENTRY_IMPLEMENTATION.md # Implementacja Quick PO
├── archive/                        # Archiwum dokumentacji
│   ├── api/                       # Dokumentacja API
│   ├── modules/                   # Dokumentacja modułów
│   ├── plan/                      # Plany implementacji
│   ├── testing/                   # Dokumentacja testów
│   └── ui/                        # Dokumentacja UI
└── plan/                          # Aktywne plany
```

## 🔧 API Routes (`app/api/`)

### Planning Module
```
app/api/planning/
├── audit/                         # Audyt planowania
├── po/                            # Purchase Orders
│   ├── [id]/                      # Operacje na PO
│   │   ├── approve/               # Zatwierdzanie
│   │   ├── close/                 # Zamykanie
│   │   ├── corrections/            # Korekty
│   │   ├── lines/                 # Linie PO
│   │   ├── reopen/                # Ponowne otwieranie
│   │   └── route.ts               # Główny endpoint
│   ├── line/[lineId]/             # Operacje na linii
│   └── route.ts                   # Lista PO
└── to/                            # Transfer Orders
    ├── [id]/                      # Operacje na TO
    ├── line/[lineId]/             # Operacje na linii
    └── route.ts                   # Lista TO
```

### Production Module
```
app/api/production/
├── pallets/                       # Palety
│   └── [id]/items/                # Przedmioty na palecie
├── trace/                         # Śledzenie
│   ├── backward/                  # Wstecz
│   └── forward/                   # Naprzód
├── wo/                            # Work Orders
│   └── [id]/operations/[seq]/weights/ # Wagi operacji
└── work-orders/                   # Zlecenia produkcyjne
    └── [id]/                      # Operacje na WO
```

### Scanner Module
```
app/api/scanner/
├── lp/[id]/                       # Tablica rejestracyjna
├── pack/[woId]/                   # Pakowanie
│   └── output/                    # Output pakowania
├── pallets/                       # Palety
│   └── [id]/items/                # Przedmioty
├── process/[woId]/                # Przetwarzanie
│   ├── complete-op/[seq]/         # Zakończenie operacji
│   └── operations/[seq]/          # Operacje
│       ├── stage/                  # Etap
│       └── weights/               # Wagi
├── reservations/                  # Rezerwacje
└── wo/[id]/stage-status/          # Status etapu
```

### Technical Module
```
app/api/technical/
└── boms/[id]/                     # BOM operations
    ├── activate/                  # Aktywacja
    ├── archive/                   # Archiwizacja
    ├── clone/                     # Klonowanie
    ├── items/                     # Przedmioty BOM
    └── route.ts                   # Główny endpoint
```

### Exports
```
app/api/exports/
├── consume.xlsx/                  # Eksport konsumpcji
├── license-plates.xlsx/           # Eksport LP
├── stock-moves.xlsx/              # Eksport ruchów magazynowych
├── trace.xlsx/                    # Eksport śledzenia
├── work-orders.xlsx/              # Eksport WO
├── yield-fg.xlsx/                 # Eksport wydajności FG
└── yield-pr.xlsx/                 # Eksport wydajności PR
```

## 🗄️ Migracje Bazy Danych (`lib/supabase/migrations/`)

Migracje są numerowane sekwencyjnie i zawierają:

- **001-033**: Podstawowy schemat i funkcjonalności
- **034-036**: Moduł planowania (Phase 1)
- **038-044**: Reset i przebudowa schematu
- **045-059**: Ulepszenia i nowe funkcjonalności
  - **049-051**: Transfer Orders - daty i akcje
  - **053-059**: Quick PO Entry - implementacja i poprawki
- **060+**: Aktualne migracje

## 📦 Komponenty (`components/`)

### Główne Kategorie Komponentów

- **Modals**: `*Modal.tsx` - Komponenty modalne
- **Tables**: `*Table.tsx` - Komponenty tabel
- **Forms**: Komponenty formularzy
- **Layout**: Komponenty layoutu w `layout/`
- **Scanner**: Komponenty skanera w `scanner/`
- **BOM**: Komponenty BOM w `bom/`

### Przykładowe Komponenty

- `PurchaseOrdersTable.tsx` - Tabela zamówień zakupowych
- `EditPurchaseOrderModal.tsx` - Edycja PO
- `QuickPOEntryModal.tsx` - Szybkie tworzenie PO
- `WorkOrdersTable.tsx` - Tabela zleceń produkcyjnych
- `TransferOrdersTable.tsx` - Tabela zleceń transferowych
- `GRNTable.tsx` - Tabela GRN
- `BomCatalogClient.tsx` - Katalog BOM
- `StageBoard.tsx` - Tablica etapów produkcji

## 🧪 Testy

### Testy Jednostkowe (`__tests__/`)
- Vitest jako framework testowy
- Testy API, komponentów i bibliotek
- Mockowanie Supabase

### Testy E2E (`e2e/`)
- Playwright jako framework testowy
- Testy wszystkich modułów
- Testy dostępności i wydajności
- Testy integracyjne

## 🔐 Konfiguracja

### Pliki Konfiguracyjne

- `next.config.ts` - Konfiguracja Next.js
- `tsconfig.json` - Konfiguracja TypeScript
- `tailwind.config.ts` - Konfiguracja Tailwind CSS
- `vitest.config.ts` - Konfiguracja Vitest
- `playwright.config.ts` - Konfiguracja Playwright
- `vercel.json` - Konfiguracja Vercel
- `package.json` - Zależności i skrypty

### Pliki Środowiskowe

- `.env.local` - Zmienne środowiskowe lokalne
- `.env.production` - Zmienne produkcyjne
- Dokumentacja w `ENVIRONMENT_CONFIG.md`

## 📝 Notatki

### Ważne Pliki Dokumentacyjne w Root

- `DEPLOYMENT_ERRORS_ANALYSIS.md` - Analiza błędów wdrożenia
- `ROUTING_P0_IMPLEMENTATION_SUMMARY.md` - Podsumowanie routingu
- `SETUP_TYPE_CHECKING.md` - Konfiguracja TypeScript

### Ważne Pliki w Frontend

- `DEPLOYMENT_CONFIG.md` - Konfiguracja wdrożenia
- `VERCEL_DEPLOYMENT_GUIDE.md` - Przewodnik Vercel
- `TYPESCRIPT_FIXES.md` - Poprawki TypeScript

## 🚀 Skrypty

### Root Scripts (`scripts/`)
- `start-dev.bat/.ps1` - Uruchomienie dev
- `kill-port-5000.*` - Zabijanie procesu na porcie
- `pre-commit-checks.sh` - Sprawdzanie przed commitem

### Frontend Scripts (`apps/frontend/scripts/`)
- Różne skrypty pomocnicze do migracji, naprawy, etc.

## 📊 Statystyki Projektu

- **Komponenty**: ~70 plików .tsx
- **API Routes**: ~50+ endpointów
- **Migracje DB**: 85+ migracji SQL
- **Testy E2E**: ~100+ testów
- **Moduły**: 5 głównych modułów (Planning, Production, Technical, Warehouse, Scanner)

## 🔄 Monorepo Structure

Projekt używa **pnpm workspace** do zarządzania monorepo:

- `apps/frontend/` - Aplikacja Next.js
- `apps/backend/` - Backend (przyszłość)
- `packages/shared/` - Współdzielone typy i schematy

## 📌 Konwencje Nazewnictwa

- **Komponenty**: PascalCase (`PurchaseOrdersTable.tsx`)
- **API Routes**: kebab-case (`purchase-orders.ts`)
- **Migracje**: `NNN_description.sql` (numerowane sekwencyjnie)
- **Testy**: `*.test.ts` lub `*.spec.ts`
- **Typy**: `types.ts` lub `*.types.ts`

---

**Ostatnia aktualizacja**: 2025-01-08  
**Wersja dokumentu**: 1.0

