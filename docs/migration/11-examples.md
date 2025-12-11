## 11. Examples

### Example 1: React + Node.js Full-Stack Project

**Project Profile:**
- **Name:** TaskMaster (Todo app with real-time collaboration)
- **Size:** 180 files, 15K LOC
- **Stack:** React + TypeScript frontend, Node.js + Express + PostgreSQL backend
- **Team:** 3 developers
- **Current State:** Mid-development, v2.0 in progress

**Migration Approach:** Full migration over 2 days

#### Day 1: Discovery & Planning (4 hours)

**Morning (2 hours): Discovery**

```bash
# 1. Create audit
cd /path/to/taskmaster
find . -type f | wc -l  # 180 files
find . -name "*.md" | wc -l  # 12 markdown files
find . -name "*.ts" -o -name "*.tsx" | wc -l  # 87 TypeScript files

# 2. Identify large docs
find . -name "*.md" -exec wc -l {} + | sort -rn
# Output:
# 842 README.md
# 456 docs/API.md
# 234 docs/ARCHITECTURE.md
# 123 docs/SETUP.md
# 89 docs/CONTRIBUTING.md

# 3. Document findings
cat > AUDIT-REPORT.md << 'EOF'
# TaskMaster Migration Audit

## Project Stats
- Total files: 180
- Documentation: 12 markdown files
- Code: 87 TypeScript, 23 test files
- Largest doc: README.md (842 lines) - MUST SHARD

## Current Structure
```
taskmaster/
├── README.md (842 lines)
├── docs/
│   ├── API.md (456 lines)
│   ├── ARCHITECTURE.md (234 lines)
│   ├── SETUP.md (123 lines)
│   └── CONTRIBUTING.md (89 lines)
├── client/ (React app)
└── server/ (Node.js API)
```

## Migration Candidates
- README.md → Shard into 5 files
- API.md → Move to 4-DEVELOPMENT/api/
- ARCHITECTURE.md → Move to 1-BASELINE/architecture/
- SETUP.md → Rename to INSTALL.md
- CONTRIBUTING.md → Move to 4-DEVELOPMENT/guides/
EOF
```

**Afternoon (2 hours): Planning**

```bash
# Create migration plan
cat > MIGRATION-PLAN.md << 'EOF'
# TaskMaster Migration Plan

## Timeline
- **Day 1 AM:** Discovery & Planning
- **Day 1 PM:** Core files & structure
- **Day 2 AM:** Doc migration & sharding
- **Day 2 PM:** Validation & team training

## File Mapping

### Root Files
| Current | New | Action |
|---------|-----|--------|
| README.md | Shard (see below) | Split into 5 files |
| package.json | Keep in root | No change |
| CHANGELOG.md | Keep in root | No change |

### README.md Sharding (842 lines → 5 files)
1. CLAUDE.md (50 lines) - Entry point
2. docs/1-BASELINE/product/overview.md (150 lines) - Product overview
3. docs/1-BASELINE/product/features.md (200 lines) - Feature list
4. INSTALL.md (300 lines) - Setup instructions
5. QUICK-START.md (142 lines) - Quick start tutorial

### Documentation Migration
| Current | New | Lines |
|---------|-----|-------|
| docs/API.md | docs/4-DEVELOPMENT/api/README.md | 456 |
| docs/ARCHITECTURE.md | docs/1-BASELINE/architecture/overview.md | 234 |
| docs/SETUP.md | INSTALL.md (merged with README setup) | 123 |
| docs/CONTRIBUTING.md | docs/4-DEVELOPMENT/guides/contributing.md | 89 |

### New Files to Create
- PROJECT-STATE.md
- docs/00-START-HERE.md
- docs/2-MANAGEMENT/epics/current/epic-03-realtime.md (current work)
- All state files (.claude/state/*)

## Priority
P0: Core files, structure, current work documentation
P1: All doc migration
P2: Historical documentation archival

## Rollback Plan
Git tag: `pre-migration-20251205`
Can revert with: `git reset --hard pre-migration-20251205`
EOF

# Commit plan
git add AUDIT-REPORT.md MIGRATION-PLAN.md
git commit -m "Migration planning complete"
```

#### Day 1 Afternoon: Core Files & Structure (4 hours)

