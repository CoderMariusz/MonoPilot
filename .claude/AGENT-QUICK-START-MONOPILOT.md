# Agent Methodology Pack - MonoPilot Quick Start Guide

**Project**: MonoPilot (Food Manufacturing MES)
**Status**: Production Ready (100% UAT pass rate)
**Version**: 1.0.0
**Last Updated**: 2025-12-14

---

## Overview

The Agent Methodology Pack provides 20 specialized agents optimized for MonoPilot development. This guide shows you how to use agents effectively for food manufacturing MES workflows.

**What You Get**:
- 20 specialized agents (Planning, Development, Quality, Operations)
- Cache system with 95% token savings
- MCP server for advanced caching
- Multi-model strategy for cost optimization

**System Status**:
- Agent System: Production Ready
- Cache System: Operational (3/4 layers working immediately)
- MCP Server: Configured (requires Claude Code restart)
- Blockers: NONE

---

## Quick Start (5 Minutes)

### 1. Check Cache System

```bash
# View cache performance dashboard
bash scripts/cache-stats.sh

# Test cache with sample queries
bash scripts/cache-test.sh
```

**Expected Output**: Dashboard showing 3/4 cache layers operational, hit rates, and savings.

### 2. Invoke the ORCHESTRATOR

The ORCHESTRATOR is your entry point for multi-agent workflows:

```
@.claude/agents/ORCHESTRATOR.md

Please [describe your task]
```

**Examples**:
- "Implement the BOM CRUD endpoints for Technical Module"
- "Create UX wireframes for Production Module dashboard"
- "Review the costing-service.ts for bugs and optimization"

The ORCHESTRATOR will automatically route to the appropriate agent.

### 3. Check Agent System Status

```bash
# View all available agents
ls .claude/agents/

# View agent state
cat .claude/state/AGENT-STATE.md
```

---

## Most Useful Agents for MonoPilot

### For Food Manufacturing MES Development

| Agent | Use When | MonoPilot Examples |
|-------|----------|-------------------|
| **ORCHESTRATOR** | Multi-agent coordination | "Create Technical Module with tests and docs" |
| **BACKEND-DEV** | API implementation | "Implement BOM cost calculation endpoints" |
| **FRONTEND-DEV** | UI implementation | "Create TEC-006 BOM detail page" |
| **UX-DESIGNER** | Wireframe creation | "Design Production Module dashboard" |
| **ARCHITECT-AGENT** | System design | "Design traceability system for food safety" |
| **PM-AGENT** | Requirements (PRD) | "Create PRD for OEE Module (Epic 10)" |
| **TEST-ENGINEER** | Test planning | "Create test plan for routing operations" |
| **CODE-REVIEWER** | Code review | "Review costing-service.ts for accuracy" |
| **QA-AGENT** | Quality assurance | "Test BOM yield calculation feature" |
| **TECH-WRITER** | Documentation | "Document cache system usage" |

### Domain-Specific Recommendations

Based on architect review (92/100 score), consider creating these domain-specific agents:

1. **FOOD-DOMAIN-EXPERT** (HIGH PRIORITY)
   - Skills: GS1 standards, allergen management, traceability patterns
   - Use: Validate food manufacturing requirements

2. **COMPLIANCE-AGENT** (HIGH PRIORITY)
   - Skills: HACCP validation, food safety compliance
   - Use: Ensure regulatory compliance

---

## Common MonoPilot Workflows

### Workflow 1: Implement a New Module

**Goal**: Create a complete module (Settings, Technical, Production, etc.)

**Steps**:
```
1. @ORCHESTRATOR.md
   "Implement [Module Name] module with:
   - Backend APIs (CRUD + business logic)
   - Frontend pages (list + detail + modals)
   - Tests (unit + integration)
   - Documentation"

2. ORCHESTRATOR routes to:
   - PM-AGENT → Review PRD
   - UX-DESIGNER → Create wireframes (if needed)
   - BACKEND-DEV → Implement APIs
   - FRONTEND-DEV → Implement UI
   - TEST-ENGINEER → Create tests
   - TECH-WRITER → Document APIs
```

**Example**: Implementing Technical Module (Epic 2)
- 19 wireframes created by UX-DESIGNER
- 28 API endpoints by BACKEND-DEV
- 15 pages by FRONTEND-DEV
- Achieved 98% FR coverage

### Workflow 2: Implement a Single Feature

**Goal**: Add a specific feature to existing module

**Steps**:
```
1. Identify feature type:
   - Backend logic? → @BACKEND-DEV.md
   - UI change? → @FRONTEND-DEV.md
   - Both? → @ORCHESTRATOR.md (coordinates both)

2. Example (FR-2.34: BOM Yield Calculation):
   - BACKEND-DEV implements calculateBOMYield()
   - Creates migration 051 (yield_percent field)
   - FRONTEND-DEV adds yield display to TEC-006
```

**MonoPilot-Specific**:
- Always check PRD first: `docs/1-BASELINE/product/modules/[module].md`
- Reference wireframes: `docs/3-ARCHITECTURE/ux/wireframes/[ID].md`
- Check architecture: `docs/1-BASELINE/architecture/modules/[module].md`

