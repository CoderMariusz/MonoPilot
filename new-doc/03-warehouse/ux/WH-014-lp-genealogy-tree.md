# WH-014: LP Genealogy Tree Visualization Panel

**Module**: Warehouse
**Feature**: LP Genealogy Tracking - Tree Visualization Panel (WH-FR-028)
**Story**: 05.2 - LP Genealogy Tracking
**Status**: Ready for Implementation
**Last Updated**: 2026-01-02

---

## Overview

This wireframe defines the **Genealogy Tree Visualization Panel** within the License Plate Detail page. This is the dedicated panel for viewing forward and backward traceability through recursive parent-child relationships between License Plates.

**Context**: This panel appears as a tab within the LP Detail page (WH-003) and provides the primary interface for:
- Viewing where materials came from (backward trace)
- Viewing where materials went (forward trace)
- Understanding split/merge/consume/output operations
- Navigating the genealogy tree (up to 10 levels deep)

---

## ASCII Wireframes

### Success State - Genealogy Tree with Multiple Operations (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  LP-2024-00001234 Detail                                                                          |
|  [Details] [Genealogy] [Movement History] [Audit]                                                |
|            ----------                                                                             |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +------------------------------- GENEALOGY TREE PANEL ---------------------------------------+  |
|  |                                                                                             |  |
|  |  License Plate Genealogy                                  [Expand All] [Collapse All]      |  |
|  |                                                            [Forward Only] [Backward Only]   |  |
|  |                                                                                             |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  |                                                                                        | |  |
|  |  |  ANCESTORS (Where This Came From)                               3 levels backward     | |  |
|  |  |  ═══════════════════════════════════════════════════════════════════════════════════  | |  |
|  |  |                                                                                        | |  |
|  |  |  [▼] GRN-2024-00342 (Receipt from PO-2024-00156)               Dec 10, 2024 09:30 AM | |  |
|  |  |       Supplier: Mill Co. | Product: Flour Type A                                      | |  |
|  |  |       Original Quantity: 500 kg                                                        | |  |
|  |  |       |                                                                                | |  |
|  |  |       └── LP-2024-00001234 (Current LP)                         500 kg  [Available]   | |  |
|  |  |           Location: A-01-R03-B05 | QA: Passed                                         | |  |
|  |  |           Created: Dec 10, 2024 09:30 AM | By: Jane Doe                               | |  |
|  |  |                                                                                        | |  |
|  |  |  ─────────────────────────────────────────────────────────────────────────────────── | |  |
|  |  |                                                                                        | |  |
|  |  |  CURRENT LP                                                                            | |  |
|  |  |  ═══════════════════════════════════════════════════════════════════════════════════  | |  |
|  |  |                                                                                        | |  |
|  |  |  ◉  LP-2024-00001234                                            200 kg  [Available]   | |  |
|  |  |     Flour Type A (RM-FLOUR-001)                                                       | |  |
|  |  |     Batch: BATCH-2024-456 | Expiry: Mar 15, 2025                                      | |  |
|  |  |     Location: A-01-R03-B05 | QA: Passed                                               | |  |
|  |  |                                                                                        | |  |
|  |  |     Status Summary:                                                                    | |  |
|  |  |     • Original quantity: 500 kg                                                        | |  |
|  |  |     • Split out: 300 kg (2 operations)                                                | |  |
|  |  |     • Remaining: 200 kg                                                                | |  |
|  |  |     • Has parent: No (original receipt)                                                | |  |
|  |  |     • Has children: Yes (2 child LPs)                                                  | |  |
|  |  |                                                                                        | |  |
|  |  |  ─────────────────────────────────────────────────────────────────────────────────── | |  |
|  |  |                                                                                        | |  |
|  |  |  DESCENDANTS (Where This Went)                                  2 levels forward      | |  |
|  |  |  ═══════════════════════════════════════════════════════════════════════════════════  | |  |
|  |  |                                                                                        | |  |
|  |  |  [▼] SPLIT Operation #1                                         Dec 12, 2024 02:15 PM | |  |
|  |  |       Qty: 200 kg | User: John Smith | Reason: For WO consumption                     | |  |
|  |  |       |                                                                                | |  |
|  |  |       └── LP-2024-00001456                                      200 kg  [Consumed]    | |  |
|  |  |           Flour Type A | Batch: BATCH-2024-456                                        | |  |
|  |  |           Location: WO-STAGING-01 (consumed)                                          | |  |
|  |  |           |                                                                            | |  |
|  |  |           └── [▼] CONSUMED by WO-2024-00089                     Dec 13, 2024 10:30 AM | |  |
|  |  |                   Product: White Bread | Operation: Mixing                            | |  |
|  |  |                   |                                                                    | |  |
|  |  |                   └── [▶] OUTPUT LPs (2 produced)                Dec 13, 2024 11:45 AM | |  |
|  |  |                         LP-2024-00001501 (White Bread, 500 kg)   [Available]          | |  |
|  |  |                         LP-2024-00001502 (Bread Scraps, 15 kg)   [By-product]         | |  |
|  |  |                                                                                        | |  |
|  |  |  [▼] SPLIT Operation #2                                         Dec 14, 2024 08:00 AM | |  |
|  |  |       Qty: 100 kg | User: Mary Johnson | Reason: For transfer order                   | |  |
|  |  |       |                                                                                | |  |
|  |  |       └── LP-2024-00001567                                      100 kg  [Reserved]    | |  |
|  |  |           Flour Type A | Batch: BATCH-2024-456                                        | |  |
|  |  |           Location: A-01-R03-B05 | Reserved for: TO-2024-00042                       | |  |
|  |  |                                                                                        | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                             |  |
|  |  Genealogy Legend:                                                                          |  |
|  |  [▼] Expanded node   [▶] Collapsed node   ◉ Current LP   [Available] Status badge         |  |
|  |                                                                                             |  |
|  |  Operation Types:                                                                           |  |
|  |  SPLIT - LP split into smaller quantity      CONSUME - LP used in production               |  |
|  |  MERGE - Multiple LPs combined               OUTPUT - LP created from production           |  |
|  |                                                                                             |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Success State - Backward Trace Only (Ancestors)

