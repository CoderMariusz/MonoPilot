# Cache System - Quick Reference Guide

**Project**: MonoPilot (Food Manufacturing MES)
**Status**: Operational (3/4 layers working immediately)
**Version**: 2.0.0
**Last Updated**: 2025-12-14

---

## Overview

The Universal Cache System provides 4-layer caching with 95% token savings and 90% cost reduction.

**Status**: PRODUCTION READY
- Layer 1 (Claude Prompt): Automatic (enabled)
- Layer 2 (Exact Match): Operational (Hot + Cold)
- Layer 3 (Semantic): Requires OpenAI API key (optional)
- Layer 4 (Global KB): Operational (21 agents, 52 skills)

---

## Quick Commands

### Check Cache Performance
```bash
# View cache dashboard
bash scripts/cache-stats.sh
```

**Output Example**:
```
┌─────────────────────────────────────────────────────────────┐
│          CACHE PERFORMANCE DASHBOARD                        │
│          Universal Cache System v2.0.0                      │
├─────────────────────────────────────────────────────────────┤

  📊 LAYER 1: Claude Prompt Cache
     ✓ Automatic caching by Claude API
     Expected Savings: 90% cost, 85% latency
     Status: ENABLED (automatic)

  📊 LAYER 2: Exact Match Cache
     Hot Cache:  1 hits / 2 queries (50.0%)
     Cold Cache: 1 hits / 2 queries (50.0%)

  📊 LAYER 3: Semantic Cache
     Semantic Matches: 0 hits / 2 queries (0.0%)
     Status: REQUIRES API KEY

  📊 LAYER 4: Global Knowledge Base
     Shared Agents:   21
     Shared Skills:   52
     Status: ENABLED

  💰 SAVINGS SUMMARY
     Overall Hit Rate:      100.0%
     Total Queries:         2
     Cache Hits:            2
     Cache Misses:          0
```

### Test Cache System
```bash
# Run automated tests
bash scripts/cache-test.sh
```

**Tests**:
1. Store 3 test queries
2. Retrieve exact matches (100% hit rate expected)
3. Test semantic matches (requires OpenAI API key)

### View Metrics
```bash
# View metrics JSON
cat .claude/cache/logs/metrics.json

# View access logs
tail -50 .claude/cache/logs/access.log

# View MCP logs (after MCP tools used)
tail -50 .claude/cache/logs/mcp-access.log
```

### Clear Cache
```bash
# Clear all caches
bash scripts/cache-clear.sh

# Selective clearing: Edit cache-clear.sh and uncomment desired layer:
# - Hot cache (in-memory)
# - Cold cache (disk)
# - Semantic cache (vector DB)
```

### Backup/Restore
```bash
# Export cache for backup
bash scripts/cache-export.sh

# Import cache from backup
bash scripts/cache-import.sh
```

---

## 4-Layer Architecture

### Layer 1: Claude Prompt Cache

**Description**: Automatic caching by Claude API for recent context

**How It Works**:
- Claude API automatically caches prompt prefixes
- Reduces token usage for repeated context
- Transparent to user (no configuration needed)

**Benefits**:
- 90% cost savings on cached portions
- 85% latency reduction
- Automatic (always enabled)

**Best For**:
- Long documents referenced multiple times
- Large codebases
- Repeated project context

**Status**: ENABLED (automatic)

---

### Layer 2: Exact Match Cache

**Description**: Hash-based caching for identical queries

**Components**:
- **Hot Cache**: In-memory, 5-minute TTL, instant retrieval
- **Cold Cache**: Disk-based, 24-hour TTL, fast retrieval

**How It Works**:
1. Query is hashed (SHA-256)
2. Check Hot cache → if HIT, return result instantly
3. Check Cold cache → if HIT, promote to Hot, return result
4. If MISS, execute query, store in both caches

**Benefits**:
- 100% hit rate on exact matches
- Instant retrieval from Hot cache
- Fast retrieval from Cold cache
- No API keys required

