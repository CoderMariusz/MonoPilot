# Obsolete Reports Archive

This directory contains historical session reports and progress summaries that have been consolidated into main knowledge base.

**Consolidated Into:**
- `PROJECT-DASHBOARD.md` - Current project status (live updates)
- `TECHNICAL-REFERENCE.md` - Database schemas, code patterns, API docs
- `IMPLEMENTATION-ROADMAP.yaml` - Detailed task breakdown

**Files in this archive:**
- `EPIC-0*-*.md` - Epic progress reports (17 files)
- `DEBUG-SESSION-*.md` - Old debug sessions
- `E2E-*.md` - E2E test planning documents
- `QUALITY-*.md` - Quality module reports
- `PROJECT-STATE.md` - Previous project status (replaced by PROJECT-DASHBOARD.md)
- `TABLES.md` - Previous table reference (merged into TECHNICAL-REFERENCE.md)
- `DATABASE-SCHEMA.md` - Previous schema doc (merged into TECHNICAL-REFERENCE.md)
- `PATTERNS.md` - Previous patterns doc (merged into TECHNICAL-REFERENCE.md)
- `MODEL-ROUTING.md` - Previous model routing (merged into TECHNICAL-REFERENCE.md)
- Various session summaries and test results

## Why Archive?

The main `.claude/` directory was cluttered with 60+ files. Many contained duplicate information or historical progress reports that don't need to be accessed frequently.

**Before:** 60 files, ~23,000 lines of documentation
**After:** 16 core files, ~5,000 lines (consolidated + highly relevant)

## How to Use

If you need historical context:
```bash
# Search archived files
grep -r "pattern_name" .claude/archive/obsolete/

# View specific file
cat .claude/archive/obsolete/EPIC-02-PROGRESS-REPORT.md
```

## If Something is Missing

The consolidation process merged content into:
1. **Schemas** → `TECHNICAL-REFERENCE.md`
2. **Code patterns** → `TECHNICAL-REFERENCE.md`
3. **Status updates** → `PROJECT-DASHBOARD.md`
4. **Task breakdown** → `IMPLEMENTATION-ROADMAP.yaml`

If you need info from archived files, it's likely in one of the above consolidated files.
