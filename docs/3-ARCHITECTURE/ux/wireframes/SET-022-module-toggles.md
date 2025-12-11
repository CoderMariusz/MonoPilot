# SET-022: Module Toggles

**Module**: Settings
**Feature**: Module Activation/Deactivation
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Modules                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Configure which modules are active for your organization.            │
│  Disabled modules are hidden from navigation and inaccessible.        │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ CORE MODULES                                    [Expand All ▼] │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 📋 Technical                                        [ON  ●──] │   │
│  │    Products, BOMs, Routings, Allergens, Traceability          │   │
│  │    Required for: Planning, NPD                         Free   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 📅 Planning                                         [ON  ●──] │   │
│  │    Purchase Orders, Transfer Orders, Work Orders, MRP         │   │
│  │    Requires: Technical                                 Free   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 🏭 Production                                       [ON  ●──] │   │
│  │    Work Order Execution, Material Consumption, Outputs        │   │
│  │    Requires: Planning, Warehouse                       Free   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 📦 Warehouse                                        [ON  ●──] │   │
│  │    License Plates, ASN/GRN, Stock, FIFO/FEFO, Locations      │   │
│  │    Requires: Technical                                 Free   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ ✅ Quality                                          [OFF ──●] │   │
│  │    QA Status, Holds, Inspections, NCR, HACCP, CAPA            │   │
│  │    Requires: Warehouse                                 Free   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 🚚 Shipping                                         [OFF ──●] │   │
│  │    Sales Orders, Picking, Packing, Carriers, GS1 Labels       │   │
│  │    Requires: Warehouse, Quality                        Free   │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ PREMIUM MODULES                                 [Expand All ▼] │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 🧪 NPD (New Product Development)           [🔒 UPGRADE] [OFF] │   │
│  │    Stage-Gate Workflow, Trial BOMs, Sample Management         │   │
│  │    Requires: Technical                          $50/user/mo   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 💰 Finance                                     [🔒 UPGRADE] [OFF] │   │
│  │    Production Costing, Variance, Margins (not full ERP)       │   │
│  │    Requires: Production, Warehouse              $50/user/mo   │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ NEW MODULES                                     [Expand All ▼] │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 📊 OEE (Overall Equipment Effectiveness)   [🔒 UPGRADE] [OFF] │   │
│  │    Real-time OEE, Machine Dashboard, Downtime, Energy         │   │
│  │    Requires: Production                         $50/user/mo   │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 🔗 Integrations                                [🔒 UPGRADE] [OFF] │   │
│  │    Comarch Optima, EDI, Portals, Webhooks, API Access         │   │
│  │    Requires: None                               $50/user/mo   │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Module Status: 4 enabled, 6 disabled                                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Interactions:
- Click toggle: Enables/disables module (validation check for dependencies)
- Click module row: Expands detail panel (features included in this module)
- Click [🔒 UPGRADE]: Opens subscription upgrade modal
- Hover over module: Shows tooltip with dependency chain
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Modules                                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Configure which modules are active for your organization.            │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ CORE MODULES                                                  │   │
│  │ [████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]       │   │
│  │ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]       │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Loading module configuration...                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Modules                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                          [🧩 Icon]                                    │
│                   All Modules Disabled                                │
│     Enable at least one module to start using MonoPilot.              │
│       We recommend starting with Technical and Planning.              │
│                                                                       │
│                  [Enable Recommended Modules]                         │
│                                                                       │
│  Note: Settings module is always enabled and cannot be disabled.      │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Modules                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│              Failed to Load Module Configuration                      │
│      Unable to retrieve module status. Check your connection.         │
│                Error: MODULE_CONFIG_FETCH_FAILED                      │
│                                                                       │
│                       [Retry]  [Contact Support]                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Module Cards** - Icon, Name, Description (features), Dependencies (Requires: X), Price (Free/Premium), Toggle switch
2. **Module Groups** - Core Modules (6), Premium Modules (2), New Modules (2), collapsible sections
3. **Toggle Switch** - ON/OFF visual state, disabled for premium modules without subscription
4. **Premium Badge** - [🔒 UPGRADE] button, replaces toggle for locked modules, opens upgrade modal
5. **Dependency Indicator** - "Requires: X, Y" text, shows which modules must be enabled first
6. **Reverse Dependency** - "Required for: X" text, shows which modules depend on this one
7. **Status Summary** - "X enabled, Y disabled" footer text
8. **Expand All/Collapse** - Toggle for each group section
9. **Price Labels** - "Free" (green), "$50/user/mo" (blue/premium badge)
10. **Validation Warning Modal** - Appears when disabling module with active data or dependent modules enabled

