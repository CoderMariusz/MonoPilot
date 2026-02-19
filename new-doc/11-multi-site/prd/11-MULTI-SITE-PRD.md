# PRD 11-Multi-Site -- MonoPilot MES
**Wersja**: 1.0 | **Data**: 2026-02-18 | **Status**: Draft

---

## 1. Executive Summary

Modul Multi-Site (M11) wprowadza obsluge wielu zakladow produkcyjnych w ramach jednej organizacji MonoPilot. Kluczowy przypadek uzycia: FORZ + KOBE jako 2 site'y w 1 org, ze wspoldzielonymi danymi podstawowymi (produkty, BOM, dostawcy) i izolowanymi danymi operacyjnymi (inventory, WO, LP) na poziomie site.

**Problem**: MonoPilot jest obecnie single-site per organizacja (org_id only). Klienci z wieloma zakladami (np. FORZ + KOBE) nie moga skutecznie zarzadzac operacjami miedzy lokalizacjami -- brak transferow miedzyzakladowych, brak raportow per site, brak izolacji danych operacyjnych.

**Rozwiazanie**: Aktywacja `site_id UUID NULL` (juz obecnego retroaktywnie na WSZYSTKICH tabelach) jako pelnego wymiaru izolacji. Model `org_id + site_id` z backward-compatible migration, feature flag activation i TO jako mostem miedzyzakladowym.

**Competitive context**: Wszyscy 4 konkurenci (AVEVA, Plex, Aptean, CSB) maja multi-site support. Single-site pokrywa 80% rynku SMB, ale multi-site jest wymagany dla klientow 50-500 pracownikow.

**Faza**: Phase 2 (aktywacja site_id). Zalezy od: M01 Settings, M03 Warehouse.

---

## 2. Objectives

### Cel glowny
Umozliwic organizacjom z wieloma zakladami produkcyjnymi zarzadzanie operacjami per site z centralnym master data i skonsolidowanym raportowaniem.

### Cele szczegolowe
1. **Site isolation** -- dane operacyjne (inventory, WO, LP, machines) izolowane per site
2. **Shared master data** -- produkty, BOM, dostawcy, klienci wspoldzielone na poziomie org
3. **Inter-site transfers** -- TO jako most miedzyzakladowy z pelnym sledzeniem
4. **Site-scoped reporting** -- raporty z filtrem site + widok skonsolidowany
5. **Backward compatibility** -- istniejace single-site deployments dzialaja bez zmian (site_id NULL = "default site")

### Metryki sukcesu

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Cross-site transfer time (draft to received) | < 48h | transfer_orders timestamps |
| Site data isolation accuracy | 100% | RLS audit tests |
| Report filtering accuracy (site-scoped) | 100% | Automated report tests |
| Backward compatibility | 0 regresji | CI/CD test suite |
| Site switcher latency | < 500 ms | APM |
| User adoption (multi-site orgs) | > 80% w 30 dni | Analytics |

---

## 3. Personas

| Persona | Interakcja z Multi-Site | Kluczowe akcje |
|---------|------------------------|----------------|
| **Owner/Admin** | Glowny konfiguracja | Tworzenie sites, przypisywanie userow, konfiguracja site settings |
| **Kierownik zakladu** | Codzienny uzytkownik | Widok wylacznie swojego site, raporty per site, zatwierdzanie transferow |
| **Operator magazynu** | Transfery | Wysylanie/przyjmowanie transferow miedzyzakladowych, LP tracking |
| **Planista** | Cross-site planning | Alokacja WO do site z dostepna capacity, konsolidacja popytu |
| **Dyrektor operacyjny** | Widok skonsolidowany | Dashboard all-sites, porownanie KPI miedzy zakladami |
| **Kierownik jakosci** | Site-scoped QA | NCR per site, inspekcje per site, skonsolidowane metryki jakosci |

---

## 4. Scope

### 4.1 In Scope -- Phase 2A (MVP Multi-Site)