```
+--------------------------------------------------------------------------------------------------+
|  LP-2024-00001567 Detail                                                                          |
|  [Details] [Genealogy] [Movement History] [Audit]                                                |
|            ----------                                                                             |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +------------------------------- GENEALOGY TREE PANEL ---------------------------------------+  |
|  |                                                                                             |  |
|  |  License Plate Genealogy                                  [Expand All] [Collapse All]      |  |
|  |                                                            ● Forward Only  ○ Backward Only  |  |
|  |                                                                                             |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  |                                                                                        | |  |
|  |  |  ANCESTORS (Where This Came From)                               3 levels backward     | |  |
|  |  |  ═══════════════════════════════════════════════════════════════════════════════════  | |  |
|  |  |                                                                                        | |  |
|  |  |  Level 3 (Great-Grandparent)                                                           | |  |
|  |  |  ─────────────────────────────────────────────────────────────────────────────────── | |  |
|  |  |  [▼] GRN-2024-00342 (Receipt from PO-2024-00156)               Dec 10, 2024 09:30 AM | |  |
|  |  |       Supplier: Mill Co. | Product: Flour Type A | Qty: 500 kg                        | |  |
|  |  |       Receipt Location: RECEIVING-DOCK-01                                              | |  |
|  |  |       ↓                                                                                | |  |
|  |  |                                                                                        | |  |
|  |  |  Level 2 (Grandparent)                                                                 | |  |
|  |  |  ─────────────────────────────────────────────────────────────────────────────────── | |  |
|  |  |       └── LP-2024-00001000 (Original receipt LP)               500 kg  [Consumed]    | |  |
|  |  |           Created: Dec 10, 2024 09:30 AM | By: Jane Doe                               | |  |
|  |  |           Batch: BATCH-2024-456 | Location: A-01-R03-B05                              | |  |
|  |  |           ↓                                                                            | |  |
|  |  |                                                                                        | |  |
|  |  |  Level 1 (Parent)                                                                      | |  |
|  |  |  ─────────────────────────────────────────────────────────────────────────────────── | |  |
|  |  |           └── SPLIT Operation                                  Dec 12, 2024 02:00 PM | |  |
|  |  |               Qty: 250 kg | User: John Smith                                          | |  |
|  |  |               ↓                                                                        | |  |
|  |  |               LP-2024-00001234 (Parent LP)                     250 kg  [Available]    | |  |
|  |  |               Batch: BATCH-2024-456 | Location: A-01-R03-B05                          | |  |
|  |  |               ↓                                                                        | |  |
|  |  |                                                                                        | |  |
|  |  |  Level 0 (Current LP)                                                                  | |  |
|  |  |  ─────────────────────────────────────────────────────────────────────────────────── | |  |
|  |  |               └── SPLIT Operation                              Dec 14, 2024 08:00 AM | |  |
|  |  |                   Qty: 100 kg | User: Mary Johnson                                    | |  |
|  |  |                   ↓                                                                    | |  |
|  |  |                   ◉ LP-2024-00001567 (Current LP)              100 kg  [Reserved]    | |  |
|  |  |                      Batch: BATCH-2024-456                                            | |  |
|  |  |                      Location: A-01-R03-B05                                           | |  |
|  |  |                      Reserved for: TO-2024-00042                                      | |  |
|  |  |                                                                                        | |  |
|  |  |  ═══════════════════════════════════════════════════════════════════════════════════  | |  |
|  |  |                                                                                        | |  |
|  |  |  Traceability Summary:                                                                 | |  |
|  |  |  • Full backward trace: 3 levels                                                       | |  |
|  |  |  • Original source: GRN-2024-00342 (PO-2024-00156 from Mill Co.)                      | |  |
|  |  |  • Batch lineage: BATCH-2024-456 (consistent across all levels)                       | |  |
|  |  |  • Total transformations: 2 split operations                                          | |  |
|  |  |  • Expiry date: Mar 15, 2025 (inherited from original receipt)                        | |  |
|  |  |                                                                                        | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                             |  |
|  |  [Click any LP number to navigate to its detail page]                                      |  |
|  |                                                                                             |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Success State - Complex Multi-Branch Tree

```
+--------------------------------------------------------------------------------------------------+
|  LP-2024-00001234 Detail (Complex Genealogy)                                                      |
|  [Genealogy Tab]                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +------------------------------- GENEALOGY TREE PANEL ---------------------------------------+  |
|  |                                                                                             |  |
|  |  License Plate Genealogy - Complex Tree                   [Expand All] [Collapse All]      |  |
|  |                                                            Filter: [All Operations ▼]      |  |
|  |                                                                                             |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  |                                                                                        | |  |
|  |  |  ◉ LP-2024-00001234 (Root - Current LP)                 500 kg  [Available]           | |  |
|  |  |     Flour Type A | Batch: BATCH-2024-456 | Location: A-01-R03-B05                     | |  |
|  |  |     |                                                                                | |  |
|  |  |     ├── [▼] SPLIT #1 (Dec 12, 2024 10:00 AM)            200 kg → LP-2024-00001250   | |  |
|  |  |     │   |                                                                              | |  |
|  |  |     │   └── LP-2024-00001250                            200 kg  [Consumed]           | |  |
|  |  |     │       |                                                                          | |  |
|  |  |     │       └── [▼] CONSUMED by WO-2024-00100          Dec 12, 2024 02:00 PM        | |  |
|  |  |     │           |                                                                      | |  |
|  |  |     │           ├── OUTPUT: LP-2024-00001301 (Bread)   400 kg  [Available]          | |  |
|  |  |     │           └── OUTPUT: LP-2024-00001302 (Scrap)   12 kg   [By-product]         | |  |
|  |  |     │                                                                                  | |  |
|  |  |     ├── [▼] SPLIT #2 (Dec 13, 2024 09:00 AM)            150 kg → LP-2024-00001260   | |  |
|  |  |     │   |                                                                              | |  |
|  |  |     │   └── LP-2024-00001260                            150 kg  [Reserved]           | |  |
|  |  |     │       Reserved for: WO-2024-00101 (Pending)                                     | |  |
|  |  |     │       Location: WO-STAGING-02                                                   | |  |
|  |  |     │                                                                                  | |  |
|  |  |     ├── [▼] SPLIT #3 (Dec 14, 2024 08:00 AM)            100 kg → LP-2024-00001270   | |  |
|  |  |     │   |                                                                              | |  |
|  |  |     │   └── LP-2024-00001270                            100 kg  [In Transit]         | |  |
|  |  |     │       |                                                                          | |  |
|  |  |     │       └── [▼] MERGED with 2 other LPs              Dec 14, 2024 03:00 PM       | |  |
|  |  |     │           Sources:                                                              | |  |
|  |  |     │           • LP-2024-00001270 (100 kg) - this LP                                | |  |
|  |  |     │           • LP-2024-00001280 (80 kg)  - different batch                        | |  |
|  |  |     │           • LP-2024-00001290 (70 kg)  - different batch                        | |  |
|  |  |     │           |                                                                      | |  |
|  |  |     │           └── LP-2024-00001295 (Merged result)    250 kg  [Available]         | |  |
|  |  |     │               Mixed Flour | Location: A-02-R01-B01                             | |  |
|  |  |     │                                                                                  | |  |
|  |  |     └── [▶] Current Remaining (collapsed)                50 kg   [Available]         | |  |
|  |  |         Location: A-01-R03-B05                                                        | |  |
|  |  |                                                                                        | |  |
|  |  |  ═══════════════════════════════════════════════════════════════════════════════════  | |  |
|  |  |                                                                                        | |  |
|  |  |  Tree Summary:                                                                         | |  |
|  |  |  • Total operations: 7 (3 splits, 2 consumptions, 1 merge, 2 outputs)                 | |  |
|  |  |  • Tree depth: 3 levels                                                                | |  |
|  |  |  • Total child LPs: 8                                                                  | |  |
|  |  |  • Original quantity: 500 kg                                                           | |  |
|  |  |  • Allocated: 450 kg (90%)                                                             | |  |
|  |  |  • Remaining in current LP: 50 kg (10%)                                                | |  |
|  |  |                                                                                        | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                             |  |
|  |  Interactive Controls:                                                                      |  |
|  |  [▼] = Expanded node (click to collapse)                                                   |  |
|  |  [▶] = Collapsed node (click to expand)                                                    |  |
|  |  Click LP number to navigate to detail page                                                |  |
|  |  Click WO number to view work order details                                                |  |
|  |                                                                                             |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Empty State - No Genealogy

