# Agent Handoffs - Epic 01 Settings v2

**Purpose:** Ready-to-use prompts for agents rebuilding Settings module
**Epic:** 01 - Settings
**Total Screens:** 33 wireframes (SET-001 to SET-031)
**Migration Strategy:** Parallel Build → Atomic Swap

---

## 📋 HANDOFF INDEX

### **Phase 1: FOUNDATION (Start Here)**
```
00-FOUNDATION-shared-components.yaml
├─ Create 9 shared components
├─ Blocks: ALL other work
├─ Effort: 6-8 hours
└─ Priority: CRITICAL
```

### **Phase 2: CRITICAL REWRITES (Do These Early)**
```
01-CRITICAL-locations-tree-rewrite.yaml
├─ Locations: Flat table → Tree view
├─ Effort: 14-16 hours
├─ Priority: HIGHEST
└─ Validates: Parallel build approach

02-CRITICAL-allergens-custom-rewrite.yaml
├─ Allergens: Read-only → Custom CRUD + Multi-language
├─ Effort: 10-12 hours
├─ Priority: HIGHEST
└─ Compliance: FR-SET-071, FR-SET-072

03-CRITICAL-tax-codes-effective-dates.yaml
├─ Tax Codes: Add effective_from/to + expiration tracking
├─ Effort: 8-10 hours
├─ Priority: HIGH
└─ Compliance: FR-SET-083
```

### **Phase 3: CORE REFACTORS**
```
04-users-actions-menu.yaml
├─ Users: Add actions menu [⋮] + 10 PRD roles
├─ Effort: 8-10 hours
└─ Keep: Tabs (good v1 addition)

05-machines-2nd-row-maintenance.yaml
├─ Machines: Add 2nd row + maintenance actions
├─ Effort: 8-10 hours
└─ Priority: MEDIUM

06-production-lines-machine-flow.yaml
├─ Production Lines: Add machine flow 2nd row
├─ Effort: 8-10 hours
└─ Priority: MEDIUM

07-warehouses-activity-log.yaml (TODO)
├─ Warehouses: Add activity log panel
├─ Effort: 3-4 hours
└─ Priority: LOW (85% already compliant)

08-modules-grouped-sections.yaml (TODO)
├─ Modules: Grid → Grouped sections (Core/Premium/New)
├─ Effort: 8-10 hours
└─ Priority: MEDIUM

09-organization-verify.yaml (TODO)
├─ Organization: Verify OrganizationForm compliance
├─ Effort: 2-4 hours
└─ Priority: LOW (90% compliant)
```

### **Phase 4: NEW SCREENS (Build from Scratch)**
```
10-roles-permissions-matrix.yaml (TODO)
├─ SET-011: Roles & Permissions matrix (10×11)
├─ Effort: 6-8 hours
└─ Priority: MEDIUM

11-api-keys.yaml (TODO)
├─ SET-023: API Keys management
├─ Effort: 6-8 hours
└─ Priority: MEDIUM

12-webhooks.yaml (TODO)
├─ SET-024: Webhooks management
├─ Effort: 8-10 hours
└─ Priority: MEDIUM

13-audit-logs.yaml (TODO)
├─ SET-025: Audit logs viewer
├─ Effort: 8-10 hours
└─ Priority: MEDIUM

14-security-settings.yaml (TODO)
├─ SET-026: Security settings
├─ Effort: 6-8 hours
└─ Priority: MEDIUM

15-notifications.yaml (TODO)
├─ SET-027: Notification preferences
├─ Effort: 4-6 hours
└─ Priority: LOW

16-billing.yaml (TODO)
├─ SET-028: Subscription & billing
├─ Effort: 8-10 hours
└─ Priority: MEDIUM

17-import-export.yaml (TODO)
├─ SET-029: Import/export wizard
├─ Effort: 8-10 hours
└─ Priority: MEDIUM

18-sessions.yaml (TODO)
├─ SET-030: Session management
├─ Effort: 4-6 hours
└─ Priority: LOW

19-password-settings.yaml (TODO)
├─ SET-031: Password settings
├─ Effort: 4-6 hours
└─ Priority: LOW
```

### **Phase 5: VERIFY EXISTING**
```
20-onboarding-verify.yaml (TODO)
├─ SET-001 to SET-006: Verify OnboardingWizard
├─ Effort: 4-6 hours
└─ Priority: LOW (verify last)
```

---

## 🎯 EXECUTION ORDER

### **Recommended Sequence:**