```bash
# 1. Install methodology pack
git submodule add https://github.com/your-org/agent-methodology-pack.git .agent-pack
cp -r .agent-pack/.claude ./
cp -r .agent-pack/scripts ./
cp -r .agent-pack/templates ./

# 2. Create organized documentation structure
mkdir -p docs/{1-BASELINE/{product,architecture},2-MANAGEMENT/{epics/{current,completed},sprints},3-ARCHITECTURE/ux,4-DEVELOPMENT/{api,guides},5-ARCHIVE}

# 3. Create CLAUDE.md
cat > CLAUDE.md << 'EOF'
# TaskMaster - Real-Time Collaboration Todo App

## Quick Facts
| Aspect | Value |
|--------|-------|
| Name | TaskMaster |
| Type | Full-Stack Web Application |
| Version | 2.0.0-beta |
| Status | Active Development |

## Current Focus
See: @PROJECT-STATE.md

## Documentation Map
- **Overview:** @docs/1-BASELINE/product/overview.md
- **Features:** @docs/1-BASELINE/product/features.md
- **Architecture:** @docs/1-BASELINE/architecture/overview.md
- **API:** @docs/4-DEVELOPMENT/api/README.md
- **Installation:** @INSTALL.md
- **Quick Start:** @QUICK-START.md

## Tech Stack
- Frontend: React 18 + TypeScript + Material-UI
- Backend: Node.js 18 + Express + PostgreSQL 15
- Real-time: Socket.io
- Deployment: Docker + AWS

## Current Sprint
Sprint 6 | Epic 3: Real-Time Collaboration
See: @docs/2-MANAGEMENT/epics/current/epic-03-realtime.md

## Agent System
@.claude/agents/ORCHESTRATOR.md

---
*Agent Methodology Pack v1.0.0*
EOF

# Verify <70 lines
wc -l CLAUDE.md  # Should be ~45 lines ✅

# 4. Create PROJECT-STATE.md
cat > PROJECT-STATE.md << 'EOF'
# Project State

**Project:** TaskMaster v2.0
**Phase:** Development - Real-Time Features
**Last Updated:** 2025-12-05

## Current Status
- Sprint 6 of 8 (planned for v2.0)
- Epic 3: Real-Time Collaboration
- 2 stories completed, 3 in progress

## Active Work

### Epic 3: Real-Time Collaboration
- [x] Story 3.1: WebSocket server setup - **Complete**
- [x] Story 3.2: Real-time task updates - **Complete**
- [ ] Story 3.3: Collaborative editing - **In Progress** (Frontend)
- [ ] Story 3.4: Presence indicators - **In Progress** (Backend)
- [ ] Story 3.5: Conflict resolution - **Queued**

## Team
- Alice: Frontend Developer (Story 3.3)
- Bob: Backend Developer (Story 3.4)
- Charlie: Full-Stack (Code review, testing)

## Recent Completions
- 2025-12-04: Story 3.2 merged to main
- 2025-12-01: Epic 2 (User Profiles) completed
- 2025-11-29: Sprint 5 retrospective

## Next Steps
1. Complete Story 3.3 (today)
2. Complete Story 3.4 (tomorrow)
3. Begin Story 3.5 (Monday)
4. Sprint 6 review (Friday 12/13)

## Blockers
- Story 3.4 waiting on Socket.io scaling research (in progress)

## Metrics
- Sprint velocity: 18 points/sprint
- Test coverage: 92%
- Open bugs: 2 (both P2)

---
*See @.claude/state/TASK-QUEUE.md for detailed task tracking*
EOF

# 5. Initialize state files
cd .claude/state
for file in AGENT-STATE.md TASK-QUEUE.md HANDOFFS.md DEPENDENCIES.md DECISION-LOG.md AGENT-MEMORY.md METRICS.md; do
  cp ../../templates/state/$file.template $file
done
cd ../..

# 6. Commit progress
git add CLAUDE.md PROJECT-STATE.md .claude/ docs/
git commit -m "Core files and structure created"
```

**End of Day 1:** Structure ready, core files created

#### Day 2 Morning: Documentation Migration & Sharding (4 hours)

