# Documentation Migration Plan

## Overview

Migration from flat docs/ structure to BMAD hierarchy.

---

## Phase 1: Architecture Migration

### Move docs/architecture/ to docs/1-BASELINE/architecture/

```bash
# Architecture index and modules
mv docs/architecture/index.md docs/1-BASELINE/architecture/architecture-overview.md
mv docs/architecture/modules/ docs/1-BASELINE/architecture/modules/

# Architecture patterns
mv docs/architecture/patterns/ docs/1-BASELINE/architecture/patterns/
```

---

## Phase 2: PRD Migration

### Move docs/prd/ to docs/1-BASELINE/product/

```bash
# PRD files (prd.md already exists in target)
mv docs/prd/index.md docs/1-BASELINE/product/prd-index.md
mv docs/prd/modules/ docs/1-BASELINE/product/modules/
```

---

## Phase 3: Reference Migration

### Move docs/reference/ to docs/1-BASELINE/reference/

```bash
mkdir -p docs/1-BASELINE/reference
mv docs/reference/code-architecture.md docs/1-BASELINE/reference/
mv docs/reference/database-schema.md docs/1-BASELINE/reference/
mv docs/reference/detailed-batch-breakdown.md docs/1-BASELINE/reference/
mv docs/reference/implementation-summary.md docs/1-BASELINE/reference/
mv docs/reference/index.md docs/1-BASELINE/reference/
mv docs/reference/rls-and-supabase-clients.md docs/1-BASELINE/reference/
mv docs/reference/shared-templates-library.md docs/1-BASELINE/reference/
mv docs/reference/template-library-index.md docs/1-BASELINE/reference/
mv docs/reference/template-system-guide.md docs/1-BASELINE/reference/
mv docs/reference/test-design-system.md docs/1-BASELINE/reference/
```

---

## Phase 4: Epics Migration

### Move docs/epics/ to docs/2-MANAGEMENT/epics/

```bash
# Completed epics (01-04 are done based on batch progress)
mkdir -p docs/2-MANAGEMENT/epics/completed
mv docs/epics/01-settings.md docs/2-MANAGEMENT/epics/completed/
mv docs/epics/02-technical.md docs/2-MANAGEMENT/epics/completed/
mv docs/epics/03-planning.md docs/2-MANAGEMENT/epics/completed/
mv docs/epics/04-production.md docs/2-MANAGEMENT/epics/completed/

# Current/future epics
mkdir -p docs/2-MANAGEMENT/epics/current
mv docs/epics/06-quality.md docs/2-MANAGEMENT/epics/current/
mv docs/epics/07-shipping.md docs/2-MANAGEMENT/epics/current/
mv docs/epics/08-npd.md docs/2-MANAGEMENT/epics/current/
mv docs/epics/09-performance-optimization.md docs/2-MANAGEMENT/epics/current/
```

---

## Phase 5: Sprint Artifacts Migration

### Move docs/sprint-artifacts/ to docs/2-MANAGEMENT/sprints/

```bash
mkdir -p docs/2-MANAGEMENT/sprints
mv docs/sprint-artifacts/sprint-status.yaml docs/2-MANAGEMENT/sprints/
mv docs/sprint-artifacts/epic-4-parallel-tracks.md docs/2-MANAGEMENT/sprints/
mv docs/sprint-artifacts/epic-5-track-breakdown.md docs/2-MANAGEMENT/sprints/
```

---

## Phase 6: Batches Migration

### Completed batches (Epic 1-3) to Archive

```bash
mkdir -p docs/5-ARCHIVE/batches/completed

# Epic 1 batches (completed)
mv docs/batches/01A-auth-users docs/5-ARCHIVE/batches/completed/
mv docs/batches/01B-infrastructure-config docs/5-ARCHIVE/batches/completed/
mv docs/batches/01C-master-data docs/5-ARCHIVE/batches/completed/
mv docs/batches/01D-dashboards-ux docs/5-ARCHIVE/batches/completed/
mv docs/batches/01E-ui-redesign docs/5-ARCHIVE/batches/completed/

# Epic 2 batches (completed)
mv docs/batches/02A-1-products-core docs/5-ARCHIVE/batches/completed/
mv docs/batches/02B-1-bom-core docs/5-ARCHIVE/batches/completed/
mv docs/batches/02B-2-bom-advanced docs/5-ARCHIVE/batches/completed/
mv docs/batches/02C-1-routing docs/5-ARCHIVE/batches/completed/
mv docs/batches/02D-1-traceability docs/5-ARCHIVE/batches/completed/
mv docs/batches/02E-1-dashboard-allergen docs/5-ARCHIVE/batches/completed/
mv docs/batches/02E-2-technical-ui docs/5-ARCHIVE/batches/completed/

# Epic 3 batches (completed)
mv docs/batches/03A-1-purchase-orders docs/5-ARCHIVE/batches/completed/
mv docs/batches/03B-1-transfer-orders docs/5-ARCHIVE/batches/completed/
mv docs/batches/03C-1-suppliers docs/5-ARCHIVE/batches/completed/
mv docs/batches/03D-1-planning-ui docs/5-ARCHIVE/batches/completed/
mv docs/batches/03D-2-wo-planning docs/5-ARCHIVE/batches/completed/
```

