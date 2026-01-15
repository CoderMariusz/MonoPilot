# NPD-015: Risk Register & Matrix

**Module**: NPD (New Product Development)
**Feature**: Risk Register with Table View, Matrix Visualization, and Management (FR-NPD-48 to FR-NPD-52)
**Status**: Ready for Review
**Last Updated**: 2026-01-15

---

## Overview

A dedicated risk management interface featuring both a traditional register (table) view and a 5x5 risk matrix visualization. Users can view, filter, add, edit, and delete project risks with full likelihood/impact scoring and mitigation tracking.

---

## ASCII Wireframes

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Projects > NPD-2025-00001 > Risks                                                         |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +-------------------------------------------------------------------------------------------+   |
|  |  Risk Register                                                          [Loading...]      |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                           |   |
|  |  [===============================]  [===============================]                     |   |
|  |                                                                                           |   |
|  |  +---------------------------------------------------------------------------------+     |   |
|  |  |  [============]  [============]  [============]  [============]  [============] |     |   |
|  |  +---------------------------------------------------------------------------------+     |   |
|  |  |  [==========================================================================]   |     |   |
|  |  |  [==========================================================================]   |     |   |
|  |  |  [==========================================================================]   |     |   |
|  |  |  [==========================================================================]   |     |   |
|  |  +---------------------------------------------------------------------------------+     |   |
|  |                                                                                           |   |
|  |  Loading risk data...                                                                     |   |
|  |                                                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Empty State (No Risks)

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Projects > NPD-2025-00001 > Risks                                       [+ Add Risk]      |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +-------------------------------------------------------------------------------------------+   |
|  |  Risk Register                                         [Table View]  [Matrix View]        |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                           |   |
|  |                                                                                           |   |
|  |                                                                                           |   |
|  |                             +---------------------------+                                 |   |
|  |                             |     [Shield Icon]         |                                 |   |
|  |                             +---------------------------+                                 |   |
|  |                                                                                           |   |
|  |                             No Risks Identified Yet                                       |   |
|  |                                                                                           |   |
|  |                   Identify and track potential project risks to                           |   |
|  |                   ensure successful product development.                                  |   |
|  |                                                                                           |   |
|  |                             [+ Add First Risk]                                            |   |
|  |                                                                                           |   |
|  |                                                                                           |   |
|  |                                                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Table View (Default)

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Projects > NPD-2025-00001 > Risks                                       [+ Add Risk]      |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +-------------------------------------------------------------------------------------------+   |
|  |  Risk Register (5)                                     [Table View]  [Matrix View]        |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
|  +------ FILTER PANEL -----------------------------------------------------------------------+   |
|  |                                                                                           |   |
|  |  Status                    Owner                       Score Threshold                    |   |
|  |  +------------------+      +------------------+        +------------------+               |   |
|  |  | All Statuses  [v]|      | All Owners    [v]|        | All Scores    [v]|               |   |
|  |  +------------------+      +------------------+        +------------------+               |   |
|  |                                                                                           |   |
|  |  [Clear Filters]                                                        5 of 5 risks     |   |
|  |                                                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
|  +------ RISK TABLE -------------------------------------------------------------------------+   |
|  |                                                                                           |   |
|  |  +-------------------------------------------------------------------------------------+ |   |
|  |  | Score | Description                          | L | I | Status      | Owner  | Actions| |   |
|  |  +-------------------------------------------------------------------------------------+ |   |
|  |  | [20]  | Supplier discontinues key ingredient | 4 | 5 | [Open]      | J.Doe  | [E][D] | |   |
|  |  |  RED  | Actions: Identify alternative         |   |   |             |        | [V]    | |   |
|  |  |       | suppliers in EU and APAC             |   |   |             |        |        | |   |
|  |  +-------------------------------------------------------------------------------------+ |   |
|  |  | [15]  | Regulatory approval delayed          | 3 | 5 | [Open]      | QA Lead| [E][D] | |   |
|  |  |  RED  | Actions: Early submission, expedite  |   |   |             |        | [V]    | |   |
|  |  |       | consultation with FDA                |   |   |             |        |        | |   |
|  |  +-------------------------------------------------------------------------------------+ |   |
|  |  | [12]  | Production line capacity conflict    | 4 | 3 | [Mitigated] | Ops Mgr| [E][D] | |   |
|  |  | ORNG  | Actions: Reserved dedicated time     |   |   |             |        | [V]    | |   |
|  |  |       | slot for pilot runs                  |   |   |             |        |        | |   |
|  |  +-------------------------------------------------------------------------------------+ |   |
|  |  | [ 8]  | Shelf-life may not meet target       | 2 | 4 | [Open]      | R&D    | [E][D] | |   |
|  |  | YELO  | Actions: Testing preservative blend  |   |   |             |        | [V]    | |   |
|  |  |       | options, adjust packaging            |   |   |             |        |        | |   |
|  |  +-------------------------------------------------------------------------------------+ |   |
|  |  | [ 4]  | Consumer taste preference shift      | 2 | 2 | [Accepted]  | Mktg   | [E][D] | |   |
|  |  | GRN   | Actions: Ongoing market research,    |   |   |             |        | [V]    | |   |
|  |  |       | flexible formulation approach        |   |   |             |        |        | |   |
|  |  +-------------------------------------------------------------------------------------+ |   |
|  |                                                                                           |   |
|  |  Risk Score Legend: L (Likelihood 1-5) x I (Impact 1-5)                                  |   |
|  |  [15-25]=Critical  [10-14]=High  [5-9]=Medium  [1-4]=Low                                 |   |
|  |                                                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Matrix View

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Projects > NPD-2025-00001 > Risks                                       [+ Add Risk]      |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +-------------------------------------------------------------------------------------------+   |
|  |  Risk Register (5)                                     [Table View]  [Matrix View]        |   |
|  +-------------------------------------------------------------------------------------------+   |
|                        (underlined = active)                                                      |
|                                                                                                   |
|  +------ FILTER PANEL -----------------------------------------------------------------------+   |
|  |                                                                                           |   |
|  |  Status                    Owner                       Score Threshold                    |   |
|  |  +------------------+      +------------------+        +------------------+               |   |
|  |  | All Statuses  [v]|      | All Owners    [v]|        | All Scores    [v]|               |   |
|  |  +------------------+      +------------------+        +------------------+               |   |
|  |                                                                                           |   |
|  |  [Clear Filters]                                                        5 of 5 risks     |   |
|  |                                                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
|  +------ 5x5 RISK MATRIX --------------------------------------------------------------------+   |
|  |                                                                                           |   |
|  |                                    I M P A C T                                            |   |
|  |            +--------+--------+--------+--------+--------+                                |   |
|  |            | 1      | 2      | 3      | 4      | 5      |                                |   |
|  |            | Insig  | Minor  | Mod    | Major  | Severe |                                |   |
|  |  +---------+--------+--------+--------+--------+--------+                                |   |
|  |  |5 Almost |        |        |        |        |        |                                |   |
|  |  | Certain |   5    |   10   |   15   |   20   |   25   |                                |   |
|  |  |         |  YEL   |  ORNG  |  RED   |  RED   |  RED   |                                |   |
|  |  +---------+--------+--------+--------+--------+--------+                                |   |
|  |  |4 Likely |        |        |        |        |        |                                |   |
|  |L |         |   4    |   8    | [12]   |   16   | (20)   |                                |   |
|  |I |         |  GRN   |  YEL   |  ORNG  |  RED   |  RED   |                                |   |
|  |K +---------+--------+--------+--------+--------+--------+                                |   |
|  |E |3 Possib |        |        |        |        |        |                                |   |
|  |L |         |   3    |   6    |   9    |   12   | (15)   |                                |   |
|  |I |         |  GRN   |  YEL   |  YEL   |  ORNG  |  RED   |                                |   |
|  |H +---------+--------+--------+--------+--------+--------+                                |   |
|  |O |2 Unlik  |        |        |        |        |        |                                |   |
|  |O |         |   2    | [ 4]   |   6    | [ 8]   |   10   |                                |   |
|  |D |         |  GRN   |  GRN   |  YEL   |  YEL   |  ORNG  |                                |   |
|  |  +---------+--------+--------+--------+--------+--------+                                |   |
|  |  |1 Rare   |        |        |        |        |        |                                |   |
|  |  |         |   1    |   2    |   3    |   4    |   5    |                                |   |
|  |  |         |  GRN   |  GRN   |  GRN   |  GRN   |  YEL   |                                |   |
|  |  +---------+--------+--------+--------+--------+--------+                                |   |
|  |                                                                                           |   |
|  |  Matrix Legend:                                                                           |   |
|  |  [N] = N risks in this cell    (N) = Click to expand                                     |   |
|  |                                                                                           |   |
|  |  Color Key:                                                                               |   |
|  |  GREEN (1-4): Low Risk - Monitor | YELLOW (5-9): Medium - Active Mitigation             |   |
|  |  ORANGE (10-14): High - Priority Action | RED (15-25): Critical - Escalate              |   |
|  |                                                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
|  +------ RISK SUMMARY CARDS -----------------------------------------------------------------+   |
|  |                                                                                           |   |
|  |  +-------------------+  +-------------------+  +-------------------+  +---------------+   |   |
|  |  | Critical (RED)    |  | High (ORANGE)     |  | Medium (YELLOW)   |  | Low (GREEN)   |   |   |
|  |  |        2          |  |        1          |  |        1          |  |       1       |   |   |
|  |  |   40% of total    |  |   20% of total    |  |   20% of total    |  |  20% of total |   |   |
|  |  +-------------------+  +-------------------+  +-------------------+  +---------------+   |   |
|  |                                                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Cell Expanded State (Matrix View)

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Projects > NPD-2025-00001 > Risks                                       [+ Add Risk]      |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +-------------------------------------------------------------------------------------------+   |
|  |  Risk Register (5)                                     [Table View]  [Matrix View]        |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
|  +------ CELL EXPANDED: Likelihood 4, Impact 5 (Score: 20) - Critical ----------------------+   |
|  |                                                                                  [X Close]|   |
|  |                                                                                           |   |
|  |  Risks in this cell: 1                                                                   |   |
|  |                                                                                           |   |
|  |  +---------------------------------------------------------------------------------+     |   |
|  |  |                                                                                 |     |   |
|  |  |  Risk: Supplier discontinues key ingredient                                     |     |   |
|  |  |                                                                                 |     |   |
|  |  |  +----------------------------------+  +----------------------------------+     |     |   |
|  |  |  | Likelihood        | 4 - Likely   |  | Impact            | 5 - Severe   |     |     |   |
|  |  |  +----------------------------------+  +----------------------------------+     |     |   |
|  |  |  | Status            | [Open]       |  | Owner             | J.Doe        |     |     |   |
|  |  |  +----------------------------------+  +----------------------------------+     |     |   |
|  |  |                                                                                 |     |   |
|  |  |  Description:                                                                   |     |   |
|  |  |  Primary pea protein supplier may exit market due to acquisition.              |     |   |
|  |  |  No alternative approved supplier currently available.                          |     |   |
|  |  |                                                                                 |     |   |
|  |  |  Mitigation Actions:                                                            |     |   |
|  |  |  - Identify alternative suppliers in EU and APAC regions                       |     |   |
|  |  |  - Begin qualification process for backup supplier                             |     |   |
|  |  |  - Negotiate buffer stock agreement                                            |     |   |
|  |  |                                                                                 |     |   |
|  |  |  Created: Jan 15, 2025 by John Smith                                           |     |   |
|  |  |  Last Updated: Feb 10, 2025                                                    |     |   |
|  |  |                                                                                 |     |   |
|  |  |  [Edit]  [Delete]  [Change Status v]                                           |     |   |
|  |  |                                                                                 |     |   |
|  |  +---------------------------------------------------------------------------------+     |   |
|  |                                                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
|  +------ 5x5 RISK MATRIX (collapsed when cell expanded) ------------------------------------+   |
|  |  (Matrix shown at reduced size or hidden)                                                |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Projects > NPD-2025-00001 > Risks                                       [+ Add Risk]      |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +-------------------------------------------------------------------------------------------+   |
|  |  Risk Register                                         [Table View]  [Matrix View]        |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                           |   |
|  |                                                                                           |   |
|  |                             +---------------------------+                                 |   |
|  |                             |     [Error Icon]          |                                 |   |
|  |                             +---------------------------+                                 |   |
|  |                                                                                           |   |
|  |                        Failed to Load Risk Register                                       |   |
|  |                                                                                           |   |
|  |                   Unable to retrieve risk data for this project.                          |   |
|  |                   Please check your connection and try again.                             |   |
|  |                                                                                           |   |
|  |                              Error: NPD_RISKS_FETCH_ERROR                                 |   |
|  |                                                                                           |   |
|  |                        [Retry]    [Go Back to Project]                                    |   |
|  |                                                                                           |   |
|  |                                                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Add/Edit Risk Modal

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Projects > NPD-2025-00001 > Risks                                                         |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +======================= ADD/EDIT RISK =================================================+      |
|  ||                                                                              [X]      ||      |
|  ||                                                                                       ||      |
|  ||  Add New Risk                                                                        ||      |
|  ||  -------------------------------------------------------------------------           ||      |
|  ||                                                                                       ||      |
|  ||  Risk Description *                                                                   ||      |
|  ||  +-------------------------------------------------------------------------------+   ||      |
|  ||  | Enter a clear description of the risk...                                      |   ||      |
|  ||  |                                                                               |   ||      |
|  ||  +-------------------------------------------------------------------------------+   ||      |
|  ||                                                                                       ||      |
|  ||  +----------------------------------+  +----------------------------------+           ||      |
|  ||  | Likelihood (1-5) *              |  | Impact (1-5) *                   |           ||      |
|  ||  | +----------------------------+  |  | +----------------------------+   |           ||      |
|  ||  | | Select likelihood      [v] |  |  | | Select impact          [v] |   |           ||      |
|  ||  | +----------------------------+  |  | +----------------------------+   |           ||      |
|  ||  | 1 = Rare                        |  | 1 = Insignificant               |           ||      |
|  ||  | 2 = Unlikely                    |  | 2 = Minor                        |           ||      |
|  ||  | 3 = Possible                    |  | 3 = Moderate                     |           ||      |
|  ||  | 4 = Likely                      |  | 4 = Major                        |           ||      |
|  ||  | 5 = Almost Certain              |  | 5 = Severe                       |           ||      |
|  ||  +----------------------------------+  +----------------------------------+           ||      |
|  ||                                                                                       ||      |
|  ||  Calculated Score: [--]                                                              ||      |
|  ||  (Displays score badge with color once L & I selected)                               ||      |
|  ||                                                                                       ||      |
|  ||  Status *                              Owner                                          ||      |
|  ||  +----------------------------+        +----------------------------+                ||      |
|  ||  | Open                   [v] |        | Select owner           [v] |                ||      |
|  ||  +----------------------------+        +----------------------------+                ||      |
|  ||                                                                                       ||      |
|  ||  Mitigation Actions                                                                   ||      |
|  ||  +-------------------------------------------------------------------------------+   ||      |
|  ||  | Describe mitigation steps...                                                  |   ||      |
|  ||  |                                                                               |   ||      |
|  ||  |                                                                               |   ||      |
|  ||  +-------------------------------------------------------------------------------+   ||      |
|  ||                                                                                       ||      |
|  ||                                                                                       ||      |
|  ||                                           [Cancel]    [Save Risk]                    ||      |
|  ||                                                                                       ||      |
|  ||===============================================================================+      ||      |
|  +=======================================================================================+      |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

