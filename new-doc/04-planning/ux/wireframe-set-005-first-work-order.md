# Wireframe: SET-005 - First Work Order Creation (Onboarding Step 5/6)

**Status:** Draft
**Created:** 2025-12-11
**Feature:** FR-SET-185
**Context:** Onboarding wizard - demonstrate work order creation using product from step 4

---

## ASCII Wireframe

```
┌─────────────────────────────────────────────┐
│ MonoPilot Setup Wizard            [5 of 6] │
├─────────────────────────────────────────────┤
│                                             │
│  ●━━●━━●━━●━━●━○  Profile│Warehouse│        │
│                   Location│Product│WO│Done  │
│                                             │
│  Create Your First Work Order (Optional)    │
│  ─────────────────────────────────────────  │
│                                             │
│  Work orders drive production. Let's       │
│  create a demo WO for "Whole Wheat Bread"   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Product                             │   │
│  │ Whole Wheat Bread              ✓    │   │
│  │ Created in previous step            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Quantity to Produce *                      │
│  ┌─────────────────────────────────────┐   │
│  │ 100                            units│   │
│  └─────────────────────────────────────┘   │
│  ⓘ How many units to produce                │
│                                             │
│  Due Date *                                 │
│  ┌─────────────────────────────────────┐   │
│  │ Tomorrow (2025-12-12)          📅   │   │
│  └─────────────────────────────────────┘   │
│  ⓘ When production should complete          │
│                                             │
│  Priority                                   │
│  ┌─────────────────────────────────────┐   │
│  │ Normal                         ▼    │   │
│  └─────────────────────────────────────┘   │
│  ⓘ Work orders start as Draft until         │
│    scheduled by production manager          │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ Create Demo Work Order         [48px]│ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ Skip - I'll Create WOs Later   [48px]│ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Key Components

| Component | Type | Notes |
|-----------|------|-------|
| Progress indicator | Stepper (5 of 6) | Steps 1-5 filled, step 6 empty |
| Product confirmation | Read-only field | Shows product from step 4 with checkmark |
| Quantity input | Number input | Default: 100, min: 1 |
| Due date picker | Date input | Default: Tomorrow, min: Today |
| Priority dropdown | Select | Options: Low, Normal, High (default: Normal) |
| Create button | Primary CTA | 48px height, full-width mobile |
| Skip button | Secondary | 48px height, full-width mobile |
| Tooltips | Info icons (ⓘ) | Explain each field |

---

## Main Actions

1. **Create Demo WO**: Creates work order with status "Draft", advances to step 6
2. **Skip**: Advances to step 6 without creating WO
3. **Edit quantity**: Update production quantity (validates min 1)
4. **Change due date**: Select date (validates not in past)
5. **Change priority**: Select from dropdown (Low/Normal/High)

---

## 4 States

- **Loading**: Skeleton for form fields + "Loading product..." text
- **Empty**: "No product created yet. Create a product first to demo work orders." + [Skip to Finish] button disabled Create button
- **Error**: "Failed to create work order: [reason]" + [Retry] button + red border on failed field
- **Success**: Green checkmark + "Work order WO-001 created (Draft status)" + auto-advance to step 6 after 2s

---

## Responsive Breakpoints

- **Mobile (<768px)**: Single column, full-width inputs, stacked buttons (48px height)
- **Tablet (768-1024px)**: Same as mobile
- **Desktop (>1024px)**: Max-width 600px centered, side-by-side buttons

---

## Accessibility Notes

- Touch targets: 48px minimum (mobile-first)
- Auto-focus on quantity field
- Tab order: Quantity → Due Date → Priority → Create → Skip
- ARIA labels: "Quantity to produce", "Production due date", "Work order priority"
- Tooltips triggered by keyboard (Shift+?) and hover

---

## Conditional Logic

| Condition | Behavior |
|-----------|----------|
| No product in step 4 | Show empty state, disable Create button |
| Product exists | Enable Create button, pre-fill product name |
| Quantity < 1 | Show error "Quantity must be at least 1" |
| Due date in past | Show error "Due date cannot be in the past" |
| Create clicked | POST to /api/planning/work-orders, advance on 201 |
| Skip clicked | Advance to step 6, no WO created |

---

## Next Steps After Approval

- Handoff to FRONTEND-DEV
- Create Zod schema for WO creation (quantity, due_date, priority)
- API endpoint: POST /api/planning/work-orders (use existing or create simple version)
- Update wizard progress to step 6 in database

---

_Approval Required: Please review and approve this wireframe before handoff._
