Transfer Orders — Ship/Receive Tracking & Location Hierarchy Fix
Brief
Dodać pełne śledzenie wysyłki i odbioru dla TO: planowane i rzeczywiste daty (4 kolumny), akcje markShipped/markReceived oraz śledzenie LP i partii. Naprawić mapowanie lokalizacji: używać from_location/to_location (z hierarchią Warehouse → Location) w UI. Ujednolicić workflow statusów: draft → submitted → in_transit → received → closed, z wymuszeniem przejść przez akcje. Ujednolicić walidacje (kolejność dat, dostępność zapasu w źródłowej lokalizacji). Uzupełnić testy jednostkowe i integracyjne (transferOrders.test.ts), oraz zaktualizować dokumentację.

Constraints
Domyślne dla repo:

RLS ON dla wszystkich tabel i operacji
UI w stylu Filament (Create/Edit/List, Columns, Filters)
Plan bez kodu - tylko kroki, kontrakty, testy, DoD
Conventional Commits w PR
Realne ścieżki plików
Specyficzne dla zadania:

Bez łamania istniejącego schematu; kolumny dat już istnieją w to_header (migrations 049, 050)
to_line już ma lp_id, batch, qty_moved - wykorzystać istniejące pola
Filament-style: czytelne 4 kolumny dat + akcje (Mark as Shipped / Mark as Received) w Details
UI powinien pokazywać Warehouse / Location (np. WH-MAIN / A-01-02)
Status workflow: draft → submitted → in_transit → received → closed
Preferencja: wykorzystać istniejące tabele to_header i to_line z migrations 034, 049, 050
Notes
Daty: planned_ship_date, actual_ship_date, planned_receive_date, actual_receive_date już istnieją w to_header
Line items: qty_moved, lp_id, batch już istnieją w to_line (migration 050)
Walidacje: planned_receive_date >= planned_ship_date; markShipped tylko z submitted; markReceived tylko z in_transit
Naprawa błędu: nie mylić warehouse z location w tabeli/filtrach - pokazywać hierarchię
Status closed dodany do enum w migration 049
Warehouse → Location: to_line.from_location_id i to_line.to_location_id powinny być wyświetlane z parent warehouse
Impact Analysis
Zmienione komponenty:

Frontend: TransferOrdersTable, TransferOrderDetailsModal, CreateTransferOrderModal, EditTransferOrderModal
API: TransferOrdersAPI (dodanie metod markShipped, markReceived, walidacje)
Database: RLS policies dla to_header, to_line, funkcje RPC dla akcji
Dotknięte moduły:

WH (Warehouse) - główny moduł dla TO
PLAN - wpływ na planowanie transferów
Estimated effort: 2-3 dni

File Plan
Frontend
apps/frontend/
├── components/
│   ├── TransferOrdersTable.tsx (modify)
│   │   └── dodać 4 kolumny dat (planned_ship, actual_ship, planned_receive, actual_receive)
│   │   └── naprawić wyświetlanie warehouse/location (hierarchia)
│   │   └── dodać kolumnę progress (qty_moved / qty_planned)
│   ├── TransferOrderDetailsModal.tsx (modify)
│   │   └── dodać sekcję Date Tracking (4 daty)
│   │   └── dodać przyciski Mark as Shipped / Mark as Received
│   │   └── naprawić wyświetlanie from/to location (show warehouse parent)
│   │   └── dodać walidacje przed akcjami
│   ├── CreateTransferOrderModal.tsx (modify)
│   │   └── dodać pola planned_ship_date, planned_receive_date
│   │   └── dodać walidację: planned_receive >= planned_ship
│   │   └── naprawić UI: pokazać Warehouse → Location dla linii
│   └── EditTransferOrderModal.tsx (modify)
│       └── dodać edycję planned dates
│       └── walidacja dat
├── lib/
│   ├── api/
│   │   └── transferOrders.ts (modify)
│   │       └── dodać markShipped(toId: number, shipDate: string)
│   │       └── dodać markReceived(toId: number, receiveDate: string, lineUpdates: {id, qty_moved, lp_id?, batch?}[])
│   │       └── dodać walidacje statusów przed akcjami
│   └── types.ts (modify)
│       └── uzupełnić TOHeader, TOLine z pełnymi polami dat/batch/lp
└── __tests__/
    └── transferOrders.test.ts (create)
        └── unit testy dla markShipped, markReceived
        └── integration testy workflow
        └── walidacje dat, statusów
