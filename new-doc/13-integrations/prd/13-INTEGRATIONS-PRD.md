# PRD 13-Integrations — MonoPilot MES
**Wersja**: 1.0 | **Data**: 2026-02-18 | **Status**: Draft

---

## 1. Executive Summary

Modul Integrations (M13) to warstwa lacznosci MonoPilot MES z systemami zewnetrznymi. Odpowiada za zarzadzanie kluczami API, webhookami, logami integracji, eksportem/importem danych, portalami dostawcow i klientow, synchronizacje z Comarch Optima oraz wymiane EDI (EDIFACT) z partnerami handlowymi.

**Kluczowy differentiator**: Gotowe konektory do Comarch Optima (najpopularniejszy system ksiegowy w Polsce) i EDI EDIFACT (standard europejski) — bez potrzeby zewnetrznego middleware. SMB food manufacturers lacza sie z sieciami handlowymi (Carrefour, Tesco) w kilka godzin zamiast tygodni.

**Status implementacji**: Phase 2 — planowany po zakonczeniu MVP (M01-M08). 30 wymagan funkcjonalnych (FR-INT-001 do FR-INT-030), 18 stories, 3 fazy.

**Zakres dokumentu**: 30 FR rozlozonych na 12 epikow + schemat bazy danych + endpointy API + wzorce integracji.

---

## 2. Objectives

### Cel glowny
Zapewnic MonoPilot MES pelna lacznosc z systemami zewnetrznymi (ERP, EDI, portale) przy zachowaniu bezpieczenstwa, audytowalnosci i niezawodnosci synchronizacji danych.

### Cele szczegolowe
1. **Eliminacja recznego wprowadzania danych** — auto-sync z Comarch Optima eliminuje 80% zduplikowanych wpisow
2. **Zgodnosc EDI** — EDIFACT ORDERS/INVOIC/DESADV dla sieci handlowych
3. **Portale partnerow** — dostawcy i klienci maja self-service bez dostepu do wewnetrznego MES
4. **Pelny audit trail** — kazda integracja logowana z mozliwoscia retry i DLQ
5. **API ecosystem** — klucze API z granularnymi scopami i rate limiting

### Metryki sukcesu

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Sync success rate | > 99% | integration_logs |
| Retry success rate | > 80% | integration_retry_queue |
| Webhook latency (end-to-end) | < 2 s | webhook delivery logs |
| Integration MTTR | < 5 min | czas od bledu do identyfikacji |
| API uptime | 99.5%+ | APM |
| Data export accuracy | 100% | walidacja eksportu vs DB |
| Supplier portal adoption | 5+ dostawcow / org | supplier_portal_users |

---

## 3. Personas

| Persona | Interakcja z Integrations | Kluczowe akcje |
|---------|--------------------------|----------------|
| **Administrator** | Glowny uzytkownik | API keys CRUD, webhooks, Comarch config, EDI setup, logi, portal users |
| **Owner** | Pelne uprawnienia | Jak Admin + rate limit tier, billing |
| **Specjalista IT** | Konfiguracja techniczna | API keys, testowanie webhookow, EDI troubleshooting, retry queue |
| **Kupiec** | Export danych | Eksport PO, produktow, zapasow (CSV/JSON) |
| **Dostawca (zewnetrzny)** | Supplier Portal | Podglad PO, potwierdzenie dostawy |
| **Klient (zewnetrzny)** | Customer Portal | Tracking zamowien, status wysylki |

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP Integrations)

| Obszar | Wymagania | Priorytet |
|--------|-----------|-----------|
| Integration Settings & Dashboard | FR-INT-001 | Must Have |
| API Keys CRUD + Scopes + Rate Limiting | FR-INT-002, 003, 004 | Must Have |
| Webhook Configuration & Events (outbound) | FR-INT-006, 007 | Must Have |
| Integration Logs & Audit Trail | FR-INT-005 | Must Have |
| Data Export (CSV/JSON) | FR-INT-008 | Must Have |
| Supplier Portal (PO view + delivery confirm) | FR-INT-009, 010 | Should Have |
| Comarch Optima Basic (auth + invoice push) | FR-INT-011, 012 | Should Have |

### 4.2 Out of Scope — Phase 2