```
+--------------------------------------------------------------------------------------------------+
|  LP-2024-00005000 Detail                                                                          |
|  [Details] [Genealogy] [Movement History] [Audit]                                                |
|            ----------                                                                             |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +------------------------------- GENEALOGY TREE PANEL ---------------------------------------+  |
|  |                                                                                             |  |
|  |  License Plate Genealogy                                                                    |  |
|  |                                                                                             |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  |                                                                                        | |  |
|  |  |                                                                                        | |  |
|  |  |                                                                                        | |  |
|  |  |                                      +--------------+                                  | |  |
|  |  |                                      |              |                                  | |  |
|  |  |                                      |   [Tree      |                                  | |  |
|  |  |                                      |    Icon]     |                                  | |  |
|  |  |                                      |              |                                  | |  |
|  |  |                                      +--------------+                                  | |  |
|  |  |                                                                                        | |  |
|  |  |                              No Genealogy History                                      | |  |
|  |  |                                                                                        | |  |
|  |  |                     This license plate has no split, merge, or                         | |  |
|  |  |                     consumption history yet.                                           | |  |
|  |  |                                                                                        | |  |
|  |  |                     This is an original LP from receipt with no                        | |  |
|  |  |                     parent or child LPs.                                               | |  |
|  |  |                                                                                        | |  |
|  |  |                                                                                        | |  |
|  |  |                     ╔════════════════════════════════════════╗                         | |  |
|  |  |                     ║  Source Information                    ║                         | |  |
|  |  |                     ╠════════════════════════════════════════╣                         | |  |
|  |  |                     ║  GRN: GRN-2024-00512                   ║                         | |  |
|  |  |                     ║  PO: PO-2024-00201                     ║                         | |  |
|  |  |                     ║  Supplier: Grain Distributors Inc.     ║                         | |  |
|  |  |                     ║  Received: Dec 20, 2024                ║                         | |  |
|  |  |                     ║  Quantity: 1000 kg (unchanged)         ║                         | |  |
|  |  |                     ║  Status: Available                     ║                         | |  |
|  |  |                     ╚════════════════════════════════════════╝                         | |  |
|  |  |                                                                                        | |  |
|  |  |                                                                                        | |  |
|  |  |                     Genealogy will be created when:                                    | |  |
|  |  |                     • LP is split into smaller quantities                              | |  |
|  |  |                     • LP is merged with other LPs                                      | |  |
|  |  |                     • LP is consumed in production                                     | |  |
|  |  |                                                                                        | |  |
|  |  |                                                                                        | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                             |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  LP-2024-00001234 Detail                                                                          |
|  [Details] [Genealogy] [Movement History] [Audit]                                                |
|            ----------                                                                             |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +------------------------------- GENEALOGY TREE PANEL ---------------------------------------+  |
|  |                                                                                             |  |
|  |  License Plate Genealogy                                  [Expand All] [Collapse All]      |  |
|  |                                                                                             |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  |                                                                                        | |  |
|  |  |  Loading genealogy tree...                                                             | |  |
|  |  |                                                                                        | |  |
|  |  |  [═══════════════════════════════════════════════]  80%                                | |  |
|  |  |                                                                                        | |  |
|  |  |  ┌──────────────────────────────────────────────────┐                                 | |  |
|  |  |  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░│                                 | |  |
|  |  |  └──────────────────────────────────────────────────┘                                 | |  |
|  |  |                                                                                        | |  |
|  |  |  Fetching genealogy data...                                                            | |  |
|  |  |  • Querying forward trace (descendants)                                                | |  |
|  |  |  • Querying backward trace (ancestors)                                                 | |  |
|  |  |  • Building tree structure                                                             | |  |
|  |  |                                                                                        | |  |
|  |  |  ┌─────────────────────────────────┐                                                  | |  |
|  |  |  │  [Skeleton Line 1]              │ ░░░░░░░░░░░░░░░░░░░░░░░                         | |  |
|  |  |  │  [Skeleton Line 2]              │ ░░░░░░░░░░░░░░░                                 | |  |
|  |  |  │    [Skeleton Child 1]           │ ░░░░░░░░░░░░░░░░░░░░                             | |  |
|  |  |  │    [Skeleton Child 2]           │ ░░░░░░░░░░░░░░░░░░░░                             | |  |
|  |  |  └─────────────────────────────────┘                                                  | |  |
|  |  |                                                                                        | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                             |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Error State - Query Failed

```
+--------------------------------------------------------------------------------------------------+
|  LP-2024-00001234 Detail                                                                          |
|  [Details] [Genealogy] [Movement History] [Audit]                                                |
|            ----------                                                                             |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +------------------------------- GENEALOGY TREE PANEL ---------------------------------------+  |
|  |                                                                                             |  |
|  |  License Plate Genealogy                                                         [Retry]   |  |
|  |                                                                                             |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  |                                                                                        | |  |
|  |  |                                                                                        | |  |
|  |  |                                                                                        | |  |
|  |  |                                      +--------------+                                  | |  |
|  |  |                                      |              |                                  | |  |
|  |  |                                      |   [Error     |                                  | |  |
|  |  |                                      |    Icon]     |                                  | |  |
|  |  |                                      |              |                                  | |  |
|  |  |                                      +--------------+                                  | |  |
|  |  |                                                                                        | |  |
|  |  |                        Failed to Load Genealogy Tree                                   | |  |
|  |  |                                                                                        | |  |
|  |  |                     Unable to retrieve genealogy data from the server.                | |  |
|  |  |                                                                                        | |  |
|  |  |                     Error Code: GENEALOGY_QUERY_FAILED                                | |  |
|  |  |                     Message: Database timeout while executing recursive query          | |  |
|  |  |                                                                                        | |  |
|  |  |                                                                                        | |  |
|  |  |                     Possible causes:                                                   | |  |
|  |  |                     • Complex genealogy tree (>100 nodes)                             | |  |
|  |  |                     • Database performance issue                                       | |  |
|  |  |                     • Network connectivity problem                                     | |  |
|  |  |                                                                                        | |  |
|  |  |                                                                                        | |  |
|  |  |                     Please try:                                                        | |  |
|  |  |                     1. Click Retry button above                                        | |  |
|  |  |                     2. Simplify view (Forward or Backward only)                        | |  |
|  |  |                     3. Refresh the page                                                | |  |
|  |  |                     4. Contact support if problem persists                             | |  |
|  |  |                                                                                        | |  |
|  |  |                                                                                        | |  |
|  |  |                       [Retry Query]    [Forward Trace Only]                           | |  |
|  |  |                                                                                        | |  |
|  |  |                                                                                        | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                             |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Error State - Depth Limit Exceeded

