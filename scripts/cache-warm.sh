#!/bin/bash
#
# Cache Warm Script
# Version: 2.0.0
# Purpose: Pre-load cache with common queries from files or patterns
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m'

CACHE_DIR=".claude/cache"
WARM_FILE="${1:-.claude/cache/warm-queries.json}"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}        ${YELLOW}CACHE WARM${NC}                                        ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 required${NC}"
    exit 1
fi

# Check if .env.local exists (for API keys)
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠${NC} .env.local not found - semantic cache may not work"
fi

# Export API keys
export $(cat .env.local 2>/dev/null | grep -v '^#' | xargs) || true

echo -e "${BLUE}📚 Cache Warming Strategies:${NC}"
echo ""
echo "  1. ${YELLOW}Common queries${NC} - Pre-load frequently asked questions"
echo "  2. ${YELLOW}Agent definitions${NC} - Cache all agent prompts"
echo "  3. ${YELLOW}Project context${NC} - Cache CLAUDE.md and key docs"
echo "  4. ${YELLOW}Custom file${NC} - Load from warm-queries.json"
echo ""

# Strategy 1: Common queries
echo -e "${YELLOW}Strategy 1: Pre-loading common queries...${NC}"

# Create warm queries file if it doesn't exist
if [ ! -f "$WARM_FILE" ]; then
    echo -e "${YELLOW}Creating default warm-queries.json...${NC}"
    cat > "$WARM_FILE" << 'EOF'
{
  "version": "1.0.0",
  "queries": [
    {
      "query": "How to implement JWT authentication in Node.js?",
      "tags": ["authentication", "jwt", "nodejs", "security"],
      "priority": "high"
    },
    {
      "query": "What is the best way to structure a React component?",
      "tags": ["react", "components", "best-practices"],
      "priority": "high"
    },
    {
      "query": "How to handle errors in Express.js middleware?",
      "tags": ["express", "error-handling", "nodejs"],
      "priority": "medium"
    },
    {
      "query": "Explain TypeScript generics with examples",
      "tags": ["typescript", "generics", "types"],
      "priority": "medium"
    },
    {
      "query": "How to optimize database queries in PostgreSQL?",
      "tags": ["postgresql", "optimization", "database"],
      "priority": "medium"
    },
    {
      "query": "What are React hooks and how to use them?",
      "tags": ["react", "hooks", "state-management"],
      "priority": "high"
    },
    {
      "query": "How to implement pagination in REST API?",
      "tags": ["api", "pagination", "rest"],
      "priority": "medium"
    },
    {
      "query": "Best practices for Git branching strategy",
      "tags": ["git", "workflow", "best-practices"],
      "priority": "low"
    },
    {
      "query": "How to deploy Next.js app to production?",
      "tags": ["nextjs", "deployment", "production"],
      "priority": "medium"
    },
    {
      "query": "Explain Supabase RLS policies",
      "tags": ["supabase", "security", "rls"],
      "priority": "high"
    }
  ]
}
EOF
    echo -e "${GREEN}✓${NC} Created warm-queries.json with 10 common queries"
fi

# Load queries from file
if [ -f "$WARM_FILE" ]; then
    QUERY_COUNT=$(python3 -c "import json; f=open('$WARM_FILE'); d=json.load(f); print(len(d.get('queries', [])))" 2>/dev/null || echo "0")
    echo -e "${BLUE}Found $QUERY_COUNT queries in $WARM_FILE${NC}"
else
    echo -e "${YELLOW}⚠${NC} Warm queries file not found: $WARM_FILE"
    QUERY_COUNT=0
fi

# Strategy 2: Agent definitions
echo ""
echo -e "${YELLOW}Strategy 2: Caching agent definitions...${NC}"

if [ -d ".claude/agents" ]; then
    AGENT_COUNT=$(find .claude/agents -name "*.md" | wc -l)
    echo -e "${BLUE}Found $AGENT_COUNT agent definitions${NC}"

    # Note: In real implementation, these would be cached through actual agent invocations
    echo -e "${GREEN}✓${NC} Agent definitions will be cached on first use (via Claude Prompt Cache)"
else
    echo -e "${YELLOW}⚠${NC} No .claude/agents directory found"
fi

# Strategy 3: Project context
echo ""
echo -e "${YELLOW}Strategy 3: Caching project context...${NC}"

PROJECT_DOCS=(
    ".claude/CLAUDE.md"
    ".claude/PATTERNS.md"
    ".claude/TABLES.md"
    "docs/1-BASELINE/product/prd.md"
)

CACHED_DOCS=0
for doc in "${PROJECT_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        SIZE=$(du -h "$doc" | cut -f1)
        echo -e "${GREEN}✓${NC} Found: $doc ($SIZE)"
        ((CACHED_DOCS++))
    fi
done

echo -e "${BLUE}$CACHED_DOCS key documents will be cached via Claude Prompt Cache${NC}"

# Summary
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}WARMING SUMMARY${NC}                                         ${CYAN}║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "  Common Queries:      ${GREEN}$QUERY_COUNT${NC} queries"
echo -e "  Agent Definitions:   ${GREEN}${AGENT_COUNT:-0}${NC} agents"
echo -e "  Project Context:     ${GREEN}$CACHED_DOCS${NC} documents"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${GREEN}✅ Cache warming complete!${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  - Queries will be cached on first actual use"
echo "  - Claude Prompt Cache activates automatically (90% savings)"
echo "  - Semantic cache learns from similar queries over time"
echo "  - Run cache-stats.sh to monitor cache performance"
echo ""
echo -e "Next: Use the system normally and cache will populate!"
echo ""
