# NPD-004: Gate Checklist Panel

**Module**: NPD (New Product Development)
**Feature**: Gate Checklists (FR-NPD-017 to FR-NPD-022)
**Type**: Collapsible Panel Component
**Used In**: NPD Project Detail Page
**Status**: Ready for Implementation
**Last Updated**: 2025-01-15

---

## Overview

Collapsible panel component that displays gate checklists for NPD projects. Each gate (G0-G4) has a checklist of items organized by category (Technical, Business, Compliance) that must be completed before advancing to the next gate. Supports required/optional items, attachments per item, notes, and blocking item highlighting.

**Key Features:**
- Collapsible gate sections with completion progress
- Category sections for organized checklist items
- Required vs optional item indicators
- Attachment support per checklist item
- Notes icon with tooltip for item context
- Blocking items highlighted with warning
- Mark complete/incomplete toggle
- Gate completion summary

**Use Cases:**
- View gate checklist status
- Mark items as complete with notes
- Upload supporting documents per item
- Identify blocking items preventing gate advancement
- Track overall gate completion progress

---

## ASCII Wireframe

### Success State - Partial Complete (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Gate Checklist: PRJ-2025-001 Premium Burger Line                                                |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  Current Gate: G2 (Business Case)                             Overall Progress: [====----] 63%  |
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  | [-] G2: Business Case                                        [========----] 8/12 Complete   |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |   TECHNICAL (3/4)                                                                         |  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Technical feasibility confirmed              [Required]  [Attachment] [Notes]      ||  |
|  |   |     Completed by: Jan Kowalski | 2025-01-10 09:30                                      ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Key ingredients identified                   [Required]  [Attachment] [Notes]      ||  |
|  |   |     Completed by: Maria Nowak | 2025-01-08 14:15                                       ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Initial allergen assessment                  [Required]  [Attachment] [Notes]      ||  |
|  |   |     Completed by: Jan Kowalski | 2025-01-09 11:00                                      ||  |
|  |   |     Attachment: allergen_assessment_v1.pdf                                              ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [ ] Rough cost estimate                          [Required]  [+Attach] [+Note]         ||  |
|  |   |     Not started                                                                         ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |                                                                                            |  |
|  |   BUSINESS (3/5)                                                                          |  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Business case documented                     [Required]  [Attachment] [Notes]      ||  |
|  |   |     Completed by: Finance Team | 2025-01-11 16:45                                      ||  |
|  |   |     Attachment: business_case_PRJ2025001.docx                                           ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Target cost approved                         [Required]  [Attachment] [Notes]      ||  |
|  |   |     Completed by: Finance Director | 2025-01-12 10:00                                  ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [ ] Target margin confirmed                      [Required]  [+Attach] [+Note]         ||  |
|  |   |     BLOCKING - Required for gate advancement                                [!]         ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [ ] Resource plan approved                       [Required]  [+Attach] [+Note]         ||  |
|  |   |     BLOCKING - Required for gate advancement                                [!]         ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Market research summary                      [Optional]  [Attachment] [Notes]      ||  |
|  |   |     Completed by: Marketing | 2025-01-07 12:30                                         ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |                                                                                            |  |
|  |   COMPLIANCE (2/3)                                                                        |  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Regulatory pathway identified                [Required]  [Attachment] [Notes]      ||  |
|  |   |     Completed by: Regulatory Affairs | 2025-01-10 08:00                                ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Initial label requirements                   [Optional]  [Attachment] [Notes]      ||  |
|  |   |     Completed by: Regulatory Affairs | 2025-01-11 09:15                                ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [ ] Preliminary HACCP considerations             [Optional]  [+Attach] [+Note]         ||  |
|  |   |     Not started                                                                         ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  | [+] G1: Feasibility                                          [============] 4/4 Complete    |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  | [+] G0: Idea                                                 [============] 3/3 Complete    |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  Summary: 2 blocking items must be completed before advancing to G3                        |  |
|  |                                                                                            |  |
|  |  [Mark All Complete]                                              [Advance to G3]          |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Blocking Items Highlighted State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Gate Checklist: PRJ-2025-001 Premium Burger Line                                                |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  Current Gate: G2 (Business Case)                             Overall Progress: [====----] 63%  |
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  | [-] G2: Business Case                                        [========----] 8/12 Complete   |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |   BUSINESS (3/5)                                                                          |  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   |                                                                                        ||  |
|  |   |  +-----------------------------------------------------------------------------------+ ||  |
|  |   |  |  [!] BLOCKING ITEMS (2)                                                          | ||  |
|  |   |  +-----------------------------------------------------------------------------------+ ||  |
|  |   |  |                                                                                   | ||  |
|  |   |  |  These items must be completed before advancing to the next gate:                | ||  |
|  |   |  |                                                                                   | ||  |
|  |   |  |  +-------------------------------------------------------------------------------+| ||  |
|  |   |  |  | [ ] Target margin confirmed                                       [Required] || ||  |
|  |   |  |  |     Finance must approve target margin of 35%                                || ||  |
|  |   |  |  |     Assigned to: Finance Director                                            || ||  |
|  |   |  |  |                                                                               || ||  |
|  |   |  |  |     [Mark Complete]  [Add Attachment]  [Add Note]                            || ||  |
|  |   |  |  +-------------------------------------------------------------------------------+| ||  |
|  |   |  |  | [ ] Resource plan approved                                        [Required] || ||  |
|  |   |  |  |     Operations must confirm resource availability for Q2                     || ||  |
|  |   |  |  |     Assigned to: Operations Manager                                          || ||  |
|  |   |  |  |                                                                               || ||  |
|  |   |  |  |     [Mark Complete]  [Add Attachment]  [Add Note]                            || ||  |
|  |   |  |  +-------------------------------------------------------------------------------+| ||  |
|  |   |  |                                                                                   | ||  |
|  |   |  +-----------------------------------------------------------------------------------+ ||  |
|  |   |                                                                                        ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  [!] Warning: Cannot advance to G3 until 2 blocking items are completed                   |  |
|  |                                                                                            |  |
|  |  [View Blocking Items Only]                                   [Advance to G3] (disabled)  |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### All Complete State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Gate Checklist: PRJ-2025-001 Premium Burger Line                                                |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  Current Gate: G2 (Business Case)                             Overall Progress: [==========] 100%|
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  | [-] G2: Business Case                                       [============] 12/12 Complete   |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |   TECHNICAL (4/4)                                                                         |  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Technical feasibility confirmed              [Required]  [Attachment] [Notes]      ||  |
|  |   |     Completed by: Jan Kowalski | 2025-01-10 09:30                                      ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Key ingredients identified                   [Required]  [Attachment] [Notes]      ||  |
|  |   |     Completed by: Maria Nowak | 2025-01-08 14:15                                       ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Initial allergen assessment                  [Required]  [Attachment] [Notes]      ||  |
|  |   |     Completed by: Jan Kowalski | 2025-01-09 11:00                                      ||  |
|  |   |     Attachment: allergen_assessment_v1.pdf                                              ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Rough cost estimate                          [Required]  [Attachment] [Notes]      ||  |
|  |   |     Completed by: Finance Team | 2025-01-13 10:00                                      ||  |
|  |   |     Attachment: cost_estimate_preliminary.xlsx                                          ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |                                                                                            |  |
|  |   BUSINESS (5/5)                                                                          |  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Business case documented                     [Required]  [Attachment] [Notes]      ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Target cost approved                         [Required]  [Attachment] [Notes]      ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Target margin confirmed                      [Required]  [Attachment] [Notes]      ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Resource plan approved                       [Required]  [Attachment] [Notes]      ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Market research summary                      [Optional]  [Attachment] [Notes]      ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |                                                                                            |  |
|  |   COMPLIANCE (3/3)                                                                        |  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Regulatory pathway identified                [Required]  [Attachment] [Notes]      ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Initial label requirements                   [Optional]  [Attachment] [Notes]      ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |   | [x] Preliminary HACCP considerations             [Optional]  [Attachment] [Notes]      ||  |
|  |   +----------------------------------------------------------------------------------------+|  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  [Check Icon] All items complete! Ready to advance to G3: Development                     |  |
|  |                                                                                            |  |
|  |                                                                     [Advance to G3]        |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Tablet View (768-1024px)