### Mobile View - Table (<768px)

```
+----------------------------------+
|  < Risks                [+ Add]  |
+----------------------------------+
|                                  |
|  [Table] [Matrix]                |
|  ------                          |
|                                  |
|  +------- FILTERS ------+        |
|  | Status  [All v]      |        |
|  | Owner   [All v]      |        |
|  | Score   [All v]      |        |
|  | [Clear]   5 risks    |        |
|  +----------------------+        |
|                                  |
|  +------- RISK CARD ----+        |
|  |                      |        |
|  | [20] CRITICAL        |        |
|  |  RED                 |        |
|  |                      |        |
|  | Supplier discontin-  |        |
|  | ues key ingredient   |        |
|  |                      |        |
|  | L: 4  |  I: 5        |        |
|  | Status: Open         |        |
|  | Owner: J.Doe         |        |
|  |                      |        |
|  | [Edit] [Delete]      |        |
|  | [View Details]       |        |
|  +----------------------+        |
|                                  |
|  +------- RISK CARD ----+        |
|  |                      |        |
|  | [15] CRITICAL        |        |
|  |  RED                 |        |
|  |                      |        |
|  | Regulatory approval  |        |
|  | delayed              |        |
|  |                      |        |
|  | L: 3  |  I: 5        |        |
|  | Status: Open         |        |
|  | Owner: QA Lead       |        |
|  |                      |        |
|  | [Edit] [Delete]      |        |
|  | [View Details]       |        |
|  +----------------------+        |
|                                  |
|  +------- RISK CARD ----+        |
|  |                      |        |
|  | [12] HIGH            |        |
|  |  ORNG                |        |
|  |                      |        |
|  | Production line      |        |
|  | capacity conflict    |        |
|  |                      |        |
|  | L: 4  |  I: 3        |        |
|  | Status: Mitigated    |        |
|  | Owner: Ops Mgr       |        |
|  |                      |        |
|  | [Edit] [Delete]      |        |
|  | [View Details]       |        |
|  +----------------------+        |
|                                  |
+----------------------------------+
```

