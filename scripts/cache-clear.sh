#!/bin/bash
#
# Cache Clear Script
# Version: 2.0.0
# Purpose: Clear cache layers (hot, cold, semantic, or all)
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

CACHE_DIR=".claude/cache"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}        ${YELLOW}CACHE CLEAR${NC}                                       ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
LAYER="${1:-all}"

case "$LAYER" in
  hot)
    echo -e "${YELLOW}Clearing HOT cache (in-memory)...${NC}"
    # Hot cache is in-memory, nothing to clear on disk
    echo -e "${GREEN}✓${NC} Hot cache will be cleared on next restart"
    ;;

  cold)
    echo -e "${YELLOW}Clearing COLD cache (disk)...${NC}"
    if [ -d "$CACHE_DIR/cold" ]; then
      COUNT=$(find "$CACHE_DIR/cold" -name "*.json.gz" | wc -l)
      rm -f "$CACHE_DIR/cold"/*.json.gz 2>/dev/null || true
      echo -e "${GREEN}✓${NC} Removed $COUNT cold cache entries"
    else
      echo -e "${YELLOW}⚠${NC} Cold cache directory not found"
    fi
    ;;

  semantic)
    echo -e "${YELLOW}Clearing SEMANTIC cache (ChromaDB)...${NC}"
    if [ -d "$CACHE_DIR/semantic" ]; then
      # Clear ChromaDB data
      rm -rf "$CACHE_DIR/semantic"/*.sqlite3* 2>/dev/null || true
      rm -rf "$CACHE_DIR/semantic"/*/  2>/dev/null || true
      echo -e "${GREEN}✓${NC} Semantic cache cleared"
    else
      echo -e "${YELLOW}⚠${NC} Semantic cache directory not found"
    fi
    ;;

  qa|patterns)
    echo -e "${YELLOW}Clearing Q&A PATTERNS cache...${NC}"
    if [ -d "$CACHE_DIR/qa-patterns" ]; then
      rm -rf "$CACHE_DIR/qa-patterns"/* 2>/dev/null || true
      echo -e "${GREEN}✓${NC} Q&A patterns cleared"
    else
      echo -e "${YELLOW}⚠${NC} Q&A patterns directory not found"
    fi
    ;;

  logs)
    echo -e "${YELLOW}Clearing LOGS...${NC}"
    if [ -d "$CACHE_DIR/logs" ]; then
      rm -f "$CACHE_DIR/logs"/*.log 2>/dev/null || true
      rm -f "$CACHE_DIR/logs"/*.json 2>/dev/null || true
      echo -e "${GREEN}✓${NC} Logs cleared"
    else
      echo -e "${YELLOW}⚠${NC} Logs directory not found"
    fi
    ;;

  all)
    echo -e "${YELLOW}Clearing ALL caches...${NC}"
    echo ""

    # Cold cache
    if [ -d "$CACHE_DIR/cold" ]; then
      COUNT=$(find "$CACHE_DIR/cold" -name "*.json.gz" | wc -l)
      rm -f "$CACHE_DIR/cold"/*.json.gz 2>/dev/null || true
      echo -e "${GREEN}✓${NC} Cold cache: $COUNT entries removed"
    fi

    # Semantic cache
    if [ -d "$CACHE_DIR/semantic" ]; then
      rm -rf "$CACHE_DIR/semantic"/*.sqlite3* 2>/dev/null || true
      rm -rf "$CACHE_DIR/semantic"/*/  2>/dev/null || true
      echo -e "${GREEN}✓${NC} Semantic cache cleared"
    fi

    # Q&A patterns
    if [ -d "$CACHE_DIR/qa-patterns" ]; then
      rm -rf "$CACHE_DIR/qa-patterns"/* 2>/dev/null || true
      echo -e "${GREEN}✓${NC} Q&A patterns cleared"
    fi

    # Logs (optional - ask first)
    read -p "Also clear logs? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      rm -f "$CACHE_DIR/logs"/*.log 2>/dev/null || true
      rm -f "$CACHE_DIR/logs"/*.json 2>/dev/null || true
      echo -e "${GREEN}✓${NC} Logs cleared"
    fi

    echo -e "${GREEN}✓${NC} Hot cache will be cleared on next restart"
    ;;

  *)
    echo -e "${RED}❌ Invalid layer: $LAYER${NC}"
    echo ""
    echo "Usage: bash scripts/cache-clear.sh [layer]"
    echo ""
    echo "Layers:"
    echo "  hot       - Clear in-memory cache"
    echo "  cold      - Clear disk cache"
    echo "  semantic  - Clear semantic/vector cache"
    echo "  qa        - Clear Q&A patterns"
    echo "  logs      - Clear logs"
    echo "  all       - Clear everything (default)"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}✅ Cache clear complete!${NC}"
echo ""
echo -e "Run ${YELLOW}bash scripts/cache-stats.sh${NC} to verify"
echo ""