| Obszar | Wymagania | Uzasadnienie |
|--------|-----------|--------------|
| Customer Portal (order tracking, shipment) | FR-INT-013, 014 | Wymaga M07 Shipping |
| EDI ORDERS (inbound) | FR-INT-015 | Wymaga parsera EDIFACT |
| EDI INVOIC (outbound) | FR-INT-016 | Wymaga M10 Finance |
| EDI DESADV (outbound ASN) | FR-INT-017 | Wymaga M07 Shipping |
| Data Import & Templates (produkty, BOM) | FR-INT-018, 019 | Post-MVP |
| Retry Logic UI & Dead Letter Queue | FR-INT-020, 021 | Rozszerzenie logs |
| Comarch Advanced (chart of accounts, VAT) | FR-INT-022, 023 | Post-MVP |
| Data Export XML | FR-INT-024 | Rozszerzenie eksportu |

### 4.3 Out of Scope — Phase 3 (Enterprise)

| Obszar | Uzasadnienie |
|--------|--------------|
| EDI ORDRSP/RECADV (FR-INT-025, 026) | Zaawansowane typy wiadomosci |
| Comarch Payment Reconciliation (FR-INT-027) | Enterprise |
| Custom Integration Builder (FR-INT-028) | Low-code connectors |
| API Marketplace (FR-INT-029) | Partner ecosystem |
| Bi-directional Webhooks (FR-INT-030) | Enterprise |

### 4.4 Exclusions (Nigdy)

- **Zastepowanie ERP** — MonoPilot to MES, nie pelny ERP
- **Przetwarzanie platnosci** — domena systemu ksiegowego
- **CRM** — osobna kategoria oprogramowania
- **Formaty wlascicielskie** — tylko otwarte standardy (EDIFACT, CSV, JSON, XML)

---

## 5. Constraints

### Techniczne
- **Multi-tenant RLS**: `org_id UUID NOT NULL` na WSZYSTKICH tabelach integracji (ADR-013)
- **Service Role**: API routes filtrowane po org_id; klucze API maja scope-based access
- **Rate Limiting**: Redis counter per API key; tiery: basic/standard/premium
- **Supabase Edge Functions**: webhook delivery i EDI polling jako background jobs
- **Szyfrowanie**: Comarch API secrets — AES-256 at rest; API keys — bcrypt hash (cost: 12)

### Biznesowe
- Comarch Optima = primary ERP target (najpopularniejszy w Polsce)
- EDI VAN = koszt po stronie klienta (MonoPilot nie hostuje VAN)
- Portal users = oddzielna baza od MonoPilot users (izolacja bezpieczenstwa)
- Freemium: podstawowy eksport darmowy; API keys + webhooks + EDI = premium

### Regulacyjne
- Audit trail na WSZYSTKICH operacjach integracji (ADR-008)
- GDPR: anonimizacja danych w logach po retention period
- Maskowanie danych wrazliwych w request/response body logow
- Retencja logow: 90 dni (konfigurowalna per org)

---

## 6. Decisions

### D-INT-1. API Keys + Scopes Model (nie OAuth)
API Key authentication (Bearer token) zamiast OAuth2. Uzasadnienie: prostsze dla SMB food manufacturers, nie potrzebuja flow OAuth. Klucz hashowany bcrypt (cost: 12), wyswietlany RAZ przy tworzeniu. Scopes granularne: `read:products`, `write:orders`, `read:inventory`, `webhook:manage` itd. Write scope automatycznie zawiera read.

### D-INT-2. Rate Limiting Strategy
Redis counter per API key z trzema tierami:
- **Basic**: 60 req/min, 1000/h, burst 10
- **Standard**: 300 req/min, 10000/h, burst 50
- **Premium**: 1000 req/min, 50000/h, burst 200

Odpowiedz 429 z headerami `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`. IP whitelist bypass opcjonalny.

### D-INT-3. Audit Trail per Integration
Kazda operacja integracji logowana do `integration_logs`: timestamp, typ, kierunek, status, request/response body (maskowane dane wrazliwe), czas trwania, API key, webhook_id. Partycjonowanie monthly. Retencja 90 dni.

### D-INT-4. Retry/DLQ Pattern
Trzy polityki retry: **immediate** (3x, 5s delay), **exponential** (5x: 5s, 30s, 5m, 30m, 2h), **manual** (brak auto-retry). Po wyczerpaniu retries — przeniesienie do Dead Letter Queue. DLQ retencja: 30 dni. Admin moze: view, retry, skip, delete.

