#!/bin/bash
#
# Cache Import Script
# Version: 2.0.0
# Purpose: Restore cache data from archive file
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

IMPORT_FILE="$1"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}        ${YELLOW}CACHE IMPORT${NC}                                      ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if archive file provided
if [ -z "$IMPORT_FILE" ]; then
    echo -e "${RED}❌ No archive file specified${NC}"
    echo ""
    echo "Usage: bash scripts/cache-import.sh <archive.tar.gz>"
    echo ""
    echo "Available archives:"
    ls -lh cache_backup_*.tar.gz 2>/dev/null || echo "  (none found)"
    exit 1
fi

# Check if archive exists
if [ ! -f "$IMPORT_FILE" ]; then
    echo -e "${RED}❌ Archive not found: $IMPORT_FILE${NC}"
    exit 1
fi

# Check metadata
METADATA_FILE="${IMPORT_FILE}.meta.json"
if [ -f "$METADATA_FILE" ]; then
    echo -e "${YELLOW}Archive Metadata:${NC}"
    echo ""

    if command -v python3 &> /dev/null; then
        python3 << EOF
import json
with open('$METADATA_FILE') as f:
    meta = json.load(f)
    print(f"  Export Date:  {meta.get('exportDate', 'unknown')}")
    print(f"  Archive Size: {meta.get('archiveSize', 'unknown')}")
    print(f"  Version:      {meta.get('version', 'unknown')}")

    contents = meta.get('contents', {})
    cold = contents.get('coldCache', {})
    print(f"  Cold Cache:   {cold.get('entries', 0)} entries ({cold.get('size', 'unknown')})")
EOF
    else
        cat "$METADATA_FILE"
    fi
    echo ""
fi

# Confirm import
read -p "Import cache from this archive? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠${NC} Import cancelled"
    exit 0
fi

# Backup current cache (if exists)
CACHE_DIR=".claude/cache"
if [ -d "$CACHE_DIR" ]; then
    BACKUP_DIR="${CACHE_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}Backing up current cache to: ${CYAN}$BACKUP_DIR${NC}"
    cp -r "$CACHE_DIR" "$BACKUP_DIR"
    echo -e "${GREEN}✓${NC} Current cache backed up"
    echo ""
fi

# Extract archive
echo -e "${YELLOW}Extracting archive...${NC}"

tar -xzf "$IMPORT_FILE" 2>/dev/null || {
    echo -e "${RED}❌ Failed to extract archive${NC}"
    echo ""
    echo "If you have a backup, restore it:"
    echo "  rm -rf $CACHE_DIR"
    echo "  mv $BACKUP_DIR $CACHE_DIR"
    exit 1
}

echo -e "${GREEN}✓${NC} Archive extracted successfully"
echo ""

# Verify extraction
echo -e "${YELLOW}Verifying cache contents...${NC}"
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

echo ""

# Summary
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}IMPORT COMPLETE${NC}                                         ${CYAN}║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "  Imported:    ${CYAN}$IMPORT_FILE${NC}"
echo -e "  Backup:      ${CYAN}${BACKUP_DIR:-none}${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${GREEN}✅ Cache imported successfully!${NC}"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "  1. Run: bash scripts/cache-stats.sh"
echo "  2. Test cache functionality"
echo "  3. If something's wrong, restore backup:"
echo "     rm -rf $CACHE_DIR && mv $BACKUP_DIR $CACHE_DIR"
echo ""
