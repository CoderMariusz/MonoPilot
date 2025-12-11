#!/bin/bash
#
# Universal Cache System - Migration Script
# Version: 2.0.0
# Purpose: Automatically migrate cache system to another project
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}     ${PURPLE}Universal Cache System - Migration Tool${NC}          ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}     Version 2.0.0 | Zero-Config Portability          ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in agent-methodology-pack
if [ ! -d ".claude/cache" ]; then
    echo -e "${RED}❌ Error: This script must be run from agent-methodology-pack root${NC}"
    echo -e "   Current dir: $(pwd)"
    echo -e "   Expected: .claude/cache/ directory"
    exit 1
fi

# Get source path
SOURCE_DIR="$(pwd)/.claude/cache"
SOURCE_SCRIPTS="$(pwd)/scripts"

echo -e "${BLUE}📦 Source:${NC} $SOURCE_DIR"
echo ""

# Ask for target project
echo -e "${YELLOW}📍 Target Project Path:${NC}"
echo -e "   Enter full path to your project (e.g., ~/Documents/Projects/my-app)"
read -p "   > " TARGET_PROJECT

# Expand tilde
TARGET_PROJECT="${TARGET_PROJECT/#\~/$HOME}"

# Validate target
if [ ! -d "$TARGET_PROJECT" ]; then
    echo -e "${YELLOW}⚠️  Directory doesn't exist. Create it? (y/n)${NC}"
    read -p "   > " CREATE_DIR
    if [[ $CREATE_DIR =~ ^[Yy]$ ]]; then
        mkdir -p "$TARGET_PROJECT"
        echo -e "${GREEN}✅ Created: $TARGET_PROJECT${NC}"
    else
        echo -e "${RED}❌ Aborted${NC}"
        exit 1
    fi
fi

TARGET_CACHE="$TARGET_PROJECT/.claude/cache"

echo ""
echo -e "${BLUE}🎯 Target:${NC} $TARGET_CACHE"
echo ""

# Migration options
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}Migration Options:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}1)${NC} Minimal (cache system only)      ${GREEN}~50KB${NC}"
echo -e "     - config.json, *.py files"
echo -e "     - Empty cache directories"
echo ""
echo -e "  ${YELLOW}2)${NC} Standard (+ scripts)             ${GREEN}~100KB${NC}"
echo -e "     - Cache system + monitoring scripts"
echo ""
echo -e "  ${YELLOW}3)${NC} Full (entire .claude structure)  ${GREEN}~5MB${NC}"
echo -e "     - Agents, patterns, workflows, templates"
echo ""
echo -e "  ${YELLOW}4)${NC} Custom (select what to copy)"
echo ""