### Workflow 3: Debug an Issue

**Goal**: Fix a bug in existing code

**Steps**:
```
1. @CODE-REVIEWER.md or @SENIOR-DEV.md
   "Review [file] for [issue description]"

2. Agent analyzes and suggests fix

3. @BACKEND-DEV.md or @FRONTEND-DEV.md
   "Implement the fix suggested by CODE-REVIEWER"

4. @QA-AGENT.md
   "Test the fix for [FR-X.XX]"
```

**Example**: Fixing TEC-008 schema mismatch
- CODE-REVIEWER identified missing fields (code, is_reusable)
- ARCHITECT-AGENT updated architecture docs
- BACKEND-DEV created migration 044
- QA-AGENT validated schema alignment

### Workflow 4: Create Documentation

**Goal**: Document a feature, API, or module

**Steps**:
```
1. @TECH-WRITER.md
   "Document [feature/API/module] based on [source]"

2. Agent creates documentation following MonoPilot style:
   - Clear, concise language
   - Code examples
   - Food manufacturing context
```

**Example**: This document was created by TECH-WRITER!

### Workflow 5: Review Quality

**Goal**: Ensure code quality before merging

**Steps**:
```
1. @CODE-REVIEWER.md
   "Review [file/module] for:
   - Code quality
   - Security issues
   - MonoPilot patterns compliance"

2. @QA-AGENT.md
   "Test [feature] against:
   - FR requirements
   - Acceptance criteria
   - Food safety regulations"

3. Address issues and re-review
```

---

## Cache System Overview

### 4-Layer Cache Architecture

| Layer | Description | Status | Savings |
|-------|-------------|--------|---------|
| **1. Claude Prompt** | Automatic by Claude API | Enabled | 90% cost, 85% latency |
| **2. Exact Match** | Hot (5min) + Cold (24h) | Operational | 100% hit on exact queries |
| **3. Semantic** | OpenAI embeddings | Requires API key | 40-60% on similar queries |
| **4. Global KB** | Shared agents/skills | Enabled | 21 agents, 52 skills |

**Total Expected Savings**: 95% tokens, 90% cost

### How to Use Cache

**Check Performance**:
```bash
# View cache dashboard
bash scripts/cache-stats.sh

# Expected output:
# - Hot Cache: 50% hit rate
# - Cold Cache: 50% hit rate
# - Overall: 100% hit rate (on test queries)
```

**Monitor Savings**:
```bash
# View metrics
cat .claude/cache/logs/metrics.json

# View access logs
tail -50 .claude/cache/logs/access.log
```

**Clear Cache (if needed)**:
```bash
# Clear all caches
bash scripts/cache-clear.sh

# Clear specific layer
# Edit cache-clear.sh and uncomment desired layer
```

### Cache Best Practices

1. **Use descriptive task names** - Better cache hit rates
   - Good: "Calculate BOM total cost including labor and overhead"
   - Bad: "Do calculation"

2. **Reuse common queries** - Maximize cache hits
   - Good: "Show me the BOM schema"
   - Reuses: Exact match from Hot/Cold cache

3. **Similar queries benefit from semantic cache** (requires OpenAI API key)
   - Query 1: "How to calculate BOM cost?"
   - Query 2: "What's the BOM costing formula?" ← Semantic match!

---

## Commands Reference

### Cache Management
```bash
# Performance dashboard
bash scripts/cache-stats.sh

# Test cache system
bash scripts/cache-test.sh

# Clear caches
bash scripts/cache-clear.sh

# Export cache for backup
bash scripts/cache-export.sh

# Import cache from backup
bash scripts/cache-import.sh

# Warm cache with common queries
bash scripts/cache-warm.sh
```

### Agent Management
```bash
# List all agents
ls .claude/agents/

# View agent state
cat .claude/state/AGENT-STATE.md

# View agent metrics
cat .claude/state/METRICS.md

# Sync agents to global KB
bash scripts/sync-agents-to-global.sh

# Sync skills to global KB
bash scripts/sync-skills-to-global.sh
```

### Project Analysis
```bash
# Analyze entire project
bash scripts/analyze-project.sh

# Monitor context usage
bash scripts/context-monitor.sh

# Validate documentation
bash scripts/validate-docs.sh

# Count tokens
bash scripts/token-counter.sh
```

---

## MonoPilot-Specific Tips

### 1. Always Reference PRDs

Before implementing any feature, check the PRD:

```bash
# View module PRD
cat docs/1-BASELINE/product/modules/technical.md

# Search for specific FR
grep "FR-2.34" docs/1-BASELINE/product/modules/technical.md
```

### 2. Follow UX Wireframes

All UI work should reference wireframes:

```bash
# View wireframe
cat docs/3-ARCHITECTURE/ux/wireframes/TEC-006-bom-detail.md

# List all wireframes
ls docs/3-ARCHITECTURE/ux/wireframes/
```

### 3. Check Architecture First

Before making schema changes:

