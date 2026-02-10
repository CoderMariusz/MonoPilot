# .claude Directory - Knowledge Base Index

> Updated: 2026-02-10
> **Status:** Consolidated from 60+ files to 6 core + archives

---

## 🎯 Core Files (Use These Daily)

### 1. **MASTER-PROMPT-FOR-AGENTS.md**
   - **Purpose:** Agent orchestration methodology
   - **Use When:** Delegating work to agents, understanding workflow phases
   - **Key Sections:** 7-phase flow, checkpoint system, delegation patterns
   - **Size:** 139 lines

### 2. **IMPLEMENTATION-ROADMAP.yaml**
   - **Purpose:** Detailed task breakdown and story tracking
   - **Use When:** Finding next task, checking epic completion, understanding dependencies
   - **Key Sections:** Executive summary, epic breakdowns, story details, blockers
   - **Size:** 970 lines

### 3. **PROJECT-DASHBOARD.md** ⭐ NEW
   - **Purpose:** Live project status snapshot
   - **Use When:** Checking what's done, what's in progress, blockers, test coverage
   - **Key Sections:** Completion by epic, recent fixes, known blockers, next phases
   - **Refresh:** After each story completion
   - **Size:** ~300 lines

### 4. **TECHNICAL-REFERENCE.md** ⭐ NEW
   - **Purpose:** Consolidated technical documentation
   - **Use When:** Looking up database schema, code patterns, API endpoints, module structure
   - **Key Sections:** Database overview, schema details, code patterns, testing patterns, styling
   - **Replaces:** DATABASE-SCHEMA.md, TABLES.md, PATTERNS.md, MODEL-ROUTING.md, MODULE-INDEX.md
   - **Size:** ~650 lines

### 5. **CLAUDE.md**
   - **Purpose:** Project overview (vision, tech stack, structure)
   - **Use When:** Onboarding, understanding project goals
   - **Size:** 222 lines

### 6. **SUPABASE-CONNECTION.md**
   - **Purpose:** Emergency recovery credentials and project details
   - **Use When:** Lost connection to Supabase or need access tokens
   - **⚠️ Security:** Contains credentials - never commit, never share
   - **Size:** 189 lines

---

## 📦 Archived Files

**Location:** `.claude/archive/obsolete/`

**What's here:** 56 historical files
- Progress reports from past sessions (EPIC-02-*, EPIC-03-*, etc.)
- Debug session notes (DEBUG-SESSION-*)
- E2E test planning docs (E2E-*)
- Previous status docs (PROJECT-STATE.md, TABLES.md, etc.)

**When to use:**
- Need historical context on a problem
- Looking up old acceptance criteria details
- Reviewing past implementation decisions

**How to search:**
```bash
grep -r "search_term" .claude/archive/obsolete/
```

**README:** `.claude/archive/obsolete/README.md` explains consolidation

---

## 📁 Subdirectories (Not Changed)

These directories remain and contain specialized content:

| Directory | Purpose | When to Use |
|-----------|---------|------------|
| `agents/` | Agent role documentation | Understanding agent responsibilities |
| `checklists/` | Quality checklists | Code review, pre-PR checks |
| `config/` | Configuration templates | Environment setup |
| `skills/` | Domain-specific knowledge | Domain expertise needed |
| `workflows/` | Process workflows | Understanding team processes |
| `procedures/` | Standard procedures | Day-to-day tasks |
| `prompts/` | Prompt templates | Creating new prompts |
| `scripts/` | Helper scripts | Automation |
| `templates/` | Document templates | Creating new documents |
| `tests/` | Test-related docs | Testing guidance |
| `cache/` | Caching info | Performance optimization |
| `audit/` | Audit logs | Compliance tracking |
| `docs/` | General documentation | Reference |
| `updates/` | Update tracking | Change logs |
| `checkpoints/` | Session checkpoints | Agent progress tracking |
| `mcp-profiles/` | MCP configurations | Model routing |

---

## 🔄 How to Update Core Files

### After Each Story/Bug Fix:
```bash
# 1. Update PROJECT-DASHBOARD.md
#    - Add to "Recent Fixes" section
#    - Update test pass rate if changed
#    - Update "Next Steps"

# 2. Update IMPLEMENTATION-ROADMAP.yaml if story status changed
#    - Change `status: in_progress` → `status: complete`
#    - Add deployment date
#    - Update epic completion %

# 3. Commit with conventional messages
git add .claude/*.md .claude/*.yaml
git commit -m "docs: update project status after story X completion"
```

### After New Discovery/Blocker:
```bash
# Update MASTER-PROMPT-FOR-AGENTS.md if methodology changes
# Update PROJECT-DASHBOARD.md "Known Blockers" section
```

---

## ✅ What's Different After Consolidation

### Before (60+ files, ~23K lines)
- 17 EPIC-02-*.md files with overlapping data
- TABLES.md, DATABASE-SCHEMA.md, PATTERNS.md all separate
- Duplicate status info in PROJECT-STATE.md
- Hard to find relevant info
- Large context overhead

### After (6 core files + archives, ~5K lines)
- ✅ Single source of truth per topic
- ✅ All schema/patterns in one TECHNICAL-REFERENCE.md
- ✅ Live status in PROJECT-DASHBOARD.md
- ✅ Easy to find information
- ✅ 75% smaller context footprint
- ✅ History preserved in archive

---

## 📌 Quick Tips

1. **Start here for project overview:** CLAUDE.md
2. **For today's work:** PROJECT-DASHBOARD.md → IMPLEMENTATION-ROADMAP.yaml
3. **For code guidance:** TECHNICAL-REFERENCE.md
4. **For methodology:** MASTER-PROMPT-FOR-AGENTS.md
5. **Lost Supabase connection?** SUPABASE-CONNECTION.md

---

## 🎓 References

- **Detailed skills:** See `.claude/skills/README.md` or specific skill files
- **Workflow details:** See `.claude/workflows/STORY-WORKFLOW.md` etc
- **Agent guidance:** See `.claude/agents/ORCHESTRATOR.md`
- **Archived reports:** See `.claude/archive/obsolete/README.md`