---

## Main Actions

### Primary
- **Toggle Module ON** - Validation check (dependencies enabled?) → enable module → update navigation → show success toast
- **Toggle Module OFF** - Validation check (dependent modules disabled? active data?) → confirmation modal → disable module → update navigation → show success toast

### Secondary
- **[🔒 UPGRADE]** - Opens subscription upgrade modal (select plan, payment method, confirm)
- **[Enable Recommended Modules]** (Empty state) - Enables Technical + Planning modules simultaneously
- **Expand/Collapse Group** - Toggles visibility of module cards in each section

### Validation/Warnings
- **Disable with Active Data** - "This module has active data (e.g., 12 open work orders). Disabling will hide this data but not delete it. Continue?"
- **Dependency Conflict (Disable)** - "Production module requires Planning to be enabled. Disable Production first or keep Planning enabled."
- **Dependency Conflict (Enable)** - "Production module requires Planning and Warehouse. Enable those modules first or enable all dependencies automatically?"
- **Premium Module** - "This module requires a Premium subscription ($50/user/month). Upgrade now to unlock NPD features."

---

## States

- **Loading**: Skeleton cards (3), "Loading module configuration..." text
- **Empty**: "All modules disabled" message, "Enable recommended modules" CTA, note about Settings always enabled
- **Error**: "Failed to load module configuration" warning, Retry + Contact Support buttons
- **Success**: Module cards grouped by type (Core/Premium/New), toggles reflect current state, status summary shows counts

---

## Module Details

### Core Modules (Free)

| Module | Icon | Features | Dependencies | Price |
|--------|------|----------|--------------|-------|
| Technical | 📋 | Products, BOMs, Routings, Allergens, Traceability | None | Free |
| Planning | 📅 | Purchase Orders, Transfer Orders, Work Orders, MRP | Technical | Free |
| Production | 🏭 | WO Execution, Material Consumption, Outputs | Planning, Warehouse | Free |
| Warehouse | 📦 | License Plates, ASN/GRN, Stock, FIFO/FEFO | Technical | Free |
| Quality | ✅ | QA Status, Holds, Inspections, NCR, HACCP | Warehouse | Free |
| Shipping | 🚚 | Sales Orders, Picking, Packing, Carriers | Warehouse, Quality | Free |

### Premium Modules ($50/user/mo)

| Module | Icon | Features | Dependencies | Price |
|--------|------|----------|--------------|-------|
| NPD | 🧪 | Stage-Gate Workflow, Trial BOMs, Samples | Technical | $50/user/mo |
| Finance | 💰 | Production Costing, Variance, Margins | Production, Warehouse | $50/user/mo |

### New Modules ($50/user/mo)

| Module | Icon | Features | Dependencies | Price |
|--------|------|----------|--------------|-------|
| OEE | 📊 | Real-time OEE, Machine Dashboard, Downtime | Production | $50/user/mo |
| Integrations | 🔗 | Comarch Optima, EDI, Portals, Webhooks | None | $50/user/mo |

---

## Dependency Chain

```
Settings (always enabled)
    │
    ├── Technical ──────┬────> Planning ──────> Production ──────> OEE
    │                   │                            │
    │                   │                            └────> Finance
    │                   │
    │                   └────> NPD
    │
    └── Warehouse ──────┬────> Production (also requires Planning)
                        │
                        ├────> Quality ──────> Shipping
                        │
                        └────> Finance (also requires Production)

Integrations (no dependencies, connects to all)
```

---

## Permissions

| Role | Can View | Can Toggle Free Modules | Can Upgrade to Premium |
|------|----------|-------------------------|------------------------|
| Super Admin | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes |
| Manager | Yes | No | No |
| Operator | No | No | No |
| Viewer | No | No | No |

---

## Validation Rules