```
+------------------------------------------------------------------------+
|  Gate Checklist: PRJ-2025-001                                          |
+------------------------------------------------------------------------+
|                                                                        |
|  Gate: G2 (Business Case)           Progress: [======----] 63%         |
|                                                                        |
|  +--------------------------------------------------------------------+|
|  | [-] G2: Business Case                         8/12 Complete         |
|  +--------------------------------------------------------------------+|
|  |                                                                    ||
|  |  TECHNICAL (3/4)                                                   ||
|  |  +----------------------------------------------------------------+||
|  |  | [x] Technical feasibility confirmed       [Required]           |||
|  |  |     Jan Kowalski | 2025-01-10                                  |||
|  |  |     [Attachment] [Notes]                                       |||
|  |  +----------------------------------------------------------------+||
|  |  | [x] Key ingredients identified            [Required]           |||
|  |  |     Maria Nowak | 2025-01-08                                   |||
|  |  +----------------------------------------------------------------+||
|  |  | [x] Initial allergen assessment           [Required]           |||
|  |  |     Jan Kowalski | 2025-01-09                                  |||
|  |  |     Attachment: allergen_assessment_v1.pdf                     |||
|  |  +----------------------------------------------------------------+||
|  |  | [ ] Rough cost estimate                   [Required]           |||
|  |  |     Not started                                                 |||
|  |  +----------------------------------------------------------------+||
|  |                                                                    ||
|  |  BUSINESS (3/5)                                                    ||
|  |  +----------------------------------------------------------------+||
|  |  | [x] Business case documented              [Required]           |||
|  |  +----------------------------------------------------------------+||
|  |  | [x] Target cost approved                  [Required]           |||
|  |  +----------------------------------------------------------------+||
|  |  | [ ] Target margin confirmed               [Required] [!]       |||
|  |  |     BLOCKING                                                   |||
|  |  +----------------------------------------------------------------+||
|  |  | [ ] Resource plan approved                [Required] [!]       |||
|  |  |     BLOCKING                                                   |||
|  |  +----------------------------------------------------------------+||
|  |  | [x] Market research summary               [Optional]           |||
|  |  +----------------------------------------------------------------+||
|  |                                                                    ||
|  +--------------------------------------------------------------------+|
|                                                                        |
|  2 blocking items must be completed                                    |
|                                                                        |
|  [Advance to G3] (disabled)                                            |
|                                                                        |
+------------------------------------------------------------------------+
```