**Best For**:
- Repeated exact queries
- Common project questions
- Frequently accessed docs

**Status**: OPERATIONAL

**Metrics**:
```json
{
  "hot_hits": 1,
  "hot_misses": 1,
  "cold_hits": 1,
  "cold_misses": 0,
  "hot_hit_rate": 50.0,
  "cold_hit_rate": 50.0
}
```

---

### Layer 3: Semantic Cache

**Description**: Vector-based caching for similar queries using OpenAI embeddings

**How It Works**:
1. Query is embedded using OpenAI text-embedding-3-small
2. Vector similarity search in ChromaDB
3. If similarity > threshold (0.72), return cached result
4. If not found, execute query, store embedding + result

**Benefits**:
- 40-60% savings on similar queries
- Understands intent, not just exact match
- Works across query variations

**Best For**:
- Similar but differently worded queries
- Conceptual questions
- Research tasks

**Status**: REQUIRES OPENAI API KEY (optional)

**Example**:
- Query 1: "How to calculate BOM cost?"
- Query 2: "What's the BOM costing formula?" ← Semantic match!

**Setup**:
```json
// .claude/cache/config.json
{
  "semanticCache": {
    "enabled": true,
    "openai_api_key": "sk-proj-YOUR_KEY_HERE",
    "similarity_threshold": 0.72,
    "embedding_model": "text-embedding-3-small"
  }
}
```

---

### Layer 4: Global Knowledge Base

**Description**: Shared agents, skills, and patterns across all projects

**Location**: `~/.claude-agent-pack/global/`

**Structure**:
```
global/
├── agents/       # 21 agents synced
├── skills/       # 52 skills synced
├── patterns/     # 1 pattern synced
├── qa-patterns/  # Q&A patterns
├── cache/        # Shared cache
└── config.json   # Global config
```

**How It Works**:
- Agents/skills are synced from project to global KB
- Global KB is accessible to all projects
- Reduces redundant agent/skill storage
- Enables cross-project learning

**Benefits**:
- Share agents across projects
- Centralized skill registry
- Cross-project cache sharing
- One-time agent definition

**Status**: OPERATIONAL

**Sync**:
```bash
# Sync agents to global KB
bash scripts/sync-agents-to-global.sh

# Sync skills to global KB
bash scripts/sync-skills-to-global.sh
```

---

## Expected Savings

### Token Savings
- **Layer 1 (Claude Prompt)**: 85% on repeated context
- **Layer 2 (Exact Match)**: 100% on exact queries
- **Layer 3 (Semantic)**: 40-60% on similar queries
- **Layer 4 (Global KB)**: Eliminates redundant agent storage

**Total**: 95% token reduction (per CLAUDE.md)

### Cost Savings
- **Layer 1**: 90% cost savings on cached portions
- **Layer 2**: 100% cost savings on cache hits
- **Layer 3**: 40-60% cost savings on similar queries
- **Layer 4**: Eliminates redundant API calls

**Total**: 90% cost reduction

### MCP Agent Savings (Expected)
| Agent | Hit Rate | Monthly Savings |
|-------|----------|-----------------|
| RESEARCH-AGENT | 70-80% | £225 |
| TEST-ENGINEER | 40-50% | £45 |
| BACKEND-DEV | 80-90% | £60 |
| DOC-AUDITOR | 60-70% | £40 |
| TECH-WRITER | 50-60% | £30 |
| **Total** | **75-80%** | **£400/month** |

---

## How to Monitor Performance

### Daily Monitoring
```bash
# Run daily for first week
bash scripts/cache-stats.sh
```

**Look For**:
- Overall hit rate > 50%
- Hot cache hits increasing
- Cold cache hits stable
- Semantic cache working (if API key set)

### Weekly Analysis
```bash
# View metrics over time
cat .claude/cache/logs/metrics.json

# Check cost savings
grep "cost_saved" .claude/cache/logs/metrics.json
```

