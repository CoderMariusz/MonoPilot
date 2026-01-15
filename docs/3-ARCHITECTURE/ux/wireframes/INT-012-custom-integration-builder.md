# INT-012: Custom Integration Builder

**Module**: Integrations
**Feature**: Visual Workflow Editor (Drag-Drop)
**Status**: Draft
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Workflow List)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Custom Integrations                                    [+ New Integration]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Search workflows...       ] [Status: All ▼] [Sort: Modified ▼]             │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Name             Trigger          Actions  Status    Last Run  Actions  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Shopify Order    Webhook:         3        ✓ Active  5m ago    [⋮]     │ │
│  │ Sync             order.created                       Success           │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Daily Inventory  Schedule:        5        ✓ Active  2h ago    [⋮]     │ │
│  │ Report           8:00 AM                             Success           │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Low Stock Alert  Database:        2        ✓ Active  1d ago    [⋮]     │ │
│  │                  inventory.qty                       Success           │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Customer Welcome Email:           4        ⏸ Paused  3d ago    [⋮]     │ │
│  │ Email            customer.created                    Disabled          │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Invoice to ERP   Manual:          6        ⚠️ Error   1h ago    [⋮]     │ │
│  │                  Button click                        API failed        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Showing 5 of 5 workflows                                                     │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - Edit Workflow (open visual editor)
  - Duplicate Workflow
  - Test Run (manual trigger)
  - View Execution Logs
  - Pause/Resume
  - Delete Workflow