| Obszar | Priorytet |
|--------|-----------|
| Sites CRUD (name, code, address, timezone, status) | Must Have |
| Site user access (przypisanie userow do sites) | Must Have |
| Site switcher w UI (top-level nav) | Must Have |
| Aktywacja site_id na kluczowych tabelach (warehouses, WO, LP, machines, lines) | Must Have |
| RLS policies org_id + site_id | Must Have |
| Inter-site Transfer Orders (TO jako most) [11.1] | Must Have |
| Site-level filtering na raportach [11.3] | Must Have |
| Feature flag activation (multi_site_enabled per org) | Must Have |
| Backward-compatible migration (site_id NULL = default) | Must Have |

### 4.2 In Scope -- Phase 2B (Rozszerzenie)

| Obszar | Priorytet |
|--------|-----------|
| Cross-site production planning (capacity allocation) | Should Have |
| Consolidated reporting dashboard (all-sites aggregation) | Should Have |
| Site-specific configuration overrides (shifts, quality plans) | Should Have |
| Cross-site inventory visibility (read-only stock at other sites) | Should Have |
| Site-level cost centers (Finance integration) | Could Have |

### 4.3 Out of Scope

| Obszar | Uzasadnienie |
|--------|--------------|
| Multi-country (rozna waluta per site) | Wymaga multi-currency -- osobny feature |
| Site-specific product catalog (rozne produkty per site) | Produkty sa org-level |
| Automatic inter-site replenishment | Wymaga MRP advanced |
| Cross-site BOM differences | BOM jest org-level, site wykonuje |
| Multi-org consolidation | Poza zakresem -- 1 org = 1 tenant |

### 4.4 Exclusions (Nigdy)

- **Osobne bazy danych per site** -- wspoldzielona infra, izolacja RLS
- **Site jako osobny tenant** -- site jest podjednostka org, nie osobna organizacja
- **Cross-org transfers** -- transfery tylko w ramach jednej org

---

## 5. Constraints

### Techniczne
- **Retroaktywne site_id**: `site_id UUID NULL` juz istnieje na WSZYSTKICH tabelach (dodane w Foundation)
- **RLS dwa wymiary**: org_id (NOT NULL, zawsze) + site_id (NULL = all sites, NOT NULL = site-scoped)
- **Backward compatibility**: site_id NULL oznacza "domyslny site" -- istniejace dane dzialaja bez zmian
- **Feature flag**: `organization_settings.multi_site_enabled` -- aktywacja per org
- **Performance**: dodatkowy filtr site_id w RLS -- wymaga indeksow kompozytowych (org_id, site_id)

### Biznesowe
- Limit: max 20 sites per org (SMB scope)
- Multi-site jako feature premium (plan Enterprise)
- Minimalna zmiana UX dla single-site klientow (site switcher ukryty)

### Regulacyjne
- Trasowalnosc musi dzialac cross-site (LP genealogy przechodzi miedzy sites)
- Audit trail musi logowac site context
- NCR numbering z site prefix (np. FORZ-NCR-001)

---

## 6. Decisions

### D-MS-1. Model org_id + site_id (ADR-003 rozszerzenie)
`org_id UUID NOT NULL` pozostaje na WSZYSTKICH tabelach. `site_id UUID NULL` aktywowane jako dodatkowy wymiar. NULL = "domyslny site" (backward compatible). Tabele operacyjne (warehouses, WO, LP, machines, lines, stock_movements) -- site_id wymagany po aktywacji. Tabele master data (products, BOM, suppliers, customers) -- site_id zawsze NULL (org-level).

### D-MS-2. RLS site isolation
Dwa wzorce:
- **Tabele site-scoped**: `USING (org_id = current_org_id() AND (site_id IS NULL OR site_id IN (SELECT site_id FROM site_user_access WHERE user_id = auth.uid())))`
- **Tabele org-level**: `USING (org_id = current_org_id())` -- bez zmian
- Owner/Admin widzi wszystkie sites w org

### D-MS-3. TO jako most miedzyzakladowy [11.1]
Transfer Orders (ADR-019) rozszerzone o `from_site_id` i `to_site_id`. State machine: draft -> planned -> shipped -> in_transit -> received -> closed (+ cancelled). Inter-site TO tworzy LP movement miedzy sites. LP zachowuje genealogy cross-site. Koszt transferu opcjonalny.

