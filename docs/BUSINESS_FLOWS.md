# Business Process Flows

## Overview
This document describes the key business processes in the MonoPilot MES system, including user interactions, API calls, database operations, and state changes.

## Core Business Flows

### 1. Product Creation and BOM Setup

**Process**: Create new product with bill of materials and routing

**Participants**: Technical User, System

**Flow**:
```mermaid
sequenceDiagram
    participant U as Technical User
    participant UI as BOM Page
    participant API as ProductsAPI
    participant R as RoutingsAPI
    participant DB as Database
    
    U->>UI: Navigate to /technical/bom
    UI->>API: getAll() - Load existing products
    API->>DB: SELECT * FROM products
    DB-->>API: Return products
    API-->>UI: Return products list
    UI-->>U: Display products table
    
    U->>UI: Click "Add Product"
    UI->>UI: Open AddItemModal
    U->>UI: Fill product details
    U->>UI: Add BOM items
    U->>UI: Configure routing operations
    U->>UI: Click "Save"
    
    UI->>API: create(productData)
    API->>DB: INSERT INTO products
    DB-->>API: Return product ID
    API->>DB: INSERT INTO boms
    DB-->>API: Return BOM ID
    
    loop For each BOM item
        API->>DB: INSERT INTO bom_items
    end
    
    API->>R: createRouting(routingData)
    R->>DB: INSERT INTO routings
    DB-->>R: Return routing ID
    
    loop For each operation
        R->>DB: INSERT INTO routing_operations
    end
    
    R-->>API: Return routing data
    API-->>UI: Return created product
    UI-->>U: Show success message
    UI->>UI: Refresh products table
```

**Database Operations**:
- `INSERT INTO products` - Create product
- `INSERT INTO boms` - Create BOM
- `INSERT INTO bom_items` - Create BOM items
- `INSERT INTO routings` - Create routing
- `INSERT INTO routing_operations` - Create operations

**Business Rules**:
- Product part number must be unique
- BOM items must reference valid materials
- Routing operations must be sequential
- Allergen inheritance from components

### 2. Work Order Creation and Execution

**Process**: Create work order and execute production

**Participants**: Planner, Operator, System

**Flow**:
```mermaid
sequenceDiagram
    participant P as Planner
    participant UI as Planning Page
    participant WO as WorkOrdersAPI
    participant DB as Database
    participant O as Operator
    participant S as Scanner
    
    P->>UI: Navigate to /planning
    UI->>WO: getAll() - Load work orders
    WO->>DB: SELECT * FROM work_orders
    DB-->>WO: Return work orders
    WO-->>UI: Return work orders list
    UI-->>P: Display work orders table
    
    P->>UI: Click "Create Work Order"
    UI->>UI: Open CreateWorkOrderModal
    P->>UI: Select product and quantity
    P->>UI: Set due date and machine
    P->>UI: Click "Create"
    
    UI->>WO: create(woData)
    WO->>DB: Validate product exists
    WO->>DB: Get BOM for product
    WO->>DB: INSERT INTO work_orders
    DB-->>WO: Return WO ID
    
    loop For each BOM item
        WO->>DB: INSERT INTO wo_materials
    end
    
    WO->>DB: Get routing operations
    loop For each operation
        WO->>DB: INSERT INTO wo_operations
    end
    
    WO-->>UI: Return created WO
    UI-->>P: Show success message
    
    Note over P,O: Work Order Released
    
    O->>S: Navigate to /scanner/process
    S->>WO: getWorkOrderStageStatus(woId)
    WO->>DB: Query wo_operations
    DB-->>WO: Return operations
    WO-->>S: Return stage status
    S-->>O: Display operations
    
    O->>S: Start operation
    S->>WO: completeOperation(woId, seq, data)
    WO->>DB: UPDATE wo_operations SET status='completed'
    WO->>DB: INSERT INTO production_outputs
    WO-->>S: Return success
    S-->>O: Show completion status
```

**Database Operations**:
- `INSERT INTO work_orders` - Create work order
- `INSERT INTO wo_materials` - Create material requirements
- `INSERT INTO wo_operations` - Create operations
- `UPDATE wo_operations` - Complete operations
- `INSERT INTO production_outputs` - Record yield

**Business Rules**:
- Work order requires valid BOM
- Operations must be sequential
- One-to-one components consume entire LP
- QA status blocks operations

### 3. Purchase Order to GRN Process

**Process**: Create purchase order and receive goods

**Participants**: Purchasing User, Warehouse User, System