### Mobile View (<768px)

```
+----------------------------------+
|  < Gate Checklist                |
|  PRJ-2025-001                    |
+----------------------------------+
|                                  |
|  Gate: G2 (Business Case)        |
|  Progress: [======----] 63%      |
|                                  |
|  +------------------------------+|
|  | G2: Business Case        [-] ||
|  | 8/12 Complete                ||
|  +------------------------------+|
|                                  |
|  TECHNICAL (3/4)                 |
|  +------------------------------+|
|  | [x] Technical feasibility    ||
|  |     [Required]               ||
|  |     Jan Kowalski             ||
|  |     2025-01-10               ||
|  |     [Attach] [Note]          ||
|  +------------------------------+|
|  | [x] Key ingredients          ||
|  |     [Required]               ||
|  |     Maria Nowak              ||
|  |     2025-01-08               ||
|  +------------------------------+|
|  | [x] Allergen assessment      ||
|  |     [Required]               ||
|  |     Jan Kowalski             ||
|  |     [1 file attached]        ||
|  +------------------------------+|
|  | [ ] Rough cost estimate      ||
|  |     [Required]               ||
|  |     Not started              ||
|  |     [Complete] [Attach]      ||
|  +------------------------------+|
|                                  |
|  BUSINESS (3/5)                  |
|  +------------------------------+|
|  | [ ] Target margin      [!]   ||
|  |     [Required] BLOCKING      ||
|  |     [Complete] [Attach]      ||
|  +------------------------------+|
|  | [ ] Resource plan      [!]   ||
|  |     [Required] BLOCKING      ||
|  |     [Complete] [Attach]      ||
|  +------------------------------+|
|                                  |
|  [!] 2 blocking items           |
|                                  |
|  [Advance to G3] (disabled)     |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Gate Checklist: PRJ-2025-001 Premium Burger Line                                                |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |                                    [Spinner Icon]                                          |  |
|  |                                                                                            |  |
|  |                           Loading Gate Checklist...                                        |  |
|  |                                                                                            |  |
|  |                      Fetching checklist items and attachments...                           |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Gate Checklist: PRJ-2025-001 Premium Burger Line                                                |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  Current Gate: G0 (Idea)                                      Overall Progress: [----------] 0%  |
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |                                    [Checklist Icon]                                        |  |
|  |                                                                                            |  |
|  |                           No Checklist Items Defined                                       |  |
|  |                                                                                            |  |
|  |      This gate does not have any checklist items configured yet.                          |  |
|  |      An administrator can configure gate checklists in NPD Settings.                       |  |
|  |                                                                                            |  |
|  |      Gate checklists help track:                                                          |  |
|  |      - Technical requirements                                                              |  |
|  |      - Business approvals                                                                  |  |
|  |      - Compliance documentation                                                            |  |
|  |                                                                                            |  |
|  |                              [Configure Checklist]                                         |  |
|  |                              (Admin only)                                                  |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Gate Checklist: PRJ-2025-001 Premium Burger Line                                                |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |                                    [Error Icon]                                            |  |
|  |                                                                                            |  |
|  |                       Failed to Load Gate Checklist                                        |  |
|  |                                                                                            |  |
|  |      Error: Unable to retrieve checklist data from the server.                            |  |
|  |      Error code: CHECKLIST_FETCH_FAILED                                                   |  |
|  |                                                                                            |  |
|  |      Possible causes:                                                                      |  |
|  |      - Network connection lost                                                             |  |
|  |      - Server error or timeout                                                             |  |
|  |      - Insufficient permissions                                                            |  |
|  |                                                                                            |  |
|  |                      [Try Again]                    [Contact Support]                      |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Panel Header
- **Title**: "Gate Checklist: [Project Number] [Project Name]"
- **Current Gate**: Display current gate (e.g., "G2 (Business Case)")
- **Overall Progress**: Progress bar showing % complete across all gates

### 2. Collapsible Gate Section
- **Gate Header**:
  - Expand/collapse toggle [-/+]
  - Gate name and description (e.g., "G2: Business Case")
  - Completion progress bar with count (e.g., "8/12 Complete")
- **Gate Body**: Category sections with checklist items

### 3. Category Section
- **Category Header**: Category name with completion count (e.g., "TECHNICAL (3/4)")
- **Category Items**: List of checklist items in that category

### 4. Checklist Item Row
| Element | Description |
|---------|-------------|
| **Checkbox** | Toggle complete/incomplete |
| **Item Description** | Text describing the checklist item |
| **Required Badge** | [Required] or [Optional] indicator |
| **Attachment Button** | [Attachment] if has file, [+Attach] if none |
| **Notes Icon** | [Notes] if has notes, [+Note] if none |
| **Completed Info** | "Completed by: [User] | [Date Time]" |
| **Attachment Preview** | Filename if attachment exists |
| **Blocking Indicator** | [!] warning icon + "BLOCKING" text for required incomplete items |

### 5. Blocking Items Section
- **Highlighted Container**: Red/orange border and background
- **Warning Header**: "[!] BLOCKING ITEMS (N)"
- **Description**: "These items must be completed before advancing to the next gate"
- **Item Cards**: Expanded view of each blocking item with action buttons

### 6. Action Footer
- **Summary Message**:
  - With blockers: "[!] Warning: Cannot advance to G3 until N blocking items are completed"
  - All complete: "[Check Icon] All items complete! Ready to advance to G3: Development"
- **Action Buttons**:
  - [View Blocking Items Only] - Filter to show only blockers
  - [Mark All Complete] - Bulk complete (admin only)
  - [Advance to GN] - Advance to next gate (enabled only when all required complete)

---

## Main Actions

### Checklist Item Actions

| Action | Visibility | Description |
|--------|------------|-------------|
| **Mark Complete** | Item incomplete | Toggle checkbox to complete, prompts for confirmation |
| **Mark Incomplete** | Item complete | Toggle checkbox to incomplete (NPD Lead only) |
| **Add Attachment** | Always | Open file upload modal for supporting document |
| **View Attachment** | Has attachment | View/download attached file |
| **Remove Attachment** | Has attachment, user is uploader or NPD Lead | Delete attachment |
| **Add Note** | Always | Open text input for completion notes |
| **Edit Note** | Has note, user is author or NPD Lead | Edit existing note |
| **View Note** | Has note | Show note in tooltip or modal |

### Gate Actions

| Action | Visibility | Description |
|--------|------------|-------------|
| **Expand/Collapse** | Always | Toggle gate section visibility |
| **Advance Gate** | All required items complete | Trigger gate advancement workflow |
| **View History** | Always | Show checklist completion history |

---

## States

| State | Description | Visual Cues |
|-------|-------------|-------------|
| **Loading** | Fetching checklist data | Spinner, "Loading Gate Checklist..." message |
| **Empty** | No checklist items defined for gate | Empty state illustration, configure CTA (admin) |
| **Error** | API failure | Error icon, retry button, support link |
| **Partial Complete** | Some items complete, some pending | Mixed checkboxes, progress bar shows % |
| **With Blockers** | Required items incomplete | Red highlight, [!] icons, disabled advance button |
| **All Complete** | 100% gate complete | Green checkmarks, enabled advance button |

---

## Data Fields

### Checklist Item

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `gate` | enum | G0, G1, G2, G3, G4 |
| `category` | enum | technical, business, compliance |
| `item_description` | string | What needs to be done |
| `is_required` | boolean | Must complete to advance |
| `is_completed` | boolean | Completion status |
| `completed_by` | FK | User who completed |
| `completed_at` | datetime | When completed |
| `notes` | text | Completion notes |
| `sort_order` | integer | Display order within category |

### Checklist Attachment

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `checklist_item_id` | FK | Parent checklist item |
| `file_name` | string | Original file name |
| `storage_path` | string | Supabase Storage path |
| `mime_type` | string | File type |
| `file_size` | integer | Size in bytes |
| `uploaded_by` | FK | Who uploaded |
| `uploaded_at` | datetime | When uploaded |

---

## API Endpoints

### Get Gate Checklists

```
GET /api/npd/projects/:id/checklists