Backend/API
apps/frontend/lib/supabase/
└── migrations/
    └── 051_to_ship_receive_actions.sql (create)
        └── funkcje RPC: mark_transfer_shipped, mark_transfer_received
        └── walidacje statusów w funkcjach
        └── audit_log dla akcji
        └── update status: submitted → in_transit, in_transit → received
DB & RLS
Migration UP
Plik: apps/frontend/lib/supabase/migrations/051_to_ship_receive_actions.sql

-- Migration 051: Add RPC functions for Transfer Order ship/receive actions
-- Purpose: Implement markShipped and markReceived with status transitions and audit

-- Function: Mark Transfer Order as Shipped
-- Transition: submitted → in_transit
CREATE OR REPLACE FUNCTION mark_transfer_shipped(
  p_to_id INTEGER,
  p_actual_ship_date TIMESTAMPTZ,
  p_user_id UUID
)
RETURNS to_header
LANGUAGE plpgsql
AS $$
DECLARE
  v_to to_header;
BEGIN
  -- Lock and validate
  SELECT * INTO v_to FROM to_header WHERE id = p_to_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer order not found';
  END IF;

  IF v_to.status != 'submitted' THEN
    RAISE EXCEPTION 'Can only mark as shipped from submitted status (current: %)', v_to.status;
  END IF;

  -- Update status and actual_ship_date
  UPDATE to_header
  SET 
    status = 'in_transit',
    actual_ship_date = p_actual_ship_date,
    updated_at = NOW()
  WHERE id = p_to_id
  RETURNING * INTO v_to;

  -- Audit log
  INSERT INTO audit_log (entity, entity_id, action, before, after, actor_id, created_at)
  VALUES (
    'to_header',
    p_to_id,
    'mark_shipped',
    jsonb_build_object('status', 'submitted'),
    jsonb_build_object('status', 'in_transit', 'actual_ship_date', p_actual_ship_date),
    p_user_id,
    NOW()
  );

  RETURN v_to;
END $$;

-- Function: Mark Transfer Order as Received
-- Transition: in_transit → received
CREATE OR REPLACE FUNCTION mark_transfer_received(
  p_to_id INTEGER,
  p_actual_receive_date TIMESTAMPTZ,
  p_line_updates JSONB, -- [{line_id, qty_moved, lp_id?, batch?}]
  p_user_id UUID
)
RETURNS to_header
LANGUAGE plpgsql
AS $$
DECLARE
  v_to to_header;
  v_line JSONB;
BEGIN
  -- Lock and validate
  SELECT * INTO v_to FROM to_header WHERE id = p_to_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer order not found';
  END IF;

  IF v_to.status != 'in_transit' THEN
    RAISE EXCEPTION 'Can only mark as received from in_transit status (current: %)', v_to.status;
  END IF;

  -- Update line items with qty_moved, lp_id, batch
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_line_updates)
  LOOP
    UPDATE to_line
    SET
      qty_moved = COALESCE((v_line->>'qty_moved')::DECIMAL(12,4), qty_moved),
      lp_id = CASE WHEN v_line ? 'lp_id' THEN (v_line->>'lp_id')::INTEGER ELSE lp_id END,
      batch = CASE WHEN v_line ? 'batch' THEN (v_line->>'batch')::VARCHAR ELSE batch END,
      updated_at = NOW()
    WHERE id = (v_line->>'line_id')::INTEGER AND to_id = p_to_id;
  END LOOP;

  -- Update header status and actual_receive_date
  UPDATE to_header
  SET 
    status = 'received',
    actual_receive_date = p_actual_receive_date,
    updated_at = NOW()
  WHERE id = p_to_id
  RETURNING * INTO v_to;

  -- Audit log
  INSERT INTO audit_log (entity, entity_id, action, before, after, actor_id, created_at)
  VALUES (
    'to_header',
    p_to_id,
    'mark_received',
    jsonb_build_object('status', 'in_transit'),
    jsonb_build_object('status', 'received', 'actual_receive_date', p_actual_receive_date, 'line_updates', p_line_updates),
    p_user_id,
    NOW()
  );

  RETURN v_to;