**Flow**:
```mermaid
sequenceDiagram
    participant PU as Purchasing User
    participant UI as Planning Page
    participant PO as PurchaseOrdersAPI
    participant DB as Database
    participant WU as Warehouse User
    participant WUI as Warehouse Page
    participant G as GRNsAPI
    participant L as LicensePlatesAPI
    
    PU->>UI: Navigate to /planning
    UI->>PO: getAll() - Load purchase orders
    PO->>DB: SELECT * FROM purchase_orders
    DB-->>PO: Return purchase orders
    PO-->>UI: Return purchase orders list
    UI-->>PU: Display purchase orders table
    
    PU->>UI: Click "Create Purchase Order"
    UI->>UI: Open CreatePurchaseOrderModal
    PU->>UI: Select supplier and items
    PU->>UI: Set quantities and dates
    PU->>UI: Click "Create"
    
    UI->>PO: create(poData)
    PO->>DB: INSERT INTO purchase_orders
    DB-->>PO: Return PO ID
    
    loop For each item
        PO->>DB: INSERT INTO purchase_order_items
    end
    
    PO-->>UI: Return created PO
    UI-->>PU: Show success message
    
    Note over PU,WU: Goods Delivered
    
    WU->>WUI: Navigate to /warehouse
    WUI->>G: getAll() - Load GRNs
    G->>DB: SELECT * FROM grns
    DB-->>G: Return GRNs
    G-->>WUI: Return GRNs list
    WUI-->>WU: Display GRNs table
    
    WU->>WUI: Click "Create GRN"
    WUI->>WUI: Open CreateGRNModal
    WU->>WUI: Select purchase order
    WU->>WUI: Enter received quantities
    WU->>WUI: Click "Create"
    
    WUI->>G: create(grnData)
    G->>DB: Validate PO exists
    G->>DB: INSERT INTO grns
    DB-->>G: Return GRN ID
    
    loop For each item
        G->>DB: INSERT INTO grn_items
        G->>L: createLicensePlate(item)
        L->>DB: INSERT INTO license_plates
        DB-->>L: Return LP ID
    end
    
    G-->>WUI: Return created GRN
    WUI-->>WU: Show success message
    WUI->>WUI: Refresh GRNs table
```

**Database Operations**:
- `INSERT INTO purchase_orders` - Create purchase order
- `INSERT INTO purchase_order_items` - Create PO items
- `INSERT INTO grns` - Create GRN
- `INSERT INTO grn_items` - Create GRN items
- `INSERT INTO license_plates` - Create license plates

**Business Rules**:
- GRN must reference valid PO
- Received quantities cannot exceed ordered
- License plates track material batches
- QA status assigned to new LPs

### 4. Production Execution with Scanner

**Process**: Execute production operations using scanner interface

**Participants**: Operator, System

**Flow**:
```mermaid
sequenceDiagram
    participant O as Operator
    participant S as Scanner Interface
    participant WO as WorkOrdersAPI
    participant SC as ScannerAPI
    participant DB as Database
    participant Y as YieldAPI
    
    O->>S: Navigate to /scanner/process
    S->>WO: getWorkOrderStageStatus(woId)
    WO->>DB: SELECT * FROM wo_operations WHERE wo_id = ?
    DB-->>WO: Return operations
    WO-->>S: Return stage status
    S-->>O: Display operations board
    
    O->>S: Select operation to start
    S->>SC: startOperation(woId, seq)
    SC->>DB: UPDATE wo_operations SET status='in_progress'
    SC-->>S: Return success
    S-->>O: Show operation started
    
    O->>S: Scan input LP
    S->>SC: validateLP(lpNumber)
    SC->>DB: SELECT * FROM license_plates WHERE lp_number = ?
    DB-->>SC: Return LP data
    SC->>SC: Validate LP status and product
    SC-->>S: Return validation result
    
    alt LP Valid
        S->>SC: stageMaterial(woId, seq, lpId)
        SC->>DB: INSERT INTO lp_reservations
        SC-->>S: Return success
        S-->>O: Show material staged
    else LP Invalid
        S-->>O: Show error message
    end
    
    O->>S: Enter output quantities
    O->>S: Click "Complete Operation"
    S->>SC: completeOperation(woId, seq, data)
    SC->>DB: UPDATE wo_operations SET status='completed'
    SC->>Y: recordYield(woId, seq, data)
    Y->>DB: INSERT INTO production_outputs
    Y-->>SC: Return success
    SC-->>S: Return success
    S-->>O: Show operation completed
    
    S->>WO: getWorkOrderStageStatus(woId)
    WO->>DB: Query updated operations
    DB-->>WO: Return updated status
    WO-->>S: Return stage status
    S-->>O: Update operations board
```

**Database Operations**:
- `SELECT FROM wo_operations` - Get operations
- `UPDATE wo_operations` - Update operation status
- `INSERT INTO lp_reservations` - Reserve materials
- `INSERT INTO production_outputs` - Record yield