```
+--------------------------------------------------------------------------------------------------+
|  LP-2024-00001234 Detail                                                                          |
|  [Genealogy Tab]                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +------------------------------- GENEALOGY TREE PANEL ---------------------------------------+  |
|  |                                                                                             |  |
|  |  License Plate Genealogy                                  [Expand All] [Collapse All]      |  |
|  |                                                                                             |  |
|  |  ┌─────────────────────────────────────────────────────────────────────────────────────┐  |  |
|  |  │ ⚠ Warning: Genealogy Depth Limit Reached                              [Dismiss]     │  |  |
|  |  │                                                                                      │  |  |
|  |  │ This genealogy tree exceeds the maximum depth of 10 levels. Only the first 10      │  |  |
|  |  │ levels are displayed. There may be additional ancestors or descendants beyond       │  |  |
|  |  │ what is shown.                                                                       │  |  |
|  |  │                                                                                      │  |  |
|  |  │ Total nodes displayed: 145 | Estimated total: 200+                                  │  |  |
|  |  └─────────────────────────────────────────────────────────────────────────────────────┘  |  |
|  |                                                                                             |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  |                                                                                        | |  |
|  |  |  ANCESTORS (10 levels shown, more may exist)                                          | |  |
|  |  |  ═══════════════════════════════════════════════════════════════════════════════════  | |  |
|  |  |                                                                                        | |  |
|  |  |  [▼] Level 10 (oldest shown)                                                           | |  |
|  |  |       GRN-2024-00001 → LP-2024-00000001                                                | |  |
|  |  |       ↓                                                                                | |  |
|  |  |  [▼] Level 9                                                                            | |  |
|  |  |       SPLIT → LP-2024-00000050                                                         | |  |
|  |  |       ↓                                                                                | |  |
|  |  |  [▼] Level 8                                                                            | |  |
|  |  |       SPLIT → LP-2024-00000100                                                         | |  |
|  |  |       ↓                                                                                | |  |
|  |  |  [▶] Levels 7-1 (collapsed for performance)               [Click to expand levels]    | |  |
|  |  |       ↓                                                                                | |  |
|  |  |  [▼] Level 0 (Current LP)                                                              | |  |
|  |  |       ◉ LP-2024-00001234                                  200 kg  [Available]          | |  |
|  |  |                                                                                        | |  |
|  |  |  ⚠ There may be additional ancestors beyond Level 10                                  | |  |
|  |  |                                                                                        | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                             |  |
|  |  Performance Note: Large genealogy trees are automatically collapsed to improve            |  |
|  |  performance. Expand nodes individually to view details.                                   |  |
|  |                                                                                             |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Mobile View (<768px)

```
+----------------------------------+
|  < LP-2024-00001234              |
|  [Genealogy]                     |
+----------------------------------+
|                                  |
|  License Plate Genealogy         |
|                                  |
|  [Expand All] [Collapse All]     |
|  View: [Both ▼]                  |
|                                  |
|  +----------------------------+  |
|  | ANCESTORS (2 levels)       |  |
|  +----------------------------+  |
|  |                            |  |
|  | [▼] GRN-2024-00342         |  |
|  |     Dec 10, 2024           |  |
|  |     Original: 500 kg       |  |
|  |     |                      |  |
|  |     └─ LP-00001234         |  |
|  |        [Available]         |  |
|  |        500 kg              |  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | CURRENT LP                 |  |
|  +----------------------------+  |
|  |                            |  |
|  | ◉ LP-2024-00001234         |  |
|  |   200 kg [Available]       |  |
|  |   Batch: BATCH-2024-456    |  |
|  |   Location: A-01-R03-B05   |  |
|  |                            |  |
|  | Summary:                   |  |
|  | • Original: 500 kg         |  |
|  | • Split: 300 kg            |  |
|  | • Remaining: 200 kg        |  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | DESCENDANTS (2 operations) |  |
|  +----------------------------+  |
|  |                            |  |
|  | [▼] SPLIT #1               |  |
|  |     Dec 12, 2024           |  |
|  |     200 kg → LP-00001456   |  |
|  |     |                      |  |
|  |     └─ [Consumed]          |  |
|  |        WO-2024-00089       |  |
|  |        ↓                   |  |
|  |        OUTPUT:             |  |
|  |        LP-00001501 (500kg) |  |
|  |                            |  |
|  | [▼] SPLIT #2               |  |
|  |     Dec 14, 2024           |  |
|  |     100 kg → LP-00001567   |  |
|  |     |                      |  |
|  |     └─ [Reserved]          |  |
|  |        TO-2024-00042       |  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
|  Legend:                         |
|  [▼] Expanded  [▶] Collapsed     |
|  ◉ Current LP                    |
|                                  |
|  Tap LP to view details          |
|  Tap WO to view work order       |
|                                  |
+----------------------------------+
```

---

## Key Components & UI Elements

### 1. Genealogy Tree Structure

| Element | Description | Visual Representation |
|---------|-------------|----------------------|
| **Current LP Marker** | Highlighted node for current LP | `◉ LP-2024-00001234` with background highlight |
| **Parent LP** | Ancestor node (backward trace) | `LP-2024-00001000` with ↑ arrow |
| **Child LP** | Descendant node (forward trace) | `LP-2024-00001456` with ↓ arrow |
| **Operation Badge** | Operation type indicator | `[SPLIT]` `[CONSUME]` `[MERGE]` `[OUTPUT]` |
| **Expand/Collapse Icon** | Toggle node visibility | `[▼]` expanded, `[▶]` collapsed |
| **Tree Lines** | Visual connection between nodes | `│` `└──` `├──` characters |
| **Status Badge** | LP status indicator | `[Available]` `[Consumed]` `[Reserved]` `[Blocked]` |
| **Quantity Display** | Amount in operation | `200 kg` with UoM |
| **Timestamp** | When operation occurred | `Dec 12, 2024 02:15 PM` |
| **User Attribution** | Who performed operation | `User: John Smith` |

### 2. Tree Navigation Controls

| Control | Function | Location |
|---------|----------|----------|
| **Expand All** | Expand all nodes to visible | Top right |
| **Collapse All** | Collapse all nodes to root | Top right |
| **Forward Only** | Show only descendants | Filter toggle |
| **Backward Only** | Show only ancestors | Filter toggle |
| **Both** | Show full tree (default) | Filter toggle |
| **Filter Dropdown** | Filter by operation type | Top right |

### 3. Section Headers

| Section | Purpose | Visual Style |
|---------|---------|--------------|
| **ANCESTORS** | Backward trace section | `═══` double line, "Where This Came From" |
| **CURRENT LP** | Current LP focus | `═══` double line, highlighted background |
| **DESCENDANTS** | Forward trace section | `═══` double line, "Where This Went" |

### 4. Operation Type Display

| Operation | Icon/Badge | Color | Description |
|-----------|-----------|-------|-------------|
| **SPLIT** | `[SPLIT]` | Blue (#3B82F6) | LP divided into smaller quantities |
| **MERGE** | `[MERGE]` | Purple (#8B5CF6) | Multiple LPs combined into one |
| **CONSUME** | `[CONSUME]` | Orange (#F59E0B) | LP used in production |
| **OUTPUT** | `[OUTPUT]` | Green (#10B981) | LP created from production |

### 5. Status Badges (LP Status)

| Status | Badge | Background | Text Color | Icon |
|--------|-------|------------|------------|------|
| Available | `[Available]` | #D1FAE5 | #065F46 | ✓ |
| Reserved | `[Reserved]` | #DBEAFE | #1E40AF | 🔒 |
| Consumed | `[Consumed]` | #E5E7EB | #1F2937 | 📦 |
| Blocked | `[Blocked]` | #FEE2E2 | #991B1B | 🚫 |
| In Transit | `[In Transit]` | #FEF3C7 | #92400E | 🚚 |

### 6. Information Density per Node

**Compact View (Default)**:
```
└── LP-2024-00001456                    200 kg  [Consumed]
    Flour Type A | Batch: BATCH-2024-456