```bash
# 1. Shard README.md

# Extract overview section (lines 1-150)
head -n 150 README.md > docs/1-BASELINE/product/overview.md

# Extract features section (lines 151-350)
sed -n '151,350p' README.md > docs/1-BASELINE/product/features.md

# Extract installation (lines 351-650)
sed -n '351,650p' README.md > INSTALL.md

# Extract quick start (lines 651-792)
sed -n '651,792p' README.md > QUICK-START.md

# Create new minimal README
cat > README.md << 'EOF'
# TaskMaster

Real-time collaboration todo app built with React and Node.js.

## Quick Links

- **Get Started:** See [INSTALL.md](INSTALL.md) and [QUICK-START.md](QUICK-START.md)
- **Documentation:** See [docs/00-START-HERE.md](docs/00-START-HERE.md)
- **Project Overview:** See [@CLAUDE.md](CLAUDE.md)

## Current Version

v2.0.0-beta - Real-time collaboration features

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

For full documentation, start at @CLAUDE.md
EOF

# 2. Move API documentation
mv docs/API.md docs/4-DEVELOPMENT/api/README.md

# Split API doc if needed (456 lines)
# Create docs/4-DEVELOPMENT/api/authentication.md
# Create docs/4-DEVELOPMENT/api/endpoints/tasks.md
# Create docs/4-DEVELOPMENT/api/endpoints/users.md
# Create docs/4-DEVELOPMENT/api/websockets.md
# Update docs/4-DEVELOPMENT/api/README.md to reference them

# 3. Move architecture docs
mv docs/ARCHITECTURE.md docs/1-BASELINE/architecture/overview.md

# 4. Move contributing guide
mv docs/CONTRIBUTING.md docs/4-DEVELOPMENT/guides/contributing.md

# 5. Create START-HERE
cat > docs/00-START-HERE.md << 'EOF'
# TaskMaster Documentation

## Getting Started

1. **New to TaskMaster?** Read [1-BASELINE/product/overview.md](1-BASELINE/product/overview.md)
2. **Want to install?** See [INSTALL.md](../INSTALL.md)
3. **Quick tutorial?** See [QUICK-START.md](../QUICK-START.md)
4. **Architecture?** See [1-BASELINE/architecture/overview.md](1-BASELINE/architecture/overview.md)

## Documentation Structure

### 1-BASELINE - What & Why
- **product/** - Product overview, features, requirements
- **architecture/** - System design, technical decisions

### 2-MANAGEMENT - Plan & Track
- **epics/current/** - Active feature development
- **sprints/** - Sprint planning and tracking

### 3-ARCHITECTURE - Design
- **ux/** - User experience design, wireframes

### 4-DEVELOPMENT - How
- **api/** - API documentation
- **guides/** - Development guides

### 5-ARCHIVE - History
- **old-sprints/** - Completed sprint documentation

## Current Work

See [@PROJECT-STATE.md](../PROJECT-STATE.md) for current sprint and active work.

---
*Entry point: @CLAUDE.md*
EOF

# 6. Create Epic 3 (current work)
cat > docs/2-MANAGEMENT/epics/current/epic-03-realtime.md << 'EOF'
# Epic 3: Real-Time Collaboration

**Status:** In Progress (60% complete)
**Start Date:** 2025-11-20
**Target:** 2025-12-15

## Goal

Enable multiple users to collaborate on tasks in real-time with live updates and presence indicators.

## Stories

- [x] **3.1:** WebSocket server setup (8 pts) - Complete
- [x] **3.2:** Real-time task updates (5 pts) - Complete
- [ ] **3.3:** Collaborative editing (8 pts) - In Progress
- [ ] **3.4:** Presence indicators (5 pts) - In Progress
- [ ] **3.5:** Conflict resolution (8 pts) - Queued

**Total:** 34 points | Completed: 13 | Remaining: 21

## Acceptance Criteria

- [ ] Multiple users can edit same task simultaneously
- [ ] Changes appear in real-time (<100ms)
- [ ] User presence shown (who's online, who's editing)
- [ ] Conflicts detected and resolved gracefully
- [ ] Works with 10+ concurrent users

## Technical Details

- **Technology:** Socket.io for WebSocket communication
- **Architecture:** Event-driven, pub/sub pattern
- **Data Sync:** Operational Transform for conflict resolution

## Dependencies

- Infrastructure: WebSocket server (complete)
- Database: PostgreSQL with row-level security (complete)

## Related

- Epic 2: User Profiles (provides user info for presence)
- Epic 4: Notifications (will use real-time infrastructure)

---
*See stories in docs/2-MANAGEMENT/epics/current/epic-03/*
EOF

# 7. Commit migration
git add .
git commit -m "Documentation migrated and sharded"
```

#### Day 2 Afternoon: Validation & Team Training (4 hours)

