# Migration Guide

Complete guide for migrating existing projects to the Agent Methodology Pack.

**Version:** 1.0.0
**Last Updated:** 2025-12-05

---

## Quick Start

```bash
# Interactive mode - recommended
bash scripts/init-interactive.sh
```

## Guide Sections

| Section | Description | Time |
|---------|-------------|------|
| [01-overview.md](01-overview.md) | What is migration, when to migrate | 5 min |
| [02-prerequisites.md](02-prerequisites.md) | Requirements, backups, git setup | 5 min |
| [03-quick-migration.md](03-quick-migration.md) | Fast-track for small projects | 15 min |
| [04-full-migration.md](04-full-migration.md) | Comprehensive phased approach | 1-3 days |
| [05-migration-phases.md](05-migration-phases.md) | Detailed phase instructions | Reference |
| [06-document-sharding.md](06-document-sharding.md) | How to split large files | Reference |
| [07-bmad-structure.md](07-bmad-structure.md) | BMAD folder structure mapping | Reference |
| [08-agent-workspaces.md](08-agent-workspaces.md) | Setting up agent state files | Reference |
| [09-troubleshooting.md](09-troubleshooting.md) | Common issues and fixes | Reference |
| [10-checklist.md](10-checklist.md) | Migration validation checklist | Reference |
| [11-examples.md](11-examples.md) | Real-world migration examples | Reference |
| [12-faq.md](12-faq.md) | Frequently asked questions | Reference |

## Available Scripts

| Script | Purpose |
|--------|---------|
| `init-interactive.sh` | Interactive wizard (recommended) |
| `analyze-project.sh` | Analyze existing project |
| `migrate-docs.sh` | Auto-move docs to BMAD structure |
| `validate-migration.sh` | Validate migration |

## Which Guide Do I Need?

```
Project Size?
│
├─ Small (<50 files) → 03-quick-migration.md (15 min)
│
├─ Medium (50-200 files) → 04-full-migration.md (4-8 hours)
│
└─ Large (200+ files) → 04-full-migration.md + 05-migration-phases.md (1-3 days)
```

---

*See @CLAUDE.md for project overview*
