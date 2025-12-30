#!/bin/bash

# Fix files that have (await params).X patterns

files_to_fix=(
  "apps/frontend/app/api/v1/settings/modules/[id]/toggle/route.ts"
  "apps/frontend/app/api/v1/settings/sessions/[id]/route.ts"
  "apps/frontend/app/api/v1/settings/users/[id]/password/reset/route.ts"
  "apps/frontend/app/api/v1/settings/users/[id]/sessions/route.ts"
  "apps/frontend/app/api/v1/settings/users/invitations/[id]/route.ts"
  "apps/frontend/app/api/v1/settings/users/invitations/[id]/resend/route.ts"
)

for file in "${files_to_fix[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing: $file"
    # Replace (await params).id with just id
    sed -i 's/(await params)\.id/id/g' "$file"
    # Replace (await params).lineId with just lineId
    sed -i 's/(await params)\.lineId/lineId/g' "$file"
    # Replace (await params).lpId with just lpId
    sed -i 's/(await params)\.lpId/lpId/g' "$file"
    # Replace (await params).productId with just productId
    sed -i 's/(await params)\.productId/productId/g' "$file"
    # Replace (await params).allergenId with just allergenId
    sed -i 's/(await params)\.allergenId/allergenId/g' "$file"
    echo "  ✓ Fixed"
  fi
done

echo ""
echo "All remaining files fixed!"