```
Day 1:
  └─ 00-FOUNDATION (shared components)

Day 2-3:
  └─ 01-CRITICAL (Locations tree) ← Hardest first!

Day 4:
  └─ 02-CRITICAL (Allergens custom)

Day 5:
  └─ 03-CRITICAL (Tax codes dates)

Day 6:
  ├─ 04-users (actions menu)
  └─ 07-warehouses (migrate + activity log)

Day 7:
  ├─ 05-machines (2nd row)
  └─ 06-production-lines (flow viz)

Day 8:
  ├─ 08-modules (grouped sections)
  └─ 09-organization (verify)

Day 9-12:
  └─ 10-19 (NEW SCREENS - can parallelize)

Day 13:
  └─ 20-onboarding (verify)

Day 14-15:
  └─ Integration + Testing + Swap
```

### **Parallel Execution (if 2-3 agents):**

```
Agent A: Critical Path
├─ 00-FOUNDATION
├─ 01-locations
├─ 02-allergens
└─ 03-tax-codes

Agent B: Core Refactors
├─ 04-users
├─ 05-machines
├─ 06-production-lines
└─ 07-warehouses

Agent C: New Screens (batch 1)
├─ 10-roles-permissions
├─ 11-api-keys
├─ 12-webhooks
└─ 13-audit-logs

Agent D: New Screens (batch 2)
├─ 14-security
├─ 15-notifications
├─ 16-billing
└─ 17-import-export
```

---

## 🛡️ UNIVERSAL RULES (All Agents)

### **Isolation Rules:**
```yaml
✅ ALLOWED:
  - Read wireframes (SET-*.md)
  - Use services (lib/services/)
  - Update schemas (lib/validation/)
  - Create in settings-v2/
  - Reference v1 FOR LOGIC ONLY

❌ FORBIDDEN:
  - Edit app/(authenticated)/settings/ (v1)
  - Edit components/settings/ (v1)
  - Import from v1 paths
  - Copy-paste v1 UI code
```

### **Verification (Run After Each Screen):**
```bash
# 1. Import audit
grep -r "from '@/app/(authenticated)/settings/'" apps/frontend/app/\(authenticated\)/settings-v2/

# 2. TypeScript check
cd apps/frontend && npx tsc --noEmit

# 3. Isolation check
bash scripts/check-settings-v2-isolation.sh
```

---

## 📊 PROGRESS TRACKING

### **Completion Checklist:**
```
☐ 00: Foundation (shared components)
☐ 01: Locations tree
☐ 02: Allergens custom
☐ 03: Tax codes dates
☐ 04: Users actions menu
☐ 05: Machines 2nd row
☐ 06: Production lines flow
☐ 07: Warehouses activity log
☐ 08: Modules grouped
☐ 09: Organization verify
☐ 10: Roles & permissions
☐ 11: API keys
☐ 12: Webhooks
☐ 13: Audit logs
☐ 14: Security
☐ 15: Notifications
☐ 16: Billing
☐ 17: Import/export
☐ 18: Sessions
☐ 19: Password
☐ 20: Onboarding verify

Progress: 0/20 (0%)
```

---

## 🚀 HOW TO USE THESE HANDOFFS

### **For Orchestrator Agent:**

```yaml
# Example: Launch Locations tree build

agent: frontend-dev
handoff_file: docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/01-CRITICAL-locations-tree-rewrite.yaml
instruction: |
  Read the handoff file completely.
  Follow all requirements exactly.
  Build in settings-v2/ directory only.
  Do not import from v1 code.
  Verify isolation after completion.
```

### **For Human Developer:**

```bash
# 1. Read handoff file
cat docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/01-CRITICAL-locations-tree-rewrite.yaml

# 2. Copy to Claude Code
# Paste entire YAML content as context

# 3. Instruct agent
"Build Locations tree view according to handoff file 01-CRITICAL-locations-tree-rewrite.yaml"

# 4. Verify
bash scripts/check-settings-v2-isolation.sh
```

---

## 📝 HANDOFF FILE FORMAT

Each handoff contains:
- **Agent type** (frontend-dev, backend-dev)
- **Context** (wireframes, stories, migration plan)
- **Architecture** (new vs old, what changed)
- **Output files** (complete list)
- **Requirements** (detailed specs)
- **Reusable assets** (services, schemas, components)
- **Isolation rules** (allowed/forbidden)
- **Acceptance criteria** (checklist)
- **Testing** (manual test cases)
- **Effort estimate** (hours)

---

## 🎯 SUCCESS CRITERIA

**All handoffs complete when:**
- ✅ All 33 wireframes have corresponding screens
- ✅ Zero imports from v1 code (verified)
- ✅ All critical rewrites done (Locations, Allergens, Tax Codes)
- ✅ 10 new screens built (SET-023 to SET-031, SET-011)
- ✅ TypeScript compiles
- ✅ Ready for atomic swap

---

**Created:** 2025-12-23
**Status:** Phase 0 Complete, Ready for Agents
**Next:** Launch 00-FOUNDATION-shared-components.yaml