- **Enable Module**: Check dependencies enabled first → if not, show "Enable dependencies automatically?" prompt
- **Disable Module**: Check no dependent modules enabled → check no active data (or confirm) → disable
- **Premium Module Enable**: Check subscription active → if not, redirect to upgrade flow → after upgrade, enable module
- **Settings Module**: Cannot be disabled (always enabled, no toggle shown)
- **Dependency Auto-Enable**: If user confirms "Enable all dependencies", enable entire chain in correct order

---

## Accessibility

- **Touch targets**: All toggle switches >= 48x48dp, clickable module rows >= 48dp height
- **Contrast**: Toggle switches pass WCAG AA (ON: green bg + white text, OFF: gray bg + dark text)
- **Screen reader**: "Module: {name}, Status: {enabled/disabled}, Requires: {dependencies}, Price: {price}, {description}"
- **Keyboard**: Tab navigation, Space to toggle switch, Enter to expand module detail
- **Focus indicators**: Clear 2px outline on toggle switches and expand buttons
- **Color independence**: Icons + text labels (not color-only for status)

---

## Related Screens

- **Subscription Upgrade Modal**: Opens from [🔒 UPGRADE] button (select plan, payment method, billing cycle)
- **Dependency Confirmation Modal**: "Enable dependencies automatically?" (Yes/No, list of modules to enable)
- **Disable Warning Modal**: "Module has active data. Continue?" (Yes/Cancel, data impact explanation)
- **Module Detail Panel**: Expands inline when clicking module row (full feature list, settings link)

---

## Technical Notes

- **RLS**: Module configuration filtered by `org_id` automatically
- **API**: `GET /api/settings/modules` → returns all modules with status per org
- **API**: `PUT /api/settings/modules/:code` → body: `{enabled: true/false}` → validates dependencies → updates
- **Real-time**: Subscribe to module config updates via Supabase Realtime (multi-user editing)
- **Navigation Update**: After toggle, client refetches navigation config → updates sidebar within 500ms (no page reload)
- **Database**: `modules` table (id, code, name, description, icon, is_premium, price, dependencies[])
- **Database**: `org_modules` table (org_id, module_id, enabled, enabled_at, enabled_by)
- **Dependency Validation**: Recursive check on disable (find all modules with this module in dependencies array)
- **Active Data Check**: On disable, query relevant tables (e.g., Production disabled → check open work orders count)
- **Pricing**: Premium modules require active subscription → check `org_subscriptions.plan_type` (free/premium)

---

## User Flows

### Enable Free Module (Simple)
1. User toggles Production module ON
2. System checks dependencies (Planning: ON ✓, Warehouse: ON ✓)
3. Module enabled immediately
4. Navigation updates (Production menu appears)
5. Toast: "Production module enabled"

### Enable Free Module (Dependencies Missing)
1. User toggles Production module ON
2. System checks dependencies (Planning: OFF ✗, Warehouse: OFF ✗)
3. Modal: "Production requires Planning and Warehouse. Enable all dependencies?"
4. User clicks "Yes, Enable All"
5. System enables Planning → Warehouse → Production (in order)
6. Navigation updates (all 3 menus appear)
7. Toast: "Production, Planning, and Warehouse modules enabled"

### Disable Module (Has Active Data)
1. User toggles Planning module OFF
2. System finds 12 open work orders
3. Modal: "Planning has 12 open work orders. Disabling will hide them but not delete. Continue?"
4. User clicks "Yes, Disable"
5. Module disabled
6. Navigation updates (Planning menu hidden)
7. Toast: "Planning module disabled. Data preserved."

### Disable Module (Dependency Conflict)
1. User toggles Planning module OFF
2. System finds Production module enabled (requires Planning)
3. Modal: "Production requires Planning to be enabled. Disable Production first."
4. User clicks "Disable Production Too"
5. System disables Production → Planning (in reverse dependency order)
6. Navigation updates (both menus hidden)
7. Toast: "Planning and Production modules disabled"

### Enable Premium Module (No Subscription)
1. User clicks [🔒 UPGRADE] on NPD module
2. Subscription upgrade modal opens
3. User selects "Premium Plan - $50/user/month"
4. User enters payment method
5. User clicks "Upgrade Now"
6. Payment processed
7. NPD module toggle becomes available (unlocked)
8. User toggles NPD ON
9. Navigation updates (NPD menu appears)
10. Toast: "NPD module enabled. Welcome to Premium!"

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-022-module-toggles]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