### D-INT-5. Comarch Optima jako Primary ERP
Comarch Optima API v2 jako pierwsza integracja ERP. Mapowanie pol: invoice_number → NumerDokumentu, customer.tax_id → Kontrahent.NIP, line_items → Pozycje. Test mode obowiazkowo przed produkcja. Auto-sync (codziennie o 2:00) w Phase 2.

### D-INT-6. EDI Standards (EDIFACT)
Standard EDIFACT (nie X12) — dominujacy w Europie/Polsce. Typy wiadomosci:
- **ORDERS** (inbound) — zamowienia od klientow
- **INVOIC** (outbound) — faktury sprzedazowe
- **DESADV** (outbound) — awizo wysylki (ASN)
- **ORDRSP** (outbound, Phase 3) — potwierdzenie zamowienia
- **RECADV** (inbound, Phase 3) — potwierdzenie odbioru

Polling EDI mailbox co 5 min. VAN provider po stronie klienta.

### D-INT-7. RLS/org_id na WSZYSTKICH tabelach
Wszystkie tabele integracji: `org_id UUID NOT NULL REFERENCES organizations(id)`. RLS policies analogiczne do ADR-013. Portal users izolowani przez org_id + supplier_id/customer_id. Cross-tenant → 404.

### D-INT-8. Webhook Security (HMAC Signing)
HMAC-SHA256 podpis na kazdym webhook payload. Secret generowany automatycznie per webhook. Headery: `X-MonoPilot-Signature: sha256=<hmac>`, `X-MonoPilot-Event`, `X-MonoPilot-Delivery-ID`. HTTPS wymagany. Timeout: 30s. Success = HTTP 2xx.

### D-INT-9. Portal Users — oddzielna baza
Supplier/Customer portal users NIE sa w tabeli `users` MonoPilot. Oddzielne tabele: `supplier_portal_users`, `customer_portal_users`. Session-based auth (nie JWT). Izolacja: portal user widzi TYLKO dane swojego dostawcy/klienta w kontekscie org_id. Zero dostepu do wewnetrznych danych MES.

### D-INT-10. site_id na tabelach integracji
`site_id UUID NULL` na tabelach: `integration_api_keys`, `comarch_optima_config`, `edi_config`. NULL do M11 Multi-Site. Umozliwia site-level konfiguracje integracji w przyszlosci.

---

## 7. Module Map

```
Integrations (M13)
├── E13.1 — Integration Settings & Dashboard [Phase 1]
│   ├── Health status cards (Comarch, EDI, API Keys, Webhooks)
│   ├── Activity feed (last 20 events)
│   └── Error summary (failed syncs, pending retries, DLQ count)
├── E13.2 — API Keys & Scopes Management [Phase 1]
│   ├── API Keys CRUD (create, view masked, edit, suspend, revoke, regenerate)
│   ├── Scopes (granularne per zasob: read/write)
│   └── Rate Limiting (3 tiery, Redis counter)
├── E13.3 — Webhook Configuration & Events [Phase 1]
│   ├── Webhooks CRUD (URL, events, secret, retry policy)
│   ├── Test webhook (sample payload)
│   ├── Delivery logs (last 100 per webhook)
│   └── HMAC-SHA256 signing
├── E13.4 — Integration Logs & Audit Trail [Phase 1]
│   ├── Logi integracji (filtrowane: typ, status, system, zakres dat)
│   ├── Statystyki (success rate, avg duration)
│   └── Full-text search w request/response
├── E13.5 — Data Export (CSV/JSON/XML) [Phase 1 + Phase 2]
│   ├── Phase 1: Export produktow, zamowien, zapasow (CSV, JSON)
│   ├── Phase 2: XML export + async dla duzych plikow (>10k wierszy)
│   └── Pliki wygasaja po 24h
├── E13.6 — Data Import & Templates [Phase 2]
│   ├── Import produktow (CSV template + walidacja + preview + conflict handling)
│   └── Import BOM (CSV template + wersjonowanie)
├── E13.7 — Supplier Portal (Comarch basic) [Phase 1]
│   ├── Portal dostawcy (login email+haslo, lista PO, szczegoly PO)
│   ├── Potwierdzenie dostawy (qty per linia, delivery note, PDF upload)
│   └── Comarch Optima basic (auth setup, test connection, invoice push)
├── E13.8 — Customer Portal [Phase 2]
│   ├── Portal klienta (login email+haslo lub magic link)
│   ├── Order tracking (status, production progress)
│   └── Shipment tracking (carrier, tracking number, timeline)
├── E13.9 — EDI (ORDERS/INVOIC/DESADV) [Phase 2]
│   ├── EDI config (mailbox, VAN provider, message types)
│   ├── ORDERS inbound (parse → validate → create SO)
│   ├── INVOIC outbound (generate EDIFACT → send)
│   └── DESADV outbound (ASN z batch/expiry)
├── E13.10 — Comarch Advanced [Phase 2]
│   ├── Chart of Accounts sync (pull GL accounts, bi-directional)
│   ├── VAT Reports (JPK_VAT v7, VAT-7, VAT-UE)
│   └── Auto-sync (daily at 2:00)
├── E13.11 — Retry Logic & DLQ [Phase 2]
│   ├── Retry Queue UI (lista, retry now, skip, bulk actions)
│   └── Dead Letter Queue (permanent failures, manual fix & retry)
└── E13.12 — API Marketplace + Bi-directional Webhooks [Phase 3]
    ├── Custom Integration Builder (low-code connectors)
    ├── Partner API Marketplace (public directory)
    └── Bi-directional webhooks (inbound + outbound)
```

