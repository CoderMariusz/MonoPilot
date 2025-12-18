# QA-011: Certificate of Analysis (CoA) List Page

**Module**: Quality Management
**Feature**: CoA Generation & Management (FR-QA-011)
**Status**: Ready for Implementation
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Quality > Certificates of Analysis (CoA)                [+ Generate CoA] [Export] [Filters]    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|  | Total CoAs          | | Pending Review      | | This Month          | | Avg Days to Issue  |   |
|  |       1,247         | |         12          | |        156          | |      2.1 days     |   |
|  | [View By Status]    | | [View All]          | | [View Trends]       | | [Review]           |   |
|  +---------------------+ +---------------------+ +---------------------+ +---------------------+   |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Filters: [Status: All v] [Batch Type: All v] [Date Range: ____ to ____] [Search Product] |  |
|  |                                                                                              |  |
|  | Bulk Actions: [ ] Select All    [Send Email] [Export] [Archive]                           |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | CoA #     | Batch/Product       | Batch Date  | Status      | QA Manager  | Issued   |   |
|  |     |           |                     |             |             |             | Date     |   |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | COA-12847 | Salsa Mild          | 2025-12-10  | Approved    | M.Garcia    | 2025-12-15|  |
|  |     | Batch#    | 5KG Tub             |             | PDF Generated| (Manager)   | 10:45 AM|  |
|  |     | BID-45289 | Lot: 2512-001-A     |             | [Send] [View PDF] [Archive] [...]     |  |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | COA-12846 | Salsa Medium        | 2025-12-09  | Approved    | J.Smith     | 2025-12-14|  |
|  |     | Batch#    | 10KG Tub            |             | PDF Generated| (Manager)   | 3:20 PM |  |
|  |     | BID-45288 | Lot: 2512-001-B     |             | [Send] [View PDF] [Archive] [...]     |  |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | COA-12845 | Salsa Hot           | 2025-12-08  | Pending     | M.Garcia    | ----    |  |
|  |     | Batch#    | 1.5KG Bottle        |             | Review      | (Manager)   | Awaiting|  |
|  |     | BID-45287 | Lot: 2512-001-C     |             | [Review QC Results] [View] [...] |  |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | COA-12844 | Salsa Verde         | 2025-12-07  | In Process  | A.Lee       | ----    |  |
|  |     | Batch#    | 5KG Tub             |             | Test Results| (Analyst)   | Generate|  |
|  |     | BID-45286 | Lot: 2512-001-D     |             | 8/10 Complete      | [View] [...] |  |
|  +----------------------------------------------------------------------------------------------+  |
|  | [x] | COA-12843 | Salsa Mild          | 2025-12-06  | Archived    | M.Garcia    | 2025-12-11|  |
|  |     | Batch#    | 5KG Tub             |             | 10yr Retention| (Manager)   | 2:15 PM |  |
|  |     | BID-45285 | Lot: 2512-001-E     |             | [View Archive] [...]          |  |
|  +----------------------------------------------------------------------------------------------+  |
|  | [ ] | COA-12842 | Salsa Corn          | 2025-12-05  | Approved    | R.Brown     | 2025-12-10|  |
|  |     | Batch#    | 2.5KG Bucket        |             | PDF Generated| (Manager)   | 9:30 AM |  |
|  |     | BID-45284 | Lot: 2512-001-F     |             | [Send] [View PDF] [Archive] [...]     |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Showing 1-20 of 1,247 CoAs                                 [< Previous] [1] [2] [3] [Next >]   |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[...] Row Actions Menu:
  - View CoA Details
  - View PDF (if approved)
  - Send via Email
  - Send to Supplier/Customer
  - Download/Export PDF
  - Archive CoA (QA Manager only)
  - View Batch Details
  - View Test Results (from FR-QA-007)
  - View E-Signature
  - Print CoA