### D-MS-4. Master data org-level vs site-level

| Poziom | Tabele | Uzasadnienie |
|--------|--------|--------------|
| **org-level** (shared) | products, boms, bom_items, routings, suppliers, customers, allergens, roles | Centralny master data -- identyczny we wszystkich zakladach |
| **site-level** (isolated) | warehouses, locations, machines, production_lines, work_orders, license_plates, stock_movements, quality_ncrs, quality_inspections, production_shifts | Operacje sa specyficzne per zaklad. Production_shifts sa site-scoped (kazdy zaklad ma rozne czasy zmian, strefy czasowe, dni robocze) |
| **cross-site** (oba) | transfer_orders (from_site + to_site), audit_log (site context) | Operacje miedzy zakladami |

### D-MS-5. Feature flag activation
`organizations.multi_site_enabled BOOLEAN DEFAULT FALSE`. Gdy FALSE: site_id NULL na wszystkim, site switcher ukryty, brak inter-site TO. Gdy TRUE: wymagane min 1 site, site switcher widoczny, inter-site TO dostepne. Aktywacja: admin wlacza w Settings -> Organization -> Multi-Site toggle.

### D-MS-6. Site context w sesji
Site context przekazywany przez:
1. Header `x-site-id` w kazdym API request
2. `current_site_id()` helper w PostgreSQL (set_config)
3. Site selector w UI zapisuje wybor w localStorage + cookie
4. Uzytkownicy z 1 site -- auto-select, brak switcher UI

### D-MS-7. Backward-compatible migration
Istniejace dane (site_id = NULL) traktowane jako "default site". Przy aktywacji multi-site admin musi:
1. Utworzyc sites (min 1)
2. Przypisac istniejace warehouses/machines/lines do sites
3. Przypisac userow do sites
Migration wizard w UI prowadzi przez ten proces.

### D-MS-8. Transfer Order koszt
Koszt transferu miedzyzakladowego opcjonalny. Pola: `transfer_cost NUMERIC`, `cost_allocation_method ENUM('sender', 'receiver', 'split')`. Domyslnie: receiver pokrywa koszt. Integracja z M10 Finance w Phase 2B.

### D-MS-9. Production Shifts Site-Specific
**Decyzja**: `production_shifts` sa site-specific od aktywacji M11. Kazdy site definiuje wlasne wzorce zmian (AM/PM/NIGHT z indywidualnymi godzinami). Migracja: istniejace shifts (site_id=NULL) przypisane do default_site, nowe site'y wymagaja konfiguracji shifts przed uruchomieniem produkcji. Shifts nie sa wspoldzielone miedzy sites, aby uwzglednic rozne czasy pracy i strefy czasowe zakladow.

**REC-L5 -- Klaryfikacja site-specific shifts**: Tabela `production_shifts` (M06) jest site-specific od poczatku. Kolumna `site_id UUID NULL` pozwala na rozne shift configs per zaklad (np. Site A = 2 zmiany, Site B = 3 zmiany). Domyslnie NULL = wspolne dla calej organizacji.

**Implikacje:**
- Tabela `production_shifts` otrzyma `site_id UUID NULL` (juz istnieje retroaktywnie)
- RLS: `site_id IN (SELECT site_id FROM site_user_access WHERE user_id = auth.uid())` lub owner/admin widzi wszystkie
- Migracja: `UPDATE production_shifts SET site_id = (SELECT id FROM sites WHERE org_id = ? AND is_default=true) WHERE site_id IS NULL AND org_id = ?`
- E11.6 (Site Configuration): Shifts editor per site, brak shared shifts cross-site
- Production line capacity (E11.5) zalezy od site-specific shifts

---

## 7. Module Map