```

### Visual Workflow Editor

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Custom Integration: Shopify Order Sync          [Save] [Test] [X Close]     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌────────────────┐                                                           │
│  │ Toolbox        │                                                           │
│  ├────────────────┤                                                           │
│  │ 🔔 Triggers    │                                                           │
│  │  • Webhook     │                                                           │
│  │  • Schedule    │                                                           │
│  │  • Database    │                                                           │
│  │  • Email       │                                                           │
│  │  • Manual      │                                                           │
│  │                │                                                           │
│  │ ⚙️  Actions     │                                                           │
│  │  • HTTP Request│   ┌─────────────────────────────────────────────────────┐│
│  │  • Database    │   │ Canvas (Drag-Drop Workflow)                         ││
│  │  • Email       │   ├─────────────────────────────────────────────────────┤│
│  │  • Transform   │   │                                                     ││
│  │  • Condition   │   │   ┌──────────────────┐                             ││
│  │  • Loop        │   │   │ 🔔 Trigger:      │                             ││
│  │  • Delay       │   │   │ Webhook          │                             ││
│  │                │   │   │ order.created    │                             ││
│  │ 🔗 Integrations│   │   └────────┬─────────┘                             ││
│  │  • Shopify     │   │            │                                        ││
│  │  • Stripe      │   │            ▼                                        ││
│  │  • SendGrid    │   │   ┌──────────────────┐                             ││
│  │  • Slack       │   │   │ Transform Data   │                             ││
│  │  • Twilio      │   │   │ Extract fields   │                             ││
│  │  • QuickBooks  │   │   └────────┬─────────┘                             ││
│  └────────────────┘   │            │                                        ││
│                       │            ▼                                        ││
│                       │   ┌──────────────────┐     ┌──────────────────┐    ││
│                       │   │ Condition:       │─Yes→│ Create Order     │    ││
│                       │   │ Is valid?        │     │ in MonoPilot     │    ││
│                       │   └────────┬─────────┘     └────────┬─────────┘    ││
│                       │            │ No                     │              ││
│                       │            ▼                        │              ││
│                       │   ┌──────────────────┐              │              ││
│                       │   │ Send Email Alert │              │              ││
│                       │   │ to admin         │              │              ││
│                       │   └──────────────────┘              │              ││
│                       │                                     ▼              ││
│                       │                            ┌──────────────────┐    ││
│                       │                            │ HTTP Request:    │    ││
│                       │                            │ POST to Shopify  │    ││
│                       │                            │ (confirm order)  │    ││
│                       │                            └──────────────────┘    ││
│                       │                                                     ││
│                       └─────────────────────────────────────────────────────┘│
│                                                                                │
│  Selected Node: Condition - Is valid?                         [Node Settings]│
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Condition Settings                                                        │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Field: [order.total_____▼]                                                │ │
│  │ Operator: [Greater than ▼]                                                │ │
│  │ Value: [$0.00__________]                                                  │ │
│  │                                                                           │ │
│  │ ☑ Validate customer email exists                                         │ │
│  │ ☑ Check for duplicate order number                                       │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  [Delete Node]  [Duplicate Node]                       [Save Settings]       │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Node Configuration Panel (HTTP Request Example)

```
┌──────────────────────────────────────────┐
│  HTTP Request Node Settings     [X Close]│
├──────────────────────────────────────────┤
│                                          │
│  Request Configuration                   │
│                                          │
│  Method *                                │
│  ● POST                                  │
│  ○ GET    ○ PUT    ○ PATCH    ○ DELETE   │
│                                          │
│  URL *                                   │
│  [https://api.shopify.com/orders/____]   │
│  [confirm________________________]       │
│                                          │
│  Headers                                 │
│  [+ Add Header]                          │
│  ┌────────────────────────────────────┐  │
│  │ Content-Type: application/json     │  │
│  │ Authorization: Bearer {{api_key}}  │  │
│  │ X-Custom-Header: {{order_id}}      │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Body (JSON)                             │
│  ┌────────────────────────────────────┐  │
│  │ {                                  │  │
│  │   "order_id": "{{order_id}}",      │  │
│  │   "status": "confirmed",           │  │
│  │   "confirmed_at": "{{timestamp}}"  │  │
│  │ }                                  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Variables Available: {{order_id}},      │
│  {{customer_email}}, {{total}},          │
│  {{timestamp}}, {{api_key}}              │
│                                          │
│  Timeout: [30___] seconds                │
│                                          │
│  ☑ Retry on failure (3 attempts)         │
│  ☑ Follow redirects                      │
│                                          │
│  [Test Request]                          │
│                                          │
│  [Cancel]              [Save Settings]   │
│                                          │
└──────────────────────────────────────────┘
```

### Test Workflow Modal

```
┌──────────────────────────────────────────┐
│  Test Workflow Execution        [X Close]│
├──────────────────────────────────────────┤
│                                          │
│  Workflow: Shopify Order Sync            │
│                                          │
│  Test Data (JSON)                        │
│  ┌────────────────────────────────────┐  │
│  │ {                                  │  │
│  │   "event": "order.created",        │  │
│  │   "order_id": "TEST-001",          │  │
│  │   "customer_email": "test@ex.com", │  │
│  │   "total": 123.45,                 │  │
│  │   "items": [...]                   │  │
│  │ }                                  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Use Sample Data]  [Load from File]     │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Execution Progress                 │  │
│  ├────────────────────────────────────┤  │
│  │ ✓ Trigger received                 │  │
│  │ ✓ Transform data (0.5s)            │  │
│  │ ✓ Condition passed (is valid)      │  │
│  │ ✓ Created order ORD-TEST-001 (1.2s)│  │
│  │ 🔄 HTTP request to Shopify...       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Cancel Test]                           │
│                                          │
└──────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Custom Integrations                                    [+ New Integration]  │
├─────────────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │
│  Loading custom integrations...                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Custom Integrations                                    [+ New Integration]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [🔧 Icon]                                            │
│                    No Custom Integrations Created                             │
│       Build custom workflows using our visual drag-drop builder.             │
│       Connect webhooks, APIs, databases, and external services without code. │
│                                                                               │
│                       [+ New Integration]                                     │
│                                                                               │
│       View Integration Examples  |  Watch Tutorial Video                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Custom Integrations                                    [+ New Integration]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                             │
│                    Failed to Load Workflows                                   │
│        Unable to retrieve custom integrations. Check your connection.        │
│                    Error: WORKFLOWS_FETCH_FAILED                              │
│                       [Retry]  [Contact Support]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Workflow List Table** - Name, Trigger type, Actions count, Status (Active/Paused/Error), Last Run, Actions menu
2. **Search/Filter Bar** - Text search (name, description), status filter, sort (Modified, Name, Last Run)
3. **New Integration Button** - Primary CTA, opens workflow editor
4. **Visual Canvas** - Drag-drop workflow builder (nodes + connections)
5. **Toolbox Panel** - Categorized node types (Triggers, Actions, Integrations)
6. **Node Settings Panel** - Dynamic form based on node type (HTTP, Database, Email, etc.)
7. **Test Workflow Modal** - Test data input, execution progress, results display
8. **Status Badges** - ✓ Active (green), ⏸ Paused (gray), ⚠️ Error (red), 🔄 Running (blue)
9. **Connection Lines** - Visual arrows between nodes (solid = success path, dashed = error path)

