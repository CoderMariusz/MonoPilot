# 🚧 V2 MIGRATION NOTICE - READ THIS FIRST

**This story is being rebuilt for Settings v2 (clean rebuild from wireframes)**

---

## ⚠️ CRITICAL: Where to Build

### **✅ BUILD IN (v2):**
```
apps/frontend/app/(authenticated)/settings-v2/{your-feature}/
apps/frontend/components/settings-v2/{your-feature}/
```

### **❌ DO NOT TOUCH (v1 frozen):**
```
apps/frontend/app/(authenticated)/settings/{your-feature}/          ← V1 FROZEN
apps/frontend/components/settings/{your-feature}/                   ← V1 FROZEN
apps/frontend/app/(authenticated)/_archive-settings-v1-DO-NOT-TOUCH/ ← READ ONLY REFERENCE
```

---

## 📋 Your Resources

### **1. Migration Plan:**
```
docs/2-MANAGEMENT/EPIC-01-MIGRATION-PLAN.md
└─ Complete strategy, timeline, rules
```

### **2. Agent Handoff (if available):**
```
docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/XX-your-story.yaml
└─ Ready-to-use prompt with all details
```

### **3. Wireframe(s):**
```
docs/3-ARCHITECTURE/ux/wireframes/SET-XXX.md
└─ Visual spec (ASCII wireframes, 4 states)
```

### **4. Master Prompt:**
```
docs/2-MANAGEMENT/epics/current/01-settings/MASTER-PROMPT-FOR-AGENTS.md
└─ Copy-paste ready instructions
```

---

## 🛡️ Isolation Rules

### **Allowed:**
- ✅ Read wireframes (SET-*.md)
- ✅ Use services (lib/services/) - reuse/update
- ✅ Use schemas (lib/validation/) - verify/update
- ✅ Create in settings-v2/
- ✅ Reference v1 FOR LOGIC ONLY

### **Forbidden:**
- ❌ Edit settings/ (v1 frozen)
- ❌ Import from @/app/(authenticated)/settings/*
- ❌ Import from @/components/settings/*
- ❌ Copy v1 UI code

---

## ✅ Verification

**After completing this story, run:**
```bash
bash scripts/check-settings-v2-isolation.sh
```

**Should output:**
- ✅ No v1 app imports found
- ✅ No v1 component imports found
- ✅ TypeScript compiles successfully

---

**Migration Strategy:** Parallel Build → Atomic Swap
**Your Code:** Clean slate in settings-v2/
**Old Code:** Reference only in _archive-settings-v1-DO-NOT-TOUCH/

---

_Continue reading story below ↓_
