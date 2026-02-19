# NPD-014: Formulation Compare View

**Module**: NPD (New Product Development)
**Feature**: Side-by-side Formulation Version Comparison (FR-NPD-15)
**Type**: Full Page / Modal (Context-dependent)
**Path**: `/npd/projects/{projectId}/formulations/compare` or Modal from NPD-006
**ID**: NPD-014
**Parent**: NPD-006 (Formulation List Page)
**Status**: Ready for Review
**Last Updated**: 2026-01-15

---

## Overview

The Formulation Compare View provides side-by-side comparison of two formulation versions, highlighting differences in ingredients, quantities, costs, and allergens. This enables R&D teams to track recipe evolution and validate changes before approval.

**Business Context:**
- Compare any two versions of a formulation within the same NPD project
- Visual diff highlighting: added (green), removed (red), changed (yellow) items
- Cost impact analysis showing total cost difference
- Allergen difference detection for compliance
- Export comparison report for documentation

**Critical PRD Coverage:**
- NPD-FR-15: System shall compare formulation versions - Should
- NPD-FR-14: Track formulation lineage - Must (supports comparison context)

**Page Purpose:**
- Select two formulation versions to compare
- Display side-by-side ingredient differences
- Highlight additions, removals, and quantity changes
- Show cost variance between versions
- Show allergen differences
- Export comparison report

---

## ASCII Wireframe

