# ⚡ QUICK START: Setup v2 for New Epic (5 min)

**Use this to quickly setup v2 migration for Epic 02, 03, 04...**

---

## 📋 CHECKLIST (Copy-Paste Commands)

```bash
# ============================================
# SETUP NEW EPIC v2 (5 minutes)
# ============================================

# 1. SET VARIABLES (UPDATE THESE!)
EPIC_NAME="technical"    # e.g., technical, planning, production
EPIC_NUM="02"            # e.g., 02, 03, 04
PREFIX="TEC"             # wireframe prefix: TEC, PLAN, PROD, etc.

# 2. GIT SETUP
git checkout -b feature/${EPIC_NAME}-v2-rebuild
git tag ${EPIC_NAME}-v1-backup-$(date +%Y%m%d)

# 3. CREATE DIRECTORIES
mkdir -p "apps/frontend/app/(authenticated)/${EPIC_NAME}-v2"
mkdir -p "apps/frontend/components/${EPIC_NAME}-v2/shared"
mkdir -p "apps/frontend/app/(authenticated)/_archive-${EPIC_NAME}-v1-DO-NOT-TOUCH"
mkdir -p "apps/frontend/components/_archive-${EPIC_NAME}-v1-DO-NOT-TOUCH"

# 4. ARCHIVE V1
cp -r "apps/frontend/app/(authenticated)/${EPIC_NAME}/"* "apps/frontend/app/(authenticated)/_archive-${EPIC_NAME}-v1-DO-NOT-TOUCH/" 2>/dev/null || echo "No v1 pages to archive"
cp -r "apps/frontend/components/${EPIC_NAME}/"* "apps/frontend/components/_archive-${EPIC_NAME}-v1-DO-NOT-TOUCH/" 2>/dev/null || echo "No v1 components to archive"

# 5. CREATE READMEs (copy from Epic 01 templates)
# TODO: Copy Epic 01 READMEs and update names

# 6. CREATE HANDOFFS DIRECTORY
mkdir -p "docs/2-MANAGEMENT/epics/current/${EPIC_NUM}-${EPIC_NAME}/agent-handoffs"

# 7. COMMIT
git add .
git commit -m "feat(${EPIC_NAME}): setup v2 parallel build structure"

echo ""
echo "✅ Structure created!"
echo ""
echo "Next steps:"
echo "1. Copy EPIC-01-MIGRATION-PLAN.md → EPIC-${EPIC_NUM}-MIGRATION-PLAN.md (update names)"
echo "2. Create agent handoffs (start with 00-FOUNDATION)"
echo "3. Update story files (add v2 banners)"
echo "4. Launch agents!"
```

---

## 📝 WHAT TO COPY FROM EPIC 01

```bash
# After running commands above, copy these files and update:

# 1. Migration Plan
cp docs/2-MANAGEMENT/EPIC-01-MIGRATION-PLAN.md \
   docs/2-MANAGEMENT/EPIC-${EPIC_NUM}-MIGRATION-PLAN.md
# Update: Epic name, wireframe prefix, screen counts, timeline

# 2. Master Prompt
cp docs/2-MANAGEMENT/epics/current/01-settings/MASTER-PROMPT-FOR-AGENTS.md \
   docs/2-MANAGEMENT/epics/current/${EPIC_NUM}-${EPIC_NAME}/MASTER-PROMPT-FOR-AGENTS.md
# Update: Epic name, directory paths

# 3. Agent Start Guide
cp docs/2-MANAGEMENT/epics/current/01-settings/AGENT-START-HERE.md \
   docs/2-MANAGEMENT/epics/current/${EPIC_NUM}-${EPIC_NAME}/AGENT-START-HERE.md
# Update: Epic name, handoff paths

# 4. Foundation Handoff (template for first agent)
cp docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/00-FOUNDATION-shared-components.yaml \
   docs/2-MANAGEMENT/epics/current/${EPIC_NUM}-${EPIC_NAME}/agent-handoffs/00-FOUNDATION-shared-components.yaml
# Update: Epic name, wireframe reference

# 5. Isolation Script
cp scripts/check-settings-v2-isolation.sh \
   scripts/check-${EPIC_NAME}-v2-isolation.sh
# Update: EPIC_NAME variable (line 3)
chmod +x scripts/check-${EPIC_NAME}-v2-isolation.sh

# 6. READMEs
cp "apps/frontend/app/(authenticated)/settings-v2/README.md" \
   "apps/frontend/app/(authenticated)/${EPIC_NAME}-v2/README.md"
# Update: Epic name, wireframe prefix

cp "apps/frontend/app/(authenticated)/_archive-settings-v1-DO-NOT-TOUCH/README.md" \
   "apps/frontend/app/(authenticated)/_archive-${EPIC_NAME}-v1-DO-NOT-TOUCH/README.md"
# Update: Epic name

# Similar for components archive README
```