END $$;

-- Add comments
COMMENT ON FUNCTION mark_transfer_shipped IS 'Mark TO as shipped (submitted → in_transit) with actual_ship_date';
COMMENT ON FUNCTION mark_transfer_received IS 'Mark TO as received (in_transit → received) with actual_receive_date and line qty_moved';
Migration DOWN
-- Drop functions
DROP FUNCTION IF EXISTS mark_transfer_shipped(INTEGER, TIMESTAMPTZ, UUID);
DROP FUNCTION IF EXISTS mark_transfer_received(INTEGER, TIMESTAMPTZ, JSONB, UUID);
RLS Policies
RLS już istnieje dla to_header i to_line (migration 035_phase1_planning_rls.sql).

Sprawdzić czy istniejące polityki pozwalają na:

UPDATE to_header.status, actual_ship_date, actual_receive_date dla ról Warehouse, Planner
UPDATE to_line.qty_moved, lp_id, batch dla ról Warehouse
Jeśli nie: dodać nowe polityki w migration 051:

-- Policy: Allow warehouse/planner to update TO ship/receive
CREATE POLICY "users_update_to_ship_receive" ON to_header
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Warehouse', 'Planner', 'Admin')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Warehouse', 'Planner', 'Admin')
    )
  );

-- Policy: Allow warehouse to update line qty_moved/lp/batch
CREATE POLICY "users_update_to_line_received" ON to_line
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Warehouse', 'Planner', 'Admin')
    )
  );
Contracts
TypeScript Interfaces
Uzupełnienia do istniejących interfejsów w apps/frontend/lib/types.ts:

// TOHeader już ma wszystkie pola, tylko upewnić się:
export interface TOHeader {
  id: number;
  number: string;
  status: TOStatus; // 'draft' | 'submitted' | 'in_transit' | 'received' | 'closed' | 'cancelled'
  from_wh_id: number;
  to_wh_id: number;
  requested_date?: string;
  planned_ship_date?: string;       // już istnieje
  actual_ship_date?: string;        // już istnieje
  planned_receive_date?: string;    // już istnieje
  actual_receive_date?: string;     // już istnieje
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  to_lines?: TOLine[];
}

// TOLine już ma wszystkie pola, tylko upewnić się:
export interface TOLine {
  id: number;
  to_id: number;
  line_no: number;
  item_id: number;
  uom: string;
  qty_planned: number;
  qty_moved: number;               // już istnieje
  from_location_id?: number;
  to_location_id?: number;
  lp_id?: number;                  // już istnieje (migration 050)
  batch?: string;                  // już istnieje (migration 050)
  scan_required: boolean;
  approved_line: boolean;
  created_at: string;
  updated_at: string;
  // Relationships
  item?: Product;
  from_location?: Location;        // powinno pokazywać parent warehouse
  to_location?: Location;          // powinno pokazywać parent warehouse
}

// DTO dla markReceived
export interface MarkReceivedLineUpdate {
  line_id: number;
  qty_moved: number;
  lp_id?: number;
  batch?: string;
}

export interface MarkReceivedRequest {
  to_id: number;
  actual_receive_date: string;
  line_updates: MarkReceivedLineUpdate[];
}
API Endpoints
Rozszerzenia klasy TransferOrdersAPI w apps/frontend/lib/api/transferOrders.ts:

export class TransferOrdersAPI {
  // Istniejące metody: getAll, getById, create, update, delete...