read -p "Select option (1-4): " MIGRATION_OPTION

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Execute migration
case $MIGRATION_OPTION in
    1)
        echo -e "${BLUE}📦 Minimal Migration${NC}"
        echo ""

        # Create target directory
        mkdir -p "$TARGET_CACHE"

        # Copy core files
        echo -e "  ${CYAN}→${NC} Copying config.json..."
        cp "$SOURCE_DIR/config.json" "$TARGET_CACHE/"

        echo -e "  ${CYAN}→${NC} Copying cache_manager.py..."
        cp "$SOURCE_DIR/cache_manager.py" "$TARGET_CACHE/"

        echo -e "  ${CYAN}→${NC} Copying semantic_cache.py..."
        cp "$SOURCE_DIR/semantic_cache.py" "$TARGET_CACHE/"

        # Create directory structure
        echo -e "  ${CYAN}→${NC} Creating cache directories..."
        mkdir -p "$TARGET_CACHE"/{hot,cold,semantic,qa-patterns,logs}

        # Create .gitkeep files
        touch "$TARGET_CACHE"/hot/.gitkeep
        touch "$TARGET_CACHE"/cold/.gitkeep
        touch "$TARGET_CACHE"/semantic/.gitkeep
        touch "$TARGET_CACHE"/qa-patterns/.gitkeep
        touch "$TARGET_CACHE"/logs/.gitkeep

        echo -e "${GREEN}✅ Minimal migration complete${NC}"
        ;;

    2)
        echo -e "${BLUE}📦 Standard Migration (cache + scripts)${NC}"
        echo ""

        # Cache system
        echo -e "  ${CYAN}→${NC} Copying cache system..."
        mkdir -p "$TARGET_CACHE"
        cp -r "$SOURCE_DIR"/* "$TARGET_CACHE/"

        # Scripts
        echo -e "  ${CYAN}→${NC} Copying scripts..."
        mkdir -p "$TARGET_PROJECT/scripts"
        cp "$SOURCE_SCRIPTS"/cache-*.sh "$TARGET_PROJECT/scripts/"
        chmod +x "$TARGET_PROJECT/scripts"/cache-*.sh

        echo -e "${GREEN}✅ Standard migration complete${NC}"
        ;;

    3)
        echo -e "${BLUE}📦 Full Migration (entire .claude)${NC}"
        echo ""

        # Entire .claude directory
        echo -e "  ${CYAN}→${NC} Copying .claude directory..."
        cp -r "$(pwd)/.claude" "$TARGET_PROJECT/"

        # Scripts
        echo -e "  ${CYAN}→${NC} Copying scripts..."
        mkdir -p "$TARGET_PROJECT/scripts"
        cp "$SOURCE_SCRIPTS"/*.sh "$TARGET_PROJECT/scripts/"
        chmod +x "$TARGET_PROJECT/scripts"/*.sh

        # Templates (if any)
        if [ -d "$(pwd)/templates" ]; then
            echo -e "  ${CYAN}→${NC} Copying templates..."
            cp -r "$(pwd)/templates" "$TARGET_PROJECT/"
        fi

        echo -e "${GREEN}✅ Full migration complete${NC}"
        ;;

    4)
        echo -e "${BLUE}📦 Custom Migration${NC}"
        echo ""

        # Cache system (required)
        echo -e "  ${CYAN}→${NC} Copying cache system (required)..."
        mkdir -p "$TARGET_CACHE"
        cp -r "$SOURCE_DIR"/* "$TARGET_CACHE/"

        # Scripts (optional)
        echo -e ""
        read -p "  Copy monitoring scripts? (y/n): " COPY_SCRIPTS
        if [[ $COPY_SCRIPTS =~ ^[Yy]$ ]]; then
            mkdir -p "$TARGET_PROJECT/scripts"
            cp "$SOURCE_SCRIPTS"/cache-*.sh "$TARGET_PROJECT/scripts/"
            chmod +x "$TARGET_PROJECT/scripts"/cache-*.sh
            echo -e "  ${GREEN}✅ Scripts copied${NC}"
        fi

        # Agents (optional)
        echo -e ""
        read -p "  Copy agent definitions? (y/n): " COPY_AGENTS
        if [[ $COPY_AGENTS =~ ^[Yy]$ ]]; then
            mkdir -p "$TARGET_PROJECT/.claude/agents"
            cp -r "$(pwd)/.claude/agents"/* "$TARGET_PROJECT/.claude/agents/"
            echo -e "  ${GREEN}✅ Agents copied${NC}"
        fi

        # Patterns (optional)
        echo -e ""
        read -p "  Copy patterns? (y/n): " COPY_PATTERNS
        if [[ $COPY_PATTERNS =~ ^[Yy]$ ]]; then
            mkdir -p "$TARGET_PROJECT/.claude/patterns"
            cp -r "$(pwd)/.claude/patterns"/* "$TARGET_PROJECT/.claude/patterns/"
            echo -e "  ${GREEN}✅ Patterns copied${NC}"
        fi

        echo -e "${GREEN}✅ Custom migration complete${NC}"
        ;;

    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

# API Keys setup
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}API Keys Setup:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Cache system requires API keys:"
echo -e "    ${YELLOW}1)${NC} OPENAI_API_KEY (for semantic cache)"
echo -e "    ${YELLOW}2)${NC} CLAUDE_API_KEY (optional)"
echo ""
echo -e "  ${YELLOW}Options:${NC}"
echo -e "    ${CYAN}→${NC} Use global environment variables (recommended)"
echo -e "    ${CYAN}→${NC} Create .env file in project"
echo ""
read -p "  Create .env file? (y/n): " CREATE_ENV

if [[ $CREATE_ENV =~ ^[Yy]$ ]]; then
    echo ""
    read -sp "  Enter OpenAI API Key: " OPENAI_KEY
    echo ""

    cat > "$TARGET_PROJECT/.env" << EOF
# API Keys for Universal Cache System
OPENAI_API_KEY=$OPENAI_KEY
EOF

    echo -e "  ${GREEN}✅ .env created${NC}"

    # Add to .gitignore
    if [ -f "$TARGET_PROJECT/.gitignore" ]; then
        if ! grep -q "^\.env$" "$TARGET_PROJECT/.gitignore"; then
            echo -e "\n# API Keys\n.env\n.env.local" >> "$TARGET_PROJECT/.gitignore"
            echo -e "  ${GREEN}✅ Added to .gitignore${NC}"
        fi
    else
        echo -e "# API Keys\n.env\n.env.local" > "$TARGET_PROJECT/.gitignore"
        echo -e "  ${GREEN}✅ Created .gitignore${NC}"
    fi
else
    echo -e "  ${YELLOW}ℹ️  Make sure to set OPENAI_API_KEY environment variable${NC}"
fi

# Global cache setup
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}Global Cache (Cross-Project Sharing):${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Global cache allows sharing agents, patterns, and Q&A"
echo -e "  between all your projects."
echo ""
read -p "  Enable global cache? (y/n): " ENABLE_GLOBAL

if [[ $ENABLE_GLOBAL =~ ^[Yy]$ ]]; then
    # Create global directory
    GLOBAL_DIR="$HOME/.claude-agent-pack/global"
    mkdir -p "$GLOBAL_DIR"/{agents,patterns,skills,qa-patterns}

    echo -e "  ${GREEN}✅ Global directory created: $GLOBAL_DIR${NC}"

    # Update config
    if [ -f "$TARGET_CACHE/config.json" ]; then
        # Enable shared cache in config
        python3 -c "
import json
with open('$TARGET_CACHE/config.json', 'r') as f:
    config = json.load(f)
config['sharedCache']['enabled'] = True
with open('$TARGET_CACHE/config.json', 'w') as f:
    json.dump(config, f, indent=2)
print('  ✅ Updated config.json')
"
    fi

    echo -e "  ${GREEN}✅ Global cache enabled${NC}"
else
    echo -e "  ${YELLOW}ℹ️  Global cache disabled (can enable later in config.json)${NC}"
fi

# Dependencies check
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}Dependencies Check:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "  ${GREEN}✅ Python: $PYTHON_VERSION${NC}"
else
    echo -e "  ${RED}❌ Python 3 not found${NC}"
    echo -e "     Install: https://python.org/downloads"
fi

# Check pip packages
echo -e ""
echo -e "  Checking Python packages..."

if python3 -c "import chromadb" 2>/dev/null; then
    echo -e "  ${GREEN}✅ chromadb installed${NC}"
else
    echo -e "  ${YELLOW}⚠️  chromadb not installed${NC}"
    read -p "     Install now? (y/n): " INSTALL_CHROMA
    if [[ $INSTALL_CHROMA =~ ^[Yy]$ ]]; then
        pip install chromadb
        echo -e "  ${GREEN}✅ chromadb installed${NC}"
    fi
fi

if python3 -c "import openai" 2>/dev/null; then
    echo -e "  ${GREEN}✅ openai installed${NC}"
else
    echo -e "  ${YELLOW}⚠️  openai not installed${NC}"
    read -p "     Install now? (y/n): " INSTALL_OPENAI
    if [[ $INSTALL_OPENAI =~ ^[Yy]$ ]]; then
        pip install openai
        echo -e "  ${GREEN}✅ openai installed${NC}"
    fi
fi

# Final verification
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}Verification:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$TARGET_PROJECT"

# Test cache manager
echo -e "  ${YELLOW}Testing cache manager...${NC}"
if python3 .claude/cache/cache_manager.py > /dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Cache manager works!${NC}"
else
    echo -e "  ${RED}❌ Cache manager failed${NC}"
    echo -e "     Check: python3 .claude/cache/cache_manager.py"
fi

# Summary
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}                  ${GREEN}MIGRATION COMPLETE!${NC}                     ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📁 Project:${NC} $TARGET_PROJECT"
echo -e "${BLUE}📊 Cache System:${NC} $TARGET_CACHE"
echo ""
echo -e "${PURPLE}Next Steps:${NC}"
echo -e "  ${CYAN}1.${NC} cd $TARGET_PROJECT"
echo -e "  ${CYAN}2.${NC} python .claude/cache/cache_manager.py  ${GREEN}# Test${NC}"

if [ -f "$TARGET_PROJECT/scripts/cache-stats.sh" ]; then
    echo -e "  ${CYAN}3.${NC} bash scripts/cache-stats.sh           ${GREEN}# Dashboard${NC}"
fi

echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "  ${CYAN}→${NC} docs/CACHE-QUICK-START.md"
echo -e "  ${CYAN}→${NC} docs/UNIVERSAL-CACHE-SYSTEM.md"
echo ""
echo -e "${GREEN}✨ Enjoy 95% token savings! 🎉${NC}"
echo ""
