#!/bin/bash
#
# Global Knowledge Base Setup Script
# Version: 2.0.0
# Purpose: Initialize global cache directory for cross-project sharing
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m'

GLOBAL_DIR="$HOME/.claude-agent-pack/global"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}        ${YELLOW}GLOBAL KNOWLEDGE BASE SETUP${NC}                      ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Global directory: ${CYAN}$GLOBAL_DIR${NC}"
echo ""

# Check if already exists
if [ -d "$GLOBAL_DIR" ]; then
    echo -e "${YELLOW}⚠ Global directory already exists${NC}"
    read -p "Reinitialize? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Setup cancelled${NC}"
        exit 0
    fi
fi

# Create directory structure
echo -e "${YELLOW}Creating directory structure...${NC}"
echo ""

mkdir -p "$GLOBAL_DIR/agents"
echo -e "${GREEN}✓${NC} Created: $GLOBAL_DIR/agents/"

mkdir -p "$GLOBAL_DIR/patterns"
echo -e "${GREEN}✓${NC} Created: $GLOBAL_DIR/patterns/"

mkdir -p "$GLOBAL_DIR/skills"
echo -e "${GREEN}✓${NC} Created: $GLOBAL_DIR/skills/"

mkdir -p "$GLOBAL_DIR/qa-patterns"
echo -e "${GREEN}✓${NC} Created: $GLOBAL_DIR/qa-patterns/"

mkdir -p "$GLOBAL_DIR/cache"
echo -e "${GREEN}✓${NC} Created: $GLOBAL_DIR/cache/"

# Create registry files
echo ""
echo -e "${YELLOW}Creating registry files...${NC}"
echo ""

# Agent registry
cat > "$GLOBAL_DIR/agents/registry.json" << 'EOF'
{
  "version": "1.0.0",
  "agents": [],
  "metadata": {
    "createdAt": null,
    "lastUpdated": null,
    "totalAgents": 0
  }
}
EOF
echo -e "${GREEN}✓${NC} Created: agents/registry.json"

# Pattern registry
cat > "$GLOBAL_DIR/patterns/registry.json" << 'EOF'
{
  "version": "1.0.0",
  "patterns": [],
  "metadata": {
    "createdAt": null,
    "lastUpdated": null,
    "totalPatterns": 0
  }
}
EOF
echo -e "${GREEN}✓${NC} Created: patterns/registry.json"

# Skills registry
cat > "$GLOBAL_DIR/skills/registry.json" << 'EOF'
{
  "version": "1.0.0",
  "skills": [],
  "metadata": {
    "createdAt": null,
    "lastUpdated": null,
    "totalSkills": 0
  }
}
EOF
echo -e "${GREEN}✓${NC} Created: skills/registry.json"

# Global config
cat > "$GLOBAL_DIR/config.json" << 'EOF'
{
  "version": "2.0.0",
  "globalKnowledgeBase": {
    "enabled": true,
    "location": "~/.claude-agent-pack/global",
    "syncMode": "auto",
    "resolutionOrder": ["local", "global", "default"]
  },
  "sharing": {
    "shareAgents": true,
    "sharePatterns": true,
    "shareSkills": true,
    "shareQA": true
  },
  "sync": {
    "autoSync": true,
    "syncIntervalMinutes": 60,
    "conflictResolution": "merge"
  },
  "metadata": {
    "createdAt": null,
    "projects": []
  }
}
EOF
echo -e "${GREEN}✓${NC} Created: config.json"

# Create README
cat > "$GLOBAL_DIR/README.md" << 'EOF'
# Global Claude Agent Pack Knowledge Base

This directory contains shared resources across all Claude projects.

## Structure

```
~/.claude-agent-pack/global/
├── agents/          # Shared agent definitions
├── patterns/        # Reusable code patterns
├── skills/          # Cross-project skills
├── qa-patterns/     # Global Q&A cache
├── cache/           # Shared semantic cache
└── config.json      # Global configuration
```

## How It Works

1. **3-Tier Resolution**: local → global → default
2. **Auto-Sync**: Projects sync their learned patterns automatically
3. **Conflict Resolution**: Merge strategies for duplicate entries

## Usage

Projects automatically check this directory for shared resources.
No manual intervention needed - it's all automatic!

## Registries

- `agents/registry.json` - Index of all shared agents
- `patterns/registry.json` - Index of all shared patterns
- `skills/registry.json` - Index of all shared skills

---

**Version**: 2.0.0
**Created**: $(date -Iseconds)
EOF
echo -e "${GREEN}✓${NC} Created: README.md"

# Summary
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}SETUP COMPLETE${NC}                                          ${CYAN}║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "  Location:   ${CYAN}$GLOBAL_DIR${NC}"
echo -e "  Structure:"
echo -e "    ${GREEN}✓${NC} agents/       (Shared agent definitions)"
echo -e "    ${GREEN}✓${NC} patterns/     (Reusable code patterns)"
echo -e "    ${GREEN}✓${NC} skills/       (Cross-project skills)"
echo -e "    ${GREEN}✓${NC} qa-patterns/  (Global Q&A cache)"
echo -e "    ${GREEN}✓${NC} cache/        (Shared semantic cache)"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${GREEN}✅ Global Knowledge Base ready!${NC}"
echo ""
echo -e "${YELLOW}💡 Next:${NC}"
echo "  1. Projects will auto-discover this directory"
echo "  2. Learned Q&A patterns will sync automatically"
echo "  3. Check status: ls -lh $GLOBAL_DIR"
echo ""