### Active batches (Epic 4-5) to Development

```bash
mkdir -p docs/4-DEVELOPMENT/batches/active

# Epic 4 batches (active/in-progress)
mv docs/batches/04A-1-wo-lifecycle docs/4-DEVELOPMENT/batches/active/
mv docs/batches/04A-2-material-reservation docs/4-DEVELOPMENT/batches/active/
mv docs/batches/04B-1-consumption docs/4-DEVELOPMENT/batches/active/
mv docs/batches/04B-2-output-registration docs/4-DEVELOPMENT/batches/active/
mv docs/batches/04C-1-config-traceability docs/4-DEVELOPMENT/batches/active/

# Epic 5 batches (upcoming)
mv docs/batches/05A-1-lp-core docs/4-DEVELOPMENT/batches/active/
mv docs/batches/05A-2-lp-operations docs/4-DEVELOPMENT/batches/active/
mv docs/batches/05A-3-receiving docs/4-DEVELOPMENT/batches/active/
mv docs/batches/05B-1-stock-moves docs/4-DEVELOPMENT/batches/active/
mv docs/batches/05B-2-pallets docs/4-DEVELOPMENT/batches/active/
mv docs/batches/05C-1-scanner-core docs/4-DEVELOPMENT/batches/active/

# Templates
mv docs/batches/batch-checklist-template.md docs/4-DEVELOPMENT/batches/
mv docs/batches/REORGANIZATION-GUIDE.md docs/4-DEVELOPMENT/batches/
```

---

## Phase 7: UX Design Migration

### Move docs/ux-design/ to docs/3-ARCHITECTURE/ux/specs/

```bash
# Active UX specs
mv docs/ux-design/ux-design-shared-system.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-planning-po-module.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-planning-to-module.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-planning-wo-spreadsheet.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-technical-module.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-production-module.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-warehouse-module.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-shipping-module.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-settings-module.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-quality-module.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-npd-module.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-npd-module-2025-11-16.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-detail-page-pattern.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-modal-crud-pattern.md docs/3-ARCHITECTURE/ux/specs/
mv docs/ux-design/ux-design-subroute-strategy.md docs/3-ARCHITECTURE/ux/specs/
```

---

## Phase 8: Meta/Reviews to Archive

### Move docs/meta/ to docs/5-ARCHIVE/meta/

```bash
mkdir -p docs/5-ARCHIVE/meta

# Code reviews
mv docs/meta/BATCH-2-TODO-SUMMARY.md docs/5-ARCHIVE/meta/
mv docs/meta/BATCH-2A-CODE-REVIEW-REPORT.md docs/5-ARCHIVE/meta/
mv docs/meta/BATCH-2A-CODE-REVIEW-UPDATED-2025-11-25.md docs/5-ARCHIVE/meta/
mv docs/meta/BATCH-2B-CODE-REVIEW-REPORT.md docs/5-ARCHIVE/meta/
mv docs/meta/BATCH-2B-CODE-REVIEW-UPDATED-2025-11-25.md docs/5-ARCHIVE/meta/
mv docs/meta/BATCH-2C-CODE-REVIEW-REPORT.md docs/5-ARCHIVE/meta/
mv docs/meta/BATCH-2C-CODE-REVIEW-UPDATED-2025-11-25.md docs/5-ARCHIVE/meta/
mv docs/meta/BATCH-2D-CODE-REVIEW-REPORT.md docs/5-ARCHIVE/meta/
mv docs/meta/BATCH-2D-CODE-REVIEW-UPDATED-2025-11-25.md docs/5-ARCHIVE/meta/
mv docs/meta/BATCH-2E-CODE-REVIEW-REPORT.md docs/5-ARCHIVE/meta/
mv docs/meta/BATCH-2E-CODE-REVIEW-UPDATED-2025-11-25.md docs/5-ARCHIVE/meta/
mv docs/meta/BATCH-3A-CODE-REVIEW-2025-11-26.md docs/5-ARCHIVE/meta/
mv docs/meta/BATCH-3B-CODE-REVIEW-REPORT.md docs/5-ARCHIVE/meta/
mv docs/meta/BATCH-3B-CODE-REVIEW-2025-11-26.md docs/5-ARCHIVE/meta/

# Status analyses
mv docs/meta/EPIC-2-STATUS-COMPLETE-ANALYSIS.md docs/5-ARCHIVE/meta/
mv docs/meta/EPIC-3-STATUS-ANALYSIS.md docs/5-ARCHIVE/meta/
mv docs/meta/PROJECT-STATUS-DEEP-ANALYSIS.md docs/5-ARCHIVE/meta/

# CI docs
mv docs/meta/ci.md docs/5-ARCHIVE/meta/
mv docs/meta/ci-secrets-checklist.md docs/5-ARCHIVE/meta/

# Readiness assessment
mv docs/meta/bmm-readiness-assessment.md docs/5-ARCHIVE/meta/
mv docs/meta/readiness-assessment/ docs/5-ARCHIVE/meta/

# Retrospectives
mv docs/meta/retrospectives/ docs/5-ARCHIVE/meta/
```

