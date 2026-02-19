# MonoPilot Documentation

## Project Overview

MonoPilot is a Manufacturing Execution System (MES) for food manufacturing industry.
This documentation covers product requirements, architecture, and implementation details.

## Documentation Structure

### 1-BASELINE
Foundational documents:
- **product/prd.md** - Product Requirements Document (module index)
- **product/modules/** - Detailed PRD per module (settings, technical, planning, production, warehouse, quality, shipping, npd)

### 2-MANAGEMENT
Project management:
- **qa/** - QA reports and test summaries
- **reviews/** - Code review documentation

## Module Status

| Module | Epic | Status | PRD |
|--------|------|--------|-----|
| Settings | 1 | Done | [settings.md](1-BASELINE/product/modules/settings.md) |
| Technical | 2 | Done | [technical.md](1-BASELINE/product/modules/technical.md) |
| Planning | 3 | Done | [planning.md](1-BASELINE/product/modules/planning.md) |
| Production | 4 | In Progress | [production.md](1-BASELINE/product/modules/production.md) |
| Warehouse | 5 | Planned | [warehouse.md](1-BASELINE/product/modules/warehouse.md) |
| Quality | 6 | Planned | [quality.md](1-BASELINE/product/modules/quality.md) |
| Shipping | 7 | Planned | [shipping.md](1-BASELINE/product/modules/shipping.md) |
| NPD | 8 | Planned | [npd.md](1-BASELINE/product/modules/npd.md) |

## Quick Start

1. Read the [PRD Index](1-BASELINE/product/prd.md) for module overview
2. Check module-specific PRD in `1-BASELINE/product/modules/`
3. Review code in `apps/frontend/`

## Key Resources

- [README](../README.md) - Project overview and setup
- [INSTALL](../INSTALL.md) - Installation guide
- [QUICK-START](../QUICK-START.md) - Quick start guide

## Source of Truth

**Code is the source of truth.** Documentation may lag behind implementation.
When in doubt, check the actual code in `apps/frontend/`.

---
**Last Updated:** 2025-12-10