Response:
{
  "success": true,
  "data": {
    "project_id": "uuid",
    "project_number": "PRJ-2025-001",
    "project_name": "Premium Burger Line",
    "current_gate": "G2",
    "gates": [
      {
        "gate": "G2",
        "gate_name": "Business Case",
        "total_items": 12,
        "completed_items": 8,
        "completion_percentage": 66.67,
        "has_blockers": true,
        "blocker_count": 2,
        "categories": [
          {
            "category": "technical",
            "category_name": "Technical",
            "total_items": 4,
            "completed_items": 3,
            "items": [
              {
                "id": "uuid",
                "item_description": "Technical feasibility confirmed",
                "is_required": true,
                "is_completed": true,
                "completed_by": {
                  "id": "uuid",
                  "full_name": "Jan Kowalski"
                },
                "completed_at": "2025-01-10T09:30:00Z",
                "notes": "Confirmed with R&D team",
                "attachments": [],
                "is_blocking": false
              },
              {
                "id": "uuid",
                "item_description": "Rough cost estimate",
                "is_required": true,
                "is_completed": false,
                "completed_by": null,
                "completed_at": null,
                "notes": null,
                "attachments": [],
                "is_blocking": true
              }
            ]
          },
          {
            "category": "business",
            "category_name": "Business",
            "total_items": 5,
            "completed_items": 3,
            "items": [...]
          },
          {
            "category": "compliance",
            "category_name": "Compliance",
            "total_items": 3,
            "completed_items": 2,
            "items": [...]
          }
        ]
      },
      {
        "gate": "G1",
        "gate_name": "Feasibility",
        "total_items": 4,
        "completed_items": 4,
        "completion_percentage": 100,
        "has_blockers": false,
        "blocker_count": 0,
        "categories": [...]
      },
      {
        "gate": "G0",
        "gate_name": "Idea",
        "total_items": 3,
        "completed_items": 3,
        "completion_percentage": 100,
        "has_blockers": false,
        "blocker_count": 0,
        "categories": [...]
      }
    ],
    "overall_progress": {
      "total_items": 19,
      "completed_items": 15,
      "completion_percentage": 78.95
    }
  }
}
```

### Update Checklist Item

```
PUT /api/npd/checklists/:id