---

## 8. Requirements

### E13.1 — Integration Settings & Dashboard (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `integration_api_keys` | org_id, name, key_value_hash, scopes (JSONB), status, rate_limit_tier, expires_at, last_used_at, created_by | Org-scoped | bcrypt hash |
| `integration_webhooks` | org_id, name, url, events (JSONB), status, secret, retry_policy, max_retries, custom_headers | Org-scoped | HTTPS required |
| `integration_logs` | org_id, timestamp, integration_type, event_type, direction, status, http_status, request_body, response_body, error_message, api_key_id, webhook_id, external_system, retry_count, duration_ms | Org-scoped | Partycjonowana monthly |
| `integration_retry_queue` | org_id, log_id, retry_count, max_retries, next_retry_at, status, error_message | Org-scoped | |

**API Endpoints:**
- `GET /api/integrations/dashboard` — health status, recent activity, error summary
- `GET /api/integrations/logs` — lista logow (paginacja, filtry: typ, status, system, date range)
- `GET /api/integrations/logs/:id` — szczegoly logu
- `GET /api/integrations/logs/stats` — statystyki (success rate, avg duration)

**Validation (Zod):**
- `integrationLogFilterSchema`: date_from/to, status enum, integration_type enum, page, limit

**Frontend/UX:**
- INT-001: Dashboard (health cards, activity feed, error alerts)
- INT-003: Integration Logs (tabela z expandable rows, filtry, search)

**Wymagania FR:** FR-INT-001 (dashboard), FR-INT-005 (logs)

---

### E13.2 — API Keys & Scopes Management (Phase 1)

**Backend:** Tabela `integration_api_keys` (patrz E13.1).

**API Endpoints:**
- `GET/POST /api/integrations/api-keys` — lista / tworzenie klucza
- `GET/PUT/DELETE /api/integrations/api-keys/:id` — szczegoly / edycja / revoke
- `POST /api/integrations/api-keys/:id/regenerate` — regeneracja klucza
- `POST /api/integrations/api-keys/:id/suspend` — zawieszenie
- `POST /api/integrations/api-keys/:id/activate` — reaktywacja

**Scopes:**
- `read:products`, `write:products`, `read:orders`, `write:orders`, `read:inventory`, `write:inventory`, `read:production`, `write:production`, `read:shipping`, `webhook:manage`
- Min. 1 scope wymagany. Write zawiera read automatycznie.

**Validation (Zod):**
- `apiKeyCreateSchema`: name 2-100 chars, scopes array non-empty, expires_at optional timestamp
- `apiKeyUpdateSchema`: name, scopes, expires_at (partial)

**Frontend/UX:**
- INT-002: API Keys list + create modal (scope selector checkboxes, rate limit tier)

**Wymagania FR:** FR-INT-002 (CRUD), FR-INT-003 (scopes), FR-INT-004 (rate limiting)

