# NPD-001: NPD Projects Kanban Dashboard

**Module**: NPD (New Product Development)
**Feature**: NPD Projects Kanban Dashboard (PRD Section 2.5)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Populated)

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Projects                                             [Kanban] [List]  [+ New Project]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Filters:                                                                                   |   |
|  |                                                                                            |   |
|  | [Search projects...                    ]  Category: [All Categories v]                    |   |
|  |                                                                                            |   |
|  | Priority: [All v]  Owner: [All Owners v]  Status: [Active v]     [Clear Filters]          |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ |
|  | G0: Ideas   | | G1: Feasib. | | G2: Biz Case| | G3: Develop | | G4: Testing | | Launched    | |
|  |    (4)      | |    (3)      | |    (2)      | |    (5)      | |    (2)      | |    (8)      | |
|  +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ |
|  |             | |             | |             | |             | |             | |             | |
|  | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | |
|  | |NPD-2025-| | | |NPD-2025-| | | |NPD-2025-| | | |NPD-2025-| | | |NPD-2025-| | | |NPD-2025-| | |
|  | |  00012  | | | |  00008  | | | |  00005  | | | |  00003  | | | |  00001  | | | |  00015  | | |
|  | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | |
|  | |Premium  | | | |Vegan    | | | |Organic  | | | |Keto     | | | |Gluten   | | | |Classic  | | |
|  | |Burger   | | | |Nuggets  | | | |Bread    | | | |Cookies  | | | |Free     | | | |Sourdough| | |
|  | |Line     | | | |Range    | | | |Series   | | | |Line     | | | |Pizza    | | | |         | | |
|  | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | |
|  | |[HIGH]   | | | |[MEDIUM] | | | |[HIGH]   | | | |[MEDIUM] | | | |[HIGH]   | | | |[LOW]    | | |
|  | |         | | | |         | | | |         | | | |         | | | |         | | | |         | | |
|  | |[JD] John| | | |[SM]Sarah| | | |[JD] John| | | |[MK]Mike | | | |[SM]Sarah| | | |[JD] John| | |
|  | |         | | | |         | | | |         | | | |         | | | |         | | | |         | | |
|  | |Target:  | | | |Target:  | | | |Target:  | | | |Target:  | | | |Target:  | | | |Launched:| | |
|  | |Jun 30   | | | |Jul 15   | | | |Aug 01   | | | |May 20   | | | |Apr 10   | | | |Jan 05   | | |
|  | |         | | | |         | | | |         | | | |         | | | |         | | | |         | | |
|  | |[Vegan]  | | | |[Vegan]  | | | |[Bakery] | | | |[Snacks] | | | |[Bakery] | | | |[Bakery] | | |
|  | |         | | | |         | | | |         | | | |         | | | |         | | | |         | | |
|  | |14 days  | | | |8 days   | | | |22 days  | | | |45 days  | | | |62 days  | | | |         | | |
|  | |in gate  | | | |in gate  | | | |in gate  | | | |in gate  | | | |in gate  | | | |         | | |
|  | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | |
|  |             | |             | |             | |             | |             | |             | |
|  | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | |
|  | |NPD-2025-| | | |NPD-2025-| | | |NPD-2025-| | | |NPD-2025-| | | |NPD-2025-| | | |NPD-2025-| | |
|  | |  00014  | | | |  00009  | | | |  00006  | | | |  00004  | | | |  00002  | | | |  00016  | | |
|  | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | |
|  | |Plant    | | | |Sugar-   | | | |...      | | | |...      | | | |...      | | | |...      | | |
|  | |Based    | | | |Free     | | | |         | | | |         | | | |         | | | |         | | |
|  | |Mince    | | | |Treats   | | | |         | | | |         | | | |         | | | |         | | |
|  | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | |
|  | |...      | | | |...      | | |             | |             | |             | |             | |
|  | +---------+ | | +---------+ | |             | |             | |             | |             | |
|  |             | |             | |             | |             | |             | |             | |
|  | (scroll)    | | (scroll)    | |             | | (scroll)    | |             | | (scroll)    | |
|  +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ |
|                                                                                                  |
|  Summary: 24 Active Projects | 4 Ideas | 3 Feasibility | 2 Business Case | 5 Development |      |
|           2 Testing | 8 Launched                                                                 |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+