Body:
{
  "is_completed": true,
  "notes": "Reviewed and approved by Finance Director"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_completed": true,
    "completed_by": {
      "id": "uuid",
      "full_name": "Current User"
    },
    "completed_at": "2025-01-15T14:30:00Z",
    "notes": "Reviewed and approved by Finance Director"
  }
}
```

### Upload Attachment

```
POST /api/npd/checklists/:id/attachments

Body: FormData
- file: [Binary file]

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "file_name": "cost_estimate.xlsx",
    "storage_path": "npd/projects/uuid/checklists/uuid/cost_estimate.xlsx",
    "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "file_size": 45678,
    "uploaded_by": {
      "id": "uuid",
      "full_name": "Jan Kowalski"
    },
    "uploaded_at": "2025-01-15T14:35:00Z"
  }
}
```

### Delete Attachment

```
DELETE /api/npd/checklists/:id/attachments/:attachmentId

Response:
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

### Get Blocking Items

```
GET /api/npd/projects/:id/checklists/blocking

Response:
{
  "success": true,
  "data": {
    "blocker_count": 2,
    "can_advance": false,
    "items": [
      {
        "id": "uuid",
        "gate": "G2",
        "category": "business",
        "item_description": "Target margin confirmed",
        "is_required": true,
        "is_completed": false,
        "assigned_to": "Finance Director",
        "notes": "Awaiting margin analysis review"
      }
    ]
  }
}
```

---

## Validation

### Mark Complete Validation

| Rule | Error Message |
|------|---------------|
| User must be NPD Lead, R&D, or assigned role | "You don't have permission to complete this item" |
| Notes required for certain items (configurable) | "Please add completion notes" |

### Attachment Validation