---

### E13.3 — Webhook Configuration & Events (Phase 1)

**Backend:** Tabela `integration_webhooks` (patrz E13.1).

**API Endpoints:**
- `GET/POST /api/integrations/webhooks` — lista / tworzenie
- `GET/PUT/DELETE /api/integrations/webhooks/:id` — szczegoly / edycja / usuniecie
- `POST /api/integrations/webhooks/:id/test` — wyslanie sample payload
- `PATCH /api/integrations/webhooks/:id` — zmiana statusu (active/paused)
- `GET /api/integrations/webhooks/:id/logs` — delivery logs (ostatnie 100)

**Webhook Events:**

| Event | Trigger | Payload |
|-------|---------|---------|
| `order.created` | Nowe PO | PO details |
| `order.updated` | Zmiana statusu PO | PO + changes |
| `workorder.started` | Start WO | WO details |
| `workorder.completed` | Zakonczenie WO | WO + output |
| `shipment.dispatched` | Wysylka | Shipment + tracking |
| `inventory.low` | Zapas < reorder point | Product + qty |
| `product.created` | Nowy produkt | Product details |

**Delivery flow:** Event → find active webhooks → build JSON → HMAC-SHA256 sign → POST (30s timeout) → log → retry if failed.

**Validation (Zod):**
- `webhookCreateSchema`: name 2-100, url HTTPS required, events array non-empty, retry_policy enum, max_retries 1-10

**Frontend/UX:**
- INT-004: Webhooks list + create/edit modal (event selector, test button)

**Wymagania FR:** FR-INT-006 (config), FR-INT-007 (events outbound)

---

### E13.4 — Integration Logs & Audit Trail (Phase 1)

Objete przez E13.1 (logi sa czescia dashboardu). Szczegolowa implementacja:

- **Filtry**: date range (domyslnie 7 dni), status (success/warning/error), integration_type (api/webhook/edi/comarch/import/export), external_system, event_type
- **Search**: full-text w request_body / response_body, search po reference ID (np. numer PO)
- **Retencja**: 90 dni aktywne, archiwum cold storage po 30 dniach
- **Maskowanie**: hasla, tokeny, sekrety w logach zastapione `***`
- **Partycjonowanie**: monthly na tabeli `integration_logs`

**Wymagania FR:** FR-INT-005

---

### E13.5 — Data Export CSV/JSON/XML (Phase 1 CSV/JSON, Phase 2 XML)

**Exportowalne encje:**

| Encja | Formaty Phase 1 | Filtry |
|-------|-----------------|--------|
| Products + BOMs | CSV, JSON | all / active only |
| Purchase Orders | CSV, JSON | date range, status |
| Work Orders | CSV, JSON | date range, status |
| Inventory (stock levels) | CSV, JSON | warehouse, location |
| Shipments | CSV, JSON | date range |
| Suppliers | CSV, JSON | all |

**API Endpoints:**
- `POST /api/integrations/export/products` — eksport produktow
- `POST /api/integrations/export/orders` — eksport zamowien
- `POST /api/integrations/export/inventory` — eksport zapasow
- `POST /api/integrations/export/shipments` — eksport wysylek
- `GET /api/integrations/export/:id/status` — status joba
- `GET /api/integrations/export/:id/download` — pobranie pliku

**CSV**: UTF-8 z BOM (kompatybilnosc Excel), naglowki w pierwszym wierszu, daty YYYY-MM-DD.
**JSON**: Pretty-printed, ISO 8601 timestamps, zagniezdzone obiekty zachowane.
**XML** (Phase 2): Custom schema z XSD do walidacji.
**Async**: dla > 10k wierszy — job w tle, email z linkiem, pliki wygasaja po 24h.

**Frontend/UX:**
- INT-005: Export modal (entity selector, format, filtry, progress indicator)

**Wymagania FR:** FR-INT-008 (CSV/JSON), FR-INT-024 (XML, Phase 2)

---

### E13.6 — Data Import & Templates (Phase 2)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `import_jobs` | org_id, data_type (products/boms), file_name, status, total_rows, imported_count, skipped_count, error_count, error_details (JSONB) | Async processing |