### Compared With Changes (Default State)

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Project > NPD-2025-00001 > Compare Formulations                       [Export Comparison] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- VERSION SELECTORS -----------------------------------------+   |
|  |                                                                                            |   |
|  |  Compare Version                                  With Version                             |   |
|  |  +----------------------------------------+       +----------------------------------------+|   |
|  |  | v1.0 (Locked - Jan 15)           [v]   |       | v2.0 (Draft - Feb 10)            [v]  ||   |
|  |  +----------------------------------------+       +----------------------------------------+|   |
|  |                                                                                            |   |
|  |  [Swap Versions]                                                                           |   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
|  +-------------------------------- COMPARISON SUMMARY -----------------------------------------+   |
|  |                                                                                            |   |
|  |  Summary:  5 items compared  |  +2 Added  |  -1 Removed  |  ~2 Changed                    |   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
|  +-------------------------------- COMPARISON TABLE ------------------------------------------+   |
|  |                                                                                            |   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  | Item                      | v1.0 Qty    | v2.0 Qty    | Change         | Status       ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  | ING-001                   | 42.000 kg   | 45.000 kg   | +3.000 kg      | [~ Changed]  ||   |
|  |  | Pea Protein Isolate       | 42.00%      | 45.00%      | +3.00%         |              ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  | ING-002                   | 28.000 kg   | 25.000 kg   | -3.000 kg      | [~ Changed]  ||   |
|  |  | Water                     | 28.00%      | 25.00%      | -3.00%         |              ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  | ING-003                [+]| -           | 15.000 kg   | +15.000 kg     | [+ Added]    ||   |
|  |  | Coconut Oil               | -           | 15.00%      | +15.00%        |   (green)    ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  | ING-004                   | 8.000 kg    | 8.000 kg    | -              | [= Same]     ||   |
|  |  | Methylcellulose           | 8.00%       | 8.00%       | -              |              ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  | ING-005                   | 7.000 kg    | 7.000 kg    | -              | [= Same]     ||   |
|  |  | Seasoning Blend           | 7.00%       | 7.00%       | -              |              ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  | ING-006                [-]| 15.000 kg   | -           | -15.000 kg     | [- Removed]  ||   |
|  |  | Sunflower Oil             | 15.00%      | -           | -15.00%        |   (red)      ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |                                                                                            |   |
|  |  Legend:  [+ Added] = Green  |  [- Removed] = Red  |  [~ Changed] = Yellow  | [= Same]   |   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
|  +-------------------------------- COST DIFFERENCE -------------------------------------------+   |
|  |                                                                                            |   |
|  |  Cost Analysis (per batch unit)                                                            |   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  |                                                                                        ||   |
|  |  |  v1.0 Estimated Cost        v2.0 Estimated Cost        Difference                     ||   |
|  |  |  +------------------+       +------------------+       +------------------+            ||   |
|  |  |  |   4.85 PLN/kg    |       |   4.72 PLN/kg    |       |  -0.13 PLN/kg    |            ||   |
|  |  |  +------------------+       +------------------+       +------------------+            ||   |
|  |  |                                                         (-2.7%)                        ||   |
|  |  |                                                                                        ||   |
|  |  |  [i] Cost reduction achieved by replacing Sunflower Oil with lower-cost Coconut Oil   ||   |
|  |  |                                                                                        ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
|  +-------------------------------- ALLERGEN DIFFERENCE ---------------------------------------+   |
|  |                                                                                            |   |
|  |  Allergen Changes                                                                          |   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  |                                                                                        ||   |
|  |  |  v1.0 Allergens                              v2.0 Allergens                            ||   |
|  |  |  +----------------------------------+       +----------------------------------+       ||   |
|  |  |  | Contains:                        |       | Contains:                        |       ||   |
|  |  |  | - Soy (ING-001)                  |       | - Soy (ING-001)                  |       ||   |
|  |  |  | - Sunflower (ING-006) [-]        |       |                                  |       ||   |
|  |  |  |                                  |       |                                  |       ||   |
|  |  |  | May Contain:                     |       | May Contain:                     |       ||   |
|  |  |  | - Wheat                          |       | - Wheat                          |       ||   |
|  |  |  |                                  |       | - Tree Nuts (ING-003) [+]        |       ||   |
|  |  |  +----------------------------------+       +----------------------------------+       ||   |
|  |  |                                                                                        ||   |
|  |  |  Summary: -1 Contains (Sunflower removed)  |  +1 May Contain (Tree Nuts added)        ||   |
|  |  |                                                                                        ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [Back to Formulations]                                                       [Export Comparison] |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Compared No Changes State

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Project > NPD-2025-00001 > Compare Formulations                       [Export Comparison] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- VERSION SELECTORS -----------------------------------------+   |
|  |                                                                                            |   |
|  |  Compare Version                                  With Version                             |   |
|  |  +----------------------------------------+       +----------------------------------------+|   |
|  |  | v1.0 (Locked - Jan 15)           [v]   |       | v1.1 (Approved - Jan 25)         [v]  ||   |
|  |  +----------------------------------------+       +----------------------------------------+|   |
|  |                                                                                            |   |
|  |  [Swap Versions]                                                                           |   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
|  +-------------------------------- NO CHANGES BANNER -----------------------------------------+   |
|  |                                                                                            |   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  |                                                                                        ||   |
|  |  |                               [checkmark icon]                                         ||   |
|  |  |                                                                                        ||   |
|  |  |                    No Differences Found Between Versions                               ||   |
|  |  |                                                                                        ||   |
|  |  |       v1.0 and v1.1 have identical ingredients, quantities, and allergens.            ||   |
|  |  |       This may indicate a documentation-only update or effective date change.         ||   |
|  |  |                                                                                        ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
|  +-------------------------------- COMPARISON TABLE (All Same) -------------------------------+   |
|  |                                                                                            |   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  | Item                      | v1.0 Qty    | v1.1 Qty    | Change         | Status       ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  | ING-001                   | 42.000 kg   | 42.000 kg   | -              | [= Same]     ||   |
|  |  | Pea Protein Isolate       | 42.00%      | 42.00%      | -              |              ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  | ING-002                   | 28.000 kg   | 28.000 kg   | -              | [= Same]     ||   |
|  |  | Water                     | 28.00%      | 28.00%      | -              |              ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  | ING-006                   | 15.000 kg   | 15.000 kg   | -              | [= Same]     ||   |
|  |  | Sunflower Oil             | 15.00%      | 15.00%      | -              |              ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  | ING-004                   | 8.000 kg    | 8.000 kg    | -              | [= Same]     ||   |
|  |  | Methylcellulose           | 8.00%       | 8.00%       | -              |              ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  | ING-005                   | 7.000 kg    | 7.000 kg    | -              | [= Same]     ||   |
|  |  | Seasoning Blend           | 7.00%       | 7.00%       | -              |              ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
|  +-------------------------------- COST DIFFERENCE (No Change) -------------------------------+   |
|  |                                                                                            |   |
|  |  Cost Analysis (per batch unit)                                                            |   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  |                                                                                        ||   |
|  |  |  v1.0 Estimated Cost        v1.1 Estimated Cost        Difference                     ||   |
|  |  |  +------------------+       +------------------+       +------------------+            ||   |
|  |  |  |   4.85 PLN/kg    |       |   4.85 PLN/kg    |       |   0.00 PLN/kg    |            ||   |
|  |  |  +------------------+       +------------------+       +------------------+            ||   |
|  |  |                                                         (0.0%)                         ||   |
|  |  |                                                                                        ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
|  +-------------------------------- ALLERGEN DIFFERENCE (No Change) ---------------------------+   |
|  |                                                                                            |   |
|  |  Allergen Changes                                                                          |   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |  |                                                                                        ||   |
|  |  |                    [checkmark] No allergen changes between versions                    ||   |
|  |  |                                                                                        ||   |
|  |  |  Both versions contain: Soy, Sunflower                                                 ||   |
|  |  |  Both versions may contain: Wheat                                                      ||   |
|  |  |                                                                                        ||   |
|  |  +----------------------------------------------------------------------------------------+|   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [Back to Formulations]                                                       [Export Comparison] |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Project > ... > Compare Formulations                                  [Export Comparison] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- VERSION SELECTORS -----------------------------------------+   |
|  |                                                                                            |   |
|  |  Compare Version                                  With Version                             |   |
|  |  +----------------------------------------+       +----------------------------------------+|   |
|  |  | [========================]         [v] |       | [========================]        [v] ||   |
|  |  +----------------------------------------+       +----------------------------------------+|   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
|  +-------------------------------- LOADING -----------------------------------------------------+   |
|  |                                                                                            |   |
|  |                                                                                            |   |
|  |                                    [Spinner]                                               |   |
|  |                                                                                            |   |
|  |                          Loading formulation comparison...                                 |   |
|  |                                                                                            |   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
|  +-------------------------------- COMPARISON TABLE SKELETON --------------------------------+   |
|  |                                                                                            |   |
|  |  [==================================================================================]      |   |
|  |  [==================================================================================]      |   |
|  |  [==================================================================================]      |   |
|  |  [==================================================================================]      |   |
|  |  [==================================================================================]      |   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
|  +-------------------------------- COST/ALLERGEN SKELETON ------------------------------------+   |
|  |                                                                                            |   |
|  |  [====================================]   [====================================]           |   |
|  |  [==================]                     [==================]                             |   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Mobile View (< 768px)