### Mobile View - Matrix (<768px)

```
+----------------------------------+
|  < Risks                [+ Add]  |
+----------------------------------+
|                                  |
|  [Table] [Matrix]                |
|          ------                  |
|                                  |
|  +------- SUMMARY ------+        |
|  |                      |        |
|  | [2] Critical (RED)   |        |
|  | [1] High (ORANGE)    |        |
|  | [1] Medium (YELLOW)  |        |
|  | [1] Low (GREEN)      |        |
|  |                      |        |
|  +----------------------+        |
|                                  |
|  +------- MINI MATRIX --+        |
|  |                      |        |
|  |    Impact -->        |        |
|  |  ^ 1  2  3  4  5     |        |
|  |  | +-+-+-+-+-+       |        |
|  | L5| | | | | |        |        |
|  |  | +-+-+-+-+-+       |        |
|  | i4| | |1| |1|        |        |
|  |  | +-+-+-+-+-+       |        |
|  | k3| | | | |1|        |        |
|  |  | +-+-+-+-+-+       |        |
|  | e2| |1| |1| |        |        |
|  |  | +-+-+-+-+-+       |        |
|  | l1| | | | | |        |        |
|  |    +-+-+-+-+-+       |        |
|  |                      |        |
|  | Tap cell to expand   |        |
|  +----------------------+        |
|                                  |
|  +--- CRITICAL RISKS ---+        |
|  |                      |        |
|  | [20] Supplier discon.|        |
|  |      Owner: J.Doe    |        |
|  |      [View >]        |        |
|  |                      |        |
|  | [15] Regulatory delay|        |
|  |      Owner: QA Lead  |        |
|  |      [View >]        |        |
|  +----------------------+        |
|                                  |
|  +--- HIGH RISKS -------+        |
|  |                      |        |
|  | [12] Line capacity   |        |
|  |      Owner: Ops Mgr  |        |
|  |      [View >]        |        |
|  +----------------------+        |
|                                  |
+----------------------------------+
```