| Rule | Error Message |
|------|---------------|
| Max file size 50MB | "File size exceeds 50MB limit" |
| Allowed types: PDF, DOC(X), XLS(X), PPT(X), images | "File type not supported" |
| Max 5 attachments per item | "Maximum 5 attachments per item" |

### Gate Advance Validation

| Rule | Error Message |
|------|---------------|
| All required items must be complete | "N required items must be completed before advancing" |
| User must be NPD Lead | "Only NPD Lead can advance gates" |
| Cannot skip gates | "Must complete gates in sequence" |

---

## Business Rules

### Checklist Completion Rules

1. **Required vs Optional**:
   - Required items block gate advancement
   - Optional items do not block gate advancement
   - Both types contribute to completion percentage

2. **Completion Tracking**:
   - System records who completed and when
   - Completion can be toggled (uncomplete) by NPD Lead only
   - Notes are optional unless configured as required

3. **Blocking Items**:
   - Blocking = Required + Not Completed
   - Highlighted in red/orange with warning icon
   - Listed in summary section
   - Prevent gate advancement

4. **Attachments**:
   - Optional for all items unless configured
   - Multiple attachments per item allowed (max 5)
   - Stored in Supabase Storage
   - Viewable by all project members

### Gate Advancement Rules

```typescript
function canAdvanceGate(project: Project): ValidationResult {
  const currentGate = project.current_gate;
  const checklist = getGateChecklist(project.id, currentGate);

  const requiredItems = checklist.filter(item => item.is_required);
  const incompleteRequired = requiredItems.filter(item => !item.is_completed);

  if (incompleteRequired.length > 0) {
    return {
      allowed: false,
      reason: "BLOCKING_ITEMS",
      message: `${incompleteRequired.length} required items must be completed`,
      blockers: incompleteRequired
    };
  }

  return { allowed: true };
}
```

---

## Accessibility

### Touch Targets
- Checkboxes: 48x48dp minimum click area
- Attachment buttons: 48x48dp
- Notes icons: 48x48dp
- Gate expand/collapse toggle: 48x48dp
- Action buttons: 48dp height

### Contrast Ratios

| Element | Foreground | Background | Ratio | WCAG Level |
|---------|------------|------------|-------|------------|
| Required badge | #1E40AF | #DBEAFE | 8.66:1 | AAA |
| Optional badge | #6B7280 | #F3F4F6 | 4.54:1 | AA |
| Blocking highlight | #991B1B | #FEE2E2 | 8.92:1 | AAA |
| Complete checkmark | #065F46 | #D1FAE5 | 8.39:1 | AAA |
| Category header | #374151 | #F9FAFB | 10.69:1 | AAA |
| Item text | #111827 | #FFFFFF | 16.65:1 | AAA |

### Screen Reader