Project Card Detail (Expanded View):
+------------------+
| NPD-2025-00012   |  <- Project number (clickable link)
+------------------+
| Premium Burger   |  <- Project name (title)
| Line             |
+------------------+
| [HIGH]           |  <- Priority badge (red=high, orange=medium, gray=low)
|                  |
| [JD] John Doe    |  <- Owner avatar + name
|                  |
| Target: Jun 30   |  <- Target launch date
|                  |
| [Vegan Line]     |  <- Category tag
|                  |
| 14 days in gate  |  <- Days in current gate
+------------------+

Priority Badge Colors:
- HIGH:   #EF4444 (red-500) background, white text
- MEDIUM: #F97316 (orange-500) background, white text
- LOW:    #6B7280 (gray-500) background, white text
```

### Success State (Desktop - Filtered)

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Projects                                             [Kanban] [List]  [+ New Project]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Filters: (2 active)                                                                       |   |
|  |                                                                                            |   |
|  | [vegan                              x]  Category: [Vegan Line      v]                     |   |
|  |                                                                                            |   |
|  | Priority: [High v]  Owner: [All Owners v]  Status: [Active v]     [Clear Filters]         |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ |
|  | G0: Ideas   | | G1: Feasib. | | G2: Biz Case| | G3: Develop | | G4: Testing | | Launched    | |
|  |    (1)      | |    (1)      | |    (0)      | |    (0)      | |    (1)      | |    (0)      | |
|  +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ |
|  |             | |             | |             | |             | |             | |             | |
|  | +---------+ | | +---------+ | |             | |             | | +---------+ | |             | |
|  | |NPD-2025-| | | |NPD-2025-| | |    No       | |    No       | | |NPD-2025-| | |    No       | |
|  | |  00012  | | | |  00018  | | | projects    | | projects    | | |  00007  | | | projects    | |
|  | +---------+ | | +---------+ | |    in       | |    in       | | +---------+ | |    in       | |
|  | |Premium  | | | |Vegan    | | |   this      | |   this      | | |Vegan    | | |   this      | |
|  | |Burger   | | | |Sausages | | |   gate      | |   gate      | | |Meatballs| | |   gate      | |
|  | |Line     | | | |         | | |             | |             | | |         | | |             | |
|  | +---------+ | | +---------+ | |             | |             | | +---------+ | |             | |
|  | |[HIGH]   | | | |[HIGH]   | | |             | |             | | |[HIGH]   | | |             | |
|  | |...      | | | |...      | | |             | |             | | |...      | | |             | |
|  | +---------+ | | +---------+ | |             | |             | | +---------+ | |             | |
|  |             | |             | |             | |             | |             | |             | |
|  +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ |
|                                                                                                  |
|  Showing 3 of 24 projects (filtered)                                              [Clear All]   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Tablet: 768-1024px)

```
+----------------------------------------------------------------------+
|  NPD > Projects                      [Kanban][List] [+ New Project]  |
+----------------------------------------------------------------------+
|                                                                        |
|  +------------------------------------------------------------------+ |
|  | [Search...              ]  [All Categories v] [All Priority v]   | |
|  | [All Owners v] [Active v]                        [Clear Filters] | |
|  +------------------------------------------------------------------+ |
|                                                                        |
|  +----------+ +----------+ +----------+ +----------+ +----------+     |
|  |G0: Ideas | |G1: Feas. | |G2: Biz   | |G3: Dev   | |G4: Test  |     |
|  |   (4)    | |   (3)    | |   (2)    | |   (5)    | |   (2)    |     |
|  +----------+ +----------+ +----------+ +----------+ +----------+     |
|  |          | |          | |          | |          | |          |     |
|  | +------+ | | +------+ | | +------+ | | +------+ | | +------+ |     |
|  | |00012 | | | |00008 | | | |00005 | | | |00003 | | | |00001 | |     |
|  | |Premim| | | |Vegan | | | |Organi| | | |Keto  | | | |Gluten| |     |
|  | |Burger| | | |Nugget| | | |Bread | | | |Cooki | | | |Free  | |     |
|  | |[HIGH]| | | |[MED] | | | |[HIGH]| | | |[MED] | | | |[HIGH]| |     |
|  | |JD    | | | |SM    | | | |JD    | | | |MK    | | | |SM    | |     |
|  | |Jun30 | | | |Jul15 | | | |Aug01 | | | |May20 | | | |Apr10 | |     |
|  | +------+ | | +------+ | | +------+ | | +------+ | | +------+ |     |
|  |          | |          | |          | |          | |          |     |
|  | (more)   | | (more)   | |          | | (more)   | |          |     |
|  +----------+ +----------+ +----------+ +----------+ +----------+     |
|                                                                        |
|  <- Scroll horizontally to see "Launched" column ->                   |
|                                                                        |
|  24 Projects | 4 Ideas | 3 Feasibility | 2 Biz Case | 5 Dev | 2 Test |
|                                                                        |
+----------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < NPD Projects                  |
|  [Kanban v]     [+ New Project]  |
+----------------------------------+
|                                  |
|  [Search projects...          ]  |
|                                  |
|  [Filters v] 2 active            |
|                                  |
+----------------------------------+
|  Gate: [G0: Ideas (4)         v] |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | NPD-2025-00012             |  |
|  | Premium Burger Line        |  |
|  |                            |  |
|  | [HIGH]  [JD] John Doe      |  |
|  |                            |  |
|  | Target: Jun 30, 2025       |  |
|  | [Vegan Line]               |  |
|  |                            |  |
|  | 14 days in gate            |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | NPD-2025-00014             |  |
|  | Plant Based Mince          |  |
|  |                            |  |
|  | [MEDIUM]  [SM] Sarah M.    |  |
|  |                            |  |
|  | Target: Jul 15, 2025       |  |
|  | [Vegan Line]               |  |
|  |                            |  |
|  | 8 days in gate             |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | NPD-2025-00017             |  |
|  | Vegan Cheese Spread        |  |
|  |                            |  |
|  | [LOW]  [MK] Mike K.        |  |
|  |                            |  |
|  | No target date             |  |
|  | [Vegan Line]               |  |
|  |                            |  |
|  | 3 days in gate             |  |
|  +----------------------------+  |
|                                  |
|  [Load More (1 remaining)]       |
|                                  |
+----------------------------------+
|  Summary: 24 Active Projects     |
|  G0: 4 | G1: 3 | G2: 2 | G3: 5  |
|  G4: 2 | Launched: 8             |
+----------------------------------+