```
Multi-Site (M11)
|-- E11.1 -- Site Management CRUD [Phase 2A]
|   |-- Backend: tabela sites, site_settings, migracja site_id
|   |-- API: CRUD /api/settings/sites
|   |-- Validation: Zod schemas
|   |-- Frontend: Sites list, create/edit, migration wizard
|   +-- Feature flag: multi_site_enabled
|
|-- E11.2 -- Inter-Site Transfers (TO jako most) [Phase 2A]
|   |-- Backend: rozszerzenie transfer_orders o from_site_id/to_site_id
|   |-- API: inter-site TO endpoints
|   |-- Validation: cross-site walidacja
|   |-- Frontend: Inter-site TO creation, tracking, receiving
|   +-- LP genealogy cross-site
|
|-- E11.3 -- Site-Scoped Security & RLS [Phase 2A]
|   |-- Backend: site_user_access, RLS policies update
|   |-- API: user-site assignment endpoints
|   |-- Frontend: user-site management w Settings
|   +-- Site switcher component
|
|-- E11.4 -- Site-Level Reporting [Phase 2A]
|   |-- Backend: site filter na raportach, materialized views
|   |-- API: site parameter na reporting endpoints
|   +-- Frontend: site filter dropdown na dashboardach
|
|-- E11.5 -- Cross-Site Planning [Phase 2B]
|   |-- Backend: capacity-by-site, cross-site demand
|   |-- API: planning allocation endpoints
|   +-- Frontend: cross-site planning dashboard
|
+-- E11.6 -- Site Settings & Configuration [Phase 2B]
    |-- Backend: site_settings overrides
    |-- API: site config endpoints
    +-- Frontend: site-specific settings pages
```

---

## 8. Requirements

### E11.1 -- Site Management CRUD (Phase 2A)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `sites` | id, org_id, code (unique/org), name, address_line1, address_line2, city, country, timezone, is_active, is_default, created_at, updated_at | Org-scoped | Max 20 per org |
| `site_settings` | id, site_id, org_id, setting_key, setting_value (JSONB) | Org+site scoped | Overrides org-level settings |

**Migracja site_id (retroaktywna aktywacja):**

| Tabela | Zmiana | Uwagi |
|--------|--------|-------|
| `warehouses` | SET site_id = (default_site) WHERE site_id IS NULL | Obowiazkowe po aktywacji |
| `machines` | SET site_id = (default_site) WHERE site_id IS NULL | Obowiazkowe po aktywacji |
| `production_lines` | SET site_id = (default_site) WHERE site_id IS NULL | Obowiazkowe po aktywacji |
| `work_orders` | SET site_id = (default_site) WHERE site_id IS NULL | Obowiazkowe po aktywacji |
| `license_plates` | SET site_id = (via warehouse.site_id) WHERE site_id IS NULL | Derived z warehouse |
| `stock_movements` | SET site_id = (via warehouse.site_id) WHERE site_id IS NULL | Derived z warehouse |
| `quality_ncrs` | SET site_id = (default_site) WHERE site_id IS NULL | Obowiazkowe po aktywacji |
| `production_shifts` | SET site_id = (default_site) WHERE site_id IS NULL | Obowiazkowe po aktywacji |

**API Endpoints:**
- `GET /api/settings/sites` -- lista sites dla org (+ is_active filter)
- `POST /api/settings/sites` -- utworz site
- `GET /api/settings/sites/:id` -- szczegoly site
- `PUT /api/settings/sites/:id` -- aktualizacja site
- `DELETE /api/settings/sites/:id` -- deaktywacja site (soft delete, is_active=false)
- `POST /api/settings/sites/activate` -- aktywuj multi-site (feature flag + migration wizard)
- `GET /api/settings/sites/:id/config` -- site-specific settings
- `PATCH /api/settings/sites/:id/config` -- aktualizacja site settings

**Validation (Zod):**
- `siteCreateSchema`: code 2-20 chars (alphanum+dash, unique/org), name 2-100 chars, timezone IANA, country ISO 3166-1
- `siteUpdateSchema`: partial siteCreateSchema
- `siteActivateSchema`: confirmation boolean, default_site_name string

