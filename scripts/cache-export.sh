#!/bin/bash
#
# Cache Export Script
# Version: 2.0.0
# Purpose: Backup cache data to archive file
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

CACHE_DIR=".claude/cache"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_FILE="${1:-cache_backup_${TIMESTAMP}.tar.gz}"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}        ${YELLOW}CACHE EXPORT${NC}                                      ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if cache directory exists
if [ ! -d "$CACHE_DIR" ]; then
    echo -e "${RED}❌ Cache directory not found: $CACHE_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}Exporting cache to: ${CYAN}$EXPORT_FILE${NC}"
echo ""

# Calculate sizes
echo -e "${YELLOW}Analyzing cache contents...${NC}"
echo ""

if [ -d "$CACHE_DIR/cold" ]; then
    COLD_COUNT=$(find "$CACHE_DIR/cold" -name "*.json.gz" | wc -l)
    COLD_SIZE=$(du -sh "$CACHE_DIR/cold" 2>/dev/null | cut -f1 || echo "0")
    echo -e "  Cold Cache:     ${GREEN}$COLD_COUNT${NC} entries (${CYAN}$COLD_SIZE${NC})"
fi

if [ -d "$CACHE_DIR/semantic" ]; then
    SEMANTIC_SIZE=$(du -sh "$CACHE_DIR/semantic" 2>/dev/null | cut -f1 || echo "0")
    echo -e "  Semantic Cache: ${CYAN}$SEMANTIC_SIZE${NC}"
fi

if [ -d "$CACHE_DIR/qa-patterns" ]; then
    QA_SIZE=$(du -sh "$CACHE_DIR/qa-patterns" 2>/dev/null | cut -f1 || echo "0")
    echo -e "  Q&A Patterns:   ${CYAN}$QA_SIZE${NC}"
fi

if [ -d "$CACHE_DIR/logs" ]; then
    LOGS_SIZE=$(du -sh "$CACHE_DIR/logs" 2>/dev/null | cut -f1 || echo "0")
    echo -e "  Logs:           ${CYAN}$LOGS_SIZE${NC}"
fi

echo ""

# Create archive
echo -e "${YELLOW}Creating archive...${NC}"

tar -czf "$EXPORT_FILE" \
    --exclude="$CACHE_DIR/hot/*" \
    --exclude="$CACHE_DIR/*.pyc" \
    --exclude="$CACHE_DIR/__pycache__" \
    "$CACHE_DIR" 2>/dev/null || {
        echo -e "${RED}❌ Failed to create archive${NC}"
        exit 1
    }

ARCHIVE_SIZE=$(du -sh "$EXPORT_FILE" | cut -f1)

echo -e "${GREEN}✓${NC} Archive created: ${CYAN}$EXPORT_FILE${NC} (${CYAN}$ARCHIVE_SIZE${NC})"
echo ""

# Create metadata file
METADATA_FILE="${EXPORT_FILE}.meta.json"
cat > "$METADATA_FILE" << EOF
{
  "exportDate": "$(date -Iseconds)",
  "archiveFile": "$EXPORT_FILE",
  "archiveSize": "$ARCHIVE_SIZE",
  "contents": {
    "coldCache": {
      "entries": ${COLD_COUNT:-0},
      "size": "$COLD_SIZE"
    },
    "semanticCache": {
      "size": "$SEMANTIC_SIZE"
    },
    "qaPatterns": {
      "size": "$QA_SIZE"
    },
    "logs": {
      "size": "$LOGS_SIZE"
    }
  },
  "version": "2.0.0"
}
EOF

echo -e "${GREEN}✓${NC} Metadata saved: ${CYAN}$METADATA_FILE${NC}"
echo ""

# Summary
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}EXPORT COMPLETE${NC}                                         ${CYAN}║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "  Archive:     ${CYAN}$EXPORT_FILE${NC}"
echo -e "  Size:        ${CYAN}$ARCHIVE_SIZE${NC}"
echo -e "  Metadata:    ${CYAN}$METADATA_FILE${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${GREEN}✅ Cache exported successfully!${NC}"
echo ""
echo -e "${YELLOW}💡 To restore:${NC}"
echo -e "   bash scripts/cache-import.sh $EXPORT_FILE"
echo ""
