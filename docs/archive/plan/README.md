# Plans Directory - MonoPilot

This directory contains implementation plans for features in MonoPilot.

## Quick Links

- **[ONE-SHOT PROMPT](_ONE_SHOT_PROMPT.md)** - Quick plan generation with Cursor
- **[GENERAL RULES](GENERAL_RULES.md)** - Comprehensive development guidelines
- **[Template](_template-plan-standard.md)** - Full plan template
- **[Example](000--PLAN--example--p0.md)** - Example of completed plan

---

## Overview

Plans are **blueprints** for development work. Each plan describes **what** to build, **why**, and **how** to verify it's done correctly - but **without actual code**.

### Key Principles

- 📝 **Plan ≠ Code** - Plans describe requirements, not implementation
- ⚡ **Short Tasks** - Max 3 days per plan
- 🧪 **Tests First** - Define tests before writing code
- 🔒 **RLS Always ON** - Security is non-negotiable
- 🎨 **Filament-style UI** - Consistent patterns across the app
- ✅ **DoD Required** - Clear success criteria

---

## Quick Start

### Option 1: One-Shot Prompt (Recommended) ⚡

1. Open `_ONE_SHOT_PROMPT.md`
2. Fill in the INPUT section:
   ```yaml
   plan_number: 003
   title_one_liner: Work Orders - Made/Progress columns
   task_5_sentences: |
     Dodaj kolumny Made i Progress...
     (5 sentences describing the task)
   module: PROD
   priority: P0
   ```
3. Run in Cursor Plan Mode
4. Plan is automatically generated and saved

### Option 2: Manual Creation

1. Copy `_template-plan-standard.md`
2. Rename to `NNN--module--slug--pX.md`
3. Fill in all sections
4. Save in `docs/plan/`

---

## File Naming Convention

```
NNN--MODULE--slug-description--pX.md
```

**Components:**
- `NNN` - Sequential number (001, 002, 003...)
- `MODULE` - PLAN|TECH|PROD|WH|SCN|QA|SET
- `slug` - Short kebab-case (max 6 words)
- `pX` - Priority (p0, p1, p2)

**Examples:**
```
001--PLAN--wo-made-progress--p0.md
002--SET--routing-dictionary-crud--p0.md
003--TECH--bom-versioning-ui--p1.md
015--PROD--yield-dashboard-mvp--p2.md
```

---

## Modules

| Code | Name | Description |
|------|------|-------------|
| `PLAN` | Planning | Demand, forecasting, planning |
| `TECH` | Technical | BOM, routing, products |
| `PROD` | Production | Work orders, yield, output |
| `WH` | Warehouse | GRN, stock, license plates |
| `SCN` | Scanner | Terminal/scanner UI |
| `QA` | Quality | Quality control |
| `SET` | Settings | Configuration, dictionaries |

---

## Priorities

| Priority | Meaning | When to Use |
|----------|---------|-------------|
| `P0` | Critical | Blocks other work, must have now |
| `P1` | Important | Should have soon, high value |
| `P2` | Nice to have | Could wait, nice to have |

---

## Plan Structure

Every plan includes these sections:

1. **Front-matter** (YAML) - Metadata
2. **Brief** (5 sentences) - What and why
3. **Constraints** - Rules to follow
4. **Notes** - Additional context
5. **Impact Analysis** - What changes
6. **File Plan** - Which files to modify
7. **DB & RLS** - Database changes
8. **Contracts** - API & types
9. **Algorithm** - How it works
10. **Tests First** - Test scenarios
11. **DoD** - Success criteria
12. **Risks** - What could go wrong
13. **Links** - References

---

## Workflow

```
┌─────────────┐
│ Plan Mode   │ Create plan in docs/plan/
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Review      │ Verify plan is complete
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Execute     │ Implement according to plan
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Test        │ Run tests (DoD)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ PR & Review │ Code review & merge
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Deploy      │ Ship to production
└─────────────┘
```

---

## Writing Good Plans

### ✅ Do

- Be specific and actionable
- Include real file paths
- Define clear success criteria (DoD)
- Cover edge cases
- Write 5 concise sentences for Brief
- Use Conventional Commits format

### ❌ Don't

- Write vague requirements
- Skip edge cases
- Forget about RLS policies
- Mix multiple features in one plan
- Write implementation code in the plan
- Create plans longer than 3 days

---

## The Brief (Most Important!)

The Brief is **5 sentences** that define the task:

1. **What** are we building?
2. **Why** do we need it?
3. **How** will it work (high level)?
4. **What** are the constraints?
5. **What's** the success criteria?