```bash
# 1. Run validation
bash scripts/validate-docs.sh

# Fix any issues found:
# - Broken references → update paths
# - Missing files → create or remove reference
# - CLAUDE.md too long → move content to referenced files

# 2. Verify line counts
wc -l CLAUDE.md  # Should be <70 ✅
wc -l PROJECT-STATE.md
wc -l docs/1-BASELINE/product/overview.md

# 3. Test with Claude CLI
echo "Test migration:

@CLAUDE.md
@PROJECT-STATE.md
@.claude/agents/ORCHESTRATOR.md

Please analyze the project and recommend next steps for Epic 3." | claude --project .

# 4. Create team onboarding doc
cat > MIGRATION-NOTES.md << 'EOF'
# Migration Complete! 🎉

## What Changed

1. **New structure:** Documentation now uses an organized format
2. **Entry point:** Start at @CLAUDE.md instead of README.md
3. **AI agents:** We can now use specialized agents for development

## Where Is Everything?

| Old Location | New Location |
|--------------|--------------|
| README.md (overview) | docs/1-BASELINE/product/overview.md |
| README.md (features) | docs/1-BASELINE/product/features.md |
| README.md (setup) | INSTALL.md |
| docs/API.md | docs/4-DEVELOPMENT/api/README.md |
| docs/ARCHITECTURE.md | docs/1-BASELINE/architecture/overview.md |
| docs/CONTRIBUTING.md | docs/4-DEVELOPMENT/guides/contributing.md |

## Quick Start for Team

### Finding Docs
- Start at [docs/00-START-HERE.md](docs/00-START-HERE.md)
- Or use @CLAUDE.md as entry point

### Using Agents

**Example: Get help implementing Story 3.3**
```
@CLAUDE.md
@docs/2-MANAGEMENT/epics/current/epic-03-realtime.md
@.claude/agents/development/FRONTEND-DEV.md

Help me implement Story 3.3: Collaborative editing
```

**Example: Code review**
```
@CLAUDE.md
@.claude/agents/quality/CODE-REVIEWER.md

Review my changes in client/src/components/TaskEditor.tsx
```

## Team Training

**Friday 12/6, 2:00 PM** - Team room
- 30 min overview of new structure
- 30 min hands-on with agents
- 30 min Q&A

## Questions?

#dev-team Slack channel or DM Charlie
EOF

# 5. Create WHERE-IS-EVERYTHING quick reference
cat > docs/WHERE-IS-EVERYTHING.md << 'EOF'
# Quick Finder: Where Is Everything?

## Common Searches

| Looking for... | Location |
|----------------|----------|
| Project overview | docs/1-BASELINE/product/overview.md |
| Feature list | docs/1-BASELINE/product/features.md |
| Setup guide | INSTALL.md |
| Quick tutorial | QUICK-START.md |
| API docs | docs/4-DEVELOPMENT/api/README.md |
| Architecture | docs/1-BASELINE/architecture/overview.md |
| Current work | PROJECT-STATE.md |
| Current epic | docs/2-MANAGEMENT/epics/current/epic-03-realtime.md |

## Can't Find Something?

```bash
# Search all docs
grep -r "search term" docs/

# Find file by name
find docs/ -name "*keyword*"
```

## Structure Overview

See [docs/00-START-HERE.md](00-START-HERE.md) for full documentation structure explanation.

---
EOF

# 6. Final commit
git add .
git commit -m "Migration complete and validated"
git tag migration-complete-20251205

# 7. Team training session (in person)
# - Show new structure
# - Demo agent usage
# - Answer questions
# - Update team wiki
```

**Migration Complete!** TaskMaster successfully migrated in 2 days.

**Results:**
- ✅ 842-line README → 5 focused files
- ✅ Organized documentation structure implemented
- ✅ All documentation organized
- ✅ Agents functional
- ✅ Team trained

---

### Example 2: Python Django REST API Project

**Project Profile:**
- **Name:** HealthTracker API
- **Size:** 95 files, 8K LOC
- **Stack:** Python 3.11 + Django 4.2 + PostgreSQL + Docker
- **Team:** 2 developers
- **Current State:** Production app, adding v2 API

**Migration Approach:** Quick migration (1 day)