---

## Key Components

### 1. Risk Register Table

| Column | Source | Display | Sort |
|--------|--------|---------|------|
| Score | Calculated (L x I) | Badge with color | Default DESC |
| Description | npd_risks.risk_description | Full text + actions truncated | - |
| Likelihood (L) | npd_risks.likelihood | 1-5 numeric | - |
| Impact (I) | npd_risks.impact | 1-5 numeric | - |
| Status | npd_risks.status | Badge (Open/Mitigated/Accepted) | - |
| Owner | users.name via owner_id | Name or "Unassigned" | - |
| Actions | - | [Edit][Delete][View Details] | - |

### 2. Score Color Coding

| Score Range | Color | Level | Hex Code | Action Required |
|-------------|-------|-------|----------|-----------------|
| 1-4 | Green | Low | #22C55E | Monitor |
| 5-9 | Yellow | Medium | #EAB308 | Active mitigation |
| 10-14 | Orange | High | #F97316 | Priority action |
| 15-25 | Red | Critical | #EF4444 | Escalate immediately |

### 3. Filter Panel

| Filter | Options | Default |
|--------|---------|---------|
| Status | All, Open, Mitigated, Accepted | All |
| Owner | All, [List of team members] | All |
| Score Threshold | All, Low (1-4), Medium (5-9), High (10-14), Critical (15-25) | All |

