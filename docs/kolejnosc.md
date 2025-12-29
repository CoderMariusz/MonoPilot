KOLEJNOŚĆ IMPLEMENTACJI

  FAZA 1: Epic 01 Settings - Dokończenie (~2 dni)

  Status: 14/14 stories + 4 extension

  | Story        | Status | Co pozostało               |
  |--------------|--------|----------------------------|
  | 01.3         | 90%    | 4 RED tests (expected)     |
  | 01.6         | 96.5%  | 11 permission matrix fixes |
  | 01.7         | 0%     | Module Toggles - TO START  |
  | 01.15, 01.16 | 90%    | Apply migrations           |

  Priorytet: Zaaplikuj migracje i dokończ 01.7

  ---
  FAZA 2: Epic 02 Technical - Kompletny (~12-15 dni)

  Status: 28% (02.8 = 95%)

  Sprint 2.1: Products Foundation

  | Story | Nazwa                 | Complexity | Zależności |
  |-------|-----------------------|------------|------------|
  | 02.1  | Products CRUD + Types | M          | 01.1 ✅    |
  | 02.2  | Product Versioning    | S          | 02.1       |
  | 02.3  | Product Allergens     | M          | 02.1       |

  Sprint 2.2: BOMs Core

  | Story | Nazwa                     | Complexity | Zależności |
  |-------|---------------------------|------------|------------|
  | 02.4  | BOMs CRUD + Date Validity | M          | 02.1       |
  | 02.5  | BOM Items Management      | L          | 02.4, 02.7 |
  | 02.6  | BOM Alternatives + Clone  | M          | 02.4, 02.5 |

  Sprint 2.3: Routings + Costing

  | Story | Nazwa              | Complexity | Zależności      |
  |-------|--------------------|------------|-----------------|
  | 02.7  | Routings CRUD      | M          | 01.1            |
  | 02.8  | Routing Operations | L          | 02.7 - 95% DONE |
  | 02.9  | BOM-Routing Costs  | M          | 02.5, 02.8      |

  Sprint 2.4: Traceability + Dashboard

  | Story  | Nazwa                  | Complexity | Zależności         |
  |--------|------------------------|------------|--------------------|
  | 02.10a | Traceability Config    | M          | 02.1               |
  | 02.11  | Shelf Life Calculation | M          | 02.1, 02.4, 02.10a |
  | 02.12  | Technical Dashboard    | M          | 02.1, 02.4         |

  Sprint 2.5: Nutrition + Advanced

  | Story | Nazwa                   | Complexity | Zależności |
  |-------|-------------------------|------------|------------|
  | 02.13 | Nutrition Calculation   | L          | 02.5       |
  | 02.14 | BOM Advanced Features   | M          | 02.6       |
  | 02.15 | Cost History + Variance | S          | 02.9       |

  ⏸️ DEFERRED: 02.10b (Traceability Queries) → po Epic 05

  ---
  FAZA 3: Epic 03 Planning MVP (~14-18 dni)

  Status: 0% - stories TO CREATE

  Sprint 3.1: Foundation

  | Story | Nazwa                       | Complexity | Zależności |
  |-------|-----------------------------|------------|------------|
  | 03.16 | Planning Settings           | M          | 01.1       |
  | 03.1  | Suppliers CRUD              | M          | 03.16      |
  | 03.2  | Supplier-Product Assignment | M          | 03.1, 02.1 |

  Sprint 3.2: Purchase Orders

  | Story | Nazwa            | Complexity | Zależności          |
  |-------|------------------|------------|---------------------|
  | 03.3  | PO CRUD + Lines  | L          | 03.2, warehouses ✅ |
  | 03.4  | Bulk PO Creation | M          | 03.3                |

  Sprint 3.3: Transfer Orders

  | Story | Nazwa                | Complexity | Zależności                 |
  |-------|----------------------|------------|----------------------------|
  | 03.8  | TO CRUD + Lines      | L          | 03.16, 02.1, warehouses ✅ |
  | 03.9a | TO Partial Shipments | S          | 03.8                       |

  Sprint 3.4: Work Orders

  | Story  | Nazwa                       | Complexity | Zależności        |
  |--------|-----------------------------|------------|-------------------|
  | 03.10  | WO CRUD + BOM Auto-Select   | L          | 02.4 (BOMs), 02.7 |
  | 03.11a | WO Materials (BOM Snapshot) | L          | 03.10, 02.5       |
  | 03.12  | WO Operations Copy          | M          | 03.10, 02.8       |

  Sprint 3.5: Dashboard + Approval

  | Story | Nazwa                | Complexity | Zależności        |
  |-------|----------------------|------------|-------------------|
  | 03.15 | Planning Dashboard   | M          | 03.3, 03.8, 03.10 |
  | 03.5a | PO Approval Setup    | S          | 03.3              |
  | 03.5b | PO Approval Workflow | M          | 03.5a             |

  ⏸️ DEFERRED (po Epic 05):
  - 03.9b: TO LP Pre-Selection
  - 03.11b: WO Material Reservation
  - 03.13: WO Material Availability
  - 03.14: WO Gantt Chart

  ---
  FAZA 4: Epic 04 Production (~10-14 dni)

  Zależność: Epic 03 (Work Orders)

  | Priorytet | Stories    | Opis                              |
  |-----------|------------|-----------------------------------|
  | MVP       | 04.1-04.8  | WO Execution, Consumption, Output |
  | Phase 1   | 04.9-04.12 | Yield, Pauses, Batch tracking     |

  ---
  FAZA 5: Epic 05 Warehouse (~14-18 dni)

  Zależność: Epic 03 (PO, TO), Epic 04 (Production)

  | Priorytet | Stories     | Opis                                 |
  |-----------|-------------|--------------------------------------|
  | MVP       | 05.1-05.10  | License Plates, GRN, Stock movements |
  | Phase 1   | 05.11-05.15 | FIFO/FEFO, Cycle counting            |

  ---
  FAZA 6: Deferred Stories

  Po Epic 05

  | Story  | Epic      | Opis                             |
  |--------|-----------|----------------------------------|
  | 02.10b | Technical | Traceability Queries & Genealogy |
  | 03.9b  | Planning  | TO LP Pre-Selection              |
  | 03.11b | Planning  | WO Material Reservation          |
  | 03.13  | Planning  | WO Material Availability         |

  ---
  📊 PODSUMOWANIE KRYTYCZNEJ ŚCIEŻKI

  01.1 (done) → 02.1 → 02.4 → 02.5 → 03.10 → 03.11a → 04.x → 05.x
                  ↓       ↓
                02.7 → 02.8 (95%) → 03.12
                          ↓
                        02.9

  ---
  ✅ ODPOWIEDŹ NA TWOJE PYTANIE:

  TAK - musisz zaimplementować część Planning (Epic 03) PRZED Warehouse MODULE (Epic 05), bo:

  1. Epic 05 (Warehouse) potrzebuje:
    - PO (Purchase Orders) do receiving
    - TO (Transfer Orders) do ship/receive
    - WO (Work Orders) do production output
  2. Ale Planning (Epic 03) potrzebuje:
    - Products (02.1) ✅
    - BOMs (02.4) - dla Work Orders
    - Routings (02.7, 02.8) - dla WO Operations
    - warehouses table - MASZ JUŻ W DB!

  Kolejność krytyczna:
  Epic 01 (fix) → Epic 02 (all) → Epic 03 (MVP) → Epic 04 → Epic 05