```bash
# Quick migration for smaller Python project

# 1. Audit (30 min)
find . -name "*.py" | wc -l  # 62 Python files
find . -name "*.md" | wc -l  # 6 docs
cat docs/API.md | wc -l      # 320 lines (shard)

# 2. Install (30 min)
cp -r /path/to/agent-methodology-pack/.claude ./
cp -r /path/to/agent-methodology-pack/scripts ./
mkdir -p docs/{1-BASELINE/{product,architecture},2-MANAGEMENT/epics/current,4-DEVELOPMENT/{api,guides}}

# 3. Create core files (1 hour)
cat > CLAUDE.md << 'EOF'
# HealthTracker API

## Quick Facts
| Aspect | Value |
|--------|-------|
| Name | HealthTracker API |
| Type | REST API |
| Version | 2.0.0-alpha |
| Status | Production + V2 Development |

## Documentation
- **API v1:** @docs/4-DEVELOPMENT/api/v1/README.md
- **API v2:** @docs/4-DEVELOPMENT/api/v2/README.md
- **Architecture:** @docs/1-BASELINE/architecture/overview.md

## Tech Stack
Python 3.11 + Django 4.2 + DRF + PostgreSQL + Docker

## Current Work
@PROJECT-STATE.md

---
EOF

# 4. Migrate docs (2 hours)
mv docs/API.md docs/4-DEVELOPMENT/api/v1/README.md
mv docs/ARCHITECTURE.md docs/1-BASELINE/architecture/overview.md
# Split API.md into endpoints
# Create v2 API docs

# 5. Create Epic for v2 API work (1 hour)
cat > docs/2-MANAGEMENT/epics/current/epic-05-api-v2.md << 'EOF'
# Epic 5: API v2

## Goal
Build v2 of API with improved authentication and GraphQL support.

## Stories
- [ ] 5.1: GraphQL schema design
- [ ] 5.2: JWT authentication
- [ ] 5.3: Rate limiting
- [ ] 5.4: API versioning

## Status
Planning phase
EOF

# 6. Validate (30 min)
bash scripts/validate-docs.sh
wc -l CLAUDE.md  # Verify <70 lines

# Total: ~6 hours (1 day)
```

**Key differences from React example:**
- Smaller project = faster migration
- Less sharding needed
- Simpler team coordination (2 people)
- Focus on API documentation organization

---

### Example 3: Monorepo (Multiple Projects)

**Project Profile:**
- **Name:** AcmeCorp Monorepo
- **Size:** 850 files across 5 sub-projects
- **Stack:** Mixed (React, Node.js, Python, Go)
- **Team:** 12 developers across 3 teams
- **Current State:** Active development, multiple teams

**Migration Approach:** Incremental (2 weeks, one project at a time)

#### Week 1: Infrastructure + Project 1

**Monday: Monorepo setup**

```bash
# Root structure
acme-corp/
├── CLAUDE.md (monorepo overview)
├── PROJECT-STATE.md (overall state)
├── .claude/ (shared agents)
├── docs/ (shared docs)
├── projects/
│   ├── web-app/
│   ├── mobile-app/
│   ├── api-gateway/
│   ├── auth-service/
│   └── analytics/
```

**Root CLAUDE.md:**

```markdown
# AcmeCorp Monorepo

## Quick Facts
| Aspect | Value |
|--------|-------|
| Name | AcmeCorp Products |
| Type | Monorepo (5 projects) |
| Status | Active Development |

## Projects

- **web-app:** @projects/web-app/CLAUDE.md
- **mobile-app:** @projects/mobile-app/CLAUDE.md
- **api-gateway:** @projects/api-gateway/CLAUDE.md
- **auth-service:** @projects/auth-service/CLAUDE.md
- **analytics:** @projects/analytics/CLAUDE.md

## Shared Resources

- **Agents:** @.claude/agents/
- **Shared Docs:** @docs/

## Current State

@PROJECT-STATE.md

---
```

**Tuesday-Friday: Migrate web-app (first project)**

```bash
cd projects/web-app

# Create project-specific CLAUDE.md
cat > CLAUDE.md << 'EOF'
# AcmeCorp Web App

## Project
Web application for customer portal

## Documentation
@docs/00-START-HERE.md

## Shared Agents
@../../.claude/agents/

## Tech Stack
React + TypeScript

## Current Work
@PROJECT-STATE.md

---
EOF

# Organize web-app docs to standard structure
mkdir -p docs/{1-BASELINE,2-MANAGEMENT,3-ARCHITECTURE,4-DEVELOPMENT}
# ... organize web-app docs ...

# Commit
git add .
git commit -m "web-app: Documentation organized"
```

#### Week 2: Projects 2-5

**Monday-Tuesday:** Organize mobile-app
**Wednesday:** Organize api-gateway
**Thursday:** Organize auth-service
**Friday:** Organize analytics + final validation

**Benefits of incremental approach:**
- ✅ Teams learn gradually
- ✅ Each project is a learning experience
- ✅ Minimal disruption
- ✅ Can adjust strategy between projects

**Challenges:**
- 🟡 Coordination across teams
- 🟡 Shared documentation organization
- 🟡 Monorepo-specific tooling

---

