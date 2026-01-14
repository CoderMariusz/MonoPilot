# Future Updates

Lista funkcjonalności do implementacji w przyszłych sprintach.

---

## 1. Product Categories System

**Status:** Planned
**Priority:** Medium
**Epic:** 2 - Technical

### Problem
- Tabela `products` ma kolumnę `category_id` (UUID) ale nie ma tabeli `categories`
- Pole category w formularzu zostało tymczasowo wyłączone

### Do zrobienia

1. **Migracja bazy danych**
   ```sql
   CREATE TABLE categories (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
     code VARCHAR(20) NOT NULL,
     name VARCHAR(100) NOT NULL,
     description TEXT,
     parent_id UUID REFERENCES categories(id),  -- hierarchia
     color VARCHAR(20),
     is_active BOOLEAN DEFAULT true,
     display_order INTEGER,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     CONSTRAINT uq_categories_org_code UNIQUE(org_id, code)
   );
   ```

2. **RLS Policies**
   - SELECT: wszyscy użytkownicy org
   - ALL: ADMIN+

3. **API Endpoints**
   - `GET /api/technical/categories` - lista kategorii
   - `POST /api/technical/categories` - tworzenie
   - `PUT /api/technical/categories/[id]` - edycja
   - `DELETE /api/technical/categories/[id]` - usuwanie

4. **UI Components**
   - Strona zarządzania kategoriami (`/technical/categories`)
   - Dropdown w formularzu produktu (zamiast Input)
   - Seed domyślnych kategorii (Dry Goods, Dairy, Frozen, etc.)

5. **Pliki do modyfikacji**
   - `components/technical/ProductFormModal.tsx` - odkomentować i zmienić na Select
   - `lib/validation/product-schemas.ts` - dodać category_id
   - `lib/types/product.ts` - dodać category_id

---

## 2. Audit Logs Page

**Status:** Planned
**Priority:** Low
**Epic:** 1 - Settings

### Problem
- Link "View All Activity" prowadzi do `/settings` (tymczasowe)
- Brak strony `/settings/audit-logs`

### Do zrobienia
1. Stworzyć stronę `app/(authenticated)/settings/audit-logs/page.tsx`
2. Tabela z logami aktywności (DataTable)
3. Filtry: data, użytkownik, akcja, moduł
4. Eksport do CSV

---

## 3. Scanner Module (Warehouse)

**Status:** Planned
**Priority:** High
**Epic:** 5 - Warehouse

### Problem
- Brak strony Scanner w module Warehouse

### Do zrobienia
1. Stworzyć `app/(authenticated)/warehouse/scanner/page.tsx`
2. Obsługa skanera kodów kreskowych
3. Quick actions: receive, move, count
4. Integracja z License Plates

---

## 4. GRN (Goods Receipt Note) UI

**Status:** Partially Done
**Priority:** High
**Epic:** 5 - Warehouse

### Do zrobienia
1. Strona listy GRN
2. Formularz tworzenia GRN
3. Proces przyjęcia towaru
4. Generowanie LP przy przyjęciu

---

## Changelog

| Data | Opis |
|------|------|
| 2026-01-14 | Utworzono plik, dodano Category System, Audit Logs, Scanner |