```
+----------------------------------+
|  < Compare Formulations          |
|  [Export v]                      |
+----------------------------------+
|                                  |
|  Compare Version                 |
|  +----------------------------+  |
|  | v1.0 (Locked)          [v] |  |
|  +----------------------------+  |
|                                  |
|  [Swap]                          |
|                                  |
|  With Version                    |
|  +----------------------------+  |
|  | v2.0 (Draft)           [v] |  |
|  +----------------------------+  |
|                                  |
|  Summary                         |
|  +2 Added | -1 Removed | ~2 Chg  |
|                                  |
|  +----------------------------+  |
|  | ING-001              [~ ]  |  |
|  | Pea Protein Isolate        |  |
|  | v1.0: 42.000 kg (42.00%)   |  |
|  | v2.0: 45.000 kg (45.00%)   |  |
|  | Change: +3.000 kg (+3.00%) |  |
|  +----------------------------+  |
|  | ING-002              [~ ]  |  |
|  | Water                      |  |
|  | v1.0: 28.000 kg (28.00%)   |  |
|  | v2.0: 25.000 kg (25.00%)   |  |
|  | Change: -3.000 kg (-3.00%) |  |
|  +----------------------------+  |
|  | ING-003              [+ ]  |  |
|  | Coconut Oil     (green bg) |  |
|  | v1.0: -                    |  |
|  | v2.0: 15.000 kg (15.00%)   |  |
|  | Added: +15.000 kg          |  |
|  +----------------------------+  |
|  | ING-006              [- ]  |  |
|  | Sunflower Oil   (red bg)   |  |
|  | v1.0: 15.000 kg (15.00%)   |  |
|  | v2.0: -                    |  |
|  | Removed: -15.000 kg        |  |
|  +----------------------------+  |
|                                  |
|  Cost Difference                 |
|  +----------------------------+  |
|  | v1.0: 4.85 PLN/kg          |  |
|  | v2.0: 4.72 PLN/kg          |  |
|  | Diff: -0.13 PLN/kg (-2.7%) |  |
|  +----------------------------+  |
|                                  |
|  Allergen Changes                |
|  +----------------------------+  |
|  | Removed: Sunflower         |  |
|  | Added May Contain:         |  |
|  |   Tree Nuts (ING-003)      |  |
|  +----------------------------+  |
|                                  |
|  [Export Comparison]             |
|                                  |
+----------------------------------+
```

