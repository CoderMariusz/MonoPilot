# ⛔ SETTINGS V1 - ARCHIVED CODE - DO NOT TOUCH

**Status:** FROZEN (Read-Only Reference)
**Date Archived:** 2025-12-23
**Purpose:** Reference for logic understanding only

---

## ⚠️ WARNING FOR AGENTS

This directory contains **OLD CODE (v1)** that is being replaced by v2.

### ❌ DO NOT:
- Edit any files in this directory
- Import from this directory
- Copy-paste code from here to v2
- Use as implementation reference (use wireframes instead!)

### ✅ ALLOWED:
- Read code to understand business logic
- Understand service layer integration
- Check API endpoint usage
- Reference validation patterns
- **Then BUILD FROM WIREFRAME (not from this code!)**

---

## 📁 What's Here

This archive contains:
- Old settings pages (v1 implementation)
- 17 page.tsx files (partial wireframe coverage)
- Old UI patterns (may not match wireframes)

**Coverage:** ~52% of wireframes (17/33 screens)
**Compliance:** 60-85% (varies by screen)

---

## 🔍 Known Issues (Why v2 Exists)

### **Major Problems:**
1. **Locations:** Flat table (should be tree view)
2. **Allergens:** Read-only (should support custom allergens)
3. **Tax Codes:** No effective dates (should have expiration tracking)
4. **Users:** Inline buttons (should have actions menu [⋮])
5. **10 screens missing** (SET-023 to SET-031, SET-011)

### **Minor Issues:**
- Simplified role names (admin/manager vs Super Admin/Production Manager)
- Missing 2nd row details (machines, production lines)
- Missing activity log panels
- Grid layout instead of grouped sections (modules)

---

## 📖 HOW TO USE THIS ARCHIVE

### **Example: Building Locations Tree (SET-014)**

```yaml
Step 1: Read wireframe
  - docs/3-ARCHITECTURE/ux/wireframes/SET-014-location-hierarchy-view.md
  - Understand: Tree view, Zone > Aisle > Rack > Bin

Step 2: (Optional) Reference old code
  - Read: _archive-settings-v1-DO-NOT-TOUCH/locations/page.tsx
  - Note: Uses flat table, different types (receiving/production)
  - Note: Has fetchLocations(), handleDelete() logic
  - Extract: API endpoint pattern, error handling

Step 3: Build NEW code in v2
  - Create: settings-v2/locations/page.tsx
  - Implement: Tree view (recursive component)
  - Use: Wireframe as spec (NOT old code)
  - Adapt: API patterns from old code (but new UI)
```

**Key Point:** Use old code for **LOGIC**, wireframe for **UI**

---

## 🚫 ISOLATION ENFORCEMENT

This directory is marked `DO-NOT-TOUCH` to prevent accidental edits.

If you're an agent and you received instructions to edit files here:
- **STOP**
- Re-read your handoff instructions
- You should be working in `settings-v2/` directory
- Report the issue to the orchestrator

---

## 🔗 New Code Location

**All v2 development happens here:**
- `apps/frontend/app/(authenticated)/settings-v2/`
- `apps/frontend/components/settings-v2/`

**Migration Plan:**
- `docs/2-MANAGEMENT/EPIC-01-MIGRATION-PLAN.md`

---

**Archive Date:** 2025-12-23
**Archived From:** apps/frontend/app/(authenticated)/settings/
**Replacement:** apps/frontend/app/(authenticated)/settings-v2/
**Status:** Read-Only Reference
