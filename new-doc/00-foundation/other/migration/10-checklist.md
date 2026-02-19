## 10. Migration Checklist

### Pre-Migration Checklist

**Before starting migration:**

- [ ] **Backup created**
  ```bash
  tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/project
  ```

- [ ] **Git repository clean**
  ```bash
  git status  # Should show "nothing to commit"
  ```

- [ ] **Migration branch created**
  ```bash
  git checkout -b migration/agent-methodology-pack
  ```

- [ ] **Agent Methodology Pack downloaded**
  ```bash
  ls -la agent-methodology-pack/
  ```

- [ ] **Team notified** (if applicable)
  - Migration schedule communicated
  - Freeze on new features agreed
  - Training session scheduled

- [ ] **Time allocated**
  - Small project: 2-4 hours blocked
  - Medium project: 1 day blocked
  - Large project: 2-3 days blocked

- [ ] **Prerequisites installed**
  ```bash
  claude --version  # Claude CLI installed
  git --version     # Git installed
  ```

### During Migration Checklist

**Phase 1: Discovery**

- [ ] **Project analyzed**
  - File count documented
  - Large files identified
  - Current structure mapped

- [ ] **AUDIT-REPORT.md created**
  ```bash
  ls AUDIT-REPORT.md
  ```

- [ ] **Migration candidates identified**
  - High priority files listed
  - Sharding candidates noted
  - Files to create planned

**Phase 2: Planning**

- [ ] **MIGRATION-PLAN.md created**
  - File mapping complete
  - Priorities set
  - Timeline defined

- [ ] **Sharding strategy defined**
  - Large files identified
  - Split points determined
  - New file names decided

- [ ] **Team alignment** (if applicable)
  - Plan reviewed with team
  - Concerns addressed
  - Roles assigned

**Phase 3: Execution**

- [ ] **Methodology pack installed**
  ```bash
  ls -la .claude/
  ```

- [ ] **Core files created**
  - [ ] CLAUDE.md (< 70 lines)
  - [ ] PROJECT-STATE.md
  - [ ] docs/00-START-HERE.md

- [ ] **Documentation structure created**
  ```bash
  ls -la docs/{1-BASELINE,2-MANAGEMENT,3-ARCHITECTURE,4-DEVELOPMENT,5-ARCHIVE}
  ```

- [ ] **Documentation migrated**
  - [ ] Product docs → 1-BASELINE/product/
  - [ ] Architecture docs → 1-BASELINE/architecture/
  - [ ] Management docs → 2-MANAGEMENT/
  - [ ] Development docs → 4-DEVELOPMENT/
  - [ ] Old docs → 5-ARCHIVE/

- [ ] **Large files sharded**
  - [ ] Files split logically
  - [ ] Index files created
  - [ ] References updated

- [ ] **State files initialized**
  - [ ] AGENT-STATE.md
  - [ ] TASK-QUEUE.md
  - [ ] HANDOFFS.md
  - [ ] DEPENDENCIES.md
  - [ ] DECISION-LOG.md
  - [ ] AGENT-MEMORY.md
  - [ ] METRICS.md

- [ ] **References updated**
  - [ ] CLAUDE.md references valid
  - [ ] Cross-references checked
  - [ ] Dead links removed

**Phase 4: Verification**

- [ ] **Validation passed**
  ```bash
  bash scripts/validate-docs.sh  # All checks pass
  ```

- [ ] **CLAUDE.md validated**
  ```bash
  wc -l CLAUDE.md  # < 70 lines
  ```

- [ ] **References tested**
  - [ ] All @references load in Claude
  - [ ] No broken links
  - [ ] Paths correct

- [ ] **Agent workflows tested**
  - [ ] ORCHESTRATOR loads successfully
  - [ ] Test development agent
  - [ ] Test quality agent

- [ ] **Documentation accessible**
  - [ ] Team can find documents
  - [ ] WHERE-IS-EVERYTHING.md created
  - [ ] Navigation clear

### Post-Migration Checklist

**After migration complete:**

- [ ] **Git committed**
  ```bash
  git add .
  git commit -m "Complete migration to Agent Methodology Pack"
  git tag migration-complete-$(date +%Y%m%d)
  ```

- [ ] **Backup verified**
  ```bash
  ls -lh backup-*.tar.gz  # Backup exists
  ```

- [ ] **Team trained** (if applicable)
  - [ ] Onboarding session held
  - [ ] Documentation shared
  - [ ] Q&A session completed

- [ ] **First epic created**
  - [ ] Current work documented as Epic
  - [ ] Stories broken down
  - [ ] Sprint planned

- [ ] **Agent workflows active**
  - [ ] First task assigned to agent
  - [ ] State files being updated
  - [ ] Handoffs working

- [ ] **Metrics baseline established**
  ```bash
  # Initial metrics captured in METRICS.md
  ```

- [ ] **Retrospective held**
  - Migration process reviewed
  - Improvements identified
  - Lessons documented

- [ ] **Documentation finalized**
  - [ ] All files in correct locations
  - [ ] No TODO placeholders
  - [ ] Quality check passed

### Quality Checklist

**Final quality verification:**

- [ ] **Structure**
  - [ ] Documentation folders exist
  - [ ] Files in correct locations
  - [ ] Naming conventions followed

- [ ] **Content**
  - [ ] CLAUDE.md accurate and concise
  - [ ] PROJECT-STATE.md current
  - [ ] No placeholder content
  - [ ] No broken references

- [ ] **Validation**
  - [ ] scripts/validate-docs.sh passes
  - [ ] CLAUDE.md < 70 lines
  - [ ] All @references work
  - [ ] Claude CLI can load all files

- [ ] **Functionality**
  - [ ] ORCHESTRATOR routes tasks
  - [ ] Agents can access docs
  - [ ] State files update
  - [ ] Workflows functional

- [ ] **Team Readiness**
  - [ ] Team knows new structure
  - [ ] Team can use agents
  - [ ] Support channel established
  - [ ] Documentation accessible

---