```bash
# View module architecture
cat docs/1-BASELINE/architecture/modules/technical.md

# Check ADRs for decisions
ls docs/1-BASELINE/architecture/decisions/
```

### 4. Use Multi-Tenancy Patterns

MonoPilot is multi-tenant (org_id everywhere):

- All tables have `org_id UUID NOT NULL`
- RLS policies on every query
- Check `.claude/PATTERNS.md` for examples

### 5. Follow Food Manufacturing Domain

MonoPilot is for food manufacturers:

- GS1 standards (GTIN-14, GS1-128, SSCC-18)
- Allergen management (14 EU allergens)
- Traceability (forward/backward/recall)
- HACCP/food safety compliance
- FIFO/FEFO inventory management

### 6. Test with Food Manufacturing Scenarios

When testing, use realistic scenarios:

- Products: "Chocolate Chip Cookie", "Tomato Sauce"
- Materials: "Flour (Wheat)", "Tomatoes (Fresh)"
- Allergens: "Wheat", "Milk", "Eggs"
- Lots: "LOT-2025-001"
- Traceability: "Recall all products with LOT-X"

---

## Troubleshooting

### Issue 1: MCP Tools Not Available

**Symptom**: cache_get, cache_set tools not found

**Solution**:
```
1. Close Claude Code
2. Restart Claude Code
3. MCP tools will auto-register
4. Test: Try using cache_get tool
```

**Status**: One-time setup (1 minute)

### Issue 2: Semantic Cache Not Working

**Symptom**: Semantic cache shows 0% hit rate

**Solution**:
```
1. Open .claude/cache/config.json
2. Update openai_api_key with valid key
3. Restart cache system
4. Run: bash scripts/cache-test.sh
```

**Status**: Optional (3/4 layers work without it)

### Issue 3: Agent Not Responding

**Symptom**: Agent invocation fails or returns generic response

**Solution**:
```
1. Check agent exists: ls .claude/agents/[domain]/[AGENT].md
2. Use full path: @.claude/agents/planning/PM-AGENT.md
3. Verify agent has required skills loaded
4. Check ORCHESTRATOR for routing rules
```

### Issue 4: Cache Hit Rate Low

**Symptom**: Cache dashboard shows <50% hit rate

**Solution**:
```
1. Use more consistent query patterns
2. Enable semantic cache (OpenAI API key)
3. Warm cache: bash scripts/cache-warm.sh
4. Check similarity threshold (default: 0.72)
```

---

## Next Steps

### Immediate (Today)
1. Run `bash scripts/cache-stats.sh` - Verify cache system
2. Read `.claude/agents/ORCHESTRATOR.md` - Understand routing
3. Try invoking an agent - Test with simple task

### Day 1
1. Restart Claude Code - Activate MCP tools
2. Review agent files - Understand capabilities
3. Test multi-agent workflow - Use ORCHESTRATOR

### Week 1
1. Update OpenAI API key (optional) - Enable semantic cache
2. Create agent habit - Use agents for all tasks
3. Monitor cache savings - Check metrics weekly

### Future
1. Create domain agents - FOOD-DOMAIN-EXPERT, COMPLIANCE-AGENT
2. Enhance patterns - Add MonoPilot-specific patterns
3. Share learnings - Document best practices

---

## Additional Resources

### Documentation Files
- **Full Documentation**: See `.claude/AGENT-ARCHITECTURE-REVIEW.md` (comprehensive review)
- **UAT Report**: See `UAT-REPORT.md` (100% pass rate)
- **Cache Reference**: See `.claude/CACHE-QUICK-REFERENCE.md` (cache details)
- **Known Issues**: See `.claude/AGENT-SYSTEM-KNOWN-ISSUES.md` (troubleshooting)
- **Project State**: See `.claude/PROJECT-STATE.md` (current state)

### MonoPilot Documentation
- **PRD Index**: `docs/1-BASELINE/product/prd.md` (11 modules)
- **Architecture**: `docs/1-BASELINE/architecture/README.md` (24 docs)
- **UX Wireframes**: `docs/3-ARCHITECTURE/ux/wireframes/` (48 screens)
- **Patterns**: `.claude/PATTERNS.md` (code patterns)
- **Tables**: `.claude/TABLES.md` (43 tables)

### External Links
- Agent Methodology Pack: See `agent-methodology-pack/` directory
- Cache System Docs: See `docs/CACHE-QUICK-START.md`
- MCP Server: See `.claude/mcp-servers/cache-server/`

---

## Support

### Questions?
1. Check this guide first
2. Read `.claude/AGENT-ARCHITECTURE-REVIEW.md`
3. Check `UAT-REPORT.md` for known issues
4. Review agent files in `.claude/agents/`

### Need Help?
1. Use @DISCOVERY-AGENT.md for unclear tasks
2. Use @ORCHESTRATOR.md for complex workflows
3. Check PROJECT-STATE.md for current status

---

**Status**: Ready to Use
**Confidence**: HIGH
**Blockers**: NONE

**Happy Coding with Agent Methodology Pack!**