**Frontend/UX:**
- MS-001: Sites List page (table: code, name, city, timezone, status, warehouses count, users count)
- MS-002: Site Create/Edit Modal (code, name, address, timezone, is_default)
- MS-003: Migration Wizard (3 kroki: create sites -> assign resources -> assign users)
- MS-004: Site Switcher (dropdown w top nav, all-sites option dla admin/owner)

**Wymagania FR:** FR-MS-001-012

---

### E11.2 -- Inter-Site Transfers [11.1] (Phase 2A)

**Backend:**

Rozszerzenie istniejacych `transfer_orders` (ADR-019):

| Kolumna | Typ | Uwagi |
|---------|-----|-------|
| `from_site_id` | UUID NULL FK sites | NULL = same-site (legacy) |
| `to_site_id` | UUID NULL FK sites | NULL = same-site (legacy) |
| `is_inter_site` | BOOLEAN GENERATED | (from_site_id IS NOT NULL AND to_site_id IS NOT NULL AND from_site_id != to_site_id) |
| `transfer_cost` | NUMERIC(12,2) NULL | Opcjonalny koszt transferu |
| `cost_allocation_method` | ENUM | 'sender', 'receiver', 'split' |
| `expected_arrival` | TIMESTAMPTZ NULL | ETA |
| `actual_arrival` | TIMESTAMPTZ NULL | Rzeczywiste przybycie |
| `shipped_at` | TIMESTAMPTZ NULL | Czas wysylki |

**State machine (inter-site TO):**
```
draft -> planned -> shipped -> in_transit -> received -> closed
                                                    +-> cancelled (z dowolnego stanu przed received)
```

**Logika inter-site TO:**
1. Tworzenie: wybierz from_site + to_site + items (LP lub produkty z qty)
2. Ship: LP w from_site zmienia status na IN_TRANSIT, stock_movement: SHIP_INTER_SITE
3. In Transit: LP widoczne w obu sites (status: IN_TRANSIT)
4. Receive: LP tworzone/aktualizowane w to_site, stock_movement: RECEIVE_INTER_SITE
5. LP genealogy zachowana cross-site (lp_genealogy.transfer_order_id)

**API Endpoints:**
- `POST /api/warehouse/transfer-orders` -- tworzenie (inter-site jesli from_site != to_site)
- `GET /api/warehouse/transfer-orders?type=inter_site` -- lista inter-site TO
- `PATCH /api/warehouse/transfer-orders/:id/ship` -- wyslij (zmienia LP status)
- `PATCH /api/warehouse/transfer-orders/:id/receive` -- przyjmij (tworzy LP w destination)
- `GET /api/warehouse/transfer-orders/:id/tracking` -- status + timeline

**Validation (Zod):**
- `interSiteTransferSchema`: from_site_id UUID, to_site_id UUID (rozne od from), items[] (product_id, qty, lp_ids optional)
- `transferShipSchema`: shipped_by UUID, ship_notes string optional
- `transferReceiveSchema`: received_by UUID, receive_notes string optional, discrepancies[] optional

**Frontend/UX:**
- MS-010: Inter-Site TO Creation (select sites, add items/LP, notes)
- MS-011: Inter-Site TO List (filtry: from_site, to_site, status, date range)
- MS-012: Inter-Site TO Detail (timeline, items, LP tracking, ship/receive actions)
- MS-013: In-Transit Dashboard (all active inter-site transfers, ETAs)

**Wymagania FR:** FR-MS-020-035

---

### E11.3 -- Site-Scoped Security & RLS (Phase 2A)

**Backend:**

| Tabela | Kluczowe kolumny | RLS | Uwagi |
|--------|-----------------|-----|-------|
| `site_user_access` | id, user_id, site_id, org_id, access_level (enum), granted_by, granted_at | Org-scoped; admin-only write | UNIQUE(user_id, site_id) |

**Access levels:**
- `viewer` -- read-only na danym site
- `operator` -- CRUD na operacjach (WO, LP, stock moves)
- `manager` -- jak operator + zatwierdzenia + raporty
- `admin` -- pelne uprawnienia na site + konfiguracja