  // Nowe metody:

  // Mark as Shipped
  static async markShipped(
    toId: number, 
    actualShipDate: string
  ): Promise<TOHeader> {
    // 1. Walidacja: status musi być 'submitted'
    // 2. Call RPC: mark_transfer_shipped(toId, actualShipDate, userId)
    // 3. Return updated TOHeader
  }

  // Mark as Received
  static async markReceived(
    toId: number,
    actualReceiveDate: string,
    lineUpdates: MarkReceivedLineUpdate[]
  ): Promise<TOHeader> {
    // 1. Walidacja: status musi być 'in_transit'
    // 2. Call RPC: mark_transfer_received(toId, actualReceiveDate, lineUpdates, userId)
    // 3. Return updated TOHeader
  }

  // Helper: Validate Date Order
  static validateDateOrder(
    plannedShip?: string,
    plannedReceive?: string
  ): void {
    if (plannedShip && plannedReceive) {
      const shipDate = new Date(plannedShip);
      const receiveDate = new Date(plannedReceive);
      if (receiveDate < shipDate) {
        throw new Error('Planned receive date must be >= planned ship date');
      }
    }
  }
}
Enums (jeśli wymagane)
Status workflow:

export type TOStatus = 
  | 'draft'       // tworzony
  | 'submitted'   // zatwierdzony, czeka na wysyłkę
  | 'in_transit'  // wysłany, w drodze
  | 'received'    // odebrano
  | 'closed'      // zamknięty (opcjonalnie po reconcile)
  | 'cancelled';  // anulowany
Algorithm / Flow
Main Flow: Mark as Shipped
User otwiera TO Details (status = submitted)
Klik "Mark as Shipped"
Modal/dialog: wybór actual_ship_date (domyślnie: dzisiaj)
Walidacja:
Status = submitted (backend też sprawdzi)
actual_ship_date jest podana
API call: TransferOrdersAPI.markShipped(toId, actualShipDate)
Backend RPC:
Lock to_header
Sprawdź status = submitted
Update: status = 'in_transit', actual_ship_date
Audit log
UI refresh: status badge → in_transit, pokazać actual_ship_date
Toast: "Transfer order marked as shipped"
Main Flow: Mark as Received
User otwiera TO Details (status = in_transit)
Klik "Mark as Received"
Modal/dialog:
Wybór actual_receive_date (domyślnie: dzisiaj)
Lista linii: dla każdej można uzupełnić qty_moved, lp_id, batch
Walidacja:
Status = in_transit (backend też sprawdzi)
actual_receive_date jest podana
qty_moved <= qty_planned dla każdej linii
API call: TransferOrdersAPI.markReceived(toId, actualReceiveDate, lineUpdates)
Backend RPC:
Lock to_header
Sprawdź status = in_transit
Update linii: qty_moved, lp_id, batch
Update header: status = 'received', actual_receive_date
Audit log
UI refresh: status badge → received, pokazać actual_receive_date, qty_moved w liniach
Toast: "Transfer order marked as received"
Main Flow: Create TO with Dates
User klika "Create Transfer Order"
Modal: wypełnia from/to warehouse, linie, oraz planned_ship_date, planned_receive_date
Walidacja przed submit:
planned_receive_date >= planned_ship_date (jeśli obie podane)
API call: TransferOrdersAPI.create(toData) - zapisuje daty w to_header
TO utworzony w statusie draft
Edge Cases
Case 1: User próbuje markShipped gdy status != submitted
Oczekiwane zachowanie: błąd "Can only mark as shipped from submitted status", toast error
Case 2: User próbuje markReceived gdy status != in_transit
Oczekiwane zachowanie: błąd "Can only mark as received from in_transit status", toast error
Case 3: planned_receive_date < planned_ship_date
Oczekiwane zachowanie: walidacja błąd w Create/Edit, DB constraint chroni (migration 049)
Case 4: qty_moved > qty_planned w markReceived
Oczekiwane zachowanie: walidacja błąd "Quantity moved cannot exceed planned quantity"
Case 5: User anuluje TO (cancel) w statusie in_transit
Oczekiwane zachowanie: dozwolone (istniejąca funkcja cancel_transfer_order)
Case 6: Location bez parent warehouse
Oczekiwane zachowanie: UI pokazuje tylko location name (fallback)
Validation Rules
planned_ship_date: opcjonalne, TIMESTAMPTZ
planned_receive_date: opcjonalne, TIMESTAMPTZ, musi być >= planned_ship_date (DB constraint)
actual_ship_date: wymagane w markShipped, TIMESTAMPTZ
actual_receive_date: wymagane w markReceived, TIMESTAMPTZ
qty_moved: >= 0, <= qty_planned
lp_id: opcjonalne, musi istnieć w license_plates
batch: opcjonalne, VARCHAR(100)
status transitions: 
draft → submitted (via approve/submit)
submitted → in_transit (via markShipped)
in_transit → received (via markReceived)
received → closed (opcjonalnie, manual close)
* → cancelled (via cancel)
Tests First
Unit Tests
Plik: apps/frontend/__tests__/transferOrders.test.ts