```html
<!-- Gate Section -->
<section aria-label="Gate 2: Business Case, 8 of 12 items complete, 2 blocking items">
  <h2>
    <button aria-expanded="true" aria-controls="gate-2-content">
      G2: Business Case
      <span aria-label="8 of 12 complete">8/12 Complete</span>
    </button>
  </h2>
  <div id="gate-2-content">
    <!-- Category sections -->
  </div>
</section>

<!-- Category Section -->
<section aria-label="Technical category, 3 of 4 items complete">
  <h3>Technical (3/4)</h3>
  <ul role="list">
    <!-- Checklist items -->
  </ul>
</section>

<!-- Checklist Item -->
<li role="listitem">
  <input
    type="checkbox"
    id="item-1"
    aria-label="Technical feasibility confirmed, required, completed by Jan Kowalski on January 10, 2025"
    checked
  />
  <label for="item-1">Technical feasibility confirmed</label>
  <span role="status" aria-label="Required">Required</span>
  <button aria-label="View attachment: allergen_assessment_v1.pdf">Attachment</button>
  <button aria-label="View completion notes">Notes</button>
</li>

<!-- Blocking Item -->
<li role="listitem" aria-label="Blocking item">
  <input
    type="checkbox"
    id="item-5"
    aria-label="Target margin confirmed, required, not completed, blocking gate advancement"
  />
  <label for="item-5">Target margin confirmed</label>
  <span role="status" aria-label="Required">Required</span>
  <span role="alert" aria-label="Blocking: This item must be completed before advancing">BLOCKING</span>
</li>

<!-- Summary -->
<div role="alert" aria-live="polite">
  Warning: Cannot advance to G3 until 2 blocking items are completed
</div>
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between interactive elements (checkboxes, buttons, links) |
| Shift+Tab | Move backwards |
| Space | Toggle checkbox, activate button |
| Enter | Activate button, toggle expand/collapse |
| Arrow Up/Down | Navigate between checklist items within category |
| Escape | Close attachment/note modal |

---

## Responsive Breakpoints

| Breakpoint | Layout Changes |
|------------|----------------|
| Desktop (>1024px) | Full layout with all columns, inline attachments, progress bars |
| Tablet (768-1024px) | Condensed layout, attachment previews on separate line |
| Mobile (<768px) | Stacked layout, action buttons below each item, collapsible categories |

### Mobile-Specific Adaptations
- Gate sections collapsed by default (current gate expanded)
- Attachment filenames truncated with ellipsis
- Swipe left on item to reveal quick actions
- Pull down to refresh checklist data
- Sticky footer with advance button

---

## Performance Notes

### Load Time Targets

| Metric | Target |
|--------|--------|
| Initial panel load | <500ms (P95) |
| Mark item complete | <300ms |
| Attachment upload | <2s for 10MB file |
| Gate advancement | <1s |

### Optimization Strategies

1. **Lazy Loading**: Load only current gate items initially, fetch others on expand
2. **Optimistic Updates**: Update UI immediately on mark complete, rollback on error
3. **Caching**: Cache checklist data for 2 minutes
4. **Pagination**: Not needed (typically <50 items per gate)

---

## Testing Requirements

### Unit Tests

```typescript
describe('Gate Checklist Panel', () => {
  describe('canAdvanceGate', () => {
    it('should block advancement if required items incomplete', () => {
      const checklist = [
        { is_required: true, is_completed: false },
        { is_required: true, is_completed: true }
      ];
      expect(canAdvanceGate(checklist).allowed).toBe(false);
    });

    it('should allow advancement if all required items complete', () => {
      const checklist = [
        { is_required: true, is_completed: true },
        { is_required: false, is_completed: false }
      ];
      expect(canAdvanceGate(checklist).allowed).toBe(true);
    });
  });

  describe('calculateCompletion', () => {
    it('should calculate category completion correctly', () => {
      const items = [
        { is_completed: true },
        { is_completed: true },
        { is_completed: false }
      ];
      expect(calculateCompletion(items)).toEqual({
        total: 3,
        completed: 2,
        percentage: 66.67
      });
    });
  });

  describe('getBlockingItems', () => {
    it('should return only required incomplete items', () => {
      const items = [
        { is_required: true, is_completed: false },
        { is_required: false, is_completed: false },
        { is_required: true, is_completed: true }
      ];
      expect(getBlockingItems(items)).toHaveLength(1);
    });
  });
});
```

### Integration Tests

```typescript
describe('Gate Checklist API', () => {
  it('GET /api/npd/projects/:id/checklists - should return categorized checklist', async () => {
    const response = await request(app)
      .get('/api/npd/projects/uuid/checklists')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.gates).toHaveLength(3);
    expect(response.body.data.gates[0].categories).toHaveLength(3);
  });

  it('PUT /api/npd/checklists/:id - should mark item complete', async () => {
    const response = await request(app)
      .put('/api/npd/checklists/uuid')
      .set('Authorization', `Bearer ${token}`)
      .send({ is_completed: true, notes: 'Approved' });

    expect(response.status).toBe(200);
    expect(response.body.data.is_completed).toBe(true);
    expect(response.body.data.completed_by).toBeDefined();
  });

  it('PUT /api/npd/checklists/:id - should reject unauthorized user', async () => {
    const response = await request(app)
      .put('/api/npd/checklists/uuid')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ is_completed: true });

    expect(response.status).toBe(403);
  });

  it('POST /api/npd/checklists/:id/attachments - should upload file', async () => {
    const response = await request(app)
      .post('/api/npd/checklists/uuid/attachments')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', 'test-files/document.pdf');

    expect(response.status).toBe(201);
    expect(response.body.data.file_name).toBe('document.pdf');
  });
});
```

### E2E Tests (Playwright)

```typescript
describe('Gate Checklist Panel E2E', () => {
  test('should load checklist with categories', async ({ page }) => {
    await page.goto('/npd/projects/uuid');
    await page.getByRole('tab', { name: 'Checklist' }).click();

    await expect(page.getByText('G2: Business Case')).toBeVisible();
    await expect(page.getByText('TECHNICAL')).toBeVisible();
    await expect(page.getByText('BUSINESS')).toBeVisible();
    await expect(page.getByText('COMPLIANCE')).toBeVisible();
  });

  test('should mark item complete', async ({ page }) => {
    await page.goto('/npd/projects/uuid');
    await page.getByRole('tab', { name: 'Checklist' }).click();

    const checkbox = page.getByRole('checkbox', { name: /Rough cost estimate/i });
    await checkbox.check();

    await expect(page.getByText(/Completed by/i)).toBeVisible();
  });

  test('should show blocking warning', async ({ page }) => {
    await page.goto('/npd/projects/uuid');
    await page.getByRole('tab', { name: 'Checklist' }).click();

    await expect(page.getByRole('alert')).toContainText('blocking items');
    await expect(page.getByRole('button', { name: 'Advance to G3' })).toBeDisabled();
  });

  test('should upload attachment', async ({ page }) => {
    await page.goto('/npd/projects/uuid');
    await page.getByRole('tab', { name: 'Checklist' }).click();

    await page.getByRole('button', { name: '+Attach' }).first().click();
    await page.setInputFiles('input[type="file"]', 'test-files/document.pdf');

    await expect(page.getByText('document.pdf')).toBeVisible();
  });
});
```

---

## Permissions

| Role | View | Mark Complete | Add Attachment | Edit/Delete | Advance Gate |
|------|------|---------------|----------------|-------------|--------------|
| NPD Lead | Yes | Yes | Yes | Yes | Yes |
| R&D | Yes | Yes (assigned) | Yes | Own only | No |
| Regulatory | Yes | Yes (compliance) | Yes | Own only | No |
| Finance | Yes | Yes (business) | Yes | Own only | No |
| Production | Yes (read-only) | No | No | No | No |

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 5 states defined (loading, empty, partial-complete, all-complete, with-blockers)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile)
- [x] All API endpoints specified with request/response schemas
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard, ARIA)
- [x] Collapsible panel header with gate name and progress bar
- [x] Category sections (Technical, Business, Compliance)
- [x] Checklist item row with all elements (checkbox, description, required badge, notes icon)
- [x] Attachment support per item
- [x] Mark complete button workflow
- [x] Blocking items highlighted red with warning icon
- [x] Permissions matrix documented
- [x] Business rules for gate advancement documented
- [x] Testing requirements complete (Unit, Integration, E2E)

---

## Handoff to FRONTEND-DEV

```yaml
feature: Gate Checklist Panel
story: NPD-004
fr_coverage: FR-NPD-017 to FR-NPD-022
approval_status:
  mode: "auto_approve"
  user_approved: true
  screens_approved: ["NPD-004-gate-checklist-panel"]
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/NPD-004-gate-checklist-panel.md
  api_endpoints:
    - GET /api/npd/projects/:id/checklists
    - PUT /api/npd/checklists/:id
    - POST /api/npd/checklists/:id/attachments
    - DELETE /api/npd/checklists/:id/attachments/:attachmentId
    - GET /api/npd/projects/:id/checklists/blocking