**Example:**
```
Dodaj widoczne w liście WO kolumny Made i Progress.
Progress licz jako procent wykonania względem planned_qty.
Agreguj dane z production_outputs po wo_id z uwzględnieniem RLS.
Nie zmieniaj schematu DB w tej iteracji.
Zapewnij testy i DoD zgodnie ze standardem.
```

---

## Default Constraints

Every plan automatically includes:

- ✅ RLS ON dla wszystkich tabel
- ✅ UI w stylu Filament (Create/Edit/List)
- ✅ Plan bez kodu (only contracts & steps)
- ✅ Conventional Commits w PR
- ✅ Realne ścieżki plików
- ✅ TypeScript strict mode
- ✅ Error handling + loading states

Add task-specific constraints on top of these.

---

## Plan Status Values

| Status | Meaning |
|--------|---------|
| `draft` | Plan is being written |
| `ready` | Ready for implementation |
| `in-progress` | Implementation started |
| `testing` | Testing in progress |
| `review` | In code review |
| `completed` | Merged and deployed |
| `cancelled` | No longer needed |
| `blocked` | Waiting for dependency |

Update status in front-matter as work progresses.

---

## Examples by Complexity

### Simple (1 day)
```
001--SET--add-operation-names--p0.md
- Single table CRUD
- Basic UI
```

### Medium (2 days)
```
003--PROD--wo-progress-columns--p0.md
- Multiple components
- Aggregation logic
- Tests
```

### Complex (split into P0/P1/P2)
```
015a--TECH--routing-machine-id--p0.md      # Core
015b--TECH--routing-yield-track--p1.md     # Enhancement
015c--TECH--routing-reports--p2.md         # Nice-to-have
```

---

## Front-matter Template

```yaml
---
id: <NNN>
title: <Short title>
module: <PLAN|TECH|PROD|WH|SCN|QA|SET>
priority: <P0|P1|P2>
owner: @mariusz
status: draft
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags: [auto, rls-on, next15, supabase, filament-style]
---
```

---

## Conventional Commits

All commits must follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code change (no functionality change)
- `test` - Adding tests
- `docs` - Documentation
- `chore` - Maintenance

**Example:**
```
feat(routing): add machine_id and expected_yield to operations

- Added machine_id field to routing_operations table
- Added expected_yield_pct with 0-100 range validation
- Updated RoutingBuilder UI with machine selector
- Added RoutingOperationNamesAPI for dictionary

Closes #015
```

---

## DoD Checklist

Task is done when:

- [ ] All tests pass (unit + integration + UI)
- [ ] TypeScript compiles without errors
- [ ] Linter passes without errors
- [ ] RLS policies work and are tested
- [ ] UI is Filament-style consistent
- [ ] Edge cases are handled
- [ ] Commits use Conventional Commits
- [ ] Migrations have UP and DOWN
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Toast notifications for user actions

---

## Directory Structure

```
docs/plan/
├── README.md                    # This file
├── GENERAL_RULES.md            # Comprehensive guidelines
├── _ONE_SHOT_PROMPT.md         # Quick plan generation
├── _template-plan-standard.md  # Full template
├── 000--PLAN--example--p0.md   # Example plan
├── 001--SET--...--p0.md        # Your plans
├── 002--TECH--...--p1.md
└── 003--PROD--...--p0.md
```

---

## Related Documentation

- **[GENERAL_RULES.md](GENERAL_RULES.md)** - Complete development guidelines
- **[_ONE_SHOT_PROMPT.md](_ONE_SHOT_PROMPT.md)** - Quick plan generation
- **[_template-plan-standard.md](_template-plan-standard.md)** - Plan template
- **[000--PLAN--example--p0.md](000--PLAN--example--p0.md)** - Example

---

## Tips

### For Plan Authors

1. **Start with Brief** - 5 sentences define everything
2. **Be specific** - Use real file paths and names
3. **Think tests first** - What proves it works?
4. **Cover edge cases** - What could go wrong?
5. **Keep it short** - Max 3 days of work

### For Implementers

1. **Read the entire plan** before starting
2. **Follow the File Plan** - it's your roadmap
3. **Write tests first** - as specified in plan
4. **Verify DoD** before marking complete
5. **Use Conventional Commits** throughout

---

## Questions?

**How to structure a plan?**
→ See templates and example plan

**What to include?**
→ Check GENERAL_RULES.md

**How to assign priority?**
→ P0 = blocks work, P1 = important, P2 = nice-to-have

**Which module for my task?**
→ See module descriptions above

**How to generate plan quickly?**
→ Use _ONE_SHOT_PROMPT.md with Cursor

---

**Remember:** A good plan saves time during implementation. Take 30 minutes to plan, save 3 hours debugging! 🎯