**API Endpoints:**
- `GET /api/integrations/import/products/template` — pobranie template CSV
- `POST /api/integrations/import/products/validate` — walidacja pliku
- `POST /api/integrations/import/products/execute` — wykonanie importu
- `GET /api/integrations/import/boms/template` — template BOM
- `POST /api/integrations/import/boms/validate` — walidacja BOM
- `POST /api/integrations/import/boms/execute` — wykonanie importu BOM

**Conflict handling**: skip / update / ask per row. Max 10k wierszy per plik.

**Frontend/UX:**
- INT-009: Import wizard (upload → validate → preview 10 rows → confirm → progress)

**Wymagania FR:** FR-INT-018 (products), FR-INT-019 (BOMs)

---

### E13.7 — Supplier Portal + Comarch Basic (Phase 1)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `supplier_portal_users` | org_id, supplier_id, email (unique), password_hash, name, status, last_login_at | Oddzielna od users |
| `comarch_optima_config` | org_id, enabled, api_url, api_key, api_secret_encrypted (AES-256), company_code, test_mode, auto_sync, last_sync_at | 1 rekord per org |

**API Endpoints — Supplier Portal (public):**
- `POST /api/portal/supplier/login` — logowanie dostawcy
- `GET /api/portal/supplier/orders` — lista PO dla dostawcy
- `GET /api/portal/supplier/orders/:id` — szczegoly PO
- `POST /api/portal/supplier/orders/:id/confirm` — potwierdzenie dostawy (qty per linia, delivery note, PDF)

**API Endpoints — Comarch:**
- `GET/PUT /api/integrations/comarch/config` — konfiguracja
- `POST /api/integrations/comarch/test` — test polaczenia
- `POST /api/integrations/comarch/push-invoice` — push faktury

**Supplier Portal restrictions:** Read-only PO. Brak dostepu do MES. Widzi TYLKO swoje PO. Walidacja: delivered_qty <= ordered_qty (warning > 110%).

**Frontend/UX:**
- INT-006: Supplier Portal (login, PO list, PO detail, confirm delivery modal)
- INT-011: Comarch Optima config (formularz, test button, sync status)

**Wymagania FR:** FR-INT-009 (PO view), FR-INT-010 (delivery confirm), FR-INT-011 (invoice push), FR-INT-012 (auth setup)

---

### E13.8 — Customer Portal (Phase 2)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `customer_portal_users` | org_id, customer_id, email (unique), password_hash, name, status, last_login_at | Magic link opcjonalny |

**API Endpoints (public):**
- `POST /api/portal/customer/login` — logowanie klienta
- `GET /api/portal/customer/orders` — lista zamowien
- `GET /api/portal/customer/orders/:id` — szczegoly zamowienia + production progress
- `GET /api/portal/customer/shipments/:id` — tracking wysylki (carrier, tracking number, status)

**Frontend/UX:**
- INT-007: Customer Portal (login, order list, order detail, shipment timeline)

**Wymagania FR:** FR-INT-013 (order tracking), FR-INT-014 (shipment status)

---

### E13.9 — EDI (ORDERS/INVOIC/DESADV) (Phase 2)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `edi_config` | org_id, enabled, edi_mailbox, van_provider, message_types (JSONB), test_mode | 1 per org |
| `edi_messages` | org_id, direction, message_type, message_content (TEXT), status, partner_id, reference_id, error_message, acknowledgment_sent_at, processed_at | Inbound + outbound |

**API Endpoints:**
- `GET/PUT /api/integrations/edi/config` — konfiguracja EDI
- `GET /api/integrations/edi/inbox` — wiadomosci przychodzace
- `GET /api/integrations/edi/outbox` — wiadomosci wychodzace
- `POST /api/integrations/edi/send` — wyslanie wiadomosci EDI
- `POST /api/integrations/edi/process/:id` — przetworzenie wiadomosci przychodacej

**EDI ORDERS (inbound) flow:** Polling mailbox co 5 min → parse EDIFACT → walidacja (customer, products, dates) → create SO lub "pending review" → log → ORDRSP (Phase 3).

**EDI INVOIC/DESADV (outbound) flow:** Trigger z MonoPilot (faktura/wysylka) → mapowanie pol → generacja EDIFACT → wyslanie do VAN → log.

**Mapowania EDIFACT → MonoPilot:** BGM → order_number, DTM → date, NAD+BY → customer_id, LIN → line_item, QTY → qty, IMD → product_code.