---

## Key Components

### 1. Version Selector Dropdowns

| Component | Description |
|-----------|-------------|
| Compare Version | Left dropdown - select base/older version |
| With Version | Right dropdown - select target/newer version |
| Swap Versions | Button to swap left/right selections |

**Dropdown Options Format:**
```
v{version} ({status} - {date})
```
Examples:
- "v1.0 (Locked - Jan 15)"
- "v2.0 (Draft - Feb 10)"
- "v1.1 (Approved - Jan 25)"

**Sort Order:** Newest first (descending by version number)

### 2. Comparison Summary

| Field | Description |
|-------|-------------|
| Total Items | Count of unique items across both versions |
| Added | Count of items in v2 but not in v1 |
| Removed | Count of items in v1 but not in v2 |
| Changed | Count of items in both with different quantities |

### 3. Side-by-Side Comparison Table

| Column | Width | Description |
|--------|-------|-------------|
| Item | 25% | Product code + name (2 lines), with +/- icon for added/removed |
| v1 Qty | 20% | Quantity + percentage from version 1 |
| v2 Qty | 20% | Quantity + percentage from version 2 |
| Change | 20% | Quantity difference with +/- prefix |
| Status | 15% | Badge: Added (green), Removed (red), Changed (yellow), Same (gray) |