---

## Node Types

### Triggers (Start Workflow):
- **Webhook**: Receives HTTP POST requests (generates unique URL)
- **Schedule**: Cron-based scheduling (daily, hourly, custom cron)
- **Database**: Triggers on database events (INSERT, UPDATE, DELETE)
- **Email**: Triggers when email received (via IMAP/Gmail API)
- **Manual**: Button click in MonoPilot UI

### Actions (Process Data):
- **HTTP Request**: Send GET/POST/PUT/PATCH/DELETE to external API
- **Database Query**: Read/write from MonoPilot or external database
- **Email**: Send email via SMTP/SendGrid/Mailgun
- **Transform**: Map/filter/aggregate data (JavaScript expressions)
- **Condition**: IF/THEN/ELSE branching (compare values, check existence)
- **Loop**: Iterate over arrays (foreach item)
- **Delay**: Wait X seconds/minutes before next action

### Pre-built Integrations:
- **Shopify**: Create/update orders, products, customers
- **Stripe**: Process payments, create invoices
- **SendGrid**: Send transactional emails
- **Slack**: Post messages to channels
- **Twilio**: Send SMS notifications
- **QuickBooks**: Sync invoices, payments
- **Google Sheets**: Read/write spreadsheet data

---

## Main Actions

### Primary
- **[+ New Integration]** - Opens visual workflow editor (blank canvas)
- **[Save]** - Saves workflow (validates nodes + connections)
- **[Test]** - Opens test modal (run workflow with sample data)

### Secondary (Workflow List)
- **Edit Workflow** - Opens visual editor for existing workflow
- **Duplicate Workflow** - Creates copy of workflow
- **Test Run** - Manually triggers workflow (opens test modal)
- **View Execution Logs** - Opens INT-003 filtered to this workflow
- **Pause/Resume** - Toggles workflow active status
- **Delete Workflow** - Confirmation → deletes workflow (archives execution logs)

### Canvas Actions
- **Drag Node** - Drag from toolbox to canvas (creates new node)
- **Connect Nodes** - Click node output → click node input (creates connection)
- **Select Node** - Click node (opens settings panel)
- **Delete Node** - Select node → [Delete Node] button or Delete key
- **Duplicate Node** - Select node → [Duplicate Node] button
- **Zoom/Pan** - Mouse wheel zoom, drag canvas to pan

---

## States

- **Loading**: Skeleton workflow rows, "Loading custom integrations..." text
- **Empty**: "No custom integrations created" message, "New Integration" CTA + examples/tutorial links
- **Error**: "Failed to load workflows" warning, error code, Retry + Contact Support
- **Success**: Workflow list table with active/paused/error workflows
- **Editing**: Visual canvas with nodes and connections
- **Testing**: Modal with execution progress, live updates
- **Running**: Status badge shows "Running" + progress indicator
- **Completed**: Status badge shows "Success" or "Error" + last run time

---

## Data Fields