**RLS policy pattern (site-scoped tables):**
```sql
-- Wzorzec dla tabel site-scoped (warehouses, WO, LP, machines itp.)
CREATE POLICY "org_and_site_isolation" ON warehouses
  USING (
    org_id = current_org_id()
    AND (
      site_id IS NULL  -- backward compat: NULL = all
      OR site_id IN (
        SELECT site_id FROM site_user_access
        WHERE user_id = auth.uid() AND org_id = current_org_id()
      )
      OR EXISTS (  -- Owner/Admin widzi wszystko w org
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND org_id = current_org_id()
        AND role_id IN (SELECT id FROM roles WHERE code IN ('owner', 'admin'))
      )
    )
  );
```

**API Endpoints:**
- `GET /api/settings/sites/:id/users` -- lista userow przypisanych do site
- `POST /api/settings/sites/:id/users` -- przypisz usera do site
- `PUT /api/settings/sites/:id/users/:userId` -- zmien access_level
- `DELETE /api/settings/sites/:id/users/:userId` -- usun przypisanie
- `GET /api/settings/users/:id/sites` -- lista sites usera

**Validation (Zod):**
- `siteUserAccessSchema`: user_id UUID, access_level enum('viewer','operator','manager','admin')

**Frontend/UX:**
- MS-020: Site Users page (per site: lista userow + access levels)
- MS-021: Assign User to Site Modal (user dropdown, access level select)
- MS-022: User Sites tab (w user detail: lista przypisanych sites)
- MS-004 (update): Site Switcher w navbar (dropdown, "All Sites" option dla admin/owner)

**Wymagania FR:** FR-MS-040-052

---

### E11.4 -- Site-Level Reporting [11.3] (Phase 2A)

**Backend:**

Rozszerzenie istniejacych endpointow raportowych o parametr `site_id`:
- Wszystkie materialized views dodaja kolumne `site_id`
- Agregacja: `GROUP BY site_id` + `UNION ALL` dla consolidated view
- Nowe materialized views: `mv_production_by_site`, `mv_inventory_by_site`, `mv_quality_by_site`

**API Endpoints (rozszerzenie istniejacych):**
- `GET /api/reports/production?site_id=X` -- produkcja per site
- `GET /api/reports/inventory?site_id=X` -- inventory per site
- `GET /api/reports/quality?site_id=X` -- quality per site
- `GET /api/reports/consolidated` -- all-sites aggregation (admin/owner only)
- `GET /api/reports/site-comparison` -- porownanie KPI miedzy sites

**Frontend/UX:**
- MS-030: Site Filter dropdown na WSZYSTKICH dashboardach raportowych
- MS-031: Consolidated Dashboard (agregacja all-sites: total output, inventory, quality)
- MS-032: Site Comparison view (tabela: site vs site KPI porownanie)

**Wymagania FR:** FR-MS-060-068

---

### E11.5 -- Cross-Site Planning (Phase 2B)

**Backend:**

| Tabela | Kluczowe kolumny | Uwagi |
|--------|-----------------|-------|
| `site_capacity` | site_id, line_id, date, available_hours, planned_hours, utilization_pct | Computed z WO + shifts |

**API Endpoints:**
- `GET /api/planning/capacity-by-site` -- capacity per site (date range)
- `POST /api/planning/allocate-to-site` -- alokuj WO do site z best capacity
- `GET /api/planning/cross-site-demand` -- skonsolidowany popyt all-sites

**Frontend/UX:**
- MS-040: Cross-Site Capacity Dashboard (heatmap: site x date x utilization)
- MS-041: WO Site Allocation (przy tworzeniu WO: suggested site based on capacity)

**Wymagania FR:** FR-MS-070-076

---

### E11.6 -- Site Settings & Configuration (Phase 2B)

**Backend:**

Site-level overrides dla istniejacych org-level settings:
- Shift patterns per site (rozne godziny AM/PM per zaklad)
- Quality plans per site (rozne inspekcje per certyfikat)
- NCR numbering z site prefix (np. FORZ-NCR-001, KOBE-NCR-001)
- Default warehouse per site
- Working hours per site