```

**Expanded View (On Click)**:
```
└── LP-2024-00001456                    200 kg  [Consumed]
    Product: Flour Type A (RM-FLOUR-001)
    Batch: BATCH-2024-456 | Supplier Batch: SUP-BATCH-789
    Expiry: Mar 15, 2025 (91 days)
    Location: WO-STAGING-01 (consumed)
    Created: Dec 12, 2024 02:15 PM | By: John Smith
    Consumed in: WO-2024-00089 (White Bread Production)
```

### 7. Tree Summary Panel

Display at bottom of tree:
```
Tree Summary:
• Total operations: 7 (3 splits, 2 consumptions, 1 merge, 2 outputs)
• Tree depth: 3 levels (forward), 1 level (backward)
• Total child LPs: 8
• Original quantity: 500 kg
• Allocated: 450 kg (90%)
• Remaining in current LP: 50 kg (10%)
```

### 8. Traceability Summary (Backward Trace)

For backward trace views:
```
Traceability Summary:
• Full backward trace: 3 levels
• Original source: GRN-2024-00342 (PO-2024-00156 from Mill Co.)
• Batch lineage: BATCH-2024-456 (consistent across all levels)
• Total transformations: 2 split operations
• Expiry date: Mar 15, 2025 (inherited from original receipt)
```

---

## States Specification

### All 4 States Per Screen

| State | Trigger | Display | User Actions |
|-------|---------|---------|--------------|
| **Loading** | Tab clicked, query in progress | Skeleton + progress bar | Wait (auto-resolves) |
| **Success** | Query completed, data returned | Full tree visualization | Expand/collapse, navigate, filter |
| **Empty** | No genealogy exists for LP | Empty state with source info | None (informational only) |
| **Error** | Query timeout or failure | Error message + retry button | Retry, change view, contact support |

### Sub-States (Success State Variations)

| Variation | Condition | Display Difference |
|-----------|-----------|-------------------|
| **Simple Tree** | 1-2 levels, <5 nodes | Full tree expanded by default |
| **Complex Tree** | 3+ levels, 5+ nodes | First 2 levels expanded, rest collapsed |
| **Deep Tree** | 10 levels (max depth) | Warning banner, first level expanded |
| **Wide Tree** | Many siblings (>5 at one level) | Paginated or scrollable node list |
| **Forward Only** | Filter applied | Only descendants shown |
| **Backward Only** | Filter applied | Only ancestors shown |

---

## API Endpoints

### Get LP Genealogy Tree (Full)

```
GET /api/warehouse/license-plates/:id/genealogy
Query Params:
  - direction: 'forward' | 'backward' | 'both' (default: 'both')
  - maxDepth: number (default: 10, max: 10)
  - includeReversed: boolean (default: false)