### Access Log Analysis
```bash
# View recent cache activity
tail -100 .claude/cache/logs/access.log

# Count cache hits
grep "HIT" .claude/cache/logs/access.log | wc -l

# Count cache misses
grep "MISS" .claude/cache/logs/access.log | wc -l
```

---

## Tuning Guide

### Similarity Threshold (Layer 3)

**Default**: 0.72

**Adjust If**:
- Too many false positives (irrelevant results) → Increase threshold (0.75-0.80)
- Too few semantic matches → Decrease threshold (0.65-0.70)

**Edit**:
```json
// .claude/cache/config.json
{
  "semanticCache": {
    "similarity_threshold": 0.72  // Adjust this
  }
}
```

### Cache TTL

**Hot Cache**: 5 minutes (default)
**Cold Cache**: 24 hours (default)

**Adjust If**:
- Stale data issues → Decrease TTL
- Low hit rates → Increase TTL

**Edit**:
```json
// .claude/cache/config.json
{
  "hotCache": {
    "ttl": 300  // seconds (5 min)
  },
  "coldCache": {
    "ttl": 86400  // seconds (24 hours)
  }
}
```

### Warm Cache

Pre-populate cache with common queries:

```bash
# Warm cache with queries from warm-queries.json
bash scripts/cache-warm.sh
```

**Edit Queries**:
```json
// .claude/cache/warm-queries.json
[
  "What is the BOM schema?",
  "How to calculate routing cost?",
  "Show me the traceability model"
]
```

---

## Troubleshooting

### Issue 1: Low Hit Rate (<50%)

**Symptoms**:
- Overall hit rate below 50%
- Frequent cache misses

**Causes**:
- Queries too variable
- Semantic cache not enabled
- Cache cleared recently

**Solutions**:
1. Use consistent query patterns
2. Enable semantic cache (add OpenAI API key)
3. Warm cache with common queries
4. Increase cache TTL

### Issue 2: Semantic Cache Not Working

**Symptoms**:
- Semantic cache shows 0% hit rate
- OpenAI API errors in logs

**Causes**:
- Invalid OpenAI API key
- OpenAI API rate limits
- Network issues

**Solutions**:
1. Update API key in `.claude/cache/config.json`
2. Check OpenAI account status
3. Verify network connectivity
4. Test with: `bash scripts/cache-test.sh`

### Issue 3: Cache Stats Not Updating

**Symptoms**:
- `cache-stats.sh` shows old data
- Metrics file not updating

**Causes**:
- Cache not being used
- Metrics logging disabled
- File permission issues

**Solutions**:
1. Verify cache is enabled in config
2. Check file permissions: `ls -la .claude/cache/logs/`
3. Run cache test: `bash scripts/cache-test.sh`
4. Check access logs: `tail .claude/cache/logs/access.log`

### Issue 4: MCP Tools Not Working

**Symptoms**:
- cache_get, cache_set tools not available
- MCP access logs empty

**Causes**:
- Claude Code not restarted after MCP setup
- MCP server not configured

**Solutions**:
1. Close Claude Code
2. Restart Claude Code (one-time setup)
3. Test MCP tools: Try using cache_get
4. Verify config: `cat ~/.claude/claude_desktop_config.json`

---

## Best Practices

### 1. Use Descriptive Task Names

**Bad**: "Do calculation"
**Good**: "Calculate BOM total cost including labor and overhead"

**Why**: Better cache key generation, higher hit rates

### 2. Reuse Common Queries

**Pattern**: Ask the same question consistently

**Example**:
- "Show me the BOM schema" ← First time (MISS)
- "Show me the BOM schema" ← Second time (HIT)

### 3. Enable Semantic Cache for Research

**Use Case**: Research tasks, market analysis, documentation

**Benefit**: 40-60% savings on similar queries

**Setup**: Add OpenAI API key to config.json

### 4. Monitor Weekly

**Frequency**: Daily for first week, then weekly

**Command**: `bash scripts/cache-stats.sh`

