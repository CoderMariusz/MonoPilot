# MCP Profiles

Context-efficient MCP server configurations for different use cases.

## Why Profiles?

MCP servers add significant token overhead (~10k tokens each) to EVERY tool call.
Loading unnecessary MCP = wasted context = slower, more expensive sessions.

```
Without profiles:  Full MCP always loaded = ~25k tokens overhead
With profiles:     Load only what's needed = 0-10k tokens overhead
```

## Available Profiles

| Profile | MCP Servers | Token Cost | Use When |
|---------|-------------|------------|----------|
| `minimal.json` | None | ~0 | Writing code, code review, planning |
| `backend.json` | Supabase | ~10k | Executing DB operations, debugging data |
| `full.json` | All | ~25k+ | Multiple external services needed |

## Usage

### Option 1: Symlink (Recommended)
```bash
# In project root
ln -sf .claude/mcp-profiles/backend.json mcp.json
```

### Option 2: Copy
```bash
cp .claude/mcp-profiles/minimal.json mcp.json
```

### Option 3: Claude Code Settings
In Claude Code, set MCP config path per project.

## Decision Guide

```
Do you need to EXECUTE operations on external services?
├── No → Use minimal.json + relevant skills
└── Yes → Which services?
    ├── Only Supabase → Use backend.json
    └── Multiple services → Use full.json
```

## Rule of Thumb

> **90% of tasks need skills, not MCP**

| Task | Use Skill | Use MCP |
|------|-----------|---------|
| Write Supabase query code | ✅ supabase-queries | ❌ |
| Run query and debug result | ❌ | ✅ backend |
| Design RLS policy | ✅ supabase-rls | ❌ |
| Apply RLS policy to DB | ❌ | ✅ backend |
| Code review | ✅ code-review-checklist | ❌ |
| Deploy to Supabase | ❌ | ✅ backend |

## Environment Variables

Required for `backend.json` and `full.json`:
```bash
export SUPABASE_ACCESS_TOKEN="your-token"
```

Optional for `full.json`:
```bash
export PROJECT_ROOT="/path/to/project"
```

## Adding New MCP Servers

1. Add to `full.json` first (as placeholder if needed)
2. Create dedicated profile if used frequently (e.g., `docker.json`)
3. Document token cost and use cases
4. Update this README