**Frontend/UX:**
- INT-008: EDI inbox/outbox (lista wiadomosci, status, szczegoly)

**Wymagania FR:** FR-INT-015 (ORDERS inbound), FR-INT-016 (INVOIC outbound), FR-INT-017 (DESADV outbound)

---

### E13.10 — Comarch Advanced (Phase 2)

**API Endpoints:**
- `POST /api/integrations/comarch/sync-accounts` — sync chart of accounts
- `GET /api/integrations/comarch/vat-report` — generowanie raportu VAT

**Chart of Accounts sync:** Pull GL accounts z Optima → mapowanie na cost centers MonoPilot. Manual sync button + scheduled daily (2:00).

**VAT Reports:** JPK_VAT (schema v7), VAT-7 (miesiczny), VAT-UE (EU). Generacja XML → walidacja schema → download → upload do Optima lub urzedu skarbowego.

**Wymagania FR:** FR-INT-022 (chart of accounts), FR-INT-023 (VAT reports)

---

### E13.11 — Retry Logic & DLQ (Phase 2)

**API Endpoints:**
- `GET /api/integrations/retry-queue` — lista retry queue
- `POST /api/integrations/retry-queue/:id/retry` — retry teraz
- `POST /api/integrations/retry-queue/:id/skip` — przenies do DLQ
- `POST /api/integrations/retry-queue/bulk-retry` — retry wielu naraz

**Retry Queue:** Events z retry_count < max_retries. Kolumny: timestamp, typ, system, blad, retry count, next retry at. Akcje: retry now, skip, view logs.

**Dead Letter Queue:** Events po max retries lub manual skip. Kolumny: timestamp, typ, system, blad, akcje (view, retry, delete). Retencja: 30 dni, auto-delete.

**Frontend/UX:**
- INT-010: Retry Queue + DLQ (tabele z akcjami, bulk operations)

**Wymagania FR:** FR-INT-020 (retry UI), FR-INT-021 (DLQ)

---

### E13.12 — API Marketplace + Bi-directional Webhooks (Phase 3)

**Custom Integration Builder:** Low-code interfejs do tworzenia konektorow. Trigger → Transform → Action. Marketplace: publiczny katalog integracji. Bi-directional webhooks: inbound + outbound.

**Wymagania FR:** FR-INT-028 (builder), FR-INT-029 (marketplace), FR-INT-030 (bi-directional)

---

## 9. KPIs

### Operacyjne Integrations

| KPI | Cel | Pomiar |
|-----|-----|--------|
| Sync success rate (24h) | > 99% | integration_logs status=success / total |
| Retry success rate | > 80% | retry_queue succeeded / total |
| Webhook delivery P95 | < 2 s | webhook delivery logs duration_ms |
| API response P95 | < 500 ms | APM |
| Export generation (10k rows) | < 30 s | export job metrics |
| EDI processing per message | < 10 s | edi_messages processing time |
| Comarch sync per invoice | < 5 s | integration_logs comarch type |

### Biznesowe Integrations

| KPI | Cel | Pomiar |
|-----|-----|--------|
| Active API keys per org | >= 1 w 30 dni | integration_api_keys |
| Active webhooks per org | >= 2 | integration_webhooks |
| Supplier portal logins / tydzien | > 10 | supplier_portal_users.last_login |
| DLQ overflow events | < 50 / org | integration_retry_queue |
| Integration MTTR | < 5 min | czas blad → identyfikacja |

---

## 10. Risks

| Ryzyko | Prawdop. | Wplyw | Mitygacja |
|--------|----------|-------|-----------|
| Comarch API changes/downtime | Srednie | Wysoki | Adapter pattern, test mode, health checks, graceful degradation |
| EDI format compliance | Srednie | Wysoki | EDIFACT parser z walidacja, test z VAN provider, sample messages |
| Webhook delivery failures | Srednie | Sredni | Exponential retry, DLQ, alerting < 90% success rate |
| Rate limiting complexity | Niskie | Sredni | Redis proven solution, per-key counters, clear error messages |
| Security API keys | Srednie | Krytyczny | bcrypt hash, shown once, scopes, suspension, audit trail |
| DLQ overflow | Niskie | Sredni | Auto-delete 30 dni, alerting > 50 items, bulk actions |
| Portal users credential leak | Niskie | Wysoki | Oddzielna baza, bcrypt, session-based, 2FA Phase 2 |
| Import data corruption | Srednie | Sredni | Walidacja + preview + dry run, conflict handling, rollback |

