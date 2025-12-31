#!/bin/bash
# TypeScript Watch Mode for MonoPilot
# Provides real-time TypeScript error feedback during development
#
# Usage:
#   ./scripts/type-check-watch.sh
#   pnpm type-check:watch

set -e

FRONTEND_DIR="apps/frontend"

# Setup colors
setup_colors() {
    if [[ -t 1 ]] && command -v tput >/dev/null 2>&1; then
        RED=$(tput setaf 1 2>/dev/null || echo "")
        GREEN=$(tput setaf 2 2>/dev/null || echo "")
        YELLOW=$(tput setaf 3 2>/dev/null || echo "")
        BLUE=$(tput setaf 4 2>/dev/null || echo "")
        CYAN=$(tput setaf 6 2>/dev/null || echo "")
        BOLD=$(tput bold 2>/dev/null || echo "")
        RESET=$(tput sgr0 2>/dev/null || echo "")
    else
        RED="" GREEN="" YELLOW="" BLUE="" CYAN="" BOLD="" RESET=""
    fi
}

setup_colors

echo "${CYAN}${BOLD}╔═══════════════════════════════════════════════════╗${RESET}"
echo "${CYAN}${BOLD}║   TypeScript Watch Mode                          ║${RESET}"
echo "${CYAN}${BOLD}╚═══════════════════════════════════════════════════╝${RESET}"
echo ""
echo "${BLUE}Starting watch mode... Press Ctrl+C to stop${RESET}"
echo "${BLUE}Changes to TypeScript files will trigger automatic type-checking${RESET}"
echo ""

cd "$FRONTEND_DIR" || exit 1

# Use tsc built-in watch mode with custom output parsing
npx tsc --noEmit --watch --pretty | while IFS= read -r line; do
    # Colorize output based on content
    if [[ "$line" =~ "Found".*"error" ]]; then
        # Error summary line
        echo -e "${RED}${BOLD}$line${RESET}"
    elif [[ "$line" =~ "Watching for file changes" ]]; then
        # Watch status line
        echo -e "${GREEN}${BOLD}$line${RESET}"
    elif [[ "$line" =~ "File change detected" ]]; then
        # File change notification
        echo -e "${CYAN}$line${RESET}"
    elif [[ "$line" =~ "error TS"[0-9]+ ]]; then
        # Individual error line
        echo -e "${RED}$line${RESET}"
    elif [[ "$line" =~ "Starting compilation" ]]; then
        # Compilation start
        echo -e "${BLUE}$line${RESET}"
    elif [[ "$line" =~ "Compilation complete" ]]; then
        # Compilation complete
        echo -e "${GREEN}$line${RESET}"
    else
        # Default output
        echo "$line"
    fi
done