import { TransferOrdersAPI } from '@/lib/api/transferOrders';
import { supabase } from '@/lib/supabase/client-browser';

describe('TransferOrdersAPI - Ship/Receive', () => {
  beforeEach(() => {
    // Mock Supabase client
    jest.clearAllMocks();
  });

  describe('markShipped', () => {
    test('should mark TO as shipped when status is submitted', async () => {
      // Arrange
      const toId = 1;
      const shipDate = '2025-11-10T10:00:00Z';
      const mockResponse = { 
        id: 1, 
        status: 'in_transit', 
        actual_ship_date: shipDate 
      };
      
      jest.spyOn(supabase, 'rpc').mockResolvedValue({ data: mockResponse, error: null });

      // Act
      const result = await TransferOrdersAPI.markShipped(toId, shipDate);

      // Assert
      expect(result.status).toBe('in_transit');
      expect(result.actual_ship_date).toBe(shipDate);
      expect(supabase.rpc).toHaveBeenCalledWith('mark_transfer_shipped', {
        p_to_id: toId,
        p_actual_ship_date: shipDate,
        p_user_id: expect.any(String)
      });
    });

    test('should throw error when status is not submitted', async () => {
      // Arrange
      const toId = 1;
      const shipDate = '2025-11-10T10:00:00Z';
      const mockError = { message: 'Can only mark as shipped from submitted status' };
      
      jest.spyOn(supabase, 'rpc').mockResolvedValue({ data: null, error: mockError });

      // Act & Assert
      await expect(TransferOrdersAPI.markShipped(toId, shipDate)).rejects.toThrow();
    });
  });

  describe('markReceived', () => {
    test('should mark TO as received with line updates', async () => {
      // Arrange
      const toId = 1;
      const receiveDate = '2025-11-12T14:00:00Z';
      const lineUpdates = [
        { line_id: 1, qty_moved: 100, lp_id: 5, batch: 'BATCH-001' },
        { line_id: 2, qty_moved: 50 }
      ];
      const mockResponse = { 
        id: 1, 
        status: 'received', 
        actual_receive_date: receiveDate 
      };
      
      jest.spyOn(supabase, 'rpc').mockResolvedValue({ data: mockResponse, error: null });

      // Act
      const result = await TransferOrdersAPI.markReceived(toId, receiveDate, lineUpdates);

      // Assert
      expect(result.status).toBe('received');
      expect(result.actual_receive_date).toBe(receiveDate);
    });

    test('should throw error when status is not in_transit', async () => {
      // Arrange
      const toId = 1;
      const receiveDate = '2025-11-12T14:00:00Z';
      const lineUpdates = [];
      const mockError = { message: 'Can only mark as received from in_transit status' };
      
      jest.spyOn(supabase, 'rpc').mockResolvedValue({ data: null, error: mockError });

      // Act & Assert
      await expect(TransferOrdersAPI.markReceived(toId, receiveDate, lineUpdates)).rejects.toThrow();
    });
  });

  describe('validateDateOrder', () => {
    test('should pass when receive date >= ship date', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder('2025-11-10', '2025-11-12');
      }).not.toThrow();
    });

    test('should throw error when receive date < ship date', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder('2025-11-10', '2025-11-08');
      }).toThrow('Planned receive date must be >= planned ship date');
    });

    test('should pass when dates are missing', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder(undefined, '2025-11-12');
      }).not.toThrow();
    });
  });
});
Integration Tests
describe('TransferOrders Integration - Workflow', () => {
  test('should complete full TO lifecycle: create → submit → ship → receive', async () => {
    // 1. Create TO (draft)
    const newTO = await TransferOrdersAPI.create({
      from_wh_id: 1,
      to_wh_id: 2,
      planned_ship_date: '2025-11-10',
      planned_receive_date: '2025-11-12',
      lines: [{ item_id: 1, qty_planned: 100, uom: 'kg' }]
    });
    expect(newTO.status).toBe('draft');

    // 2. Submit TO
    const submitted = await TransferOrdersAPI.update(newTO.id, { status: 'submitted' });
    expect(submitted.status).toBe('submitted');

    // 3. Mark as Shipped
    const shipped = await TransferOrdersAPI.markShipped(newTO.id, '2025-11-10T08:00:00Z');
    expect(shipped.status).toBe('in_transit');
    expect(shipped.actual_ship_date).toBeDefined();

    // 4. Mark as Received
    const received = await TransferOrdersAPI.markReceived(newTO.id, '2025-11-12T10:00:00Z', [
      { line_id: shipped.to_lines![0].id, qty_moved: 100 }
    ]);
    expect(received.status).toBe('received');
    expect(received.actual_receive_date).toBeDefined();
  });

  test('should respect RLS policies for Warehouse role', async () => {
    // Test RLS: Warehouse user can markShipped and markReceived
    // (mock auth context)
  });
});
UI Tests (Playwright)
test('TransferOrders - Mark as Shipped flow', async ({ page }) => {
  // 1. Navigate to Transfer Orders
  await page.goto('/warehouse/transfer-orders');
  
  // 2. Open TO Details (status = submitted)
  await page.click('[data-testid="view-to-1"]');
  
  // 3. Click "Mark as Shipped"
  await page.click('button:has-text("Mark as Shipped")');
  
  // 4. Fill actual_ship_date
  await page.fill('input[name="actual_ship_date"]', '2025-11-10');
  
  // 5. Submit
  await page.click('button:has-text("Confirm")');
  
  // 6. Verify success toast
  await expect(page.locator('.toast-success')).toContainText('marked as shipped');
  
  // 7. Verify status badge changed to "in_transit"
  await expect(page.locator('[data-testid="status-badge"]')).toContainText('In Transit');
});