Mobile Filter Expansion (when [Filters v] tapped):
+----------------------------------+
|  Filters                    [x]  |
+----------------------------------+
|                                  |
|  Category                        |
|  [All Categories            v]   |
|                                  |
|  Priority                        |
|  [All Priorities            v]   |
|                                  |
|  Owner                           |
|  [All Owners                v]   |
|                                  |
|  Status                          |
|  [Active                    v]   |
|                                  |
|  [Clear All]    [Apply Filters]  |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Projects                                             [Kanban] [List]  [+ New Project]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Filters:                                                                                   |   |
|  | [████████████████████████░░░░░░░░░░]  [████████░░░░░]  [████████░░░░░]                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ |
|  | G0: Ideas   | | G1: Feasib. | | G2: Biz Case| | G3: Develop | | G4: Testing | | Launched    | |
|  |    (-)      | |    (-)      | |    (-)      | |    (-)      | |    (-)      | |    (-)      | |
|  +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ |
|  |             | |             | |             | |             | |             | |             | |
|  | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | |
|  | |[░░░░░░]| | | |[░░░░░░]| | | |[░░░░░░]| | | |[░░░░░░]| | | |[░░░░░░]| | | |[░░░░░░]| | |
|  | |[░░░░░░]| | | |[░░░░░░]| | | |[░░░░░░]| | | |[░░░░░░]| | | |[░░░░░░]| | | |[░░░░░░]| | |
|  | |[░░░░░]| | | |[░░░░░]| | | |[░░░░░]| | | |[░░░░░]| | | |[░░░░░]| | | |[░░░░░]| | |
|  | |[░░░░]| | | |[░░░░]| | | |[░░░░]| | | |[░░░░]| | | |[░░░░]| | | |[░░░░]| | |
|  | |[░░░]| | | |[░░░]| | | |[░░░]| | | |[░░░]| | | |[░░░]| | | |[░░░]| | |
|  | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | | +---------+ | |
|  |             | |             | |             | |             | |             | |             | |
|  | +---------+ | | +---------+ | |             | |             | |             | |             | |
|  | |[░░░░░░]| | | |[░░░░░░]| | |             | |             | |             | |             | |
|  | |[░░░░░░]| | | |[░░░░░░]| | |             | |             | |             | |             | |
|  | +---------+ | | +---------+ | |             | |             | |             | |             | |
|  |             | |             | |             | |             | |             | |             | |
|  +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ +-------------+ |
|                                                                                                  |
|  Loading NPD projects...                                                                         |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Projects                                             [Kanban] [List]  [+ New Project]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Lightbulb Icon]                                         |
|                                                                                                  |
|                                    No NPD Projects Yet                                           |
|                                                                                                  |
|                     Start your product innovation journey by creating your                       |
|                     first NPD project. Track ideas from concept through                          |
|                     development to launch with our Stage-Gate workflow.                          |
|                                                                                                  |
|                                                                                                  |
|                                    [+ Create First Project]                                      |
|                                                                                                  |
|                                                                                                  |
|                     Stage-Gate Workflow:                                                         |
|                                                                                                  |
|                     G0 (Ideas) -> G1 (Feasibility) -> G2 (Business Case) ->                     |
|                     G3 (Development) -> G4 (Testing) -> Launched                                 |
|                                                                                                  |
|                                                                                                  |
|                              [View NPD Documentation]                                            |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  NPD > Projects                                             [Kanban] [List]  [+ New Project]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Failed to Load NPD Projects                                        |
|                                                                                                  |
|                     Unable to retrieve project data. Please check your                           |
|                     connection and try again.                                                    |
|                                                                                                  |
|                                Error: NPD_PROJECTS_FETCH_FAILED                                  |
|                                                                                                  |
|                                                                                                  |
|                                  [Retry]    [Contact Support]                                    |
|                                                                                                  |
|                                                                                                  |
|  Quick Actions (still available):                                                                |
|  [+ New Project] - Create a new NPD project offline (will sync when connection restored)        |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Kanban Board (6 Columns)