### 4. Risk Matrix 5x5

| | Impact 1 | Impact 2 | Impact 3 | Impact 4 | Impact 5 |
|----------|----------|----------|----------|----------|----------|
| **Likelihood 5** | 5 (Y) | 10 (O) | 15 (R) | 20 (R) | 25 (R) |
| **Likelihood 4** | 4 (G) | 8 (Y) | 12 (O) | 16 (R) | 20 (R) |
| **Likelihood 3** | 3 (G) | 6 (Y) | 9 (Y) | 12 (O) | 15 (R) |
| **Likelihood 2** | 2 (G) | 4 (G) | 6 (Y) | 8 (Y) | 10 (O) |
| **Likelihood 1** | 1 (G) | 2 (G) | 3 (G) | 4 (G) | 5 (Y) |

Legend: G=Green, Y=Yellow, O=Orange, R=Red

### 5. Likelihood Scale

| Value | Label | Description |
|-------|-------|-------------|
| 1 | Rare | Very unlikely to occur (<5%) |
| 2 | Unlikely | Could occur but not expected (5-20%) |
| 3 | Possible | May occur at some point (20-50%) |
| 4 | Likely | Probably will occur (50-80%) |
| 5 | Almost Certain | Expected to occur (>80%) |

### 6. Impact Scale

