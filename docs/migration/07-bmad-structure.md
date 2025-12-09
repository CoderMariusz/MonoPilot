## 7. BMAD Structure Mapping

### What is BMAD?

**BMAD** = **B**aseline, **M**anagement, **A**rchitecture, **D**evelopment

A documentation organization pattern that separates concerns:

- **1-BASELINE:** Foundation (requirements, architecture, research)
- **2-MANAGEMENT:** Execution (epics, stories, sprints)
- **3-ARCHITECTURE:** Design (UX, wireframes, specs)
- **4-DEVELOPMENT:** Implementation (code docs, APIs, guides)
- **5-ARCHIVE:** History (old sprints, deprecated docs)

### Mapping Common Structures to BMAD

#### Typical Project → BMAD Mapping

| Your Current File | BMAD Location | Notes |
|-------------------|---------------|-------|
| **Root Files** |  |  |
| README.md | docs/1-BASELINE/product/overview.md | Product overview |
| CHANGELOG.md | Keep in root | Version history |
| LICENSE | Keep in root | Legal |
| .gitignore | Keep in root | Config |
| **Documentation** |  |  |
| docs/overview.md | docs/1-BASELINE/product/overview.md | Product info |
| docs/architecture.md | docs/1-BASELINE/architecture/overview.md | System design |
| docs/database.md | docs/1-BASELINE/architecture/database-schema.md | Data model |
| docs/requirements.md | docs/1-BASELINE/product/requirements.md | Requirements |
| docs/api.md | docs/4-DEVELOPMENT/api/README.md | API docs |
| docs/setup.md | INSTALL.md → root | Installation |
| docs/tutorial.md | QUICK-START.md → root | Quick start |
| **Project Management** |  |  |
| docs/roadmap.md | docs/2-MANAGEMENT/roadmap.md | Product roadmap |
| docs/backlog.md | docs/2-MANAGEMENT/backlog.md | Story backlog |
| docs/sprint-notes.md | docs/2-MANAGEMENT/sprints/sprint-NN.md | Sprint docs |
| **Design** |  |  |
| docs/ux/*.png | docs/3-ARCHITECTURE/ux/wireframes/ | Wireframes |
| docs/user-flows.md | docs/3-ARCHITECTURE/ux/flows/ | User flows |
| **Development** |  |  |
| docs/dev-guide.md | docs/4-DEVELOPMENT/guides/README.md | Dev guide |
| docs/testing.md | docs/4-DEVELOPMENT/guides/testing.md | Test guide |
| docs/deployment.md | docs/4-DEVELOPMENT/guides/deployment.md | Deploy guide |
| docs/contributing.md | docs/4-DEVELOPMENT/guides/contributing.md | Contribution |
| **Archive** |  |  |
| docs/old-* | docs/5-ARCHIVE/ | Old versions |
| docs/deprecated-* | docs/5-ARCHIVE/deprecated/ | Deprecated |

#### Framework-Specific Mappings

**React/Vue/Angular Projects:**

| Your File | BMAD Location |
|-----------|---------------|
| README.md | docs/1-BASELINE/product/overview.md |
| src/README.md | docs/4-DEVELOPMENT/code-structure.md |
| docs/components.md | docs/3-ARCHITECTURE/ux/specs/components.md |
| docs/state-management.md | docs/1-BASELINE/architecture/state-management.md |
| docs/routing.md | docs/1-BASELINE/architecture/routing.md |
| .storybook/README.md | docs/4-DEVELOPMENT/storybook.md |

**Node.js/Express API Projects:**

| Your File | BMAD Location |
|-----------|---------------|
| README.md | docs/1-BASELINE/product/overview.md |
| docs/api-spec.md | docs/4-DEVELOPMENT/api/README.md |
| docs/authentication.md | docs/4-DEVELOPMENT/api/authentication.md |
| docs/database.md | docs/1-BASELINE/architecture/database-schema.md |
| docs/deployment.md | docs/4-DEVELOPMENT/guides/deployment.md |

**Python/Django Projects:**

| Your File | BMAD Location |
|-----------|---------------|
| README.md | docs/1-BASELINE/product/overview.md |
| docs/models.md | docs/1-BASELINE/architecture/data-models.md |
| docs/views.md | docs/4-DEVELOPMENT/views.md |
| docs/admin.md | docs/4-DEVELOPMENT/admin-guide.md |
| docs/deployment.md | docs/4-DEVELOPMENT/guides/deployment.md |

**Mobile (React Native / Flutter) Projects:**

| Your File | BMAD Location |
|-----------|---------------|
| README.md | docs/1-BASELINE/product/overview.md |
| docs/screens.md | docs/3-ARCHITECTURE/ux/specs/screens.md |
| docs/navigation.md | docs/1-BASELINE/architecture/navigation.md |
| docs/state.md | docs/1-BASELINE/architecture/state-management.md |
| docs/build.md | docs/4-DEVELOPMENT/guides/building.md |

#### Decision Tree: Where Does This Go?

```
Is this document about...

├─ What we're building & why?
│  └─ docs/1-BASELINE/product/
│
├─ How the system is designed?
│  └─ docs/1-BASELINE/architecture/
│
├─ What we learned from research?
│  └─ docs/1-BASELINE/research/
│
├─ What features we're building (epics/stories)?
│  └─ docs/2-MANAGEMENT/epics/
│
├─ Sprint planning & tracking?
│  └─ docs/2-MANAGEMENT/sprints/
│
├─ User interface design?
│  └─ docs/3-ARCHITECTURE/ux/
│
├─ How to implement/code/deploy?
│  └─ docs/4-DEVELOPMENT/
│
└─ Old/deprecated/historical?
   └─ docs/5-ARCHIVE/
```

### Creating BMAD Structure

```bash
# Full BMAD structure
mkdir -p docs/{1-BASELINE/{product,architecture,research},2-MANAGEMENT/{epics/{current,completed},sprints},3-ARCHITECTURE/ux/{flows,wireframes,specs},4-DEVELOPMENT/{api,guides,notes},5-ARCHIVE/{old-sprints,deprecated}}

# Create index file
cat > docs/00-START-HERE.md << 'EOF'
# Start Here

## Documentation Structure (BMAD)

### 1-BASELINE - What & Why
Foundation documents defining the product and system.

- **product/** - PRD, features, requirements
- **architecture/** - System design, ADRs, schemas
- **research/** - User research, technical research

### 2-MANAGEMENT - Plan & Track
Project management and execution tracking.

- **epics/** - Feature specifications
  - current/ - Active epics
  - completed/ - Finished epics
- **sprints/** - Sprint documentation
- **backlog.md** - Story backlog

### 3-ARCHITECTURE - Design
User experience and interface design.

- **ux/** - UX documentation
  - flows/ - User flow diagrams
  - wireframes/ - UI wireframes
  - specs/ - Component specifications

### 4-DEVELOPMENT - How
Implementation guides and code documentation.

- **api/** - API documentation
- **guides/** - Development guides
- **notes/** - Implementation notes

### 5-ARCHIVE - History
Completed work and deprecated documents.

- **old-sprints/** - Past sprint docs
- **deprecated/** - Outdated documentation

## Getting Started

1. **New to project?** Read docs/1-BASELINE/product/overview.md
2. **Starting development?** Check docs/2-MANAGEMENT/epics/current/
3. **Need API docs?** See docs/4-DEVELOPMENT/api/
4. **Current sprint?** Check @PROJECT-STATE.md

---
*See @CLAUDE.md for project overview*
EOF
```

---