```

### Success State (Tablet: 768-1024px)

```
+--------------------------------------------------------------------+
|  Quality > CoAs                          [+ Generate] [Filters]    |
+--------------------------------------------------------------------+
|                                                                      |
|  +----------------+ +----------------+                               |
|  | Total CoAs     | | Pending Review |                               |
|  |    1,247       | |      12        |                               |
|  | [View]         | | [View]         |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  +----------------+ +----------------+                               |
|  | This Month     | | Avg Days       |                               |
|  |     156        | |    2.1 days    |                               |
|  | [View]         | | [Trends]       |                               |
|  +----------------+ +----------------+                               |
|                                                                      |
|  Filters: [Status v] [Batch Type v] [Date]                          |
|                                                                      |
|  [ ] Select All    [Send] [Export]                                  |
|                                                                      |
|  +----------------------------------------------------------------+ |
|  | [ ] COA-12847  [Approved]       2025-12-15                   | |
|  |     Salsa Mild - Batch #BID-45289                            | |
|  |     Lot: 2512-001-A | Issued: 10:45 AM                        | |
|  |     QA Manager: M.Garcia        [View] [Send] [...]           | |
|  +----------------------------------------------------------------+ |
|  | [ ] COA-12846  [Approved]       2025-12-14                   | |
|  |     Salsa Medium - Batch #BID-45288                          | |
|  |     Lot: 2512-001-B | Issued: 3:20 PM                         | |
|  |     QA Manager: J.Smith         [View] [Send] [...]           | |
|  +----------------------------------------------------------------+ |
|  | [ ] COA-12845  [Pending]        Review Needed                 | |
|  |     Salsa Hot - Batch #BID-45287                             | |
|  |     Lot: 2512-001-C | Created: 2025-12-08                     | |
|  |     QA Manager: M.Garcia        [Review] [...]                | |
|  +----------------------------------------------------------------+ |
|  | [ ] COA-12844  [In Progress]    8/10 Tests Complete          | |
|  |     Salsa Verde - Batch #BID-45286                           | |
|  |     Lot: 2512-001-D | Started: 2025-12-07                     | |
|  |     Analyst: A.Lee              [View] [...]                  | |
|  +----------------------------------------------------------------+ |
|                                                                      |
|  Showing 1-10 of 1,247                      [<] [1] [2] [3] [>]    |
|                                                                      |
+--------------------------------------------------------------------+
```

### Success State (Mobile: <768px)

```
+----------------------------------+
|  < CoAs                          |
|  [+ Generate] [Filters]          |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Total CoAs         1,247   |  |
|  | [View]                     |  |
|  +----------------------------+  |
|  | Pending Review        12   |  |
|  | [View All]                 |  |
|  +----------------------------+  |
|  | This Month           156   |  |
|  | [View Trends]              |  |
|  +----------------------------+  |
|                                  |
|  [Filters v]    [Search]         |
|                                  |
|  +----------------------------+  |
|  | [ ] COA-12847 [Approved]   |  |
|  | Salsa Mild - 2025-12-15    |  |
|  +----------------------------+  |
|  | Batch #BID-45289           |  |
|  | Lot: 2512-001-A            |  |
|  | Issued: 10:45 AM           |  |
|  | QA: M.Garcia               |  |
|  |    [View] [Send] [...]     |  |
|  +----------------------------+  |
|  | [ ] COA-12846 [Approved]   |  |
|  | Salsa Medium - 2025-12-14  |  |
|  +----------------------------+  |
|  | Batch #BID-45288           |  |
|  | Lot: 2512-001-B            |  |
|  | Issued: 3:20 PM            |  |
|  | QA: J.Smith                |  |
|  |    [View] [Send] [...]     |  |
|  +----------------------------+  |
|  | [ ] COA-12845 [Pending]    |  |
|  | Salsa Hot - 2025-12-08     |  |
|  +----------------------------+  |
|  | Batch #BID-45287           |  |
|  | Lot: 2512-001-C            |  |
|  | Status: Review Needed      |  |
|  | QA: M.Garcia               |  |
|  |    [Review] [View] [...]   |  |
|  +----------------------------+  |
|                                  |
|  [Load More]                     |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Quality > CoAs                                              [+ Generate] [Filters]              |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [████████░░░░░░░░] Skeleton: Total CoAs                                                        |
|  [████████░░░░░░░░] Skeleton: Pending Review                                                    |
|  [████████░░░░░░░░] Skeleton: This Month                                                        |
|  [████████░░░░░░░░] Skeleton: Avg Days                                                          |
|                                                                                                    |
|  Loading filters and data...                                                                    |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] |  |
|  | [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] |  |
|  | [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] |  |
|  | [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] |  |
|  | [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] |  |
|  | [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Fetching certificates...                                                                       |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Quality > CoAs                                              [+ Generate] [Filters]              |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  No certificates of analysis found.                                                             |
|                                                                                                    |
|               ╭─────────────────────────────────╮                                                 |
|               │    [Document Icon]              │                                                 |
|               │ No CoAs Generated Yet           │                                                 |
|               │                                 │                                                 |
|               │ Generate your first CoA from a  │                                                 |
|               │ released batch to get started.  │                                                 |
|               │                                 │                                                 |
|               │  [+ Generate First CoA]         │                                                 |
|               │  [Browse Released Batches]      │                                                 |
|               │                                 │                                                 |
|               │ Questions? View Help            │                                                 |
|               ╰─────────────────────────────────╯                                                 |
|                                                                                                    |
|  Tip: CoA generation is available for released batches with completed QC testing.               |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Quality > CoAs                                              [+ Generate] [Filters]              |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [!] Error loading CoA list                                                                     |
|                                                                                                    |
|  ╭─────────────────────────────────────────────────────────────────────────────────────────────╮ |
|  │                                                                                             │ |
|  │  ⚠  Failed to fetch certificates of analysis                                              │ |
|  │                                                                                             │ |
|  │  Error: Database connection timeout                                                        │ |
|  │  Status Code: 504                                                                           │ |
|  │                                                                                             │ |
|  │  Try refreshing or contact support if the problem persists.                               │ |
|  │                                                                                             │ |
|  │  [Retry]  [Contact Support]  [View Status]                                                │ |
|  │                                                                                             │ |
|  ╰─────────────────────────────────────────────────────────────────────────────────────────────╯ |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Generate CoA Modal (4-Step Wizard)

### Step 1: Select Batch (Desktop)

```
+------------------------------------------+
| + Generate Certificate of Analysis       |
+------------------------------------------+
| Step 1 of 4: Select Batch                |
+------------------------------------------+
|                                          |
| Filters: [Status: Released v]            |
|          [Product Category v]            |
|          [Date Range: ____]              |
|          [Search Product...]            |
|                                          |
| +--------------------------------------+ |
| | [ ] | Batch #    | Product    | Date | |
| +--------------------------------------+ |
| | [*] | BID-45289  | Salsa Mild | 2025 | |
| |     |            | 5KG Tub    |-12-10| |
| |     |            | Released   | [i]  | |
| +--------------------------------------+ |
| | [ ] | BID-45288  | Salsa      | 2025 | |
| |     |            | Medium     |-12-09| |
| |     |            | Released   | [i]  | |
| +--------------------------------------+ |
| | [ ] | BID-45287  | Salsa Hot  | 2025 | |
| |     |            | 1.5KG Bottle|-12-08 | |
| |     |            | Released   | [i]  | |
| +--------------------------------------+ |
|                                          |
| Showing 1-20 of 45 released batches     |
| [< Prev] [1] [2] [3] [Next >]           |
|                                          |
| [Cancel]  [Next >]                       |
+------------------------------------------+
```

### Step 1: Select Batch (Mobile)

```
+----------------------------------+
| + Generate CoA                   |
+----------------------------------+
| Step 1 of 4: Select Batch        |
+----------------------------------+
|                                  |
| [Filters v] [Search...]          |
|                                  |
| +----------------------------+  |
| | BID-45289 [Selected]       |  |
| | Salsa Mild 5KG Tub         |  |
| | Released: 2025-12-10       |  |
| | Tests: 5/5 Complete [OK]   |  |
| +----------------------------+  |
| | BID-45288                  |  |
| | Salsa Medium 10KG Tub      |  |
| | Released: 2025-12-09       |  |
| | Tests: 4/5 Complete        |  |
| +----------------------------+  |
| | BID-45287                  |  |
| | Salsa Hot 1.5KG Bottle     |  |
| | Released: 2025-12-08       |  |
| | Tests: 5/5 Complete [OK]   |  |
| +----------------------------+  |
|                                  |
| [Cancel]  [Next >]               |
+----------------------------------+
```

### Step 2: Review Test Results (Desktop)

```
+------------------------------------------+
| + Generate Certificate of Analysis       |
+------------------------------------------+
| Step 2 of 4: Review Test Results         |
+------------------------------------------+
|                                          |
| Batch: BID-45289 | Salsa Mild 5KG Tub   |
| Released: 2025-12-10                    |
| QC Tests Completed: 2025-12-12, 14:30   |
|                                          |
| From: FR-QA-007 Test Results             |
|                                          |
| +--------------------------------------+ |
| | Parameter      | Spec      | Result | |
| +--------------------------------------+ |
| | pH             | 3.0-4.0   | 3.45   | |
| |                |  ✓ Pass   |        | |
| +--------------------------------------+ |
| | Sodium (%)     | < 1.5     | 1.12   | |
| |                |  ✓ Pass   |        | |
| +--------------------------------------+ |
| | Color (Lovib.) | 20-30     | 25     | |
| |                |  ✓ Pass   |        | |
| +--------------------------------------+ |
| | Moisture (%)   | < 0.5     | 0.32   | |
| |                |  ✓ Pass   |        | |
| +--------------------------------------+ |
| | Microbial      | <1000 CFU | Pass   | |
| | Count          |  ✓ Pass   |        | |
| +--------------------------------------+ |
|                                          |
| All tests passed. Ready for CoA approval.|
|                                          |
| [Cancel]  [Next >]                       |
+------------------------------------------+
```

### Step 2: Review Test Results (Mobile)

```
+----------------------------------+
| + Generate CoA                   |
+----------------------------------+
| Step 2 of 4: Review Tests        |
+----------------------------------+
|                                  |
| Batch: BID-45289                 |
| Salsa Mild 5KG Tub               |
| Released: 2025-12-10             |
|                                  |
| +----------------------------+  |
| | pH                    3.45 |  |
| | Spec: 3.0-4.0         [✓] |  |
| +----------------------------+  |
| | Sodium (%)            1.12 |  |
| | Spec: <1.5            [✓] |  |
| +----------------------------+  |
| | Color (Lovib.)           25 |  |
| | Spec: 20-30           [✓] |  |
| +----------------------------+  |
| | Moisture (%)          0.32 |  |
| | Spec: <0.5            [✓] |  |
| +----------------------------+  |
| | Microbial Count       <500 |  |
| | Spec: <1000 CFU/g     [✓] |  |
| +----------------------------+  |
|                                  |
| All tests passed!                |
|                                  |
| [Cancel]  [Next >]               |
+----------------------------------+
```

### Step 3: Preview PDF (Desktop)

```
+------------------------------------------+
| + Generate Certificate of Analysis       |
+------------------------------------------+
| Step 3 of 4: Preview PDF                 |
+------------------------------------------+
|                                          |
| [Document Preview Frame]                 |
| ┌──────────────────────────────────────┐ |
| │                                      │ |
| │  CERTIFICATE OF ANALYSIS             │ |
| │  ════════════════════════════════    │ |
| │                                      │ |
| │  Product:   Salsa Mild               │ |
| │  Batch #:   BID-45289                │ |
| │  Lot:       2512-001-A               │ |
| │  Qty:       150 Units (5KG Tubs)     │ |
| │  Mfg Date:  2025-12-10               │ |
| │  Expiry:    2026-12-10               │ |
| │                                      │ |
| │  TEST RESULTS SUMMARY                │ |
| │  ────────────────────                │ |
| │                                      │ |
| │  pH ..................... 3.45 ✓     │ |
| │  Sodium (%) ............. 1.12 ✓     │ |
| │  Color (Lovib.) ......... 25 ✓       │ |
| │  Moisture (%) ........... 0.32 ✓     │ |
| │  Microbial Count ........ <1000 ✓    │ |
| │                                      │ |
| │  Generated: 2025-12-15 10:15 AM      │ |
| │  Approved By: [QA Manager Sig]       │ |
| │  Certificate Valid Through: 2035     │ |
| │                                      │ |
| │  [Unique PDF/A ID: COA-12847]        │ |
| │                                      │ |
| └──────────────────────────────────────┘ |
|                                          |
| Format: [PDF/A (Archive)] [Standard PDF] |
| Retain for: [10 Years]                  |
|                                          |
| [Cancel]  [Back]  [Next >]               |
+------------------------------------------+
```

### Step 3: Preview PDF (Mobile)

```
+----------------------------------+
| + Generate CoA                   |
+----------------------------------+
| Step 3 of 4: Preview PDF         |
+----------------------------------+
|                                  |
| [Document Preview - Scrollable]  |
| ┌──────────────────────────────┐ |
| │  CERTIFICATE OF ANALYSIS     │ |
| │  ════════════════════════    │ |
| │                              │ |
| │  Product: Salsa Mild         │ |
| │  Batch: BID-45289            │ |
| │  Lot: 2512-001-A             │ |
| │  Mfg: 2025-12-10             │ |
| │  Expiry: 2026-12-10          │ |
| │                              │ |
| │  TEST RESULTS                │ |
| │  ─────────────               │ |
| │  pH .................... 3.45 │ |
| │  Sodium ............... 1.12% │ |
| │  Color ................... 25 │ |
| │  Moisture ............. 0.32% │ |
| │  Microbial ............. Pass │ |
| │                              │ |
| │  Generated: 2025-12-15       │ |
| │  [PDF/A Format]              │ |
| │                              │ |
| └──────────────────────────────┘ |
|                                  |
| Format: [PDF/A v] [10 Years v]   |
|                                  |
| [Cancel]  [Back]  [Next >]       |
+----------------------------------+
```

### Step 4: Approve & Issue (Desktop)

```
+------------------------------------------+
| + Generate Certificate of Analysis       |
+------------------------------------------+
| Step 4 of 4: Approve & Issue             |
+------------------------------------------+
|                                          |
| Batch: BID-45289 | Salsa Mild 5KG Tub   |
|                                          |
| ✓ Tests reviewed and approved            |
| ✓ PDF generated (PDF/A format)          |
|                                          |
| E-SIGNATURE REQUIRED                    |
| ────────────────────────────────────────|
|                                          |
| Authorized QA Manager: M.Garcia          |
| (Current User)                           |
|                                          |
| [ ] I certify this CoA is accurate and   |
|     complete per GMP standards           |
|                                          |
| [Sign with E-Signature]                  |
|                                          |
| Or: [Use Full Signature Pad...]          |
|                                          |
| Retention Policy:                        |
| - Archive Format: PDF/A (immutable)     |
| - Retention Period: 10 years             |
| - Searchable: Yes (OCR indexed)         |
| - Audit Trail: Enabled                   |
|                                          |
| [ ] Send CoA to customer immediately    |
|                                          |
| Customer Email: _______________          |
| (Auto-filled from order)                 |
|                                          |
| [Cancel]  [Back]  [Issue & Approve]      |
+------------------------------------------+
```

### Step 4: Approve & Issue (Mobile)

```
+----------------------------------+
| + Generate CoA                   |
+----------------------------------+
| Step 4 of 4: Approve             |
+----------------------------------+
|                                  |
| Batch: BID-45289                 |
| Salsa Mild 5KG Tub               |
|                                  |
| ✓ Tests approved                 |
| ✓ PDF ready                      |
|                                  |
| E-SIGNATURE                      |
| ──────────────────               |
|                                  |
| QA Manager: M.Garcia             |
|                                  |
| [ ] I certify this CoA is        |
|     accurate and complete        |
|     per GMP standards            |
|                                  |
| [Sign with Pad...]               |
|                                  |
| [ ] Send to customer             |
|                                  |
| Customer Email:                  |
| customers@customer-co.com        |
|                                  |
| Retention: 10 years              |
| Format: PDF/A (immutable)        |
|                                  |
| [Cancel]  [Back]  [Issue]        |
+----------------------------------+
```

---

## CoA Detail Page

### Desktop

```
+--------------------------------------------------------------------------------------------------+
|  Quality > CoAs > COA-12847                                                 [Back] [Actions v]   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  STATUS: APPROVED                          ISSUED: 2025-12-15 10:45 AM                          |
|                                             EXPIRY: 2035-12-15 (10 years)                        |
|                                                                                                    |
|  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  |
|  │                                                                                          │  |
|  │  CERTIFICATE OF ANALYSIS                                                                │  |
|  │  ════════════════════════════════════════════════════════════════════════════════════   │  |
|  │                                                                                          │  |
|  │  Certificate Number: COA-12847                                                           │  |
|  │  Unique ID: PDF-A-2025-12847-GMP                                                         │  |
|  │                                                                                          │  |
|  │  PRODUCT INFORMATION                                                                     │  |
|  │  ──────────────────                                                                      │  |
|  │  Product Name:        Salsa Mild                                                         │  |
|  │  GTIN-14:             01234567890126                                                     │  |
|  │  Batch Number:        BID-45289                                                          │  |
|  │  Lot Code:            2512-001-A                                                         │  |
|  │  Quantity:            150 Units (5KG Tubs)                                               │  |
|  │  SSCC Pallets:        5 (374012345678901230 - 374012345678901234)                        │  |
|  │  Manufacture Date:    2025-12-10                                                        │  |
|  │  Expiry Date:         2026-12-10                                                        │  |
|  │  Storage Condition:   Room Temperature (15-25°C)                                        │  |
|  │                                                                                          │  |
|  │  TEST RESULTS SUMMARY                                                                    │  |
|  │  ──────────────────                                                                      │  |
|  │                                                                                          │  |
|  │  Parameter          │ Specification  │ Result   │ Unit  │ Method        │ Status     │  |
|  │  ─────────────────────────────────────────────────────────────────────────────────────  │  |
|  │  pH                 │ 3.0 - 4.0      │ 3.45     │ n/a   │ AOAC 981.12   │ PASS ✓    │  |
|  │  Sodium Content     │ < 1.5          │ 1.12     │ %     │ ISO 5958      │ PASS ✓    │  |
|  │  Color (Lovibond)   │ 20 - 30        │ 25       │ L     │ ISO 1006      │ PASS ✓    │  |
|  │  Moisture Content   │ < 0.5          │ 0.32     │ %     │ ISO 712       │ PASS ✓    │  |
|  │  Microbial Count    │ < 1,000 CFU/g  │ <500     │ CFU/g │ ISO 4833-1    │ PASS ✓    │  |
|  │  E. coli            │ Negative       │ Negative │ n/a   │ ISO 7251      │ PASS ✓    │  |
|  │  Salmonella         │ Negative/25g   │ Negative │ n/a   │ ISO 6579-1    │ PASS ✓    │  |
|  │  Heavy Metals (Pb)  │ < 0.1 ppm      │ 0.02 ppm │ ppm   │ ICP-MS        │ PASS ✓    │  |
|  │                                                                                          │  |
|  │  CONCLUSION                                                                              │  |
|  │  ──────────────────────────────────────────────────────────────────────────────────────  │  |
|  │  All test results comply with product specification and regulatory requirements.        │  |
|  │  This batch is suitable for distribution.                                               │  |
|  │                                                                                          │  |
|  │  APPROVAL & CERTIFICATION                                                               │  |
|  │  ──────────────────────────────────────────────────────────────────────────────────────  │  |
|  │  Approved By:         M. Garcia                                                          │  |
|  │  Title:               Quality Assurance Manager                                         │  |
|  │  Digital Signature:   [E-Signature Verified ✓]                                         │  |
|  │  Signature Date:      2025-12-15 10:45:32 AM                                            │  |
|  │  Organization:        MyFood Manufacturing Inc.                                         │  |
|  │                                                                                          │  |
|  │  Generated By System: MonoPilot MES v2.1                                                │  |
|  │  Archive Format:      PDF/A-2a (ISO 19005-2)                                            │  |
|  │  Retention Until:     2035-12-15                                                       │  |
|  │  Audit Trail:         Enabled - Changes Tracked                                         │  |
|  │                                                                                          │  |
|  └──────────────────────────────────────────────────────────────────────────────────────────┘  |
|                                                                                                    |
|  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  |
|  │ DOCUMENT ACTIONS                                                                         │  |
|  ├──────────────────────────────────────────────────────────────────────────────────────────┤  |
|  │ [Download PDF] [Print] [Send to Customer] [Send to Supplier] [View Audit Trail]        │  |
|  │ [Archive] [View Related Batch] [View QC Tests] [Verify Digital Signature]              │  |
|  │ [Export to ERP] [Share Link]                                                           │  |
|  └──────────────────────────────────────────────────────────────────────────────────────────┘  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[Actions v] Menu:
  - Download PDF (full document)
  - Print CoA
  - Send to Email
  - Share via Link
  - View Audit Trail (all changes)
  - Archive Certificate
  - View Related Batch Details
  - View QC Test Data (FR-QA-007)
  - Verify E-Signature
  - Export to ERP/System
  - View Linked NCRs (if any)
  - Create CAPA (if issues found)
```

### Tablet (768-1024px)

```
+--------------------------------------------------------------------+
|  Quality > CoAs > COA-12847              [Back] [Actions v]        |
+--------------------------------------------------------------------+
|                                                                      |
| STATUS: APPROVED | ISSUED: 2025-12-15 | EXPIRY: 2035-12-15        |
|                                                                      |
| +---------------------+ +---------------------+                    |
| | Product Information | | Test Results Status |                    |
| +---------------------+ +---------------------+                    |
| | Product: Salsa Mild | | pH ................. ✓ |                    |
| | GTIN: 0123456789012 | | Sodium ............. ✓ |                    |
| | Batch: BID-45289    | | Color .............. ✓ |                    |
| | Lot: 2512-001-A     | | Moisture ........... ✓ |                    |
| | Qty: 150 Units      | | Microbial .......... ✓ |                    |
| | Mfg: 2025-12-10     | | E.coli ............. ✓ |                    |
| | Exp: 2026-12-10     | | Salmonella ......... ✓ |                    |
| +---------------------+ | Heavy Metals ....... ✓ |                    |
|                        | (All Tests Passed)     |                    |
|                        +---------------------+                    |
|                                                                      |
| Approved By: M. Garcia (QA Manager)                                |
| Signature: Verified via E-Signature                                |
| Signed: 2025-12-15 10:45 AM                                        |
|                                                                      |
| Retention: PDF/A format, 10 years, OCR indexed                     |
|                                                                      |
| [Download PDF] [Print] [Send] [Archive] [Audit Trail]              |
|                                                                      |
+--------------------------------------------------------------------+
```

### Mobile (<768px)

```
+----------------------------------+
| < CoA Details                    |
| [Actions v]                      |
+----------------------------------+
|                                  |
| COA-12847                        |
| Salsa Mild 5KG Tub               |
|                                  |
| STATUS: APPROVED                 |
| Issued: 2025-12-15 10:45 AM      |
| Expires: 2035-12-15              |
|                                  |
| +----------------------------+  |
| | BATCH INFORMATION          |  |
| +----------------------------+  |
| | Batch: BID-45289           |  |
| | Lot: 2512-001-A            |  |
| | Qty: 150 Units             |  |
| | GTIN: 0123456789012        |  |
| | Mfg: 2025-12-10            |  |
| | Exp: 2026-12-10            |  |
| +----------------------------+  |
|                                  |
| +----------------------------+  |
| | TEST RESULTS               |  |
| +----------------------------+  |
| | Parameter | Spec | Result |  |
| | pH        | 3-4  | 3.45✓  |  |
| | Sodium    | <1.5 | 1.12✓  |  |
| | Color     | 20-30| 25✓    |  |
| | Moisture  | <0.5 | 0.32✓  |  |
| | Microb.   | <1K  | <500✓  |  |
| | E.coli    | Neg  | Neg✓   |  |
| | Salmon.   | Neg  | Neg✓   |  |
| | Pb        | <0.1 | 0.02✓  |  |
| +----------------------------+  |
|                                  |
| +----------------------------+  |
| | APPROVAL                   |  |
| +----------------------------+  |
| | Approved By: M.Garcia      |  |
| | Title: QA Manager          |  |
| | Signed: 2025-12-15         |  |
| | E-Sig: Verified            |  |
| +----------------------------+  |
|                                  |
| [Download] [Print] [Send]        |
| [Archive] [Audit Trail]          |
|                                  |
+----------------------------------+
```

---

## Send CoA Email Modal

```
+------------------------------------------+
| Send Certificate of Analysis             |
+------------------------------------------+
|                                          |
| CoA #: COA-12847 (Salsa Mild)            |
| Batch: BID-45289                         |
| Current Status: APPROVED                 |
|                                          |
+------------------------------------------+
| Recipients                               |
+------------------------------------------+
|                                          |
| [ ] Customer (from Order)                |
| customers@customer-co.com                |
| [ ] Supplier (if ingredient batch)      |
| [ ] QA Team (internal notification)     |
| [ ] Other:                               |
| [__________________________]             |
|                                          |
| [+ Add Recipient]                        |
|                                          |
+------------------------------------------+
| Email Subject (Auto-filled)              |
+------------------------------------------+
| Certificate of Analysis - Salsa Mild    |
| Batch BID-45289, Lot 2512-001-A         |
|                                          |
+------------------------------------------+
| Email Body (Editable)                    |
+------------------------------------------+
|                                          |
| Dear Customer,                           |
|                                          |
| Please find attached the Certificate of |
| Analysis for the referenced batch.      |
|                                          |
| Product: Salsa Mild (5KG Tub)           |
| Batch: BID-45289                         |
| Lot: 2512-001-A                          |
| Manufactured: 2025-12-10                 |
| Expiry: 2026-12-10                       |
|                                          |
| All quality parameters have passed.      |
| This batch is ready for use.             |
|                                          |
| Best regards,                            |
| Quality Assurance Team                   |
| MyFood Manufacturing Inc.                |
|                                          |
+------------------------------------------+
| Attachments                              |
+------------------------------------------+
|                                          |
| [✓] CoA PDF (COA-12847.pdf)             |
| [✓] Test Report (technical summary)     |
| [ ] Supplier Certificate (if applicable)|
|                                          |
+------------------------------------------+
| Send Options                             |
+------------------------------------------+
|                                          |
| [ ] Record in archive (audit trail)     |
| [ ] Request read receipt                 |
| [ ] Send immediately                     |
|                                          |
+------------------------------------------+
|                                          |
| [Cancel]  [Save Draft]  [Send Email]     |
|                                          |
+------------------------------------------+
```

---

## Responsive Design Breakpoints

| Device | Width | Layout Adjustments |
|--------|-------|-------------------|
| Mobile | <768px | Single-column, collapsible filters, card-based list, stacked metrics |
| Tablet | 768-1024px | 2-column metrics, compact filters, expanded list view |
| Desktop | >1024px | Full 4-column dashboard, side-by-side layout, all controls visible |

---

## Accessibility Checklist (WCAG AA)

| Item | Requirement | Status |
|------|-------------|--------|
| Color Contrast | 4.5:1 for text, 3:1 for UI | ✓ Pass |
| Touch Targets | Minimum 48x48dp | ✓ Pass |
| Keyboard Navigation | Tab, Enter, Escape support | ✓ Pass |
| Screen Reader | ARIA labels on modals, tables, alerts | ✓ Pass |
| Focus Indicators | Visible focus ring on all controls | ✓ Pass |
| Error Messages | Clear, specific, actionable | ✓ Pass |
| Form Labels | Associated with inputs (for/id) | ✓ Pass |
| Status Updates | aria-live="polite" for async operations | ✓ Pass |
| PDF Accessibility | PDF/A-2a tagged (accessible format) | ✓ Pass |
| PDF E-Signature | Accessible verification UI | ✓ Pass |

---

## API Specifications

### 1. GET /api/quality/coa/list
**Purpose**: Fetch CoA list with filters and pagination
**Auth**: QA Manager, Analyst
**Inputs**:
- status?: 'approved' | 'pending' | 'in_progress' | 'archived'
- batch_type?: 'finished_goods' | 'ingredients' | 'packaging'
- date_from?: ISO 8601 date
- date_to?: ISO 8601 date
- search?: string (product/batch/lot search)
- page?: number (default: 1)
- limit?: number (default: 20, max: 100)

**Output**:
```json
{
  "data": [
    {
      "id": "coa-id-uuid",
      "coa_number": "COA-12847",
      "batch_id": "bid-uuid",
      "batch_number": "BID-45289",
      "product_name": "Salsa Mild",
      "product_gtin": "01234567890126",
      "lot_code": "2512-001-A",
      "batch_date": "2025-12-10T00:00:00Z",
      "qty": 150,
      "unit": "units",
      "status": "approved",
      "qa_manager_id": "user-uuid",
      "qa_manager_name": "M.Garcia",
      "issued_at": "2025-12-15T10:45:32Z",
      "expiry_at": "2035-12-15T00:00:00Z",
      "pdf_url": "https://storage.../COA-12847.pdf",
      "pdf_archive_format": "pdf-a-2a",
      "created_at": "2025-12-15T10:45:32Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1247,
    "pages": 63
  },
  "metrics": {
    "total_coas": 1247,
    "pending_review": 12,
    "this_month": 156,
    "avg_days_to_issue": 2.1
  }
}
```

### 2. GET /api/quality/coa/:id/detail
**Purpose**: Fetch single CoA with full test results
**Auth**: QA Manager, Analyst, Customer (if sent to them)
**Output**:
```json
{
  "coa_number": "COA-12847",
  "batch_id": "bid-uuid",
  "batch_number": "BID-45289",
  "product": {
    "name": "Salsa Mild",
    "gtin": "01234567890126",
    "category": "condiment"
  },
  "lot_code": "2512-001-A",
  "batch_date": "2025-12-10T00:00:00Z",
  "qty": 150,
  "sscc_pallets": ["374012345678901230", "374012345678901231"],
  "mfg_date": "2025-12-10T00:00:00Z",
  "expiry_date": "2026-12-10T00:00:00Z",
  "test_results": [
    {
      "parameter": "pH",
      "specification": "3.0 - 4.0",
      "result": 3.45,
      "unit": "n/a",
      "method": "AOAC 981.12",
      "status": "pass"
    }
  ],
  "approval": {
    "qa_manager_id": "user-uuid",
    "qa_manager_name": "M.Garcia",
    "title": "Quality Assurance Manager",
    "signature_status": "verified",
    "signature_date": "2025-12-15T10:45:32Z",
    "signature_method": "e-signature"
  },
  "archive": {
    "format": "pdf-a-2a",
    "retention_until": "2035-12-15T00:00:00Z",
    "retention_years": 10,
    "audit_trail_enabled": true,
    "searchable": true,
    "ocr_indexed": true
  }
}
```

### 3. POST /api/quality/coa/generate
**Purpose**: Create and generate new CoA (step 1-2)
**Auth**: QA Manager
**Inputs**:
```json
{
  "batch_id": "bid-uuid",
  "batch_number": "BID-45289"
}
```
**Validations**:
- Batch must be in "Released" status
- All QC tests from FR-QA-007 must be completed
- All tests must be "passed"
- User must have QA Manager role

**Output**:
```json
{
  "coa_draft_id": "coa-draft-uuid",
  "batch_id": "bid-uuid",
  "batch_number": "BID-45289",
  "product_name": "Salsa Mild",
  "test_results": [
    {
      "parameter": "pH",
      "specification": "3.0 - 4.0",
      "result": 3.45,
      "status": "pass"
    }
  ],
  "ready_for_approval": true
}
```

### 4. POST /api/quality/coa/:id/preview-pdf
**Purpose**: Generate PDF preview (step 3)
**Auth**: QA Manager
**Output**:
```json
{
  "pdf_url": "https://temporary-storage/COA-12847-PREVIEW.pdf",
  "expires_at": "2025-12-15T11:45:32Z",
  "format": "pdf-a-2a",
  "file_size_kb": 245
}
```

### 5. POST /api/quality/coa/:id/approve
**Purpose**: Approve and issue CoA with e-signature (step 4)
**Auth**: QA Manager
**Inputs**:
```json
{
  "signature_method": "e-signature",
  "signature_token": "esign-token-from-pad",
  "send_to_customer": false,
  "customer_email": "optional@customer.com"
}
```
**Side Effects**:
- Generate immutable PDF/A archive
- Store e-signature verification
- Create audit trail entry
- Schedule 10-year retention
- Immutable after approval (no edits allowed)

**Output**:
```json
{
  "coa_number": "COA-12847",
  "status": "approved",
  "pdf_url": "https://archive-storage/COA-12847.pdf",
  "archive_format": "pdf-a-2a",
  "archive_id": "PDF-A-2025-12847-GMP",
  "signature_verified": true,
  "issued_at": "2025-12-15T10:45:32Z",
  "expiry_at": "2035-12-15T00:00:00Z"
}
```

### 6. POST /api/quality/coa/:id/send-email
**Purpose**: Send CoA via email
**Auth**: QA Manager, Analyst
**Inputs**:
```json
{
  "recipients": ["customer@example.com"],
  "subject": "Certificate of Analysis - Salsa Mild",
  "body": "Please find attached...",
  "include_test_report": true,
  "record_in_archive": true,
  "request_read_receipt": false
}
```
**Output**:
```json
{
  "email_id": "email-uuid",
  "recipients": ["customer@example.com"],
  "status": "sent",
  "sent_at": "2025-12-15T10:46:00Z",
  "archived": true
}
```

### 7. POST /api/quality/coa/:id/archive
**Purpose**: Archive CoA (after retention period or manual)
**Auth**: QA Manager
**Output**:
```json
{
  "coa_id": "coa-uuid",
  "status": "archived",
  "archive_location": "long-term-storage",
  "retention_until": "2035-12-15T00:00:00Z",
  "archived_at": "2025-12-15T11:00:00Z"
}
```

### 8. GET /api/quality/coa/:id/audit-trail
**Purpose**: Fetch audit trail (all changes and access)
**Auth**: QA Manager
**Output**:
```json
{
  "audit_events": [
    {
      "timestamp": "2025-12-15T10:45:32Z",
      "event_type": "approved",
      "actor_id": "user-uuid",
      "actor_name": "M.Garcia",
      "action": "CoA approved and issued",
      "details": {
        "signature_method": "e-signature",
        "signature_verified": true
      }
    },
    {
      "timestamp": "2025-12-15T10:45:00Z",
      "event_type": "generated",
      "actor_id": "user-uuid",
      "actor_name": "M.Garcia",
      "action": "PDF generated"
    }
  ]
}
```

---

## Business Rules & Constraints

### CoA Generation Rules
1. **Released Batches Only**: CoA can only be generated for batches with status "Released"
2. **Complete QC Tests**: All QC test parameters from FR-QA-007 must be completed
3. **Passing Tests**: All QC tests must be in "Passed" status (no failures)
4. **QA Manager Approval**: Only QA Manager role can approve and issue CoA
5. **Immutable After Approval**: Once approved, CoA PDF cannot be edited or regenerated
6. **E-Signature Required**: Approval requires valid e-signature (no manual signature)
7. **One CoA Per Batch**: Only one approved CoA per batch (no duplicates)
8. **PDF/A Archive Format**: CoA must be stored in PDF/A-2a format (ISO 19005-2)
9. **10-Year Retention**: All CoAs must be retained for minimum 10 years
10. **Searchable Archive**: PDF must be OCR-indexed and searchable
11. **Audit Trail**: All changes and access must be logged with timestamps
12. **No Modifications**: CoA cannot be modified after approval (create new if changes needed)

### Business Process
1. User initiates CoA generation from released batch
2. System validates batch status and test completion
3. System displays all test results for review
4. System generates PDF preview (PDF/A format)
5. User reviews PDF and approves with e-signature
6. System archives PDF and creates immutable record
7. System emails CoA to customer/supplier if requested
8. System maintains 10-year audit trail
9. System schedules automatic archival at retention limit

### Data Retention
- **Duration**: 10 years from issuance
- **Format**: PDF/A-2a (immutable, archivable)
- **Searchability**: Full-text OCR indexed
- **Audit**: All access and changes logged
- **Compliance**: Meets GMP and regulatory requirements

---

## UI States Summary

| State | Trigger | Content | Action |
|-------|---------|---------|--------|
| **Loading** | Initial page load | Skeleton loaders for metrics & list | None (auto-complete) |
| **Empty** | No CoAs generated yet | Illustration + "Generate First" button | Generate CoA |
| **Success** | Data loaded & displayed | Full CoA list with metrics & filters | Manage CoAs |
| **Error** | API failure or timeout | Error message + Retry button | Retry or contact support |

---

## Component Specifications

### Stats Card (Reusable)
- **Props**: title, value, subtitle, action_label, action_click
- **Responsive**: Full width mobile, 25% width desktop
- **Accessibility**: Semantic HTML, ARIA labels

### Data Table (Reusable)
- **Columns**: Dynamic, user-customizable
- **Sorting**: Click column header to sort
- **Filtering**: Multi-filter support
- **Pagination**: Page navigation with total count
- **Selection**: Checkbox for bulk actions
- **Touch Targets**: 48x48dp minimum for all interactive elements

### Modal Dialog (Reusable)
- **Structure**: Title, content, footer with actions
- **Accessibility**: Focus trap, keyboard navigation, ARIA labels
- **Responsive**: Full-width on mobile, centered on desktop
- **Overlay**: Dimmed background, click-outside to close

### Form Controls
- **Text Input**: Label, placeholder, error message, 44px height
- **Select Dropdown**: Label, options, placeholder, keyboard navigation
- **Checkbox**: Large touch target (48x48dp), clear label
- **Button**: 48x48dp minimum, clear action labels

---

## Error Handling & Recovery

| Error | Message | Action |
|-------|---------|--------|
| Batch not released | "Batch must be released before CoA generation" | Select different batch |
| Tests incomplete | "All QC tests must be completed" | View batch testing status |
| Test failed | "CoA cannot be generated with failed tests" | View failing test details |
| PDF generation failed | "Unable to generate PDF. Try again or contact support." | Retry or contact |
| Signature invalid | "E-signature verification failed. Please try again." | Re-sign or contact IT |
| Email failed | "Email delivery failed. Save and try again later." | Retry or manual send |
| Archive failed | "Unable to archive CoA. Try again later." | Retry |

---

## Notes

- **Integration**: Links to FR-QA-007 (QC Test Results)
- **Integration**: Links to Batch Details (Production Module)
- **Export**: CoA list can be exported to Excel/PDF
- **Print**: Full-page print support for CoA document
- **Security**: All CoAs behind org-level RLS (row-level security)
- **Compliance**: GMP-compliant archive retention
- **Audit**: All operations logged with user, timestamp, action
- **PDF/A Format**: Ensures long-term preservation and accessibility
- **E-Signature Verification**: Cryptographic validation on view
- **OCR Indexing**: Enables full-text search across all CoAs