**Workflows**:
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Workflow ID |
| name | string | Workflow name |
| description | text | Optional description |
| trigger_type | enum | webhook, schedule, database, email, manual |
| trigger_config | jsonb | Trigger-specific settings (webhook URL, cron, etc.) |
| nodes | jsonb | Array of node objects (type, config, position) |
| connections | jsonb | Array of connection objects (from_node, to_node) |
| status | enum | active, paused, error |
| last_run_at | timestamp | Last execution time |
| last_run_status | enum | success, error, running |
| error_message | text | Last error message (if failed) |

**Execution Logs**:
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Execution ID |
| workflow_id | uuid | Workflow reference |
| trigger_data | jsonb | Input data that triggered workflow |
| started_at | timestamp | Execution start time |
| completed_at | timestamp | Execution end time |
| status | enum | success, error, running |
| nodes_executed | jsonb | Array of node execution results (node_id, duration, status, output) |
| error_node_id | uuid | Node where error occurred (if failed) |
| error_message | text | Error details (if failed) |

---

## Workflow Execution

**Execution Flow**:
1. Trigger receives event (webhook, schedule, database, etc.)
2. Extract trigger data (payload, timestamp, source)
3. Execute nodes in order (following connections)
4. Pass output from one node as input to next node
5. Handle conditions (branch to different paths)
6. Handle loops (iterate over arrays)
7. Log each node execution (duration, status, output)
8. Complete workflow (success or error)

**Error Handling**:
- **Node Fails**: Stop workflow, log error, mark workflow as failed
- **Retry Logic**: Some nodes (HTTP, Email) auto-retry 3 times
- **Error Paths**: Condition nodes can have error branches (fallback actions)

---

## Validation

- **Workflow Name**: Required (max 100 chars)
- **Nodes**: At least 1 trigger + 1 action required
- **Connections**: All nodes must be connected (no orphaned nodes)
- **Node Config**: Required fields validated per node type (e.g., URL for HTTP request)
- **Circular Dependencies**: Detect and prevent infinite loops

---

## Accessibility

- **Touch targets**: All nodes/buttons >= 48x48dp
- **Contrast**: Node colors pass WCAG AA
- **Screen reader**: Workflow row announces "Workflow: {name}, Trigger: {trigger_type}, {actions_count} actions, Status: {status}, Last run: {time}"
- **Keyboard**: Arrow keys to navigate nodes, Tab to select, Enter to edit
- **Zoom**: Keyboard shortcuts (Ctrl+Plus, Ctrl+Minus)
- **Canvas Pan**: Arrow keys to pan canvas

---

## Related Screens

- **INT-001**: Integrations Dashboard (Custom Integrations card)
- **INT-003**: Integration Logs (View Execution Logs)
- **INT-010**: Retry Logic & DLQ (failed workflow executions)

---

## Technical Notes

- **RLS**: Workflows filtered by `org_id`
- **API**:
  - `GET /api/integrations/workflows?status={status}&search={query}&sort={field}`
  - `POST /api/integrations/workflows` (create workflow)
  - `GET /api/integrations/workflows/{id}` (get workflow)
  - `PATCH /api/integrations/workflows/{id}` (update workflow)
  - `DELETE /api/integrations/workflows/{id}` (delete workflow)
  - `POST /api/integrations/workflows/{id}/test` (test run)
  - `POST /api/integrations/workflows/{id}/execute` (manual trigger)
  - `PATCH /api/integrations/workflows/{id}/status` (pause/resume)
  - `GET /api/integrations/workflows/{id}/executions?limit={N}` (execution logs)
- **Canvas Library**: React Flow (or similar drag-drop library)
- **Execution Engine**: BullMQ/Supabase Edge Functions for async execution
- **Node Execution**: Isolated sandboxes (prevent cross-contamination)
- **Variable Interpolation**: Mustache-style `{{variable_name}}` syntax
- **JavaScript Sandbox**: vm2 or isolated-vm for custom transform logic
- **Webhook URLs**: `https://api.monopilot.com/webhooks/{workflow_id}/{token}`
- **Real-time**: WebSocket updates for execution progress
- **Timeout**: Workflow max execution time 5 minutes (prevent runaway loops)

---

**Status**: Draft - Ready for Review