### Tech Debt (Integrations-specific)
- **P1**: Brak idempotency keys na API endpoints (ryzyko duplikatow)
- **P1**: Brak circuit breaker dla Comarch/EDI (kaskadowe awarie)
- **P2**: integration_logs bez partycjonowania do MVP (ok do ~100K records)
- **P2**: Webhook delivery synchroniczne (async queue w Phase 2)

---

## 11. Success Criteria

### Funkcjonalne (Phase 1)
- [ ] API Keys CRUD z granularnymi scopami i rate limiting
- [ ] Webhooks: konfiguracja, test, delivery z HMAC-SHA256
- [ ] Integration logs: filtrowane, searchable, masked sensitive data
- [ ] Data export CSV/JSON dla produktow, zamowien, zapasow
- [ ] Supplier Portal: login, PO list, PO detail, delivery confirmation
- [ ] Comarch Optima: auth setup, test connection, invoice push
- [ ] Integration Dashboard: health status, activity feed, error summary

### Niefunkcjonalne
- [ ] RLS: 0 cross-tenant leaks w tabelach integracji
- [ ] API P95 < 500 ms
- [ ] Webhook delivery P95 < 2 s
- [ ] Export < 30 s dla 10k wierszy
- [ ] Rate limiting dziala poprawnie (429 + headery)
- [ ] Audit trail 100% operacji integracji

### Biznesowe
- [ ] 5+ dostawcow korzysta z portalu per org
- [ ] Comarch Optima invoices syncing > 95% success
- [ ] 0 bugow Critical/High w Integrations

---

## 12. References

### Dokumenty zrodlowe
- Foundation PRD → `new-doc/00-foundation/prd/00-FOUNDATION-PRD.md`
- Poprzedni Integrations PRD (v1.0) → `new-doc/13-integrations/prd/integrations.md`
- Integrations Analysis → `new-doc/13-integrations/ANALYSIS.md`
- Integrations Architecture → `new-doc/13-integrations/decisions/integrations-arch.md`
- PRD Update List (77 items) → `new-doc/_meta/PRD-UPDATE-LIST.md`
- Design Guidelines → `new-doc/_meta/DESIGN-GUIDELINES.md`

### ADR (Integrations-relevant)
- ADR-003: Multi-Tenancy RLS → `new-doc/00-foundation/decisions/`
- ADR-008: Audit Trail Strategy → `new-doc/01-settings/decisions/`
- ADR-013: RLS Org Isolation Pattern → `new-doc/00-foundation/decisions/`
- ADR-016: CSV Parser → `new-doc/00-foundation/decisions/`
- Integrations Architecture → `new-doc/13-integrations/decisions/integrations-arch.md`

### Implementation artifacts
- Stories 11.1–11.18 → `new-doc/13-integrations/stories/`
- UX Wireframes INT-001–INT-012 → `new-doc/13-integrations/ux/`
- Story Context YAML → `new-doc/13-integrations/stories/context/`
- Implementation Roadmap → `new-doc/13-integrations/stories/IMPLEMENTATION-ROADMAP.yaml`

### Database schema
- Core: `integration_api_keys`, `integration_webhooks`, `integration_logs`, `integration_retry_queue`
- Portals: `supplier_portal_users`, `customer_portal_users`
- External: `comarch_optima_config`, `edi_config`, `edi_messages`
- Phase 2: `import_jobs`

### FR Coverage Summary
- **Phase 1**: 12 FR (FR-INT-001 do FR-INT-012)
- **Phase 2**: 12 FR (FR-INT-013 do FR-INT-024)
- **Phase 3**: 6 FR (FR-INT-025 do FR-INT-030)
- **Total**: 30 wymagan

---

_PRD 13-Integrations v1.0 — 12 epikow (7 Phase 1 + 4 Phase 2 + 1 Phase 3), 30 wymagan, 10 decyzji Integrations-specific._
_Wyjasnienia: API Keys (nie OAuth), EDIFACT (nie X12), Comarch Optima primary, portale oddzielna baza, HMAC-SHA256, retry exponential + DLQ, site_id NULL._
_Data: 2026-02-18_