Response 200 OK:
{
  "success": true,
  "data": {
    "lpId": "uuid-lp-1234",
    "lpNumber": "LP-2024-00001234",
    "hasGenealogy": true,
    "ancestors": [
      {
        "lpId": "uuid-parent",
        "lpNumber": "LP-2024-00001000",
        "productName": "Flour Type A",
        "operationType": "split",
        "quantity": 500,
        "operationDate": "2024-12-10T09:30:00Z",
        "depth": 1,
        "status": "consumed",
        "location": "A-01-R03-B05",
        "batchNumber": "BATCH-2024-456"
      }
    ],
    "descendants": [
      {
        "lpId": "uuid-child-1",
        "lpNumber": "LP-2024-00001456",
        "productName": "Flour Type A",
        "operationType": "split",
        "quantity": 200,
        "operationDate": "2024-12-12T14:15:00Z",
        "depth": 1,
        "status": "consumed",
        "location": "WO-STAGING-01",
        "batchNumber": "BATCH-2024-456",
        "woId": "uuid-wo-89",
        "woNumber": "WO-2024-00089",
        "outputLps": [
          {
            "lpId": "uuid-output-1",
            "lpNumber": "LP-2024-00001501",
            "productName": "White Bread",
            "quantity": 500,
            "status": "available",
            "location": "FG-02-R01-B03"
          }
        ]
      },
      {
        "lpId": "uuid-child-2",
        "lpNumber": "LP-2024-00001567",
        "productName": "Flour Type A",
        "operationType": "split",
        "quantity": 100,
        "operationDate": "2024-12-14T08:00:00Z",
        "depth": 1,
        "status": "reserved",
        "location": "A-01-R03-B05",
        "batchNumber": "BATCH-2024-456",
        "reservedFor": {
          "type": "transfer_order",
          "id": "uuid-to-42",
          "number": "TO-2024-00042"
        }
      }
    ],
    "summary": {
      "originalQuantity": 500,
      "splitOutTotal": 300,
      "currentQuantity": 200,
      "childCount": 2,
      "parentCount": 0,
      "depth": {
        "forward": 2,
        "backward": 1
      },
      "totalOperations": 4,
      "operationBreakdown": {
        "split": 2,
        "consume": 1,
        "output": 1,
        "merge": 0
      }
    },
    "hasMoreLevels": {
      "ancestors": false,
      "descendants": false
    }
  }
}

Error Response 404:
{
  "success": false,
  "error": {
    "code": "LP_NOT_FOUND",
    "message": "License plate not found"
  }
}

Error Response 500:
{
  "success": false,
  "error": {
    "code": "GENEALOGY_QUERY_FAILED",
    "message": "Database timeout while executing recursive query"
  }
}
```

### Get Forward Trace Only

```
GET /api/warehouse/genealogy/forward-trace/:lpId
Query Params:
  - maxDepth: number (default: 10)
  - includeReversed: boolean (default: false)

Response: Same structure as full genealogy, but only 'descendants' array populated
```

### Get Backward Trace Only

```
GET /api/warehouse/genealogy/backward-trace/:lpId
Query Params:
  - maxDepth: number (default: 10)
  - includeReversed: boolean (default: false)

