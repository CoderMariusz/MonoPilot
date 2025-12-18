# Migration Discovery Phase

> **Part of:** @.claude/workflows/documentation/MIGRATION-WORKFLOW.md
> **Phase:** 1 of 4
> **Duration:** 30-45 minutes

---

## Overview

Discovery phase scans the project to understand its structure, identify issues, and optionally interview stakeholders for missing context.

## Flow Diagram

```
+=====================================================================================+
|                            PHASE 1: DISCOVERY (30-45 min)                          |
+=====================================================================================+
|                                                                                     |
|   +------------------+     +------------------+     +------------------+            |
|   | doc-auditor      |---->| Generate Report  |---->| GATE: Audit      |            |
|   | (sonnet)         |     |                  |     | Complete?        |            |
|   +------------------+     +------------------+     +--------+---------+            |
|   | - Scan project   |     | AUDIT-REPORT.md: |              |                      |
|   | - File analysis  |     | - File inventory |         YES  |  NO                  |
|   | - Find orphans   |     | - Large files    |              |   |                  |
|   | - Tech stack     |     | - Tech stack     |              |   +---> Re-scan      |
|   | - Dependencies   |     | - Issues found   |              |                      |
|   | - Flag gaps      |     | - Context gaps   |              |                      |
|   +------------------+     +------------------+              |                      |
|                                                              v                      |
|   +-------------------------------------------------------------------------+      |
|   | OPTIONAL: Quick Context Interview (discovery-agent, depth=quick)        |      |
|   +-------------------------------------------------------------------------+      |
|   | Trigger: scan.has_gaps OR scan.missing_context                          |      |
|   | Skip if: complete docs found OR --skip-interview                        |      |
|   |                                                                          |      |
|   | - Max 7 questions about blocking unknowns                                |      |
|   | - Focus: pain points, priorities, what NOT to touch                      |      |
|   | - Output: MIGRATION-CONTEXT.md                                           |      |
|   +-------------------------------------------------------------------------+      |
|                                                                                     |
+=====================================================================================+
```

---

## Step 1.1: Project Scanning

**Agent:** doc-auditor
**Model:** sonnet
**Duration:** 30 minutes

### Activities

1. Scan entire project directory
2. Inventory all documentation files
3. Identify large files (>500 lines)
4. Detect orphaned documentation
5. Analyze tech stack from code
6. Map existing documentation structure
7. Identify potential issues
8. **Flag context gaps** for optional interview

### Scan Checklist

```markdown
## Project Scan Checklist

### File Inventory
- [ ] Count all markdown files
- [ ] Count all code files
- [ ] Identify documentation directories
- [ ] List README files
- [ ] Find architecture docs

### Large File Detection
- [ ] Files > 500 lines: {count}
- [ ] Files > 1000 lines: {count}
- [ ] Largest file: {name} ({lines} lines)

### Tech Stack Detection
- [ ] Languages identified
- [ ] Frameworks identified
- [ ] Dependencies analyzed
- [ ] Build tools identified

### Issue Detection
- [ ] Orphaned docs: {count}
- [ ] Broken links: {count}
- [ ] Missing READMEs: {locations}
- [ ] Duplicate content: {files}
```

### Output

`AUDIT-REPORT.md`

---

## Step 1.2: Quick Context Interview (Optional)

**Agent:** discovery-agent
**Model:** sonnet
**Duration:** 5-15 minutes
**Depth:** quick

### When to Run

- Scan found significant gaps in documentation
- Project context unclear from files alone
- User explicitly requests interview
- First-time migration (no prior knowledge)

### When to Skip

- Scan found complete PRD with goals
- Documentation is comprehensive
- User passed `--skip-interview` flag
- Re-migration of known project

### Activities

1. Read AUDIT-REPORT.md to understand gaps
2. Ask ONLY about blocking unknowns (max 7 questions)
3. Focus on: pain points, priorities, what NOT to touch
4. Stop as soon as basic understanding achieved
5. Save to MIGRATION-CONTEXT.md

### Quick Interview Questions

```
Based on scan gaps, ask about:
- "What's the main goal of this migration?"
- "Are there areas we should NOT touch?"
- "What's causing the most pain currently?"
- "Which files/features are most critical?"
- "Any recent changes we should know about?"
- "Who should we contact if questions arise?"
- "What's the priority order for migration?"
```

### Output

`docs/0-DISCOVERY/MIGRATION-CONTEXT.md` (if interview conducted)

---

## Audit Report Template

```markdown
# Migration Audit Report

**Project:** {project-name}
**Scan Date:** {YYYY-MM-DD}
**Generated By:** doc-auditor

## Executive Summary
- Total files: {count}
- Documentation files: {count}
- Code files: {count}
- Large files needing sharding: {count}
- Migration complexity: SMALL | MEDIUM | LARGE

## File Inventory

### Documentation Files
| File | Location | Lines | Type | Issues |
|------|----------|-------|------|--------|
| README.md | root | 150 | Main | Too long |
| CONTRIBUTING.md | root | 80 | Dev | OK |
| API.md | docs/ | 600 | Tech | Needs sharding |

### Large Files Requiring Sharding
| File | Lines | Suggested Splits |
|------|-------|------------------|
| API.md | 600 | api-overview.md, api-endpoints.md, api-examples.md |
| ARCHITECTURE.md | 800 | arch-overview.md, arch-components.md, arch-decisions.md |

### Tech Stack Detected
- **Language:** {language}
- **Framework:** {framework}
- **Database:** {database}
- **Build Tool:** {build-tool}
- **Package Manager:** {pm}

### Existing Documentation Structure
```
current-project/
├── README.md
├── docs/
│   ├── api/
│   ├── guides/
│   └── architecture/
└── ...
```

### Issues Found

#### Critical Issues
- [ ] Missing CLAUDE.md
- [ ] Missing PROJECT-STATE.md
- [ ] No .claude/ structure

#### Medium Issues
- [ ] Large files need sharding: {count}
- [ ] Broken documentation links: {count}
- [ ] Orphaned documentation: {count}

#### Minor Issues
- [ ] Inconsistent file naming
- [ ] Missing table of contents
- [ ] Outdated documentation

## Migration Recommendations

### Strategy
**RECOMMEND:** AUTO | MANUAL | HYBRID

**Justification:**
{Why this strategy}

### Priority Order
1. Setup core structure (CLAUDE.md, PROJECT-STATE.md)
2. Migrate baseline documentation
3. Shard large files
4. Organize existing docs into documentation structure
5. Generate agent workspaces

### Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Low | High | Backup before start |
| Broken references | Medium | Medium | Validation script |
| Large file issues | High | Low | Systematic sharding |

## Next Steps
1. Review this audit report
2. Create MIGRATION-PLAN.md
3. Backup project
4. Begin Phase 2: Planning
```

---

## Quality Gate 1: Discovery Complete

- [ ] All project files scanned
- [ ] Large files identified
- [ ] Tech stack detected
- [ ] Issues documented
- [ ] Report generated
- [ ] Strategy recommended
- [ ] Context gaps assessed
- [ ] Interview conducted (if needed) OR skipped (if not needed)
- [ ] Basic project understanding achieved

**Pass:** → Proceed to MIGRATION-PLANNING.md
**Fail:** → Re-scan or escalate

---

**Next:** @.claude/workflows/documentation/migration/MIGRATION-PLANNING.md