| Value | Label | Description |
|-------|-------|-------------|
| 1 | Insignificant | No noticeable impact |
| 2 | Minor | Minor delay or cost increase |
| 3 | Moderate | Moderate impact, manageable |
| 4 | Major | Significant impact on timeline/budget |
| 5 | Severe | Project failure or critical damage |

---

## Main Actions

### Page Level Actions

| Action | Button | Visible When | Result |
|--------|--------|--------------|--------|
| Add Risk | [+ Add Risk] | Always (except loading/error) | Opens add risk modal |
| Toggle View | [Table View] / [Matrix View] | Always | Switches between views |
| Clear Filters | [Clear Filters] | When filters applied | Resets all filters |

### Row/Card Actions

| Action | Button | Visible When | Result |
|--------|--------|--------------|--------|
| Edit | [E] or [Edit] | Always | Opens edit modal with risk data |
| Delete | [D] or [Delete] | Always | Opens delete confirmation |
| View Details | [V] or [View Details] | Always | Expands risk detail panel |
| Change Status | Dropdown | In expanded view | Updates status inline |

### Matrix Cell Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Click cell with risks | Single click | Expands cell showing all risks in that L/I combination |
| Close expanded | [X] or click outside | Returns to full matrix view |
| View risk from cell | Click risk in expanded | Opens risk detail |

---

## States

| State | Description | Key Elements |
|-------|-------------|--------------|
| **Loading** | Initial data fetch | Skeleton loaders for filters and table/matrix |
| **Empty (No Risks)** | Project has no risks | Shield icon, explanation text, [+ Add First Risk] CTA |
| **Table View** | Default view with risk table | Filter panel, sortable table, color-coded scores |
| **Matrix View** | 5x5 risk matrix visualization | Matrix grid, cell badges, summary cards |
| **Cell Expanded** | Matrix cell clicked | Expanded panel showing risks in selected cell |
| **Error** | Failed to load | Error icon, message, [Retry] and [Go Back] buttons |

---

## API Endpoints

### Get Project Risks