Main visualization showing project pipeline across Stage-Gate workflow.

| Column | Gate | Status Mapping | Description |
|--------|------|----------------|-------------|
| Ideas | G0 | idea | Initial concepts, quick feasibility check |
| Feasibility | G1 | feasibility | Technical assessment, resource requirements |
| Business Case | G2 | business_case | Financial analysis, target cost setting |
| Development | G3 | development | Formulation development, trial batches |
| Testing | G4 | testing | Shelf-life, sensory evaluation, compliance |
| Launched | Launched | launched | Handed off to Production, commercial production |

**Column Features:**
- Header with gate name and project count
- Vertical scrolling within column (max-height: 70vh)
- Drag-and-drop source/target zones
- Visual highlight on drag hover

### 2. Project Cards

Compact card design showing key project information.

| Field | Display | Click Action |
|-------|---------|--------------|
| Project Number | NPD-YYYY-NNNNN (link style) | Navigate to project detail |
| Project Name | 2-line title, truncate with ellipsis | Navigate to project detail |
| Priority Badge | Color-coded badge (HIGH/MEDIUM/LOW) | - |
| Owner | Avatar circle + first name | - |
| Target Date | "Target: MMM DD" or "No target" | - |
| Category | Tag pill style | Filter by category |
| Days in Gate | "N days in gate" (muted text) | - |

