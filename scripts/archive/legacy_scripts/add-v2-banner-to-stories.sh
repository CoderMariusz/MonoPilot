#!/bin/bash
# Add v2 migration banner to all Epic 01 story files

set -e

STORIES_DIR="docs/2-MANAGEMENT/epics/current/01-settings"
BANNER_FILE="$STORIES_DIR/_V2-BANNER-TEMPLATE.txt"

# Create banner template
cat > "$BANNER_FILE" <<'EOF'

---

## 🚧 V2 MIGRATION NOTICE

**This story is part of Settings v2 rebuild (parallel build strategy)**

### **⚠️ BUILD IN:**
```
✅ apps/frontend/app/(authenticated)/settings-v2/{your-feature}/
✅ apps/frontend/components/settings-v2/{your-feature}/
❌ DO NOT EDIT: app/(authenticated)/settings/ (v1 frozen)
```

### **📋 Instructions:**
**READ FIRST:** `docs/2-MANAGEMENT/epics/current/01-settings/V2-BUILD-INSTRUCTIONS.md`

**Your handoff:** Check `agent-handoffs/` directory for your story's YAML file

**Verify after:** `bash scripts/check-settings-v2-isolation.sh`

---

_Original story content below ↓_

---

EOF

echo "Banner template created: $_V2-BANNER-TEMPLATE.txt"
echo ""
echo "📝 Stories already updated manually:"
echo "   ✅ 01.9 - Locations (CRITICAL REWRITE)"
echo "   ✅ 01.12 - Allergens (CRITICAL REWRITE)"
echo "   ✅ 01.13 - Tax Codes (ADD DATES)"
echo "   ✅ 01.5a - Users (REFACTOR)"
echo "   ✅ 01.10 - Machines (REFACTOR)"
echo "   ✅ 01.11 - Production Lines (REFACTOR)"
echo ""
echo "📝 Stories that can use this template banner:"
echo "   - 01.1 (Org Context - backend only, no v2 UI)"
echo "   - 01.2 (Settings Shell - layout)"
echo "   - 01.3, 01.4 (Onboarding - verify)"
echo "   - 01.5, 01.5b (Users - related)"
echo "   - 01.6 (Roles - new screen)"
echo "   - 01.7 (Modules - already updated manually)"
echo "   - 01.8 (Warehouses - already has custom banner)"
echo "   - 01.14, 01.15, 01.16 (New screens)"
echo ""
echo "To manually add to a story file:"
echo "1. Edit the story file"
echo "2. After the title line (# 01.X - Story Name)"
echo "3. Insert the banner content from _V2-BANNER-TEMPLATE.txt"
echo ""
echo "OR"
echo ""
echo "Let agents reference V2-BUILD-INSTRUCTIONS.md directly (cleaner)"
echo ""
echo "Banner template ready at: $BANNER_FILE"