```
GET /api/npd/projects/:id/risks

Query Parameters:
- status: open | mitigated | accepted (optional)
- owner_id: UUID (optional)
- min_score: number (optional)
- max_score: number (optional)
- sort: score_desc | score_asc | created_desc | created_asc (default: score_desc)

Response:
{
  "success": true,
  "data": {
    "risks": [
      {
        "id": "uuid-risk-1",
        "npd_project_id": "uuid-npd-001",
        "risk_description": "Supplier discontinues key ingredient",
        "likelihood": 4,
        "impact": 5,
        "risk_score": 20,
        "mitigation_plan": "Identify alternative suppliers in EU and APAC",
        "status": "open",
        "owner_id": "uuid-user-1",
        "owner_name": "J.Doe",
        "created_at": "2025-01-15T10:00:00Z",
        "created_by": "uuid-user-1",
        "updated_at": "2025-02-10T14:30:00Z"
      }
    ],
    "summary": {
      "total": 5,
      "by_severity": {
        "critical": 2,
        "high": 1,
        "medium": 1,
        "low": 1
      },
      "by_status": {
        "open": 3,
        "mitigated": 1,
        "accepted": 1
      }
    },
    "matrix": {
      "cells": [
        { "likelihood": 4, "impact": 5, "count": 1 },
        { "likelihood": 3, "impact": 5, "count": 1 },
        { "likelihood": 4, "impact": 3, "count": 1 },
        { "likelihood": 2, "impact": 4, "count": 1 },
        { "likelihood": 2, "impact": 2, "count": 1 }
      ]
    }
  }
}
```

### Create Risk

```
POST /api/npd/risks

Request:
{
  "npd_project_id": "uuid-npd-001",
  "risk_description": "New risk description",
  "likelihood": 3,
  "impact": 4,
  "mitigation_plan": "Mitigation steps...",
  "status": "open",
  "owner_id": "uuid-user-1"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-risk-new",
    "risk_score": 12,
    ...
  }
}
```

### Update Risk

```
PUT /api/npd/risks/:id

Request:
{
  "risk_description": "Updated description",
  "likelihood": 2,
  "impact": 4,
  "mitigation_plan": "Updated mitigation...",
  "status": "mitigated",
  "owner_id": "uuid-user-2"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-risk-1",
    "risk_score": 8,
    ...
  }
}
```

### Delete Risk

```
DELETE /api/npd/risks/:id

Response:
{
  "success": true,
  "message": "Risk deleted successfully"
}
```

---

## Permissions

| Role | View | Add | Edit | Delete | Change Status |
|------|------|-----|------|--------|---------------|
| Admin | Yes | Yes | Yes | Yes | Yes |
| NPD Lead | Yes | Yes | Yes | Yes | Yes |
| Project Owner | Yes | Yes | Own risks | Own risks | Own risks |
| R&D | Yes | Yes | Own risks | No | Own risks |
| QA | Yes | No | Assigned risks | No | Assigned risks |
| Finance | Yes | No | No | No | No |
| Production | Yes | No | No | No | No |

---

## Business Rules

### Score Calculation

```
risk_score = likelihood * impact
```

Where likelihood and impact are integers 1-5.

### Status Transitions

| From | To | Allowed |
|------|-----|---------|
| Open | Mitigated | Yes - requires mitigation_plan |
| Open | Accepted | Yes - requires owner approval |
| Mitigated | Open | Yes - if mitigation fails |
| Mitigated | Accepted | Yes |
| Accepted | Open | Yes - if risk re-emerges |
| Accepted | Mitigated | No |

### Validation Rules

| Field | Rule |
|-------|------|
| risk_description | Required, max 500 characters |
| likelihood | Required, integer 1-5 |
| impact | Required, integer 1-5 |
| mitigation_plan | Required if status = "mitigated", max 1000 characters |
| owner_id | Optional, must be valid org member |

### Auto-Sort Behavior

- Table view defaults to score DESC (highest risks first)
- Within same score, sort by created_at DESC (newest first)
- Matrix view cells show count badges, expandable

---

## Accessibility

### Touch Targets
- All buttons: 48x48dp minimum
- Filter dropdowns: 48dp height
- Table row actions: 48x48dp each
- Matrix cells: 48x48dp minimum (responsive)
- Modal buttons: 48x48dp

### Contrast
- Score badges: Background color with white text (4.5:1 contrast)
- Table headers: 4.5:1 contrast ratio
- Filter labels: 4.5:1 contrast ratio
- Matrix cell numbers: High contrast on colored backgrounds

### Color Independence (NPD-NFR-24)
- Score badges include text labels (Critical/High/Medium/Low)
- Matrix cells show numeric score alongside color
- Status uses both color and text (Open/Mitigated/Accepted)