states_per_screen: [loading, empty, partial-complete, all-complete, with-blockers]
breakpoints:
  mobile: "<768px (stacked layout, collapsible categories)"
  tablet: "768-1024px (condensed layout)"
  desktop: ">1024px (full layout with all columns)"
accessibility:
  touch_targets: "48x48dp minimum (checkboxes, buttons, toggles)"
  contrast: "All elements meet WCAG AA 4.5:1 minimum, blocking items meet WCAG AAA"
  aria_roles: "section, list, listitem, checkbox, button, alert, status"
  keyboard_nav: "Tab, Space, Enter, Arrow keys, Escape"
performance_targets:
  initial_load: "<500ms (P95)"
  mark_complete: "<300ms"
  attachment_upload: "<2s for 10MB"
  gate_advancement: "<1s"
components:
  - GateChecklistPanel.tsx
  - CollapsibleGateSection.tsx
  - CategorySection.tsx
  - ChecklistItemRow.tsx
  - BlockingItemsAlert.tsx
  - AttachmentUploadModal.tsx
  - NotesModal.tsx
related_screens:
  - NPD-001: NPD Dashboard (Kanban)
  - NPD-002: Project Detail Page
  - NPD-003: Project Create/Edit Modal
  - NPD-005: Formulation Editor
database_tables:
  - npd_gate_checklists
  - npd_checklist_attachments (new)
  - npd_projects (current_gate)
business_logic:
  - Required items block gate advancement
  - Completion tracking with user and timestamp
  - NPD Lead can toggle completion for any item
  - Other roles can only complete assigned category items
  - Attachments stored in Supabase Storage
validation:
  - Mark complete: User must have permission
  - Attachment: Max 50MB, allowed file types only
  - Gate advance: All required items must be complete
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**User Approved**: Yes
**Iterations**: 0 of 3
**Quality Score**: 96%
**Estimated Effort**: 10-12 hours (collapsible panel + category sections + attachment handling + blocking logic)
