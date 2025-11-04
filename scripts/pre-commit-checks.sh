#!/bin/bash

# Pre-commit checks script
# This script performs comprehensive TypeScript and quality checks before allowing a commit

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print section header
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Print success message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Print error message
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Print warning message
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository!"
    exit 1
fi

# Get staged TypeScript files
STAGED_TS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)

if [ -z "$STAGED_TS_FILES" ]; then
    print_warning "No TypeScript files staged for commit. Skipping TypeScript checks."
    exit 0
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Pre-Commit TypeScript Checks        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Count staged files
FILE_COUNT=$(echo "$STAGED_TS_FILES" | wc -l)
print_header "Found $FILE_COUNT TypeScript file(s) to check"
echo "$STAGED_TS_FILES"

# Check 1: TypeScript Type Checking
print_header "1/4 - TypeScript Type Checking"
echo "Running: pnpm type-check"
if pnpm type-check; then
    print_success "TypeScript type checking passed!"
else
    print_error "TypeScript type checking failed!"
    echo ""
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  TYPE CHECK FAILED                     ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "Fix the TypeScript errors above before committing."
    echo "To see detailed errors, run: ${YELLOW}pnpm type-check${NC}"
    echo ""
    echo "Common fixes:"
    echo "  • Check for missing properties in objects"
    echo "  • Verify import paths are correct"
    echo "  • Ensure types match between assignments"
    echo "  • Add null checks where needed"
    echo ""
    echo "See DEPLOYMENT_ERRORS_ANALYSIS.md for more details."
    exit 1
fi

# Check 2: ESLint
print_header "2/4 - ESLint Checking"
echo "Running: pnpm lint"
if pnpm lint; then
    print_success "ESLint checking passed!"
else
    print_warning "ESLint found issues. Attempting auto-fix..."
    if pnpm lint:fix; then
        print_success "ESLint auto-fix succeeded!"
    else
        print_error "ESLint checking failed and auto-fix couldn't resolve all issues!"
        echo ""
        echo "Fix the linting errors above or run: ${YELLOW}pnpm lint:fix${NC}"
        exit 1
    fi
fi

# Check 3: Prettier Format Check
print_header "3/4 - Code Formatting Check"
echo "Running: pnpm format:check"
if pnpm format:check; then
    print_success "Code formatting is correct!"
else
    print_warning "Code formatting issues found. Auto-formatting..."
    if pnpm format; then
        print_success "Code auto-formatted successfully!"
        # Stage the formatted files
        echo "$STAGED_TS_FILES" | xargs git add
        print_success "Formatted files re-staged for commit"
    else
        print_error "Code formatting failed!"
        echo ""
        echo "Run: ${YELLOW}pnpm format${NC} to fix formatting issues"
        exit 1
    fi
fi

# Check 4: Validate imports
print_header "4/4 - Import Validation"
echo "Checking for common import issues..."

IMPORT_ERRORS=0

for file in $STAGED_TS_FILES; do
    if [ -f "$file" ]; then
        # Check for lazy import issues
        if grep -q "LazyAddItemModal\|LazyEditItemModal" "$file" 2>/dev/null; then
            print_error "Found lazy import issue in: $file"
            echo "  Replace LazyAddItemModal/LazyEditItemModal with actual component imports"
            IMPORT_ERRORS=$((IMPORT_ERRORS + 1))
        fi
        
        # Check for potential path issues
        if grep -q "@/components/modals/" "$file" 2>/dev/null; then
            print_warning "Check import paths in: $file"
            echo "  Verify that imported components exist at specified paths"
        fi
    fi
done

if [ $IMPORT_ERRORS -gt 0 ]; then
    print_error "Found $IMPORT_ERRORS import error(s)!"
    echo ""
    echo "Fix import issues before committing."
    exit 1
else
    print_success "Import validation passed!"
fi

# Final success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ ALL CHECKS PASSED!                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Your code is ready to commit! 🚀"
echo ""

exit 0