---

## 🎯 THEN CREATE HANDOFFS

**For each wireframe in your epic:**

```bash
# Template file: agent-handoffs/XX-screen-name.yaml

# Copy structure from Epic 01 handoff examples:
# - 01-CRITICAL-locations-tree-rewrite.yaml (for critical rewrites)
# - 04-users-actions-menu.yaml (for refactors)
# - 00-FOUNDATION-shared-components.yaml (for foundation)

# Update:
# - Epic name/number
# - Story ID
# - Wireframe paths (SET-XXX → TEC-XXX or PLAN-XXX)
# - Output directories (settings-v2 → technical-v2 or planning-v2)
# - Requirements (from YOUR wireframe)
```

**Typical epic needs:**
- 1 Foundation handoff (shared components)
- 2-3 Critical Rewrite handoffs (architecture changes)
- 3-5 Refactor handoffs (updates)
- 5-15 New Screen handoffs (build from scratch)

**Total: 10-25 handoffs per epic**

---

## ✅ VERIFICATION

```bash
# After setup, verify:

# 1. Structure exists
ls apps/frontend/app/\(authenticated\)/${EPIC_NAME}-v2/
ls apps/frontend/components/${EPIC_NAME}-v2/

# 2. Archive exists
ls apps/frontend/app/\(authenticated\)/_archive-${EPIC_NAME}-v1-DO-NOT-TOUCH/

# 3. Isolation script works
bash scripts/check-${EPIC_NAME}-v2-isolation.sh
# Should show: ✅ All checks passed

# 4. Git clean
git status
# Should show: On branch feature/{epic}-v2-rebuild

# 5. Commits present
git log --oneline -3
# Should show your setup commits
```

---

## 🚀 READY STATUS

**You're ready to launch agents when:**
- ✅ Directories created ({epic}-v2/)
- ✅ V1 archived
- ✅ Migration plan written
- ✅ Foundation handoff created (00-FOUNDATION)
- ✅ 3+ critical handoffs created
- ✅ Isolation script works
- ✅ Master prompt exists

**Then:** Launch Foundation agent!

---

## 📊 TIME ESTIMATES

```
Per Epic Setup:
├── Variables + Git: 5 min
├── Directory structure: 5 min
├── Copy/adapt docs: 30 min
├── Create handoffs: 10 min each × 7 = 70 min
├── Update stories: 5 min each × 5 = 25 min
├── Testing/verification: 10 min
└── Total: ~2.5-3 hours

Epic Execution (agents):
├── Foundation: 1 day
├── Critical rewrites: 2-5 days
├── Core refactors: 3-7 days
├── New screens: 2-5 days
├── Integration: 1 day
└── Total: 10-20 days (depends on epic size)
```

---

## 💡 PRO TIP

**Don't create ALL handoffs upfront!**

**Do this instead:**
1. ✅ Create Foundation handoff (00-FOUNDATION)
2. ✅ Create 3-5 critical handoffs
3. ⏳ Create remaining handoffs ON-DEMAND (as agents finish previous)

**Why:**
- Faster initial setup
- Can adjust based on agent feedback
- Don't waste time on handoffs that may change

---

**PLAYBOOK:** `PLAYBOOK-EPIC-V2-MIGRATION.md` (full details)
**EXAMPLE:** Epic 01 Settings (reference implementation)
**TIME:** 5 min quick start, 3h full setup
**RESULT:** Ready for clean v2 rebuild

**GO! 🚀**