---

## Phase 9: Helpers to Reference

### Move docs/helpers/ to docs/1-BASELINE/reference/helpers/

```bash
mkdir -p docs/1-BASELINE/reference/helpers
mv docs/helpers/HE-code-review-common-errors.md docs/1-BASELINE/reference/helpers/
mv docs/helpers/HE-development-guide.md docs/1-BASELINE/reference/helpers/
mv docs/helpers/index.md docs/1-BASELINE/reference/helpers/
```

---

## Phase 10: Reviews to Archive

### Move docs/review/ to docs/5-ARCHIVE/reviews/

```bash
mkdir -p docs/5-ARCHIVE/reviews
mv docs/review/index.md docs/5-ARCHIVE/reviews/
mv docs/review/REV-stories-3-6-3-7-deep-analysis.md docs/5-ARCHIVE/reviews/
```

---

## Phase 11: Root Files to Archive

### Archive old root files

```bash
mkdir -p docs/5-ARCHIVE/root-files

# BATCH files
mv docs/BATCH-4A-CLARIFICATION-QUESTIONS.md docs/5-ARCHIVE/root-files/
mv docs/BATCH-4A-DEEP-DIVE.md docs/5-ARCHIVE/root-files/
mv docs/BATCH-5A-CLARIFICATION.md docs/5-ARCHIVE/root-files/
mv docs/BATCH-5A-DECISIONS.md docs/5-ARCHIVE/root-files/
mv docs/BATCH-5A-REVIEW-PART1.md docs/5-ARCHIVE/root-files/
mv docs/BATCH-5A-REVIEW-PART2.md docs/5-ARCHIVE/root-files/
mv docs/BATCH-5A-UPDATE-SUMMARY.md docs/5-ARCHIVE/root-files/

# Code review files
mv docs/code-review-stories-3-14-3-15-3-16-2025-11-29.md docs/5-ARCHIVE/root-files/
mv docs/CODE-REVIEW-2025-12-02.md docs/5-ARCHIVE/root-files/

# Test design
mv docs/test-design-batch-04B2-04C1.md docs/5-ARCHIVE/root-files/

# INDEX
mv docs/INDEX.md docs/5-ARCHIVE/root-files/
```

---

## Phase 12: Cleanup Empty Directories

```bash
# Remove empty old directories
rmdir docs/architecture/modules
rmdir docs/architecture/patterns
rmdir docs/architecture
rmdir docs/prd/modules
rmdir docs/prd
rmdir docs/epics
rmdir docs/sprint-artifacts
rmdir docs/batches
rmdir docs/ux-design
rmdir docs/meta
rmdir docs/helpers
rmdir docs/review
rmdir docs/reference
```

---

## Files to Keep in docs/ Root

These files should remain:
- `docs/00-START-HERE.md`
- `docs/MIGRATION-GUIDE.md`
- `docs/ONBOARDING-GUIDE.md`
- `docs/ONBOARDING-GUIDE-SUMMARY.md`
- `docs/DOCS-MIGRATION-PLAN.md` (this file - delete after migration)

---

## Post-Migration Verification

```bash
# Verify structure
find docs/0-DISCOVERY -type f | wc -l  # Should have discovery files
find docs/1-BASELINE -type f | wc -l   # Should have architecture + PRD + reference
find docs/2-MANAGEMENT -type f | wc -l # Should have epics + sprints
find docs/3-ARCHITECTURE -type f | wc -l # Should have UX specs
find docs/4-DEVELOPMENT -type f | wc -l  # Should have active batches
find docs/5-ARCHIVE -type f | wc -l      # Should have completed + old files

# Verify old directories removed
ls docs/architecture 2>&1 | grep "No such file"
ls docs/prd 2>&1 | grep "No such file"
ls docs/epics 2>&1 | grep "No such file"
```

---

## Special Handling Notes

1. **docs/1-BASELINE/product/prd.md** - Already exists. Check if docs/prd/index.md has different content before overwriting.

2. **Batch 03C-1-suppliers, 03D-1-planning-ui, 03D-2-wo-planning** - Verify these directories exist before moving.

3. **Context XML files in batches** - These will move with their parent batch directories.

4. **.gitkeep files** - Keep in empty directories for git tracking.

---

## Execution Order

Execute phases in order 1-12. Each phase can be run independently but should complete before the next.

**Total commands: ~100 mv commands + ~15 mkdir commands + ~12 rmdir commands**
