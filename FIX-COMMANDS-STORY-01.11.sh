#!/bin/bash
# Frontend Integration Fix Commands for Story 01.11
# Run these commands to fix the production-lines page.tsx

set -e  # Exit on error

FILE="apps/frontend/app/(authenticated)/settings/production-lines/page.tsx"

echo "Fixing Story 01.11 frontend integration issues..."

# Fix 1: Update header comment (lines 1-7)
sed -i '1,7d' "$FILE"
cat > temp_header.txt << 'EOF'
/**
 * Production Line Management Page
 * Story: 01.11 - Production Lines CRUD
 * Purpose: Main page for production line CRUD operations
 */
EOF
cat temp_header.txt "$FILE" > temp_file.txt
mv temp_file.txt "$FILE"
rm temp_header.txt

echo "✓ Fixed header comment"

# Fix 2: Update import statement
sed -i "s|import { ProductionLineFormModal } from '@/components/settings/ProductionLineFormModal'|import { ProductionLineModal } from '@/components/settings/production-lines'|g" "$FILE"

echo "✓ Fixed import statement"

# Fix 3: Fix API paths
sed -i "s|/api/settings/lines|/api/v1/settings/production-lines|g" "$FILE"
sed -i "s|/api/settings/warehouses|/api/v1/settings/warehouses|g" "$FILE"

echo "✓ Fixed API paths"

# Fix 4: Update component usage (this requires manual intervention)
echo ""
echo "⚠️  MANUAL FIX REQUIRED:"
echo "   Lines ~329-342: Update ProductionLineFormModal to ProductionLineModal"
echo "   See FRONTEND-INTEGRATION-FIX-STORY-01.11.md for interface differences"
echo ""

echo "Done! Review changes with: git diff $FILE"
