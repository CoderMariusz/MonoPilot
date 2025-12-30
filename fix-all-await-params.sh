#!/bin/bash

find apps/frontend/app/api -name "route.ts" -type f -exec grep -l "Promise<{" {} \; | while read file; do
  echo "Processing: $file"
  sed -i 's/(await params)\.id/id/g' "$file"
  sed -i 's/(await params)\.lineId/lineId/g' "$file"
  sed -i 's/(await params)\.lpId/lpId/g' "$file"
  sed -i 's/(await params)\.productId/productId/g' "$file"
  sed -i 's/(await params)\.allergenId/allergenId/g' "$file"
done

echo ""
echo "All (await params).X patterns fixed!"