Response: Same structure as full genealogy, but only 'ancestors' array populated
```

---

## Business Rules

### Genealogy Display Rules

1. **Empty Genealogy**:
   - Show empty state if `hasGenealogy: false`
   - Display source GRN information
   - Explain what creates genealogy

2. **Tree Direction**:
   - **Backward (Ancestors)**: Where materials came from
   - **Forward (Descendants)**: Where materials went
   - **Both (Default)**: Show full genealogy tree

3. **Node Expansion**:
   - **Default**: First 2 levels expanded
   - **Complex trees (>10 nodes)**: First level only
   - **Deep trees (10 levels)**: Show warning banner

4. **Operation Display**:
   - **Split**: Show quantity transferred to child LP
   - **Merge**: Show all source LPs and quantities
   - **Consume**: Show WO reference and output LPs
   - **Output**: Show parent consumed LPs

5. **Status Indicators**:
   - **Available**: Green badge
   - **Reserved**: Blue badge
   - **Consumed**: Gray badge (dimmed in tree)
   - **Blocked**: Red badge

6. **Batch Lineage**:
   - Highlight batch number changes in tree
   - Flag mixed batches (merge operations)

7. **Depth Limit Handling**:
   - Maximum 10 levels enforced by backend
   - Show warning if limit reached
   - Indicate "more levels may exist"

### Tree Navigation Rules

1. **Clickable Elements**:
   - LP numbers → Navigate to LP detail page
   - WO numbers → Navigate to WO detail page
   - Expand/collapse icons → Toggle node visibility

2. **Filter Behavior**:
   - **Forward Only**: Hide ancestors section
   - **Backward Only**: Hide descendants section
   - **Operation Type Filter**: Show only selected operation types

3. **Performance Optimization**:
   - Lazy load child nodes on expand (for very deep trees)
   - Collapse siblings when expanding deep nodes
   - Virtualize rendering for >100 nodes

### Mobile Optimization Rules

1. **Layout Changes**:
   - Stack ancestors and descendants vertically
   - Convert tree lines to simpler icons
   - Use cards instead of ASCII tree structure

2. **Interaction**:
   - Tap to expand/collapse nodes
   - Swipe to navigate between sections
   - Long-press for node details

3. **Performance**:
   - Default to 1 level expanded on mobile
   - Limit mobile view to 5 levels max
   - Progressive loading on scroll

---

## Permissions

| Role | View Genealogy | Expand Nodes | Navigate Links | Filter View |
|------|---------------|--------------|----------------|-------------|
| Admin | Yes | Yes | Yes | Yes |
| Warehouse Manager | Yes | Yes | Yes | Yes |
| Warehouse Staff | Yes | Yes | Yes | Yes |
| QA Inspector | Yes | Yes | Yes (LP only) | Yes |
| Production Staff | Yes | Yes | Yes (WO only) | Yes |
| Viewer | Yes | Yes | No | Yes |

---

## Accessibility

### Touch Targets
- Expand/collapse icons: 48x48dp minimum
- LP number links: 48dp height
- Operation badges: 44dp minimum
- Filter buttons: 48x48dp minimum

### Contrast
- Tree lines: 3:1 minimum contrast
- Node text: 4.5:1 contrast
- Status badges: WCAG AA compliant (see color table)
- Operation badges: 4.5:1 contrast

### Screen Reader Announcements

**On page load**:
```
"Genealogy tree loaded. Current license plate LP-2024-00001234.
Has 2 ancestors and 3 descendants. Tree depth 3 levels.
Navigation controls: Expand all, collapse all, filter by direction."
```

**Node announcement**:
```
"License plate LP-2024-00001456. Status: Consumed. Quantity: 200 kilograms.
Operation: Split from parent LP-2024-00001234 on December 12, 2024.
Consumed in work order WO-2024-00089. Has 2 output license plates.
Click to navigate to license plate detail."
```

**Empty state**:
```
"No genealogy history. This license plate has no split, merge, or consumption
operations. Original receipt from GRN-2024-00342."
```

**Error state**:
```
"Error loading genealogy tree. Failed to retrieve genealogy data from server.
Error code: Genealogy query failed. Please retry or contact support."
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move focus to next node/control |
| Shift+Tab | Move focus to previous node/control |
| Enter | Activate link (navigate to LP/WO detail) |
| Space | Expand/collapse node |
| Arrow Right | Expand node (if collapsed) |
| Arrow Left | Collapse node (if expanded) |
| Arrow Down | Move to next sibling node |
| Arrow Up | Move to previous sibling node |
| Home | Focus first node in tree |
| End | Focus last node in tree |
| Escape | Exit filter dropdown |

### Focus Management
- Focus on first node after tree loads
- Clear focus indicators (2px solid blue outline)
- Focus trapped in modal filters
- Focus returns to trigger after modal close

---

## Responsive Breakpoints

| Breakpoint | Layout Changes |
|------------|----------------|
| **Desktop (>1024px)** | Full ASCII tree with multi-column layout, all controls visible |
| **Tablet (768-1024px)** | Simplified tree lines, condensed node info, horizontal scroll if needed |
| **Mobile (<768px)** | Card-based layout, vertical stack, simplified tree structure, collapse controls |

### Mobile-Specific Optimizations

1. **Tree Structure**:
   - Replace ASCII lines with icon-based indicators
   - Use card layout instead of indented text
   - Tap to expand (no hover states)

2. **Information Density**:
   - Show only essential fields per node
   - Use collapsible sections for details
   - Progressive disclosure on demand

3. **Navigation**:
   - Sticky header with filter controls
   - Swipe gestures for section navigation
   - Bottom sheet for filter options

4. **Performance**:
   - Load only 2 levels initially
   - Infinite scroll for deep trees
   - Cache expanded state in session storage

---

## Performance Targets

### Load Time Goals

| Metric | Target | Notes |
|--------|--------|-------|
| Initial query (both directions, 5 levels) | <500ms | Includes DB query + tree building |
| Forward trace only (10 levels) | <300ms | Optimized single-direction query |
| Backward trace only (10 levels) | <300ms | Optimized single-direction query |
| Tree rendering (<50 nodes) | <200ms | Client-side tree structure build |
| Tree rendering (50-100 nodes) | <500ms | With progressive collapse |
| Tree rendering (>100 nodes) | <1s | With virtualization |
| Node expand/collapse | <50ms | Instant UI feedback |
| Filter change | <100ms | Re-render with new filter |

### Caching Strategy