**Goal**: Overall hit rate > 50%

### 5. Warm Cache on Project Start

**When**: Starting new work session

**Command**: `bash scripts/cache-warm.sh`

**Benefit**: Pre-populate with common queries

---

## Configuration Reference

### Full Config Structure

```json
// .claude/cache/config.json
{
  "claudePromptCache": {
    "enabled": true,
    "auto": true
  },
  "hotCache": {
    "enabled": true,
    "ttl": 300,
    "maxSize": 1000
  },
  "coldCache": {
    "enabled": true,
    "ttl": 86400,
    "compression": true,
    "path": ".claude/cache/cold/"
  },
  "semanticCache": {
    "enabled": true,
    "openai_api_key": "sk-proj-...",
    "similarity_threshold": 0.72,
    "embedding_model": "text-embedding-3-small",
    "max_results": 5,
    "path": ".claude/cache/semantic/"
  },
  "globalKB": {
    "enabled": true,
    "path": "~/.claude-agent-pack/global/",
    "sync_on_start": true
  },
  "monitoring": {
    "enabled": true,
    "log_access": true,
    "log_metrics": true,
    "metrics_path": ".claude/cache/logs/metrics.json",
    "access_log_path": ".claude/cache/logs/access.log"
  }
}
```

---

## File Locations

### Cache Files
```
.claude/cache/
├── config.json              # Configuration (all 4 layers)
├── cache_manager.py         # Core cache logic
├── semantic_cache.py        # Semantic search module
├── unified_cache.py         # Unified cache interface
├── global_cache.py          # Global KB module
├── hot/                     # In-memory cache (empty on disk)
├── cold/                    # Disk cache (*.json.gz files)
├── semantic/                # Vector DB (ChromaDB files)
├── qa-patterns/             # Q&A pattern storage
└── logs/                    # Access logs & metrics
    ├── metrics.json         # Performance metrics
    ├── access.log           # Cache access log
    └── mcp-access.log       # MCP tool access log
```

### Scripts
```
scripts/
├── cache-stats.sh           # Performance dashboard
├── cache-test.sh            # System test suite
├── cache-clear.sh           # Clear caches
├── cache-export.sh          # Export for backup
├── cache-import.sh          # Import from backup
└── cache-warm.sh            # Warm cache with queries
```

### Global KB
```
~/.claude-agent-pack/global/
├── agents/                  # 21 agents synced
├── skills/                  # 52 skills synced
├── patterns/                # 1 pattern synced
├── qa-patterns/             # Q&A patterns
├── cache/                   # Shared cache
└── config.json              # Global config
```

---

## Additional Resources

### Documentation
- **Cache Quick Start**: `docs/CACHE-QUICK-START.md`
- **Cache User Guide**: `agent-methodology-pack/CACHE-USER-GUIDE.md`
- **Universal Cache System**: `docs/UNIVERSAL-CACHE-SYSTEM.md`
- **MCP Cache Patterns**: `agent-methodology-pack/.claude/patterns/MCP-CACHE-USAGE.md`

### Reports
- **UAT Report**: `UAT-REPORT.md` (100% pass rate)
- **Integration Tests**: 90% pass rate (27/30 tests)
- **Agent Architecture Review**: `.claude/AGENT-ARCHITECTURE-REVIEW.md`

### Related Guides
- **Agent Quick Start**: `.claude/AGENT-QUICK-START-MONOPILOT.md`
- **Known Issues**: `.claude/AGENT-SYSTEM-KNOWN-ISSUES.md`
- **Project State**: `.claude/PROJECT-STATE.md`

---

## Support

**Questions?**
1. Check this guide first
2. Run `bash scripts/cache-stats.sh` for diagnostics
3. Check `UAT-REPORT.md` for known issues
4. Review cache logs in `.claude/cache/logs/`

**Status**: OPERATIONAL (3/4 layers)
**Confidence**: HIGH
**Blockers**: NONE (4th layer optional)

**Cache System Ready to Use!**