**API Endpoints:**
- `GET /api/settings/sites/:id/config` -- pelna konfiguracja site
- `PATCH /api/settings/sites/:id/config` -- aktualizacja (merge z org defaults)
- `GET /api/settings/sites/:id/shifts` -- shift patterns per site
- `PUT /api/settings/sites/:id/shifts` -- aktualizacja shift patterns

**Frontend/UX:**
- MS-050: Site Configuration page (tabs: General, Shifts, Quality, Numbering)
- MS-051: Site Shifts editor (AM/PM times, days of week)

**Wymagania FR:** FR-MS-080-088

---

## 9. KPIs

### Operacyjne Multi-Site

| KPI | Cel | Pomiar |
|-----|-----|--------|
| Cross-site transfer cycle time | < 48h (draft to received) | transfer_orders timestamps |
| Inter-site transfer accuracy | > 99% (qty shipped = qty received) | TO discrepancy rate |
| Site data isolation | 100% (zero cross-site leaks) | Automated RLS tests |
| Sites per org (avg, multi-site orgs) | 2-5 | sites count |
| User-site assignments per user | 1-3 | site_user_access count |

### Performance Multi-Site

| KPI | Cel | Pomiar |
|-----|-----|--------|
| Site switcher latency | < 500 ms | APM |
| Site-filtered report load | < 3 s | APM |
| Consolidated report load | < 5 s | APM |
| RLS policy overhead (site_id) | < 50 ms | Query plan analysis |
| Inter-site TO creation | < 2 s | APM |

### Reporting Multi-Site

| KPI | Cel | Pomiar |
|-----|-----|--------|
| Report site filtering accuracy | 100% | Automated test: data in report = data for site |
| Cross-site comparison accuracy | 100% | Automated test: aggregation correctness |
| Site-scoped dashboard adoption | > 80% multi-site users | Analytics |

---

## 10. Risks

| Ryzyko | Prawdop. | Wplyw | Mitygacja |
|--------|----------|-------|-----------|
| **Migracja danych** -- przypisanie site_id do istniejacych rekordow | Wysokie | Wysoki | Migration wizard z walidacja; dry-run mode; rollback capability |
| **RLS complexity** -- dwa wymiary (org+site) | Wysokie | Krytyczny | Template RLS policies; automated testing; security audit per epic |
| **Performance degradation** -- dodatkowy filtr site_id | Srednie | Sredni | Indeksy kompozytowe (org_id, site_id); query plan monitoring; benchmark przed/po |
| **Backward compatibility** -- regresje w single-site orgs | Srednie | Wysoki | Feature flag; NULL = default; pelny test suite single-site |
| **LP genealogy cross-site** -- trasowalnosc miedzy zakladami | Srednie | Wysoki | lp_genealogy.transfer_order_id; integration tests cross-site flow |
| **UX complexity** -- site switcher + filtrowanie | Srednie | Sredni | Auto-select dla 1-site users; persistent site context; clear site indicator |
| **Audit trail gaps** -- brak site context w logach | Niskie | Sredni | set_audit_context() rozszerzony o site_id; middleware enforcement |
| **Inter-site TO discrepancies** -- roznice qty shipped vs received | Srednie | Sredni | Walidacja na receive; discrepancy workflow; alert na rozbieznosci |

### Tech Debt (Multi-Site specific)
- **P0**: Brak indeksow kompozytowych (org_id, site_id) na kluczowych tabelach -- dodac PRZED aktywacja
- **P1**: RLS policies nie maja site_id -- update WSZYSTKICH policies w ramach E11.3
- **P1**: Materialized views bez site_id -- rebuild w ramach E11.4
- **P2**: Brak site context w audit_log -- rozszerzyc trigger

---

## 11. Success Criteria

### Funkcjonalne
- [ ] FORZ + KOBE jako 2 sites w 1 org -- pelna izolacja danych operacyjnych
- [ ] Inter-site TO dziala (draft -> ship -> receive) z LP tracking
- [ ] Raporty site-scoped -- filtr per site na wszystkich dashboardach
- [ ] Master data (products, BOM, suppliers) shared miedzy sites
- [ ] Site switcher dziala plynnie (< 500 ms)
- [ ] Migration wizard prowadzi single-site org do multi-site
- [ ] Single-site orgs dzialaja bez zmian (backward compatible)
- [ ] Feature flag toggle wlacza/wylacza multi-site per org
- [ ] Audit trail loguje site context
- [ ] LP genealogy zachowana cross-site (trasowalnosc end-to-end)