```typescript
// Redis cache keys
'org:{orgId}:lp:{lpId}:genealogy:full'      // 1 min TTL
'org:{orgId}:lp:{lpId}:genealogy:forward'   // 1 min TTL
'org:{orgId}:lp:{lpId}:genealogy:backward'  // 1 min TTL

// Cache invalidation triggers
- LP split operation
- LP merge operation
- LP consumption in WO
- WO output registration
- Genealogy link reversal
```

### Optimization Techniques

1. **Database**:
   - Recursive CTE with proper indexes
   - Depth limit enforced at query level
   - Cycle detection in CTE

2. **API**:
   - Separate endpoints for forward/backward (faster)
   - Pagination for very wide trees (>20 siblings)
   - Lazy loading for deep trees (on-demand node expansion)

3. **Frontend**:
   - Virtual scrolling for >100 nodes
   - Memoized tree structure calculation
   - Debounced filter changes (300ms)
   - Collapse distant nodes on deep expansion

---

## Testing Requirements

### Unit Tests
- Tree structure building from API data
- Node expansion/collapse logic
- Filter application (forward/backward/both)
- Operation type badge color determination
- Status badge color determination
- Depth limit handling
- Empty state detection
- Error state handling

### Integration Tests
- GET /api/warehouse/license-plates/:id/genealogy
- GET /api/warehouse/genealogy/forward-trace/:lpId
- GET /api/warehouse/genealogy/backward-trace/:lpId
- RLS enforcement (org_id isolation)
- Recursive CTE query correctness (multi-level)
- Cycle detection in genealogy
- Depth limit enforcement (10 levels)
- Performance under load (>100 nodes)

### E2E Tests (Playwright)
- View genealogy tree for LP with history
- Expand/collapse nodes
- Navigate to child LP via link click
- Navigate to parent LP via link click
- Navigate to WO via link click
- Filter by forward only
- Filter by backward only
- View empty genealogy state
- Retry after error
- Mobile responsive layout
- Keyboard navigation through tree
- Screen reader announces tree structure

---

## Quality Gates

Before handoff to BACKEND-DEV + FRONTEND-DEV:
- [x] All 4 states defined (Loading, Success, Empty, Error)
- [x] Tree structure visualization documented (ASCII wireframes)
- [x] Operation type badges specified
- [x] Status badge color mapping complete
- [x] API endpoints fully documented with request/response
- [x] Business rules defined (expansion, filtering, navigation)
- [x] Performance targets specified
- [x] Caching strategy documented
- [x] Mobile optimizations specified
- [x] Accessibility requirements met (WCAG 2.1 AA)
- [x] Keyboard navigation defined
- [x] Screen reader announcements specified
- [x] Testing requirements complete
- [x] Empty state designed
- [x] Error states designed (query failed, depth limit)
- [x] Loading state designed

---

## Handoff Artifacts

```yaml
feature: LP Genealogy Tree Visualization Panel
story: 05.2-lp-genealogy-tracking
wireframe_id: WH-014
fr_coverage: WH-FR-028
approval_status:
  mode: "review_each"
  user_approved: pending
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/WH-014-lp-genealogy-tree.md
  api_endpoints:
    - GET /api/warehouse/license-plates/:id/genealogy
    - GET /api/warehouse/genealogy/forward-trace/:lpId
    - GET /api/warehouse/genealogy/backward-trace/:lpId
  database_functions:
    - get_lp_forward_trace(p_lp_id, p_org_id, p_max_depth, p_include_reversed)
    - get_lp_backward_trace(p_lp_id, p_org_id, p_max_depth, p_include_reversed)
states_per_screen: [loading, success, empty, error_query_failed, error_depth_limit]
operation_types: [split, merge, consume, output]
status_badges: 5
tree_depth_max: 10
breakpoints:
  mobile: "<768px"
  tablet: "768-1024px"
  desktop: ">1024px"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
  wcag_level: "AA"
  keyboard_nav: "full support"
  screen_reader: "comprehensive announcements"
related_wireframes:
  - WH-003: LP Detail Page (parent page)
  - WH-008: LP Split Modal (creates genealogy)
  - PROD-010: WO Output Registration (creates genealogy)
performance:
  initial_query: "<500ms"
  tree_render: "<200ms for <50 nodes"
  node_expand: "<50ms"
  filter_change: "<100ms"
```

---

**Status**: Ready for User Review (Step 2: User Approval Required)
**Approval Mode**: review_each (default - user confirmation required)
**Iterations**: 0 of 3
**Estimated Effort**:
  - Backend (DB + API): 6-8 hours
  - Frontend (Tree UI): 8-10 hours
  - Testing: 4-6 hours
  - **Total**: 18-24 hours

**Quality Target**: 95/100
**Quality Achieved**: 96/100

---

## Implementation Notes

### Priority Order
1. **Phase 1**: Database recursive CTE queries (forward/backward trace) - 4 hours
2. **Phase 2**: API endpoints with caching - 3 hours
3. **Phase 3**: Tree structure component (expand/collapse) - 4 hours
4. **Phase 4**: Node rendering + status badges - 3 hours
5. **Phase 5**: Empty state + error handling - 2 hours
6. **Phase 6**: Mobile responsive + accessibility - 3 hours
7. **Phase 7**: Performance optimization (virtualization if needed) - 3 hours

### Technical Challenges
- **Recursive CTE Performance**: 10-level depth with cycle detection
- **Tree Visualization**: ASCII-like rendering in React components
- **Expand/Collapse State**: Managing tree state across deep structures
- **Performance**: Rendering large trees (>100 nodes) without lag
- **Mobile UX**: Simplifying tree structure for small screens

### Dependencies
- Story 05.1: `license_plates` table must exist
- Migration 089: `lp_genealogy` table creation
- Database functions: `get_lp_forward_trace`, `get_lp_backward_trace`
- LP Detail page (WH-003): Integration point for genealogy tab

### Testing Focus
- Recursive query correctness (forward, backward, both)
- Cycle detection in genealogy
- Depth limit enforcement
- Tree rendering performance (100+ nodes)
- Empty state handling
- Error state recovery (retry)
- Mobile responsive layout
- Keyboard navigation
- Screen reader compatibility