test('TransferOrders - Mark as Received flow', async ({ page }) => {
  // 1. Navigate and open TO (status = in_transit)
  await page.goto('/warehouse/transfer-orders');
  await page.click('[data-testid="view-to-2"]');
  
  // 2. Click "Mark as Received"
  await page.click('button:has-text("Mark as Received")');
  
  // 3. Fill receive date and line quantities
  await page.fill('input[name="actual_receive_date"]', '2025-11-12');
  await page.fill('input[name="line-1-qty_moved"]', '100');
  
  // 4. Submit
  await page.click('button:has-text("Confirm")');
  
  // 5. Verify status changed to "received"
  await expect(page.locator('[data-testid="status-badge"]')).toContainText('Received');
});
Edge Case Tests
Test z pustymi wartościami: markShipped bez actual_ship_date → błąd
Test z maksymalnymi wartościami: qty_moved = qty_planned → OK
Test z qty_moved > qty_planned → błąd
Test współbieżności: dwa użytkownicy próbują markShipped tego samego TO → jeden wygrywa (DB lock)
Test uprawnień RLS: rola Operator próbuje markShipped → blocked (jeśli RLS nie pozwala)
Test date constraint: planned_receive < planned_ship → DB error
Test workflow violation: markShipped z draft → błąd, markReceived z submitted → błąd
DoD (Definition of Done)
[ ] Wszystkie testy przechodzą (unit + integration + UI)
[ ] TypeScript kompiluje się bez błędów (tsc --noEmit)
[ ] Linter przechodzi bez błędów (npm run lint)
[ ] RLS policies działają i są przetestowane (Warehouse, Planner mogą ship/receive)
[ ] UI jest w stylu Filament (spójny z resztą aplikacji)
[ ] Wszystkie edge cases są obsłużone (status violations, date validations, qty_moved > qty_planned)
[ ] Commits używają Conventional Commits (feat(wh): add mark shipped/received actions)
[ ] Migration 051 ma sekcje UP i DOWN
[ ] API ma proper error handling (try/catch, toast messages)
[ ] Loading states są zaimplementowane (przyciski disabled podczas API calls)
[ ] Toast notifications dla akcji użytkownika ("Marked as shipped", "Marked as received", errory)
[ ] TransferOrdersTable pokazuje 4 kolumny dat (planned_ship, actual_ship, planned_receive, actual_receive)
[ ] Location hierarchy fix: UI pokazuje Warehouse → Location (np. WH-MAIN / A-01-02)
[ ] Status workflow enforced: draft → submitted → in_transit → received (nie można pominąć)
[ ] Walidacje dat: planned_receive >= planned_ship (UI + DB constraint)
[ ] Dokumentacja zaktualizowana: komentarze w migration 051, API docs (jeśli istnieją)
Risks & Notes
Risks
Risk 1: Migracje 049, 050 już dodały kolumny - może być konflikt jeśli zmienimy schemat
Mitigation: Wykorzystać istniejące kolumny, tylko dodać RPC functions w migration 051
Risk 2: RLS może blokować update to_header.status dla ról Warehouse
Mitigation: Sprawdzić istniejące polityki w migration 035, dodać nowe jeśli potrzeba
Risk 3: Warehouse/Location hierarchy - może nie być warehouse_id w locations dla starych rekordów
Mitigation: UI fallback - jeśli brak parent warehouse, pokazać tylko location name
Risk 4: Użytkownik może próbować edytować TO po received status
Mitigation: UI disable edit/delete dla statusów received, closed, cancelled
Risk 5: Concurrent updates: dwa użytkowników próbuje markShipped/markReceived
Mitigation: RPC functions używają FOR UPDATE lock
Technical Debt
Stare tabele transfer_orders, transfer_order_items mogą być deprecated - należy używać to_header, to_line
API compatibility: TransferOrdersAPI.getAll() mapuje TOHeader → TransferOrder dla backward compatibility (sprawdzić czy zachować)
Future Improvements
Faza 2: Scanner integration - scan_required flag w to_line pozwoli wymuszać skanowanie LP
Faza 3: Stock reconciliation - dodać funkcję close_transfer_order która weryfikuje qty_moved vs stock moves
Faza 4: Partial receives - pozwolić markReceived z qty_moved < qty_planned, status → partially_received
Performance: jeśli TO ma dużo linii (>100), rozważyć paginację w markReceived modal
Links
Related Issue: #003
Related Plan: docs/plan/003--PLAN--to-ship-receive-tracking--p0.md (ten plik)
Database Schema: apps/frontend/lib/supabase/migrations/034_phase1_planning_schema.sql
Migration 049 (dates): apps/frontend/lib/supabase/migrations/049_to_shipping_dates.sql
Migration 050 (lp/batch): apps/frontend/lib/supabase/migrations/050_to_line_tracking.sql
Existing RLS: apps/frontend/lib/supabase/migrations/035_phase1_planning_rls.sql
TransferOrdersAPI: apps/frontend/lib/api/transferOrders.ts
Types: apps/frontend/lib/types.ts