**Row Styling:**
| Status | Background | Icon | Badge Color |
|--------|------------|------|-------------|
| Added | Light green (#dcfce7) | [+] | Green |
| Removed | Light red (#fee2e2) | [-] | Red |
| Changed | Light yellow (#fef9c3) | [~] | Yellow |
| Same | White | [=] | Gray |

### 4. Cost Difference Display

| Field | Description |
|-------|-------------|
| v1 Estimated Cost | Total cost per unit from version 1 |
| v2 Estimated Cost | Total cost per unit from version 2 |
| Difference | Absolute difference with +/- prefix |
| Percentage | Percentage change from v1 to v2 |
| Insight | Auto-generated explanation of cost change |

**Color Coding:**
- Positive difference (cost increase): Red text
- Negative difference (cost decrease): Green text
- No change: Gray text

### 5. Allergen Difference Display

| Section | Description |
|---------|-------------|
| v1 Allergens | List of Contains + May Contain from version 1 |
| v2 Allergens | List of Contains + May Contain from version 2 |
| Summary | Count of added/removed allergens |

**Markers:**
- `[+]` next to newly added allergens (green)
- `[-]` next to removed allergens (red)

---

## Main Actions

### Header Actions

| Action | Button | Result |
|--------|--------|--------|
| Export Comparison | [Export Comparison] | Download PDF/Excel comparison report |

### Footer Actions

| Action | Button | Result |
|--------|--------|--------|
| Back | [Back to Formulations] | Return to NPD-006 Formulation List |
| Export | [Export Comparison] | Download PDF/Excel comparison report |

### Version Selector Actions

| Action | Button | Result |
|--------|--------|--------|
| Select Version | Dropdown | Load comparison with selected versions |
| Swap | [Swap Versions] | Exchange left and right version selections |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **loading** | Initial load / version change | Skeleton UI, spinner |
| **compared-no-changes** | Versions are identical | No changes banner, all-same table |
| **compared-with-changes** | Versions have differences | Summary, diff table, cost/allergen changes |

---

## API Endpoints

### Get Formulation Comparison

```
GET /api/npd/formulations/compare?v1={id1}&v2={id2}

Response:
{
  "success": true,
  "data": {
    "version1": {
      "id": "uuid-form-v1",
      "formulation_number": "v1.0",
      "status": "locked",
      "effective_from": "2025-01-15",
      "total_qty": 100.000,
      "uom": "kg",
      "estimated_cost": 4.85
    },
    "version2": {
      "id": "uuid-form-v2",
      "formulation_number": "v2.0",
      "status": "draft",
      "effective_from": "2025-02-10",
      "total_qty": 100.000,
      "uom": "kg",
      "estimated_cost": 4.72
    },
    "items": [
      {
        "product_id": "uuid-prod-1",
        "product_code": "ING-001",
        "product_name": "Pea Protein Isolate",
        "v1_qty": 42.000,
        "v1_percentage": 42.00,
        "v2_qty": 45.000,
        "v2_percentage": 45.00,
        "qty_change": 3.000,
        "pct_change": 3.00,
        "status": "changed"
      },
      {
        "product_id": "uuid-prod-3",
        "product_code": "ING-003",
        "product_name": "Coconut Oil",
        "v1_qty": null,
        "v1_percentage": null,
        "v2_qty": 15.000,
        "v2_percentage": 15.00,
        "qty_change": 15.000,
        "pct_change": 15.00,
        "status": "added"
      },
      {
        "product_id": "uuid-prod-6",
        "product_code": "ING-006",
        "product_name": "Sunflower Oil",
        "v1_qty": 15.000,
        "v1_percentage": 15.00,
        "v2_qty": null,
        "v2_percentage": null,
        "qty_change": -15.000,
        "pct_change": -15.00,
        "status": "removed"
      }
    ],
    "summary": {
      "total_items": 6,
      "added": 1,
      "removed": 1,
      "changed": 2,
      "same": 2,
      "has_changes": true
    },
    "cost_comparison": {
      "v1_cost": 4.85,
      "v2_cost": 4.72,
      "difference": -0.13,
      "percentage_change": -2.68,
      "currency": "PLN",
      "unit": "kg"
    },
    "allergen_comparison": {
      "v1_contains": [
        { "allergen": "Soy", "source": "ING-001" },
        { "allergen": "Sunflower", "source": "ING-006" }
      ],
      "v2_contains": [
        { "allergen": "Soy", "source": "ING-001" }
      ],
      "v1_may_contain": [
        { "allergen": "Wheat", "source": "Shared line" }
      ],
      "v2_may_contain": [
        { "allergen": "Wheat", "source": "Shared line" },
        { "allergen": "Tree Nuts", "source": "ING-003" }
      ],
      "contains_added": [],
      "contains_removed": [
        { "allergen": "Sunflower", "source": "ING-006" }
      ],
      "may_contain_added": [
        { "allergen": "Tree Nuts", "source": "ING-003" }
      ],
      "may_contain_removed": []
    }
  }
}
```

### Get Available Versions for Comparison

```
GET /api/npd/projects/:projectId/formulations/versions

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-form-v2",
      "formulation_number": "v2.0",
      "status": "draft",
      "effective_from": "2025-02-10",
      "created_at": "2025-02-10T09:00:00Z"
    },
    {
      "id": "uuid-form-v1.1",
      "formulation_number": "v1.1",
      "status": "approved",
      "effective_from": "2025-01-25",
      "created_at": "2025-01-25T14:00:00Z"
    },
    {
      "id": "uuid-form-v1",
      "formulation_number": "v1.0",
      "status": "locked",
      "effective_from": "2025-01-15",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### Export Comparison Report

```
GET /api/npd/formulations/compare/export?v1={id1}&v2={id2}&format=pdf

Response: Binary PDF file download

Headers:
Content-Type: application/pdf
Content-Disposition: attachment; filename="formulation-comparison-v1.0-v2.0.pdf"
```

---

## Comparison Logic

### Item Matching Algorithm

```typescript
const compareFormulations = (v1Items: Item[], v2Items: Item[]): ComparisonResult[] => {
  const results: ComparisonResult[] = []
  const v2Map = new Map(v2Items.map(item => [item.product_id, item]))
  const processedV2Ids = new Set<string>()

  // Process v1 items
  v1Items.forEach(v1Item => {
    const v2Item = v2Map.get(v1Item.product_id)
    processedV2Ids.add(v1Item.product_id)

    if (!v2Item) {
      // Item removed in v2
      results.push({
        ...v1Item,
        v1_qty: v1Item.quantity,
        v1_percentage: v1Item.percentage,
        v2_qty: null,
        v2_percentage: null,
        qty_change: -v1Item.quantity,
        pct_change: -v1Item.percentage,
        status: 'removed'
      })
    } else if (Math.abs(v1Item.quantity - v2Item.quantity) > 0.0001) {
      // Item changed
      results.push({
        ...v1Item,
        v1_qty: v1Item.quantity,
        v1_percentage: v1Item.percentage,
        v2_qty: v2Item.quantity,
        v2_percentage: v2Item.percentage,
        qty_change: v2Item.quantity - v1Item.quantity,
        pct_change: v2Item.percentage - v1Item.percentage,
        status: 'changed'
      })
    } else {
      // Item same
      results.push({
        ...v1Item,
        v1_qty: v1Item.quantity,
        v1_percentage: v1Item.percentage,
        v2_qty: v2Item.quantity,
        v2_percentage: v2Item.percentage,
        qty_change: 0,
        pct_change: 0,
        status: 'same'
      })
    }
  })

  // Process new items in v2
  v2Items.forEach(v2Item => {
    if (!processedV2Ids.has(v2Item.product_id)) {
      // Item added in v2
      results.push({
        ...v2Item,
        v1_qty: null,
        v1_percentage: null,
        v2_qty: v2Item.quantity,
        v2_percentage: v2Item.percentage,
        qty_change: v2Item.quantity,
        pct_change: v2Item.percentage,
        status: 'added'
      })
    }
  })

  // Sort: changed/added/removed first, then same
  return results.sort((a, b) => {
    const priority = { changed: 1, added: 2, removed: 3, same: 4 }
    return priority[a.status] - priority[b.status]
  })
}
```

### Cost Calculation

```typescript
const calculateCostDifference = (v1Cost: number, v2Cost: number): CostComparison => {
  const difference = v2Cost - v1Cost
  const percentageChange = v1Cost > 0 ? ((difference / v1Cost) * 100) : 0

  return {
    v1_cost: v1Cost,
    v2_cost: v2Cost,
    difference: Math.round(difference * 100) / 100,
    percentage_change: Math.round(percentageChange * 100) / 100
  }
}
```

### Allergen Comparison

```typescript
const compareAllergens = (v1: AllergenSet, v2: AllergenSet): AllergenComparison => {
  const v1ContainsSet = new Set(v1.contains.map(a => a.allergen))
  const v2ContainsSet = new Set(v2.contains.map(a => a.allergen))
  const v1MayContainSet = new Set(v1.may_contain.map(a => a.allergen))
  const v2MayContainSet = new Set(v2.may_contain.map(a => a.allergen))

  return {
    contains_added: v2.contains.filter(a => !v1ContainsSet.has(a.allergen)),
    contains_removed: v1.contains.filter(a => !v2ContainsSet.has(a.allergen)),
    may_contain_added: v2.may_contain.filter(a => !v1MayContainSet.has(a.allergen)),
    may_contain_removed: v1.may_contain.filter(a => !v2MayContainSet.has(a.allergen))
  }
}
```

---

## Accessibility (WCAG 2.1 AA)

### Touch Targets
- All buttons: 48x48dp minimum
- Dropdown triggers: 48dp height
- Swap button: 48x48dp
- Export button: 48x48dp

### Contrast
- Text: 4.5:1 minimum
- Status badges: WCAG AA compliant colors
- Row backgrounds: Sufficient contrast with text
- Cost difference text: Green/red with 4.5:1 contrast

### Screen Reader
- Page title: "Compare Formulations - v1.0 vs v2.0"
- Summary: "Comparison summary: 2 items added, 1 removed, 2 changed"
- Table: "Comparison table, 6 items. Row 1: ING-001 Pea Protein Isolate, changed, v1 42 kilograms, v2 45 kilograms, plus 3 kilograms"
- Cost: "Cost difference: v2 is 0.13 PLN per kilogram less than v1, representing a 2.7 percent decrease"
- Allergen: "Allergen changes: Sunflower removed from contains, Tree Nuts added to may contain"

### Keyboard Navigation
- Tab: Navigate between version selectors, buttons, table
- Enter: Activate buttons, select dropdown options
- Arrow keys: Navigate dropdown options
- Escape: Close dropdowns

### Color Independence
- All status indicators include text labels (not color alone)
- Row icons (+, -, ~, =) supplement background colors
- Badge text labels always visible

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | Full side-by-side layout |
| Tablet (768-1024px) | Stacked version selectors, condensed table |
| Mobile (<768px) | Vertical card layout per item, stacked sections |

---

## Permissions

| Role | View Compare | Export |
|------|--------------|--------|
| Admin | Yes | Yes |
| NPD Lead | Yes | Yes |
| R&D | Yes (assigned project) | Yes |
| Regulatory | Yes | Yes |
| Finance | Yes | Yes |

---

## Related Screens

- **Parent**: NPD-006 (Formulation List Page)
- **Related**: NPD-007 (Formulation Editor)
- **Related**: NPD-002 (Project Detail Page)

---

## Handoff to FRONTEND-DEV

```yaml
feature: NPD Formulation Compare View
story: NPD-014
fr_coverage: NPD-FR-15
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/NPD-014-formulation-compare-view.md
  api_endpoints:
    - GET /api/npd/formulations/compare?v1={id1}&v2={id2}
    - GET /api/npd/projects/:projectId/formulations/versions
    - GET /api/npd/formulations/compare/export?v1={id1}&v2={id2}&format=pdf
states_per_screen: [loading, compared-no-changes, compared-with-changes]
components:
  - Version selector dropdowns (Compare v1.0 vs v2.0)
  - Swap versions button
  - Comparison summary bar
  - Side-by-side comparison table (Item, v1 Qty, v2 Qty, Change, Status)
  - Added items row (green background, + icon)
  - Removed items row (red background, - icon)
  - Changed items row (yellow background, ~ icon)
  - Cost difference display at bottom
  - Allergen difference display
  - [Export Comparison] button
breakpoints:
  mobile: "<768px"
  tablet: "768-1024px"
  desktop: ">1024px"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
  color_independence: "All status indicators include text labels"
  screen_reader: "Full ARIA support"
related_screens:
  - NPD-006: Formulation List Page
  - NPD-007: Formulation Editor
  - NPD-002: Project Detail Page
critical_ux_requirements:
  - Visual diff highlighting (green/red/yellow)
  - Cost impact calculation
  - Allergen change detection
  - Export to PDF/Excel
  - Swap versions functionality
  - Sort by change status (changed/added/removed first)
libraries:
  - ShadCN Select (for version dropdowns)
  - ShadCN Table (for comparison table)
  - ShadCN Badge (for status indicators)
  - ShadCN Button (for actions)
  - ShadCN Card (for cost/allergen sections)
```

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All states defined (loading, compared-no-changes, compared-with-changes)
- [x] All components specified (version selectors, comparison table, cost/allergen displays)
- [x] API endpoints documented
- [x] Row styling for all statuses defined (added/removed/changed/same)
- [x] Accessibility requirements met
- [x] Responsive design documented
- [x] Comparison logic documented
- [x] Cost calculation logic documented
- [x] Allergen comparison logic documented
- [x] Permission matrix defined

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**PRD Coverage**: NPD-FR-15 (100%)
**Estimated Effort**: 6-8 hours implementation
**Quality Target**: 95/100
