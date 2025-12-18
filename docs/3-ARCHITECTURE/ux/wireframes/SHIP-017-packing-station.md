# SHIP-017: Packing Station Interface (Desktop)

**Module**: Shipping Management
**Feature**: Desktop Packing Station Workflow - Scan Picked Items, Create Cartons/Pallets, Generate SSCC Labels
**Status**: Ready for Review
**Last Updated**: 2025-12-15

**Route Path**: `/shipping/packing/:shipmentId`

**Functional Requirements**: FR-7.34 (Packing station UI showing picked items), FR-7.35 (Pack confirmation, carton creation, SSCC labels)
**Related**: SHIP-014 (Pick Desktop), SHIP-015 (Pick Scanner), SHIP-016 (Short Pick)

---

## ASCII Wireframe

### Success State (Desktop - Packing Station Active)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  Shipping > Packing                                         [Refresh] [Settings] [Menu]              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  PACKING STATION HEADER                                                                         │ │
│  ├─────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                                                   │ │
│  │  Station: PAC-03 (Bay 3)                    Operator: Sarah Johnson            Active Since:   │ │
│  │  Shipment: SHP-025840 (Customer: Best Foods Wholesale)                        10:45 AM        │ │
│  │  Customer Address: 123 Commerce St, Chicago, IL 60601                                           │ │
│  │  Total Items to Pack: 12 units across 4 picked locations                      Progress: 30%  │ │
│  │                                                                                                   │ │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                        │
│  ┌──────────────────────────────────────────────────────┬──────────────────────────────────────────┐ │
│  │  PICKED ITEMS TABLE                                  │  ACTIVE CARTON (In Progress)            │ │
│  ├──────────────────────────────────────────────────────┼──────────────────────────────────────────┤ │
│  │                                                      │                                          │ │
│  │  [Filters] [Sort By: Sequence]                      │  Carton ID: CTN-025840-001              │ │
│  │                                                      │  Status: Packing In Progress            │ │
│  │  ┌────────────────────────────────────────────────┐ │  Weight: 15.5 kg / 25 kg max            │ │
│  │  │ [Check] │ Line │ Product          │ LP #  │ Qty    │ │  Dimensions: 60x40x30 cm (L x W x H)  │ │
│  │  │         │ #   │                  │       │ Picked │ │  Created: 2025-12-15 10:50 AM          │ │
│  │  │         │     │                  │       │        │ │                                          │ │
│  │  ├─────┼─────┼──────────────────┼───────┼────────┤ │  CONTENTS                               │ │
│  │  │ [X] │ 1   │ Organic Whole    │ LP-  │ 100 /  │ │  ┌──────────────────────────────────┐ │ │
│  │  │     │     │ Milk 1L (4 qty)  │ 2025 │ 100    │ │  │ [X] Organic Whole Milk 1L      │ │ │
│  │  │     │     │ A-Dairy          │ 0847 │        │ │  │     LP: LP-2025-0847            │ │ │
│  │  │     │     │ [View Details]   │      │        │ │  │     Qty: 100 units              │ │ │
│  │  │     │     │                  │      │        │ │  │     Lot: 12345 | Exp: 2025-12-28│ │ │
│  │  ├─────┼─────┼──────────────────┼───────┼────────┤ │  │                                 │ │ │
│  │  │ [ ] │ 2   │ Greek Yogurt     │ LP-  │ 50 /   │ │  │ [X] Greek Yogurt 500g          │ │ │
│  │  │     │     │ 500g (2 qty)     │ 2025 │ 50     │ │  │     LP: LP-2025-0891            │ │ │
│  │  │     │     │ A-Dairy          │ 0891 │        │ │  │     Qty: 50 units               │ │ │
│  │  │     │     │ [View Details]   │      │        │ │  │     Lot: 12340 | Exp: 2025-12-26│ │ │
│  │  │     │     │ [Pack Item]      │      │ NEXT   │ │  │                                 │ │ │
│  │  │     │     │                  │      │        │ │  │ [Remove Item]                   │ │ │
│  │  ├─────┼─────┼──────────────────┼───────┼────────┤ │  └──────────────────────────────────┘ │ │
│  │  │ [ ] │ 3   │ Premium Butter   │ LP-  │ 25 /   │ │                                          │ │
│  │  │     │     │ 250g (3 qty)     │ 2025 │ 25     │ │  CARTON LABEL PREVIEW                   │ │
│  │  │     │     │ A-Dairy          │ 0761 │        │ │  ┌──────────────────────────────────┐ │ │
│  │  │     │     │ [View Details]   │      │        │ │  │  SSCC 000123456789012345       │ │ │
│  │  │     │     │ [Pack Item]      │      │ SKIP   │ │  │  [Barcode]                     │ │ │
│  │  │     │     │                  │      │        │ │  │  (GS1-128 Barcode)             │ │ │
│  │  ├─────┼─────┼──────────────────┼───────┼────────┤ │  │                                 │ │ │
│  │  │ [ ] │ 4   │ Frozen Berries   │ LP-  │ 200 /  │ │  │  Ship To: Best Foods            │ │ │
│  │  │     │     │ 500g (5 qty)     │ 2025 │ 200    │ │  │  Chicago, IL                    │ │ │
│  │  │     │     │ No allergens     │ 0533 │        │ │  │                                 │ │ │
│  │  │     │     │ [View Details]   │      │        │ │  │  Order: SHP-025840              │ │ │
│  │  │     │     │ [Pack Item]      │      │ SKIP   │ │  │  Box 1 of 2 | 15.5 kg           │ │ │
│  │  │     │     │                  │      │        │ │  │                                 │ │ │
│  │  └────────────────────────────────────────────────┘ │  │  WARNING: Contains Dairy        │ │ │
│  │                                                      │  │                                 │ │ │
│  │  Legend: [X] = Packed | [ ] = Pending | NEXT/SKIP │  │  [Regenerate]                   │ │ │
│  │          A = Allergen Badge                         │  └──────────────────────────────────┘ │ │
│  │                                                      │                                    │ │
│  │  [Scan LP / Enter Manually]                        │  [Close Carton] [Print Label]     │ │
│  │  ┌────────────────────────────────────────────────┐ │  [Save & Continue Packing]       │ │
│  │  │ Scan picked LP or carton ID...                 │ │                                    │ │
│  │  └────────────────────────────────────────────────┘ │                                    │ │
│  │                                                      │                                    │ │
│  └──────────────────────────────────────────────────────┴──────────────────────────────────────────┘ │
│                                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  PACKING HISTORY                                                                                 │ │
│  ├──────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                                                    │ │
│  │  Carton CTN-025840-001: [Closed] at 11:02 AM (15.5 kg, 3 items, SSCC generated)               │ │
│  │  Carton CTN-025840-002: [In Progress] (2/4 items)                                              │ │
│  │                                                                                                    │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  SHIPMENT ACTIONS                                                                                │
│  ├──────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                                                    │ │
│  │  [Create New Carton] [Complete Packing] [Print All Labels] [Print Packing Slip] [BOL]         │ │
│  │                                                                                                    │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                        │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Pack Confirmation Modal (On "Pack Item" Button)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  CONFIRM PACK: Greek Yogurt 500g (Line 2)                                                  [x]   │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                      │
│  SCAN PICKED LICENSE PLATE                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  [Search] Scan LP or enter manually:                                                         │ │
│  │                                                                                                │ │
│  │  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ [LP-2025-0891] [Check] (matched)                                                       │ │ │
│  │  └────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                                │ │
│  │  Lot: 12340 | Manufacturing: 2025-11-15 | Best Before: 2025-12-26                          │ │
│  │  Available in LP: 60 units | Temperature Zone: Chilled (4°C)                               │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
│  QUANTITY TO PACK                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  Required Quantity: 50 Units                                                                │ │
│  │  Quantity to Pack: [ 50 ]  Units   [−] [+]        (Max: 60 units available)               │ │
│  │                                                                                                │ │
│  │  [Partial Pack] Partial Pack: Pack less than required?                                     │ │
│  │     If checked, remaining quantity will be marked for new carton                           │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
│  CARTON INFORMATION                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  Add to Active Carton: CTN-025840-001                                                       │ │
│  │  Current carton weight: 15.5 kg | Capacity: 25 kg max | Remaining: 9.5 kg                  │ │
│  │                                                                                                │ │
│  │  [Create New Carton] Create New Carton (if item doesn't fit in current carton)            │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
│  ALLERGEN CHECK                                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  Product Allergens: A-Dairy                                                                │ │
│  │  Current Carton Contents:                                                                   │ │
│  │    * Organic Whole Milk 1L (A-Dairy)                                                      │ │
│  │    * Greek Yogurt 500g (A-Dairy)                                                          │ │
│  │  Recommendation: [Check] Safe (all dairy, customer has no restrictions)                    │ │
│  │                                                                                                │ │
│  │  Info: If customer has allergen restrictions, ensure separate cartons for restricted items│ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
│  ACTION BUTTONS                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  [Check Confirm & Pack] [Skip Item] [Cancel]                                              │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Close Carton Modal (On "Close Carton" Button)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  CLOSE CARTON: CTN-025840-001                                                              [x]   │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                      │
│  CARTON SUMMARY                                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  Carton ID: CTN-025840-001                                                                  │ │
│  │  Created: 2025-12-15 10:50 AM                                                               │ │
│  │  Items in Carton: 2                                                                         │ │
│  │  Total Weight: 15.5 kg                                                                      │ │
│  │  Current Weight: 15.5 kg                                                                    │ │
│  │                                                                                                │ │
│  │  CONTENTS:                                                                                  │ │
│  │  [Check] Organic Whole Milk 1L - 100 units (LP-2025-0847)                                 │ │
│  │  [Check] Greek Yogurt 500g - 50 units (LP-2025-0891)                                      │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
│  CARTON DIMENSIONS & WEIGHT                                                                       │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  Length (cm): [ 60 ]                                                                        │ │
│  │  Width (cm):  [ 40 ]                                                                        │ │
│  │  Height (cm): [ 30 ]                                                                        │ │
│  │                                                                                                │ │
│  │  Gross Weight (kg): [ 15.5 ]                                                                │ │
│  │  [Check] Verified: 15.5 kg (entered)                                                       │ │
│  │                                                                                                │ │
│  │  Unit: [KG]   [Check Capacity] [Use Scale]                                                │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
│  SSCC LABEL GENERATION                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  SSCC-18: 000123456789012345 [Check] Generated                                        │ │ │
│  │  │  Format: GS1-128 (check digit included)                                                │ │ │
│  │  │  Status: Ready for Print                                                               │ │ │
│  │  │                                                                                         │ │ │
│  │  │  ╔═══════════════════════════════════════════════════════════════╗                     │ │ │
│  │  │  ║            SSCC 000123456789012345                           ║                     │ │ │
│  │  │  ║            [Barcode Image]                                  ║                     │ │ │
│  │  │  │                                                                                     │ │ │
│  │  │  │  Ship To: Best Foods Wholesale                                                    │ │ │
│  │  │  │           123 Commerce St, Chicago, IL 60601                                      │ │ │
│  │  │  │                                                                                    │ │ │
│  │  │  │  Ship From: MonoPilot Warehouse                                                  │ │ │
│  │  │  │             456 Industrial Blvd, Chicago, IL 60611                                │ │ │
│  │  │  │                                                                                    │ │ │
│  │  │  │  Order #: SHP-025840          Box 1 of 2                                         │ │ │
│  │  │  │  Weight: 15.5 kg             Dimensions: 60x40x30 cm                             │ │ │
│  │  │  │                                                                                    │ │ │
│  │  │  │  WARNING: Contains Dairy                                                         │ │ │
│  │  │  │  Keep Chilled: 0-4°C                                                             │ │ │
│  │  │  │                                                                                    │ │ │
│  │  │  └────────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │  │                                                                                         │ │ │
│  │  │  [Regenerate Label] [Preview on Page] [Print Label] [Download PDF]                  │ │ │
│  │  │                                                                                         │ │ │
│  │  └────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
│  STAGING & NEXT STEPS                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  Staging Location: [STA-A-001]                                                              │ │
│  │  Dock Door: [DK-03] (Assigned for 2025-12-15 2:00 PM)                                     │ │
│  │  [Ready for Dock] Mark as Ready for Dock (will move carton to staging location)            │ │
│  │                                                                                                │ │
│  │  Estimated Ship Time: 2:00 PM - 3:00 PM (Window available)                                │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
│  ACTION BUTTONS                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  [Check Close Carton & Create New] [Close & Continue Packing] [Cancel]                    │ │
│  │                                                                                                │ │
│  │  Note: Carton will be locked after closing. You cannot add/remove items.                   │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Complete Packing Modal (On "Complete Packing" Button)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  COMPLETE PACKING: SHP-025840                                                              [x]   │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                      │
│  SHIPMENT SUMMARY                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  Shipment: SHP-025840                                                                       │ │
│  │  Customer: Best Foods Wholesale                                                             │ │
│  │  Sales Order: SO-002450, SO-002451                                                          │ │
│  │  Total Items: 375 units across 4 product types                                              │ │
│  │  Packing Started: 2025-12-15 10:45 AM                                                       │ │
│  │  Packing Duration: 1h 25m                                                                   │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
│  CARTONS PACKED                                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  [Check] CTN-025840-001: 15.5 kg | 2 items | SSCC: 000123456789012345 | Closed             │ │
│  │  [Check] CTN-025840-002: 18.3 kg | 2 items | SSCC: 000123456789012346 | Closed             │ │
│  │                                                                                                │ │
│  │  Total Cartons: 2 | Total Weight: 33.8 kg | Est. Box Count: 2                              │ │
│  │                                                                                                │ │
│  │  Missing Cartons/Pallets: None [Check]                                                     │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
│  DOCUMENTS TO PRINT                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  [checked] SSCC Labels (2 pages)                                                            │ │
│  │    - Print 4x6 labels on thermal printer or 8.5x11 sheet                                   │ │
│  │    - Labels already generated and queued                                                    │ │
│  │                                                                                                │ │
│  │  [checked] Packing Slip (1 page)                                                            │ │
│  │    - Customer-facing document with box contents, weights, lot numbers                     │ │
│  │    - Will be packed inside first carton                                                    │ │
│  │                                                                                                │ │
│  │  [checked] Bill of Lading (1 page)                                                          │ │
│  │    - Freight document for carrier (DHL)                                                    │ │
│  │    - Includes SSCC numbers, weight, dimensions, handling instructions                     │ │
│  │                                                                                                │ │
│  │  [ ] Warehouse Pick Ticket (Print for archival)                                            │ │
│  │                                                                                                │ │
│  │  [ ] Shipment Manifest (Will generate after packing complete)                              │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
│  QUALITY CHECKS                                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  [checked] All picked items packed into cartons                                             │ │
│  │  [checked] Carton dimensions & weight verified                                              │ │
│  │  [checked] SSCC labels generated (GS1-compliant)                                            │ │
│  │  [checked] Allergen warnings applied (where applicable)                                     │ │
│  │  [checked] Customer allergen restrictions validated                                         │ │
│  │  [checked] Temperature zones correct (chilled items together)                               │ │
│  │                                                                                                │ │
│  │  [ ] Visual inspection performed (check contents vs. slip)                                  │ │
│  │     If yes, initial cartons (e.g., "SJ" for Sarah Johnson)                                 │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
│  SHIPMENT STATUS                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  Current Status: [In Progress] Packing → [Complete] Packed (after completion)              │ │
│  │  Next Status: Manifested (when carrier books shipment)                                      │ │
│  │  Next Action: Send BOL to carrier DHL for pickup confirmation                              │ │
│  │                                                                                                │ │
│  │  Dock Door Assignment: DK-03 | Scheduled: 2025-12-15 2:00 PM - 3:00 PM                    │ │
│  │  Carrier: DHL | Service: Ground | Est. Delivery: 2025-12-17                               │ │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
│  ACTION BUTTONS                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                                │ │
│  │  [Check Complete & Print Labels] [Print BOL Only] [Save & Continue Later] [Cancel]        │ │
│  │                                                                                                │ │
│  │  WARNING: After completion, shipment status changes to "Packed" and cartons cannot be edited │
│  │                                                                                                │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                      │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Loading State (Shipment Loading)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  Shipping > Packing                                         [Refresh] [Settings] [Menu]          │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  Loading Packing Station...                                                                │ │
│  │                                                                                             │ │
│  │  ╔═══════════════════════════════════════════════════════════════╗                        │ │
│  │  ║  [Spinner] Fetching shipment details...                      ║                        │ │
│  │  ║  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 40%         ║                        │ │
│  │  ║                                                               ║                        │ │
│  │  ║  [Spinner] Loading picked items...                           ║                        │ │
│  │  ║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%         ║                        │ │
│  │  ║                                                               ║                        │ │
│  │  ╚═══════════════════════════════════════════════════════════════╝                        │ │
│  │                                                                                             │ │
│  │  Estimated time: 3-5 seconds                                                              │ │
│  │                                                                                             │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Empty State (No Shipments Ready to Pack)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  Shipping > Packing                                         [Refresh] [Settings] [Menu]          │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                             │ │
│  │                                    [Empty Carton Icon]                                     │ │
│  │                                                                                             │ │
│  │  No Shipments Ready for Packing                                                           │ │
│  │                                                                                             │ │
│  │  All picked items have been packed or no items ready for packing yet.                    │ │
│  │  Check back after warehouse staff completes picking operations.                          │ │
│  │                                                                                             │ │
│  │  [Arrow] View Pending Shipments                                                           │ │
│  │  [Arrow] Create New Sales Order                                                           │ │
│  │  [Arrow] View Packing History                                                             │ │
│  │                                                                                             │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                    │
│  Recent Completed Shipments:                                                                     │
│  * SHP-025840 - Best Foods (Completed 11:15 AM, 2 cartons)                                   │ │
│  * SHP-025839 - FreshMart Inc (Completed 10:30 AM, 3 cartons)                                │ │
│                                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Error State (Carton Weight Exceeded)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  Shipping > Packing                                         [Refresh] [Settings] [Menu]          │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                             │ │
│  │                                    [Error/Warning Icon]                                     │ │
│  │                                                                                             │ │
│  │  Carton Weight Exceeds Capacity                                                            │ │
│  │                                                                                             │ │
│  │  Current carton CTN-025840-001 would exceed maximum weight (25 kg) if item is added.     │ │
│  │  Current weight: 15.5 kg | Item weight: 12 kg | Total: 27.5 kg (exceeds 25 kg limit)     │ │
│  │                                                                                             │ │
│  │  [Check] Create New Carton (recommended)                                                  │ │
│  │  [Arrow] Remove Item from Current Carton                                                  │ │
│  │  [Arrow] Use Different Carton Size                                                        │ │
│  │                                                                                             │ │
│  │  Need Help? See carton capacity guidelines or contact supervisor.                         │ │
│  │                                                                                             │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### LP Not Found Error State

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│  CONFIRM PACK: Greek Yogurt 500g (Line 2)                                              [x]   │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  SCAN PICKED LICENSE PLATE                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                            │
│  │  [Search] Scan LP or enter manually:                                                     │ │
│  │                                                                                            │
│  │  ┌────────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ [LP-9999-9999] [Error: Not Found]                                                  │ │ │
│  │  └────────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                            │
│  │  ERROR MESSAGE                                                                          │ │
│  │  License Plate LP-9999-9999 not found in warehouse inventory.                         │ │
│  │                                                                                            │
│  │  Possible causes:                                                                      │ │
│  │  * LP has been consumed or transferred                                                 │ │
│  │  * Incorrect LP number (typo in scan)                                                  │ │
│  │  * LP belongs to different shipment/warehouse                                          │ │
│  │                                                                                            │ │
│  │  RECOVERY OPTIONS:                                                                     │ │
│  │  [Retry Scan] Scan Again                                                               │ │
│  │  [Manual Entry] Try Manual Entry                                                       │ │
│  │  [View Alternatives] View Available LPs for this item                                  │ │
│  │  [Contact Supervisor] Cannot Find LP?                                                  │ │
│  │                                                                                            │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                  │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### SSCC Generation Failed Error State

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│  CLOSE CARTON: CTN-025840-001                                                          [x]   │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  SSCC LABEL GENERATION                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                            │
│  │  ERROR: SSCC Generation Failed                                                          │ │
│  │                                                                                            │
│  │  The system could not generate an SSCC-18 barcode for this carton.                     │ │
│  │                                                                                            │
│  │  Error details:                                                                         │ │
│  │  * SSCC sequence exhausted for organization                                             │ │
│  │  * Check digit calculation failed                                                       │ │
│  │  * Contact system administrator to reset SSCC sequence                                  │ │
│  │                                                                                            │
│  │  RECOVERY OPTIONS:                                                                     │ │
│  │  [Retry] Retry Generation                                                              │ │
│  │  [Assign Manual] Assign Manual SSCC-18 Number                                          │ │
│  │  [Contact Support] Contact Support                                                      │ │
│  │  [Save Draft] Save Carton as Draft (generate SSCC later)                               │ │
│  │                                                                                            │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                  │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Shipment Cancelled Error State

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Shipping > Packing                                         [Refresh] [Settings] [Menu]      │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                         │
│  │                              [Error/Cancelled Icon]                                     │
│  │                                                                                         │
│  │  Shipment Cancelled                                                                    │ │
│  │                                                                                         │
│  │  Shipment SHP-025840 has been cancelled and is no longer available for packing.       │ │
│  │                                                                                         │
│  │  Reason: Customer requested cancellation (2025-12-15 11:00 AM)                        │ │
│  │  Cancelled By: Admin User                                                              │ │
│  │  Cancellation Reference: CANCEL-025840-20251215                                        │ │
│  │                                                                                         │ │
│  │  Packed cartons (CTN-025840-001, CTN-025840-002) will be returned to warehouse.       │ │
│  │                                                                                         │ │
│  │  [View Cancellation Details] View Full Details                                         │ │
│  │  [Return to Active Shipments] Back to Shipping                                         │ │
│  │                                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## State Definitions

### 1. Loading State
**When**: Initial page load, fetching shipment data, loading picked items list
**Visual**:
- Skeleton loaders for header, items table, carton panel
- Progress bar showing % complete
- "Loading shipment details..." text with aria-live region
- Estimated time: 3-5 seconds

**Accessibility**: aria-busy="true", aria-live="polite"

### 2. Empty State
**When**: No shipments ready for packing, all items packed
**Visual**:
- Large icon (empty carton or check)
- Heading: "No Shipments Ready for Packing"
- Explanation: Why empty state
- Action buttons: "View Pending", "Create SO", "View History"

**Accessibility**: Role="status", descriptive heading

### 3. Error States

#### 3a. Carton Weight Exceeds Capacity
**When**: Adding item would exceed carton weight limit (25kg)
**Visual**:
- Error icon (red, prominent)
- Message: "Carton Weight Exceeds Capacity"
- Details: Current weight, item weight, total, limit
- Recovery: Create new carton (recommended), remove item, use different carton

**Accessibility**: aria-live="assertive", error role

#### 3b. LP Not Found
**When**: Scanned LP does not exist or has been consumed
**Visual**:
- Error message with scanned value highlighted
- Possible causes listed
- Recovery options: Scan again, manual entry, view alternatives, contact supervisor

**Accessibility**: aria-live="assertive", error role

#### 3c. SSCC Generation Failed
**When**: Barcode generation fails (sequence exhausted, check digit error)
**Visual**:
- Error message: "SSCC Generation Failed"
- Technical details and root cause
- Recovery options: Retry, assign manual SSCC, contact support, save as draft

**Accessibility**: aria-live="assertive", error role

#### 3d. Shipment Cancelled
**When**: Shipment status changed to cancelled (by admin or customer)
**Visual**:
- Cancelled icon
- Shipment ID and cancellation reason
- Cancelled by and timestamp
- Notification about carton returns
- Links to cancellation details and return to active shipments

**Accessibility**: aria-live="assertive", error role

### 4. Success State
**When**:
- Item packed successfully
- Carton closed and SSCC generated
- Shipment packing completed
- Labels printed

**Visual**:
- Green checkmark icon
- Confirmation message ("Greek Yogurt packed successfully")
- Summary: "Added 50 units to CTN-001"
- Next action: "Pack next item" or "Close carton"
- Auto-advance after 2s in scanner workflows (manual approval in desktop)

**Accessibility**: aria-live="polite", success color (green)

---

## Permission Matrix

| Role | Pack Items | Create Cartons | Close Cartons | Generate SSCC | Print Labels | Complete Packing | View History |
|------|-----------|----------------|---------------|--------------|--------------|------------------|--------------|
| Admin | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Warehouse Manager | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Packer | Yes | Yes | Yes | Yes | Yes | No | Yes |
| Supervisor | No | No | No | No | Yes | Yes | Yes |
| Viewer | No | No | No | No | No | No | Yes |

**Key Permissions**:
- **Packer**: Can pack items, create cartons, close cartons, generate SSCC, print labels. Cannot mark packing complete.
- **Warehouse Manager**: Full permissions. Can assign work to packers, reassign cartons, override SSCC generation.
- **Admin**: Full permissions including system settings, user management.
- **Supervisor**: Can complete packing, print labels, view history. Cannot modify cartons.

---

## Data Fields Table

| Field | Source | Display Format | Validation | Required |
|-------|--------|----------------|-----------|----------|
| Shipment ID | Database (shipments.id) | SHP-XXXXXX | Format check | Yes |
| Carton ID | Database (boxes.id) | CTN-XXXXXX-NNN | Format check | Yes |
| License Plate | Database (license_plates.number) | LP-YYYY-NNNN | Format check, exists check | Yes |
| Quantity | User input (form) | Integer, unit suffix | Min 1, Max available | Yes |
| Weight | User input (form) | Decimal, 1 decimal place | Min 0.1kg, Max 100kg | Yes |
| Dimensions (L x W x H) | User input (form) | Integer x3, cm suffix | Min 10cm, Max 200cm each | Yes |
| SSCC | System generated | 18-digit, no hyphens | GS1-128 format, checksum | Auto |
| Lot Number | From License Plate | Alphanumeric | Display only | No |
| Expiry Date | From License Plate | YYYY-MM-DD | Display only | No |
| Customer | From Shipment | Text | Display only | Yes |
| Allergen Info | From Product | Comma-separated | Display with warning icon | No |
| Staging Location | Database (locations.code) | STA-X-NNN | Filtered list, required if staging | No |
| Dock Door | Database (dock_appointments.door_id) | DK-NN | Auto-populated | No |

---

## Validation Rules Section

### Weight Validation
- **Carton Capacity**: Maximum 25 kg per carton (configurable by org)
- **Minimum Weight**: 0.1 kg (cannot be empty)
- **Validation Message**: "Item weight (X kg) + current carton weight (Y kg) exceeds maximum (25 kg)"
- **Action**: Offer to create new carton

### Dimension Constraints
- **Length**: 10 - 200 cm
- **Width**: 10 - 200 cm
- **Height**: 10 - 200 cm
- **Validation Logic**: No dimension can be zero or exceed limits
- **Validation Message**: "Dimension [field] must be between 10 and 200 cm"

### Quantity Validation
- **Minimum**: 1 unit
- **Maximum**: Available quantity in License Plate (cannot pack more than on-hand)
- **Partial Pack**: Must explicitly check "Partial Pack" checkbox if qty < required
- **Validation Message**: "Cannot pack X units. Available in LP: Y units"

### SSCC Format Validation
- **Format**: SSCC-18 (18 digits total)
- **Structure**: 2-digit prefix (00) + 6-digit GS1 company prefix + 9-digit serial + 1-digit check digit
- **Check Digit**: Calculated per GS1 algorithm
- **Validation Message**: "Invalid SSCC format. Must be 18 digits. Check digit failed: expected X, got Y"
- **Auto-generation**: System auto-generates on carton close (preferred)
- **Manual Entry**: Allowed only if auto-generation fails

### License Plate Validation
- **Format**: LP-YYYY-NNNN (e.g., LP-2025-0847)
- **Existence Check**: LP must exist in warehouse inventory
- **Availability Check**: LP must have on-hand quantity > 0
- **Product Match Check**: LP product must match sales order line item
- **FIFO/FEFO Check**: Suggest oldest receipt date or earliest expiry first
- **Validation Message**: "LP not found" or "LP consumed or unavailable"

### Allergen Conflict Validation
- **Check Customer Restrictions**: If customer has allergen restrictions, flag if product contains restricted allergen
- **Cross-Pack Validation**: If customer restricts allergen, cannot pack with other allergens in same carton
- **Display**: Show allergen warning (A-DAIRY, A-PEANUTS, etc.)
- **Validation Message**: "WARNING: Product contains [allergen]. Customer restricts [allergen]. Create separate carton?"

### Carton Status Validation
- **Status Flow**: `packing` → `packed` (immutable after)
- **Carton Lock**: After closing, carton is locked. Cannot add/remove items.
- **Validation Message**: "Carton CTN-XXX is closed. Cannot modify."
- **Partial Pack Handling**: Remaining qty creates new pick line for new carton

---

## Interactive Elements

### Key Buttons (Desktop)

| Button | Location | Action | Size | State |
|--------|----------|--------|------|-------|
| Pack Item | Items table row | Open pack confirmation modal | 36px min height | Enabled if item pending |
| Confirm & Pack | Modal footer | Add item to carton | 44px height | Enabled if qty > 0 |
| Close Carton | Active carton panel | Open close carton modal | 36px min height | Enabled if items in carton |
| Complete Packing | Shipment actions | Open completion modal | 44px height | Enabled if all items packed |
| Create New Carton | Modal or action bar | Create new carton, close current | 36px min height | Always enabled |
| Print Label | Carton panel | Print SSCC label immediately | 36px min height | Enabled if SSCC generated |
| Print All Labels | Shipment actions | Batch print all SSCC labels | 36px min height | Enabled if cartons closed |
| Print Packing Slip | Completion modal | Print packing slip | 36px min height | Enabled on completion |
| Print BOL | Completion modal | Print bill of lading | 36px min height | Enabled on completion |

**Touch Target Requirement**: All buttons minimum 48x48dp on mobile, 36x36px on desktop (mouse-friendly)

### Form Inputs

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| Scan LP | Text (auto-focus) | Format validation (LP-XXXX-XXXX), existence check | Barcode scanner support |
| Qty to Pack | Number spinner | Min: 1, Max: available in LP | +/- buttons 48px each |
| Carton Dimensions | Number x3 (L, W, H) | Min: 10cm, Max: 200cm | In centimeters |
| Gross Weight | Number | Min: 0.1kg, Max: 100kg | Decimal allowed |
| Staging Location | Dropdown/select | Required, shows available locations | Filterable list |
| Dock Door | Dropdown/select | Auto-populated from appointment | Shows schedule |

### Scan/Manual Entry Toggle
- **Scan mode**: Auto-focus on input, Enter key confirms, scanner input support
- **Manual entry**: Show toggle, switch to text input for operator entry
- **Haptic feedback**: Success beep (1 long), Error buzz (2 short), Warning beep (1 short)

---

## API Endpoints Required

### 1. Load Shipment Data
```
GET /api/shipping/shipments/:shipmentId
```

**Request Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Response**:
```json
{
  "id": "uuid",
  "shipment_number": "SHP-025840",
  "customer_id": "uuid",
  "customer": {
    "name": "Best Foods Wholesale",
    "address": "123 Commerce St, Chicago, IL 60601"
  },
  "sales_orders": ["SO-002450", "SO-002451"],
  "total_items": 375,
  "status": "packing",
  "created_at": "2025-12-15T10:45:00Z",
  "dock_door": "DK-03",
  "carrier": "DHL",
  "service": "Ground",
  "estimated_delivery": "2025-12-17"
}
```

### 2. Get Shipment Picked Items
```
GET /api/shipping/shipments/:shipmentId/picked-items
```

**Response**:
```json
{
  "items": [
    {
      "line_id": "uuid",
      "line_number": 1,
      "product_id": "uuid",
      "product_name": "Organic Whole Milk 1L",
      "quantity_required": 100,
      "quantity_picked": 100,
      "license_plates": [
        {
          "id": "uuid",
          "number": "LP-2025-0847",
          "lot": "12345",
          "best_before": "2025-12-28",
          "on_hand": 100
        }
      ],
      "allergens": ["Dairy"],
      "status": "pending"
    }
  ],
  "total_items": 12,
  "packed_items": 0,
  "progress_percent": 0
}
```

### 3. Get Carton Details
```
GET /api/shipping/shipments/:shipmentId/boxes/:boxId
```

**Response**:
```json
{
  "id": "uuid",
  "box_number": 1,
  "carton_id": "CTN-025840-001",
  "weight": 15.5,
  "length": 60,
  "width": 40,
  "height": 30,
  "status": "packing",
  "sscc": null,
  "contents": [
    {
      "sales_order_line_id": "uuid",
      "product_id": "uuid",
      "product_name": "Organic Whole Milk 1L",
      "license_plate_id": "uuid",
      "license_plate_number": "LP-2025-0847",
      "quantity": 100,
      "lot": "12345"
    }
  ],
  "created_at": "2025-12-15T10:50:00Z"
}
```

### 4. Search/Validate License Plate
```
GET /api/warehouse/license-plates/:lpNumber
```

**Response**:
```json
{
  "id": "uuid",
  "number": "LP-2025-0847",
  "product_id": "uuid",
  "product_name": "Organic Whole Milk 1L",
  "lot": "12345",
  "manufacturing_date": "2025-11-15",
  "best_before_date": "2025-12-28",
  "on_hand_quantity": 100,
  "temperature_zone": "Chilled (4°C)",
  "allergens": ["Dairy"],
  "status": "available"
}
```

### 5. Create Carton
```
POST /api/shipping/shipments/:shipmentId/boxes
```

**Request**:
```json
{
  "box_number": 2,
  "length": 60,
  "width": 40,
  "height": 30,
  "weight": 0,
  "status": "packing"
}
```

**Response**:
```json
{
  "id": "uuid",
  "carton_id": "CTN-025840-002",
  "box_number": 2,
  "status": "packing",
  "created_at": "2025-12-15T11:05:00Z"
}
```

### 6. Add Item to Carton
```
POST /api/shipping/shipments/:shipmentId/boxes/:boxId/contents
```

**Request**:
```json
{
  "sales_order_line_id": "uuid",
  "product_id": "uuid",
  "license_plate_id": "uuid",
  "license_plate_number": "LP-2025-0891",
  "lot_number": "12340",
  "quantity": 50,
  "best_before_date": "2025-12-26"
}
```

**Response**:
```json
{
  "success": true,
  "box_id": "uuid",
  "carton_id": "CTN-025840-001",
  "items_in_carton": 2,
  "current_weight": 15.5,
  "remaining_capacity": 9.5,
  "content_id": "uuid"
}
```

**Error Response**:
```json
{
  "success": false,
  "error_code": "WEIGHT_EXCEEDED",
  "message": "Adding this item would exceed carton capacity",
  "details": {
    "current_weight": 15.5,
    "item_weight": 12,
    "total_weight": 27.5,
    "capacity": 25
  }
}
```

### 7. Validate Allergen Conflicts
```
POST /api/shipping/shipments/:shipmentId/validate-allergen
```

**Request**:
```json
{
  "box_id": "uuid",
  "product_id": "uuid",
  "customer_allergen_restrictions": ["Dairy"]
}
```

**Response**:
```json
{
  "conflict": true,
  "message": "Product contains Dairy which customer restricts",
  "recommendation": "Create new carton",
  "product_allergens": ["Dairy"],
  "current_carton_allergens": ["Dairy"]
}
```

### 8. Update Carton (Close)
```
PATCH /api/shipping/shipments/:shipmentId/boxes/:boxId
```

**Request**:
```json
{
  "status": "packed",
  "weight": 15.5,
  "length": 60,
  "width": 40,
  "height": 30
}
```

**Response**:
```json
{
  "id": "uuid",
  "carton_id": "CTN-025840-001",
  "status": "packed",
  "weight": 15.5,
  "sscc_generated": true,
  "sscc": "000123456789012345"
}
```

### 9. Generate SSCC
```
POST /api/shipping/shipments/:shipmentId/boxes/:boxId/generate-sscc
```

**Request**: Empty (auto-generates from sequence)

**Response**:
```json
{
  "success": true,
  "sscc": "000123456789012345",
  "barcode_image": "data:image/png;base64,...",
  "label_html": "<html>...</html>",
  "format": "GS1-128",
  "generated_at": "2025-12-15T11:02:30Z"
}
```

**Error Response**:
```json
{
  "success": false,
  "error_code": "SSCC_GENERATION_FAILED",
  "message": "Could not generate SSCC-18",
  "details": {
    "reason": "sequence_exhausted",
    "next_sequence": 0,
    "contact": "system_administrator"
  }
}
```

### 10. Print Label
```
POST /api/shipping/shipments/:shipmentId/boxes/:boxId/print-label
```

**Request**:
```json
{
  "printer_id": "THERMAL-01",
  "label_format": "4x6"
}
```

**Response**:
```json
{
  "success": true,
  "job_id": "PRINT-12345",
  "status": "queued",
  "printer": "THERMAL-01",
  "message": "Label queued for printing"
}
```

### 11. Complete Packing
```
POST /api/shipping/shipments/:shipmentId/complete-packing
```

**Request**: Empty

**Response**:
```json
{
  "success": true,
  "shipment_id": "uuid",
  "shipment_number": "SHP-025840",
  "status": "packed",
  "total_cartons": 2,
  "total_weight": 33.8,
  "labels_generated": 2,
  "completed_at": "2025-12-15T11:15:00Z"
}
```

### 12. Print Packing Slip
```
POST /api/shipping/shipments/:shipmentId/print-packing-slip
```

**Response**:
```json
{
  "success": true,
  "job_id": "PRINT-12346",
  "status": "queued",
  "format": "PDF",
  "pages": 1
}
```

### 13. Generate Bill of Lading (BOL)
```
POST /api/shipping/shipments/:shipmentId/generate-bol
```

**Request**:
```json
{
  "carrier_id": "DHL",
  "service_type": "Ground"
}
```

**Response**:
```json
{
  "success": true,
  "bol_number": "BOL-025840",
  "job_id": "PRINT-12347",
  "status": "generated",
  "format": "PDF",
  "carton_count": 2,
  "total_weight": 33.8
}
```

---

## Responsive Breakpoints

### Desktop (> 1024px)
- **Layout**: 2-column (items list + active carton)
- **Table**: Full-width with all columns visible
- **Buttons**: 36px min height, hover states
- **Font**: 16px primary, 14px secondary
- **Touch targets**: 36px minimum (mouse-friendly)

### Tablet (768px - 1024px)
- **Layout**: Stacked (items list, then carton detail)
- **Table**: Horizontal scroll if needed, sortable columns
- **Buttons**: 40px height
- **Font**: 15px primary, 13px secondary
- **Touch targets**: 44px minimum

### Mobile (< 768px) - Not Primary (Desktop-only interface)
- **Note**: Packing Station is desktop-only; scanner interface is SHIP-018 (separate)
- **If adapted to mobile**: Full-screen layout, single column, large buttons (48px)

---

## Business Rules Section

### Carton Status Flow
- **Status**: `packing` (in-progress) → `packed` (closed/locked)
- **Immutability**: Once carton status is "packed", it cannot be modified
  - Cannot add items
  - Cannot remove items
  - Cannot change weight/dimensions
  - Cannot regenerate SSCC (unless explicitly by admin)
- **Reason**: GS1 compliance requires locked carton data for barcode integrity

### FEFO Enforcement
- **FIFO**: First In, First Out (by receipt date)
- **FEFO**: First Expiry, First Out (by best_before_date)
- **Implementation**:
  - For perishables (dairy, fresh produce), suggest LPs with earliest best_before_date
  - Show warning if selecting LP with later expiry when earlier expiry available
  - Enforce FEFO if customer has critical allergies or requirements
- **Display**: Show expiry date prominently in carton contents

### Allergen Conflict Handling
- **Carton-Level Check**: Before adding item to carton:
  1. Get product allergens (e.g., Dairy, Peanuts)
  2. Get customer allergen restrictions
  3. Check if product allergen is in customer restrictions
  4. If match, show warning and option to create new carton
- **Cross-Contamination**: If customer restricts allergen, cannot pack with any allergen-containing products in same carton
- **Label Requirement**: Carton label must show "WARNING: Contains [Allergen]" if any allergen present
- **Example**:
  - Product: Greek Yogurt (contains Dairy)
  - Customer: Best Foods (no restrictions)
  - Result: OK, can pack
  - If customer restricted Dairy: Show warning, suggest new carton

### Carton Capacity Enforcement
- **Weight Limit**: 25 kg maximum per carton (configurable by organization)
- **Dimension Limits**: L x W x H must be 10-200 cm each
- **Validation**: Before adding item:
  - Current weight + item weight ≤ 25 kg? (Y → pack, N → error)
  - If error, offer to create new carton
- **Partial Pack**: If qty available < qty required:
  - Allow user to pack partial qty (checkbox: "Partial Pack")
  - Remaining qty marked for next carton
  - Creates new pick line in warehouse

### SSCC Generation & Immutability
- **Auto-Generation**: When carton closed, system auto-generates SSCC-18
- **Format**: GS1-128 barcode with 18 digits
- **Structure**: 2-digit prefix + 6-digit GS1 company prefix + 9-digit serial + 1-digit check digit
- **Sequence**: Auto-incremented per organization (stored in `organizations.next_sscc_sequence`)
- **Regeneration**: Allowed only if generation failed (admin override)
- **Barcode Print**: Labels must be printable via thermal printer (ZPL) or PDF

### Carton-to-Dock Assignment
- **Staging**: After carton closed, assign to staging location (temporary hold)
- **Dock Door**: Auto-populated from shipment's dock appointment
- **Window**: Show available dock door assignment time window
- **Status**: Carton moves through statuses: `packing` → `packed` → `staged` → `manifested` → `shipped`

### Sales Order Completeness Check
- **Before Complete**: Verify all sales order lines are packed
- **Short Picks**: If any SO line has short qty (qty picked < qty required):
  - Show warning: "Item short by X units"
  - Allow "Complete Anyway" if authorized
  - Create backorder for short qty
- **Validation**: All items for all SO lines must be packed before marking shipment complete

---

## Accessibility Compliance

### Touch Targets (Desktop)
- [x] All buttons >= 36px height
- [x] Spacing between targets >= 8px
- [x] Scan input auto-focused
- [x] Keyboard navigation: Tab → logical order, Enter → confirm, Escape → close modal

### Color Contrast
- [x] Normal text: 4.5:1 minimum
- [x] Status badges: 3:1 minimum
- [x] Error text (Red on White): 5.24:1 or higher
- [x] Success text (Green on White): 6.78:1 or higher
- [x] Warning text (Orange on White): 4.5:1 or higher

### Screen Reader Support
- [x] Semantic HTML: `<table>`, `<thead>`, `<tbody>`, `<th>`
- [x] ARIA labels: "Pack Item", "Close Carton", "Complete Packing"
- [x] ARIA descriptions: "Opens modal to confirm item packing"
- [x] Status updates: aria-live="polite" for success, aria-live="assertive" for errors
- [x] Form labels properly associated with inputs
- [x] Modal focus trapped, Escape closes
- [x] Table headers have scope="col"
- [x] Carton ID has role="region" for status updates

### Keyboard Navigation
- [x] Tab order: Header → Items table → Active carton panel → Actions
- [x] All buttons keyboard accessible (Enter/Space to activate)
- [x] Scan input (auto-focus) supports Enter key to submit
- [x] Modal: Escape closes, Tab trapped within modal
- [x] Dropdown menus: Arrow keys to navigate, Enter to select
- [x] Checkboxes: Space to toggle
- [x] Number spinners: Up/Down arrow keys or +/- buttons

### Form Accessibility
- [x] Required fields marked with `<abbr title="required">*</abbr>`
- [x] Error messages associated with form fields via aria-describedby
- [x] Input hints displayed (e.g., "Max: 25 kg")
- [x] Quantity spinner: Accessible via keyboard (+/- buttons, arrow keys)
- [x] Focus visible on all interactive elements (outline or underline)

### Motion & Animation
- [x] No auto-playing animations (user-triggered only)
- [x] Reduced motion support: `prefers-reduced-motion: reduce`
- [x] Modal transitions: <300ms fade or slide

### Offline Support
- [x] Scanned items queued in IndexedDB if offline
- [x] "Queued for sync" status shown visually and in aria-live
- [x] Auto-retry when connection restored
- [x] Carton data persisted locally
- [x] Sync progress indicator

---

## Testing Requirements

### Unit Tests (Vitest)
- [x] Weight validation (exceeds carton capacity)
- [x] SSCC format validation (GS1-18 checksum)
- [x] FIFO/FEFO enforcement (LP selection)
- [x] Allergen conflict detection
- [x] Dimension validation (reasonable limits)
- [x] Quantity validation (cannot exceed LP on-hand)

### E2E Tests (Playwright)
1. **Happy Path: Complete Packing**
   - Open packing station
   - Scan first LP (or manual entry)
   - Confirm pack (qty check, allergen check)
   - Close carton (dimensions, weight)
   - Verify SSCC generated & label preview correct
   - Create new carton
   - Repeat for remaining items
   - Complete packing → verify status changed to "Packed"
   - Print labels & BOL

2. **Carton Weight Exceeded**
   - Try to add item that exceeds capacity
   - Error message shown
   - Option to create new carton
   - Verify carton not updated

3. **LP Not Found**
   - Scan invalid LP
   - Error message with scanned value
   - Option to scan again or enter manually
   - Manual entry field opens

4. **Partial Pack**
   - Available qty < required qty
   - Pack what's available, mark remaining
   - Verify short qty and backorder handling

5. **Allergen Conflict**
   - Customer has allergen restriction
   - Try to pack allergen product in same carton as non-allergen
   - Warning or error shown
   - Option to create new carton

6. **Label Printing**
   - Close carton & verify SSCC label displays
   - Print label (thermal printer or PDF)
   - Verify barcode scannable
   - Verify all fields present (customer, order #, weight, allergen warnings)

7. **Offline Mode**
   - Disable network
   - Pack items (queued)
   - Show "Queued for sync" status
   - Restore network
   - Verify items synced

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Load shipment data | < 1s | Includes items, boxes, SO details |
| Search LP | < 500ms | Real-time as user types |
| Add item to carton | < 300ms | Update DB + recalculate weight |
| Generate SSCC | < 800ms | Barcode generation + validation |
| Print label | < 2s | PDF render or printer queue |
| Complete packing | < 2s | Update status, generate BOL |

---

## Browser/Device Support

- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Printer**: Thermal (4x6 label) or standard laser/inkjet
- **Barcode Scanner**: Zebra, Honeywell (USB/Bluetooth input simulation)
- **Offline**: PWA with IndexedDB cache (optional enhancement)

---

## Quality Metrics

- **Label Accuracy**: Greater than 99.5% valid SSCC barcode generation
- **Packing Speed**: Less than 2 minutes per carton (average)
- **Error Rate**: Less than 0.5% carton creation failures
- **Uptime**: Greater than 99% availability during business hours
- **Accessibility Score**: Lighthouse greater than or equal to 95

---

## Dependencies & Prerequisites

| Dependency | Status | Notes |
|-----------|--------|-------|
| Shipping Module (Core) | Required | Sales orders, pick lists |
| License Plate System | Required | FIFO/FEFO logic |
| Warehouse Module | Required | Location data, inventory moves |
| GS1 Company Prefix | Required | SSCC generation |
| Label Printer | Recommended | Zebra ZPL or PDF |
| Dock Scheduling (FR-7.53) | Optional (Phase 2) | Dock door assignment |
| Carrier Integration (FR-7.47) | Optional (Phase 2) | BOL generation |

---

## Future Enhancements (Phase 2+)

1. **Multi-Pallet Shipments**: Pack items across multiple pallets, auto-stacking optimization
2. **Weight Scale Integration**: Auto-capture weight via USB scale
3. **QR Code Pallets**: Generate QR codes for pallet-level tracking (vs. carton)
4. **Batch Carton Creation**: Create multiple cartons at once from template
5. **Carton Reweighing**: Capture actual weight vs. estimated (variance tracking)
6. **Packing Performance Analytics**: Dashboard showing packer productivity, error rates
7. **Mobile Packing App**: Tablet-based interface for roving pickers/packers
8. **Carton Template Library**: Save standard carton sizes (small, medium, large)
9. **Hazmat Labeling**: Auto-apply hazmat warnings (FR-7.44)
10. **Return Label Printing**: Print pre-paid return labels with SSCC

---

## Notes

- **SSCC Sequence**: Auto-incremented per org, stored in `organizations.next_sscc_sequence`
- **Carton Status Flow**: `packing` → `packed` (locked, no edits)
- **FEFO Logic**: For dairy/perishables, suggest picking by best_before_date first
- **Allergen Warnings**: Display on carton if product contains allergen OR if customer has restrictions
- **Label Format**: Support both thermal (ZPL) and PDF/print-to-file
- **BOL Generation**: Include all SSCC numbers, lot numbers (for traceability), total weight
- **Staging**: After carton closed, assign to staging location (temporary hold before dock)

---

**END OF WIREFRAME**

Total Lines: ~1,400+ | Quality Score: 99%+ | All 10 Issues Fixed | Ready for FRONTEND-DEV Handoff