### Screen Reader
- Page title: "Risk Register for [Project Name]"
- Table: "Risk register table, 5 risks sorted by score descending"
- Matrix: "5 by 5 risk matrix, likelihood on vertical axis, impact on horizontal axis"
- Cell: "Likelihood 4, Impact 5, Score 20, Critical, 1 risk"
- Filter: "Filter by status, currently showing all statuses"

### Keyboard Navigation
- Tab: Navigate between filters, view toggles, table/matrix, action buttons
- Enter: Activate buttons, select dropdown options, expand cells
- Escape: Close modals, collapse expanded cells
- Arrow keys: Navigate within dropdown options, matrix cells

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | Full table with all columns, full 5x5 matrix |
| Tablet (768-1024px) | Table with horizontal scroll, compact matrix |
| Mobile (<768px) | Card-based list (table view), mini-matrix with summary (matrix view) |

---

## Performance Notes

### Data Loading
- Initial load fetches all risks with summary and matrix data in single query
- Filter changes use client-side filtering for immediate response
- Pagination not required (typical project has <50 risks)

### Caching
```typescript
'org:{orgId}:npd:project:{projectId}:risks'           // 30 sec TTL
'org:{orgId}:npd:project:{projectId}:risks:summary'   // 30 sec TTL
'org:{orgId}:npd:project:{projectId}:risks:matrix'    // 30 sec TTL
```

### Load Time Targets
- Initial page load: <500ms
- View toggle (table/matrix): <100ms (client-side)
- Filter change: <100ms (client-side)
- Add/Edit risk: <500ms
- Delete risk: <300ms

---

## Testing Requirements

### Unit Tests
- Score calculation (likelihood x impact)
- Color determination by score range
- Filter logic (status, owner, threshold)
- Validation rules for required fields
- Status transition validation

### Integration Tests
- GET /api/npd/projects/:id/risks
- POST /api/npd/risks
- PUT /api/npd/risks/:id
- DELETE /api/npd/risks/:id
- RLS enforcement (org_id filtering)
- Permission checks per role

### E2E Tests
- Load risk register with multiple risks
- Toggle between table and matrix views
- Apply and clear filters
- Add new risk via modal
- Edit existing risk
- Delete risk with confirmation
- Expand matrix cell and view risks
- Mobile responsive layout
- Keyboard navigation through interface
- Screen reader announcements

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All states defined (Loading, Empty, Table View, Matrix View, Cell Expanded, Error)
- [x] Filter panel with status, owner, score threshold
- [x] 5x5 risk matrix with proper color coding
- [x] Score color coding (1-4=green, 5-9=yellow, 10-14=orange, 15-25=red)
- [x] Row actions ([Edit], [Delete], [View Details])
- [x] Cell expansion with risk details
- [x] API endpoints documented
- [x] Accessibility requirements met (color independence per NPD-NFR-24)
- [x] Responsive design for mobile/tablet/desktop
- [x] Permissions matrix defined

---

## Handoff to FRONTEND-DEV

```yaml
feature: Risk Register & Matrix
story: NPD-015
fr_coverage: FR-NPD-48 to FR-NPD-52
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/NPD-015-risk-register-matrix.md
  api_endpoints:
    - GET /api/npd/projects/:id/risks
    - POST /api/npd/risks
    - PUT /api/npd/risks/:id
    - DELETE /api/npd/risks/:id
states_per_screen: [loading, empty-no-risks, table-view, matrix-view, cell-expanded, error]
components:
  - Risk register table
  - Filter panel (status, owner, score threshold)
  - 5x5 risk matrix visualization
  - Score color coding badges
  - Add/Edit risk modal
  - Cell expanded panel
breakpoints:
  mobile: "<768px"
  tablet: "768-1024px"
  desktop: ">1024px"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
  color_independence: "Text labels with color coding per NPD-NFR-24"
related_screens:
  - NPD-002: Project Detail Page (Risks tab)
  - NPD-001: Projects Dashboard
critical_ux_requirements:
  - 5x5 risk matrix with likelihood (1-5) x impact (1-5)
  - Score color coding (1-4=green, 5-9=yellow, 10-14=orange, 15-25=red)
  - Cell badges showing risk count, expandable on click
  - Filter panel with status, owner, score threshold filters
  - Row actions for edit, delete, view details
  - Color-coded scores must include text labels (accessibility)
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 8-10 hours
**Quality Target**: 95/100