**Business Rules**:
- Sequential operation execution
- One-to-one component validation
- QA status enforcement
- Reservation safety checks

### 5. Traceability Query Process

**Process**: Trace materials forward or backward through production

**Participants**: User, System

**Flow**:
```mermaid
sequenceDiagram
    participant U as User
    participant UI as Trace Interface
    participant T as TraceabilityAPI
    participant DB as Database
    
    U->>UI: Navigate to trace interface
    U->>UI: Enter LP number
    U->>UI: Select direction (forward/backward)
    U->>UI: Click "Trace"
    
    UI->>T: traceLP(lpNumber, direction)
    T->>DB: SELECT * FROM license_plates WHERE lp_number = ?
    DB-->>T: Return LP data
    
    alt Forward Trace
        T->>DB: SELECT * FROM lp_genealogy WHERE parent_lp_id = ?
        DB-->>T: Return child LPs
        loop For each child LP
            T->>DB: SELECT * FROM lp_compositions WHERE lp_id = ?
            DB-->>T: Return compositions
        end
    else Backward Trace
        T->>DB: SELECT * FROM lp_genealogy WHERE child_lp_id = ?
        DB-->>T: Return parent LPs
        loop For each parent LP
            T->>DB: SELECT * FROM lp_compositions WHERE lp_id = ?
            DB-->>T: Return compositions
        end
    end
    
    T->>T: Build trace tree
    T-->>UI: Return trace data
    UI-->>U: Display trace tree
    
    U->>UI: Click on LP in tree
    UI->>T: getLPDetails(lpId)
    T->>DB: SELECT * FROM license_plates WHERE id = ?
    DB-->>T: Return LP details
    T-->>UI: Return LP details
    UI-->>U: Show LP details modal
```

**Database Operations**:
- `SELECT FROM license_plates` - Get LP data
- `SELECT FROM lp_genealogy` - Get parent/child relationships
- `SELECT FROM lp_compositions` - Get LP compositions

**Business Rules**:
- Trace chain integrity
- Direction-based traversal
- Data visualization

## Error Handling Flows

### API Error Handling
```mermaid
sequenceDiagram
    participant C as Component
    participant API as API Class
    participant DB as Database
    
    C->>API: makeRequest()
    API->>DB: Execute query
    
    alt Success
        DB-->>API: Return data
        API-->>C: Return success
    else Database Error
        DB-->>API: Return error
        API->>API: Log error
        API-->>C: Return error
        C->>C: Show error message
    else Network Error
        API->>API: Retry logic
        alt Retry Success
            API-->>C: Return data
        else Retry Failed
            API-->>C: Return error
            C->>C: Show error message
        end
    end
```

### Validation Error Handling
```mermaid
sequenceDiagram
    participant U as User
    participant F as Form
    participant V as Validator
    participant API as API
    
    U->>F: Submit form
    F->>V: validateFormData(data)
    
    alt Validation Passed
        V-->>F: Return valid
        F->>API: submitData(data)
        API-->>F: Return success
        F-->>U: Show success message
    else Validation Failed
        V-->>F: Return errors
        F-->>U: Show validation errors
        U->>F: Fix errors
        U->>F: Resubmit form
    end
```

## State Management Flows

### Real-time Updates
```mermaid
sequenceDiagram
    participant DB as Database
    participant S as Supabase
    participant C as Client
    participant UI as Component
    
    DB->>DB: Data change
    DB->>S: Trigger realtime event
    S->>C: Send update
    C->>C: Update local state
    C->>UI: Trigger re-render
    UI->>UI: Update display
```

### Optimistic Updates
```mermaid
sequenceDiagram
    participant U as User
    participant UI as Component
    participant API as API
    participant DB as Database
    
    U->>UI: Perform action
    UI->>UI: Update UI optimistically
    UI->>API: Send request
    
    alt Success
        API->>DB: Update data
        DB-->>API: Return success
        API-->>UI: Return success
        UI->>UI: Confirm optimistic update
    else Failure
        API-->>UI: Return error
        UI->>UI: Revert optimistic update
        UI-->>U: Show error message
    end
```

## Performance Considerations

### Data Loading Patterns
- Server-side data fetching for initial load
- Client-side caching with SWR
- Background revalidation
- Pagination for large datasets

### Error Recovery
- Retry logic for transient errors
- Fallback data for critical failures
- User-friendly error messages
- Graceful degradation

## See Also

- [System Overview](SYSTEM_OVERVIEW.md) - High-level system architecture
- [API Reference](API_REFERENCE.md) - API documentation
- [Page Reference](PAGE_REFERENCE.md) - Page mappings
- [Component Reference](COMPONENT_REFERENCE.md) - Component documentation