**Priority Badge Colors:**
- HIGH: Red (#EF4444) background, white text
- MEDIUM: Orange (#F97316) background, white text
- LOW: Gray (#6B7280) background, white text

**Days in Gate Highlighting:**
- 0-14 days: Normal (gray text)
- 15-30 days: Warning (yellow/amber)
- 30+ days: Overdue (red text, bold)

### 3. Filter Panel

Comprehensive filtering for project discovery.

| Filter | Type | Options |
|--------|------|---------|
| Search | Text input | Searches project_number, project_name |
| Category | Dropdown | All Categories, [dynamic list from portfolio_category] |
| Priority | Dropdown | All, High, Medium, Low |
| Owner | Dropdown | All Owners, [dynamic user list] |
| Status | Dropdown | Active (default), All, Cancelled |

**Filter Behavior:**
- Filters combine with AND logic
- URL query params update with filter state
- Filter count badge shows active filters
- Clear Filters button resets all
- Debounced search (300ms)

### 4. View Toggle

Switch between Kanban and List views.

| View | Icon | Storage |
|------|------|---------|
| Kanban | Grid icon | localStorage: npd_view_preference |
| List | List icon | localStorage: npd_view_preference |

### 5. Summary Bar

Bottom bar showing project distribution.

```
Summary: 24 Active Projects | 4 Ideas | 3 Feasibility | 2 Business Case |
         5 Development | 2 Testing | 8 Launched
```

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Create Project | Header [+ New Project] | Opens CreateProjectModal |
| View Project | Click card | Navigate to /npd/projects/[id] |
| Switch View | Header toggle | Switch Kanban/List, save preference |

### Drag-and-Drop Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Advance Gate | Drag to next column | Opens AdvanceGateModal |
| Move Back | Drag to previous column | Opens RollbackModal with warning |
| Skip Gate | Drag to non-adjacent | Error toast "Cannot skip gates" |

### Filter Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Search | Type in search box | Debounced filter (300ms) |
| Filter | Select dropdown | Immediate filter |
| Clear Filters | Click button | Reset all filters |

### Card Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| View Detail | Click card | Navigate to detail page |
| Quick Edit | Right-click (desktop) | Context menu with Edit, Advance, Cancel |

---

## States

### Loading State
- Skeleton cards in each column (2-3 per column)
- Skeleton filter bar
- Column headers visible with "-" count
- "Loading NPD projects..." text at bottom

### Empty State
- Lightbulb illustration
- "No NPD Projects Yet" headline
- Explanation text about Stage-Gate workflow
- [+ Create First Project] primary CTA
- Stage-Gate workflow visualization
- [View NPD Documentation] secondary link

### Populated State (Success)
- All columns with project cards
- Filter panel active
- Summary bar with counts
- Drag-and-drop enabled

### Filtered State
- Active filter indicators
- Filter count badge
- "Showing X of Y projects (filtered)" text
- [Clear All] button visible
- Empty columns show "No projects in this gate"

### Error State
- Warning icon
- "Failed to Load NPD Projects" headline
- Error explanation
- Error code for support
- [Retry] and [Contact Support] buttons
- Quick Actions still accessible

---

## Data Fields

### Dashboard Response

| Field | Source | Display |
|-------|--------|---------|
| kanban.G0 | npd_projects WHERE current_gate = 'G0' | Array of projects |
| kanban.G1 | npd_projects WHERE current_gate = 'G1' | Array of projects |
| kanban.G2 | npd_projects WHERE current_gate = 'G2' | Array of projects |
| kanban.G3 | npd_projects WHERE current_gate = 'G3' | Array of projects |
| kanban.G4 | npd_projects WHERE current_gate = 'G4' | Array of projects |
| kanban.Launched | npd_projects WHERE current_gate = 'Launched' | Array of projects |
| summary.total_projects | COUNT(*) | "24 Active Projects" |
| summary.by_gate | GROUP BY current_gate | Gate counts |

### Project Card Fields

| Field | Source | Display |
|-------|--------|---------|
| id | npd_projects.id | Internal reference |
| project_number | npd_projects.project_number | "NPD-2025-00012" |
| project_name | npd_projects.project_name | "Premium Burger Line" |
| priority | npd_projects.priority | Badge: HIGH/MEDIUM/LOW |
| owner_id | npd_projects.owner_id | UUID |
| owner_name | users.name (JOIN) | "John Doe" |
| owner_avatar | users.avatar_url (JOIN) | Avatar image or initials |
| target_launch_date | npd_projects.target_launch_date | "Jun 30" or "No target" |
| portfolio_category | npd_projects.portfolio_category | Tag: "Vegan Line" |
| current_gate | npd_projects.current_gate | Column placement |
| created_at | npd_projects.created_at | For calculating days in gate |
| days_in_gate | DATEDIFF(now, last_gate_change) | "14 days in gate" |

---

## API Endpoints

### Get Kanban Data

```
GET /api/npd/dashboard
Query: ?status=active&category=&priority=&owner_id=&search=

Response:
{
  "kanban": {
    "G0": [
      {
        "id": "uuid-project-1",
        "project_number": "NPD-2025-00012",
        "project_name": "Premium Burger Line",
        "priority": "high",
        "owner_id": "uuid-user-1",
        "owner_name": "John Doe",
        "owner_avatar": "/avatars/jd.png",
        "target_launch_date": "2025-06-30",
        "portfolio_category": "Vegan Line",
        "current_gate": "G0",
        "status": "idea",
        "days_in_gate": 14,
        "created_at": "2025-01-01T10:00:00Z"
      },
      ...
    ],
    "G1": [...],
    "G2": [...],
    "G3": [...],
    "G4": [...],
    "Launched": [...]
  },
  "summary": {
    "total_projects": 24,
    "by_gate": [
      { "gate": "G0", "count": 4 },
      { "gate": "G1", "count": 3 },
      { "gate": "G2", "count": 2 },
      { "gate": "G3", "count": 5 },
      { "gate": "G4", "count": 2 },
      { "gate": "Launched", "count": 8 }
    ],
    "by_priority": [
      { "priority": "high", "count": 8 },
      { "priority": "medium", "count": 10 },
      { "priority": "low", "count": 6 }
    ]
  },
  "filters": {
    "categories": ["Vegan Line", "Bakery", "Snacks", "Premium"],
    "owners": [
      { "id": "uuid-user-1", "name": "John Doe" },
      { "id": "uuid-user-2", "name": "Sarah Miller" }
    ]
  }
}
```

### Advance Gate

```
POST /api/npd/projects/:id/advance-gate

Request:
{
  "skip_validation": true
}

Response:
{
  "project": {
    "id": "uuid-project-1",
    "project_number": "NPD-2025-00012",
    "current_gate": "G1",
    "status": "feasibility",
    ...
  },
  "previous_gate": "G0",
  "new_gate": "G1"
}
```

### Filter Options

```
GET /api/npd/filters

Response:
{
  "categories": ["Vegan Line", "Bakery", "Snacks", "Premium", "Organic"],
  "owners": [
    { "id": "uuid-user-1", "name": "John Doe", "avatar": "/avatars/jd.png" },
    { "id": "uuid-user-2", "name": "Sarah Miller", "avatar": "/avatars/sm.png" },
    { "id": "uuid-user-3", "name": "Mike King", "avatar": "/avatars/mk.png" }
  ],
  "priorities": ["high", "medium", "low"],
  "statuses": ["active", "cancelled", "all"]
}
```

---

## Permissions

| Role | View Dashboard | Create Project | Edit Project | Advance Gate | Delete Project |
|------|---------------|----------------|--------------|--------------|----------------|
| NPD Lead | Yes | Yes | Yes | Yes | Yes (idea only) |
| R&D | Yes (assigned only) | No | Yes (assigned) | No | No |
| Regulatory | Yes | No | No | No | No |
| Finance | Yes | No | No | No | No |
| Production | Yes (G4+ only) | No | No | No | No |
| Admin | Yes | Yes | Yes | Yes | Yes |

---

## Validation

### Filter Validation

| Field | Rule |
|-------|------|
| search | min 1 char, max 100 chars |
| category | Must exist in org categories |
| priority | Must be 'high', 'medium', or 'low' |
| owner_id | Must be valid UUID, user in org |
| status | Must be 'active', 'cancelled', or 'all' |

### Drag-and-Drop Validation

| Rule | Error Message |
|------|---------------|
| Sequential advancement only | "Cannot skip gates. Advance sequentially." |
| Cannot drag from Launched | "Launched projects cannot be moved." |
| Cannot drag cancelled | "Cancelled projects cannot be moved." |

---

## Business Rules

### Gate Advancement

1. **Sequential Progression**: Projects must advance G0 -> G1 -> G2 -> G3 -> G4 -> Launched
2. **Backward Movement**: Allowed with warning modal ("Move project back? This is unusual.")
3. **Skip Prevention**: Dragging to non-adjacent gate shows error, card returns to original
4. **Cancelled Projects**: Excluded from Kanban (visible in list view with filter)
5. **Gate-Status Mapping**: Advancing gate automatically updates status

### Gate-Status Mapping

| Gate | Status |
|------|--------|
| G0 | idea |
| G1 | feasibility |
| G2 | business_case |
| G3 | development |
| G4 | testing |
| Launched | launched |

### Days in Gate Calculation

```
days_in_gate = DATEDIFF(NOW(), last_gate_change_date)

If no gate change recorded:
  days_in_gate = DATEDIFF(NOW(), created_at)
```

### Priority Sorting

Within each column, projects sorted by:
1. Priority DESC (high -> medium -> low)
2. Created At DESC (newest first)

### Filter Persistence

- Filters saved to URL query params
- Shareable filtered URLs
- Filter state restored on page reload

---

## Accessibility

### Touch Targets
- Project cards: min 48x48dp clickable area
- Filter dropdowns: 48x48dp minimum
- Drag handles: 48x48dp (visible on hover/focus)
- [+ New Project] button: 48x48dp

### Contrast
- Card text: 4.5:1 minimum against card background
- Priority badges: 4.5:1 (white text on colored background)
- Column headers: 4.5:1 against column background
- Days in gate text: 4.5:1 (warning/overdue colors AA compliant)

### Screen Reader

- **Kanban board**: `role="region"` `aria-label="NPD Projects Kanban Board with 6 columns"`
- **Columns**: `role="list"` `aria-label="G0 Ideas column, 4 projects"`
- **Cards**: `role="listitem"` `aria-label="Project NPD-2025-00012, Premium Burger Line, high priority, owner John Doe, target June 30, 14 days in Ideas gate"`
- **Drag action**: `aria-describedby="drag-instructions"` "Drag to adjacent column to advance gate"
- **Filter panel**: `role="search"` `aria-label="Filter NPD projects"`

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Navigate between columns, cards, filters |
| Enter | Open project detail, apply filter, execute action |
| Space | Toggle dropdown, confirm modal |
| Arrow Up/Down | Navigate cards within column |
| Arrow Left/Right | Navigate between columns |
| Escape | Close modal, cancel drag |

### ARIA Attributes

```html
<div role="region" aria-label="NPD Projects Kanban Board">
  <div role="list" aria-label="G0 Ideas, 4 projects">
    <div role="listitem"
         aria-label="Project NPD-2025-00012, Premium Burger Line, high priority"
         tabindex="0"
         draggable="true"
         aria-describedby="drag-instructions">
      <!-- Card content -->
    </div>
  </div>
</div>

<div id="drag-instructions" hidden>
  Press Enter to start dragging. Use arrow keys to select target column. Press Enter to drop or Escape to cancel.
</div>
```

---

## Responsive Breakpoints

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| **Desktop (>1024px)** | 6 columns visible, horizontal scroll if needed | Full Kanban experience |
| **Tablet (768-1024px)** | 5 columns visible (Launched off-screen), horizontal scroll | Compact cards |
| **Mobile (<768px)** | Single column with gate selector dropdown | Cards stack vertically |

### Desktop (>1024px)
- 6 columns in single row
- Full card details visible
- Drag-and-drop enabled
- Filter panel expanded
- Summary bar full width

### Tablet (768-1024px)
- 5 columns visible (scroll for Launched)
- Compact card design
- Drag-and-drop enabled
- Filter panel compressed (2 rows)
- Summary bar condensed

### Mobile (<768px)
- Single column view
- Gate selector dropdown at top
- Cards stack vertically
- Swipe between gates (or dropdown)
- Filters in expandable panel
- No drag-and-drop (use action buttons)
- [Load More] pagination

---

## Performance Notes

### Query Optimization

```sql
-- Index for Kanban dashboard query
CREATE INDEX idx_npd_projects_kanban
ON npd_projects(org_id, current_gate, status, priority, created_at);

-- Index for filter by category
CREATE INDEX idx_npd_projects_category
ON npd_projects(org_id, portfolio_category)
WHERE portfolio_category IS NOT NULL;

-- Index for filter by owner
CREATE INDEX idx_npd_projects_owner
ON npd_projects(org_id, owner_id)
WHERE owner_id IS NOT NULL;
```

### Caching Strategy

```typescript
// Redis keys
'org:{orgId}:npd:dashboard'              // 60 sec TTL
'org:{orgId}:npd:dashboard:filters'      // 5 min TTL (filter options)
'org:{orgId}:npd:project:{id}'           // 60 sec TTL

// Invalidation triggers
- Project created -> invalidate dashboard
- Project updated -> invalidate dashboard, project cache
- Gate advanced -> invalidate dashboard, project cache
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial dashboard load | < 500ms |
| Filter change | < 300ms |
| Gate advancement | < 500ms |
| Project create | < 300ms |

### Lazy Loading

- Progressive column loading (G0 first, then others)
- Card images/avatars loaded lazily
- Filter options fetched separately
- Mobile: 10 cards initial, Load More for remaining

---

## Error Handling

### API Errors

| Error | Display | Recovery |
|-------|---------|----------|
| 401 Unauthorized | Redirect to login | - |
| 403 Forbidden | "NPD module not enabled" | Link to Settings |
| 404 Not Found | "Project not found" | Return to dashboard |
| 500 Server Error | Error state with Retry | Retry button |

### Drag-and-Drop Errors

| Error | Toast Message | Behavior |
|-------|---------------|----------|
| Skip gate attempt | "Cannot skip gates. Advance sequentially." | Card returns to original |
| Move from Launched | "Launched projects cannot be moved." | Card stays in Launched |
| Network error | "Failed to update gate. Please try again." | Card returns to original |

### Filter Errors

| Error | Display | Recovery |
|-------|---------|----------|
| Invalid filter value | Field highlighted red | Clear invalid value |
| Search timeout | Toast: "Search timed out" | Auto-retry after 2s |

---

## Testing Requirements

### Unit Tests

```typescript
describe('NPD Kanban Dashboard', () => {
  describe('Column Rendering', () => {
    it('renders 6 gate columns', async () => {});
    it('shows correct project count per column', async () => {});
    it('sorts projects by priority then created_at', async () => {});
  });

  describe('Project Cards', () => {
    it('displays all card fields correctly', async () => {});
    it('truncates long project names', async () => {});
    it('shows correct priority badge color', async () => {});
    it('calculates days in gate correctly', async () => {});
  });

  describe('Filters', () => {
    it('filters by category', async () => {});
    it('filters by priority', async () => {});
    it('filters by owner', async () => {});
    it('combines multiple filters with AND', async () => {});
    it('debounces search input', async () => {});
    it('updates URL with filter state', async () => {});
  });

  describe('Drag and Drop', () => {
    it('allows sequential gate advancement', async () => {});
    it('blocks skipping gates', async () => {});
    it('allows backward movement with warning', async () => {});
    it('prevents moving cancelled projects', async () => {});
  });
});
```

### E2E Tests

```typescript
describe('NPD Kanban E2E', () => {
  it('loads dashboard with projects in columns', async () => {
    // Navigate to /npd/dashboard
    // Verify 6 columns visible
    // Verify project cards render
    // Verify summary bar shows counts
  });

  it('creates project and appears in G0', async () => {
    // Click [+ New Project]
    // Fill form
    // Submit
    // Verify card in G0 column
  });

  it('advances project via drag-and-drop', async () => {
    // Drag card from G0 to G1
    // Confirm modal
    // Verify card in G1
    // Verify status updated
  });

  it('filters projects by category', async () => {
    // Select category filter
    // Verify only matching projects
    // Verify URL updated
    // Refresh page
    // Verify filter persists
  });
});
```

### Performance Tests

| Test | Target |
|------|--------|
| Dashboard load (50 projects) | < 500ms |
| Filter response | < 300ms |
| Drag-and-drop update | < 500ms |
| Mobile Load More | < 300ms |

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 4 states defined (Loading, Empty, Error, Success)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile)
- [x] All API endpoints specified with request/response schemas
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard, ARIA)
- [x] Performance targets defined (load times, caching strategy)
- [x] Kanban columns defined (6 gates with status mapping)
- [x] Project card fields specified
- [x] Filter panel with all filter types
- [x] Drag-and-drop business rules documented
- [x] View toggle (Kanban/List) specified
- [x] Permissions matrix documented
- [x] Error handling for all scenarios
- [x] Testing requirements defined

---

## Handoff to FRONTEND-DEV

```yaml
feature: NPD Projects Kanban Dashboard
story: NPD-001
prd_coverage: "NPD PRD Section 2.5 (Project UI - Kanban Dashboard)"
  - "Stage-Gate workflow visualization"
  - "Drag-and-drop gate advancement"
  - "Filter by category, priority, owner, status"
  - "Project cards with key information"
approval_status:
  mode: "auto_approve"
  user_approved: true
  screens_approved: [NPD-001-projects-kanban-dashboard]
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/NPD-001-projects-kanban-dashboard.md
  api_endpoints:
    - GET /api/npd/dashboard (Kanban data)
    - POST /api/npd/projects/:id/advance-gate (Gate advancement)
    - GET /api/npd/filters (Filter options)
states_per_screen: [loading, empty, error, populated, filtered]
breakpoints:
  mobile: "<768px (single column, gate dropdown)"
  tablet: "768-1024px (5 columns, horizontal scroll)"
  desktop: ">1024px (6 columns visible)"
accessibility:
  touch_targets: "48x48dp minimum"
  contrast: "4.5:1 minimum"
  aria_roles: "region, list, listitem"
  keyboard_nav: "Tab, Enter, Arrow keys, Escape"
drag_and_drop:
  library: "dnd-kit or react-beautiful-dnd"
  constraints: "Sequential gates only, no cancelled projects"
performance_targets:
  initial_load: "<500ms"
  filter_change: "<300ms"
  gate_advancement: "<500ms"
cache_ttl:
  dashboard: "60sec"
  filters: "5min"
kanban_columns: 6  # G0, G1, G2, G3, G4, Launched
card_fields: 7  # number, name, priority, owner, target_date, category, days_in_gate
filter_types: 5  # search, category, priority, owner, status
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**User Approved**: Yes
**Iterations**: 0 of 3
**Estimated Effort**: 8-10 hours (Kanban board with drag-and-drop, filters, responsive)
**Quality Target**: 95/100 (comprehensive NPD pipeline visualization)
**PRD Coverage**: 100% (NPD PRD Section 2.5 - Kanban Dashboard)
**Wireframe Length**: ~950 lines