### Niefunkcjonalne
- [ ] RLS: 0 cross-site data leaks w automated tests
- [ ] Site-filtered queries P95 < 500 ms
- [ ] Consolidated reports P95 < 5 s
- [ ] Indeksy kompozytowe na WSZYSTKICH tabelach z site_id
- [ ] 100% RLS policies zaktualizowane o site_id
- [ ] Backward compatibility: 0 regresji w CI test suite

### Biznesowe
- [ ] Min 1 klient multi-site (FORZ+KOBE) w produkcji
- [ ] Multi-site jako feature premium (upsell)
- [ ] Cross-site transfer workflow < 48h average
- [ ] Onboarding multi-site < 1h (z migration wizard)

---

## 12. References

### Dokumenty zrodlowe
- Foundation PRD -> `new-doc/00-foundation/prd/00-FOUNDATION-PRD.md` (D3: Multi-Tenancy, site_id decision)
- Settings PRD -> `new-doc/01-settings/prd/01-SETTINGS-PRD.md` (D-SET-12: site_id na wszystkich tabelach)
- Multi-Site Analysis -> `new-doc/11-multi-site/ANALYSIS.md` (36 references, architecture, gaps)
- PRD Update List -> `new-doc/_meta/PRD-UPDATE-LIST.md` (items 11.1-11.3)
- Feature Gap Analysis -> `new-doc/00-foundation/other/discovery/FEATURE-GAP-ANALYSIS.md`

### ADR (Multi-Site relevant)
- ADR-003: Multi-Tenancy RLS (org_id pattern) -> rozszerzenie o site_id
- ADR-013: RLS Org Isolation Pattern -> rozszerzenie o site isolation
- ADR-019: TO State Machine -> rozszerzenie o inter-site states

### Zaleznosci modulowe

| Modul | Zmiana wymagana | Impact |
|-------|----------------|--------|
| M01 Settings | Sites CRUD, user-site access, feature flag | HIGH |
| M03 Warehouse | site_id na warehouses/locations/LP, inter-site TO | HIGH |
| M04 Planning | site_id na WO, capacity-by-site | HIGH |
| M06 Production | site_id na WO execution, shifts per site | MEDIUM |
| M08 Quality | site_id na NCR/inspections, site prefix | MEDIUM |
| M15 Reporting | site filter na dashboardach, consolidated views | MEDIUM |
| M02 Technical | Brak zmian -- products/BOM org-level | LOW |
| M07 Shipping | site_id na SO (fulfilling site) | LOW |

### Database schema (nowe + zmienione)
- **Nowe tabele**: `sites`, `site_settings`, `site_user_access`, `site_capacity`
- **Zmienione tabele**: `transfer_orders` (+ from_site_id, to_site_id, transfer_cost), `audit_log` (+ site_id context)
- **Aktywowane**: site_id na ~15 tabelach operacyjnych (juz NULL, wymaga SET po aktywacji)
- **Indeksy**: CREATE INDEX idx_{table}_org_site ON {table}(org_id, site_id) na wszystkich tabelach z site_id

### Competitive context
- AVEVA: Deep multi-site standardization (model-driven architecture)
- Plex: Single-instance multi-tenant z multi-site
- Aptean: Multi-site z multiple editions
- CSB: Multiple facility support (industry-specific)
- MonoPilot: Lightweight multi-site z shared master data i site isolation (SMB-friendly)

---

_PRD 11-Multi-Site v1.0 -- 6 epikow (4 Phase 2A + 2 Phase 2B), ~88 wymagan, 8 decyzji Multi-Site specific._
_Kluczowe: org_id + site_id model, TO jako most miedzyzakladowy, backward-compatible migration, feature flag activation._
_Data: 2026-02-18_
