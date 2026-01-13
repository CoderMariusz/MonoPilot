# TypeScript Type Checking - Quick Reference

## 🎯 Quick Commands

### 1. Sprawdź aktualny stan
```bash
pnpm type-check:status
```
**Output**: Dashboard z metrykami, progress bar, enforcement mode

### 2. Zobacz błędy (podsumowanie)
```bash
pnpm type-check:monitor
```
**Output**: Kategorie błędów, top 10 plików, priorytety

### 3. Zobacz wszystkie szczegóły
```bash
pnpm type-check:full
```
**Output**: Kompletna lista błędów HIGH/MEDIUM/LOW

### 4. Eksportuj do JSON
```bash
pnpm type-check:json > errors.json
```
**Output**: JSON format (dla narzędzi)

### 5. Watch mode (auto-refresh)
```bash
pnpm type-check:watch
```
**Output**: Ciągłe monitorowanie (odśwież co 30s)

### 6. Generuj HTML report
```bash
pnpm type-check:report
```
**Output**: Interaktywny HTML (⚠️ currently broken - use monitor instead)

---

## 📊 Aktualny Stan (2026-01-13)

| Metryka | Wartość |
|---------|---------|
| **Błędy** | **499** ❌ |
| **Baseline** | 298 |
| **Regresja** | +201 (67%) |
| **Tryb** | `warn` (nie blokuje) |

**Status**: 🚨 **KRYTYCZNA REGRESJA**

---

## 📁 Pliki

- **`TYPE-CHECK-STATUS.md`** - Pełny raport (kategorie, plan naprawy)
- **`TYPE-CHECK-README.md`** - Ten plik (quick reference)
- **`scripts/type-check-config.sh`** - Konfiguracja (baseline, thresholds)
- **`scripts/type-check-monitor.sh`** - Główny skrypt monitoringu
- **`scripts/type-check-report.sh`** - Generator HTML report
- **`scripts/type-check-status.sh`** - Dashboard statusu
- **`scripts/type-check-watch.sh`** - Watch mode

---

## 🔥 Top 3 Kategorie Błędów

### 1. Next.js Route Handler Params (~50 errors)
**Problem**: Ścieżka `[id]` vs code używa `[productId]`
**Fix**: Dostosuj handlers do filesystem naming

### 2. Test Fixtures (~150 errors)
**Problem**: `status: string` zamiast `WOStatus`
**Fix**: Create test factories w `lib/test/factories.ts`

### 3. Missing Type Declarations (~2 errors)
**Problem**: `Cannot find module 'sonner'`
**Fix**: `pnpm add sonner` lub usuń import

---

## 🛠️ Plan Naprawy

### Faza 1: Quick Wins (1-2 dni) → Target: -200 errors
- [ ] Fix route handlers
- [ ] Install missing deps
- [ ] Create test factories

### Faza 2: Test Cleanup (1-2 dni) → Target: -150 errors
- [ ] Migrate test fixtures
- [ ] Fix component props
- [ ] Fix void expressions

### Faza 3: Strict Mode (1-2 dni) → Target: 0 errors
- [ ] Fix remaining issues
- [ ] Enable strict mode
- [ ] CI/CD enforcement

**Total**: 4-6 dni do 0 errors ✅

---

## ⚙️ Konfiguracja

**File**: `scripts/type-check-config.sh`

```bash
# Current
ENFORCEMENT_MODE="warn"           # Shows but doesn't block
BASELINE_ERRORS=499              # Updated 2026-01-13
STRICT_MODE_THRESHOLD=50         # Auto-enable strict at <50

# Recommended after Phase 1 (-200 errors)
ENFORCEMENT_MODE="prevent-regression"  # Block increases

# Target after all fixes
ENFORCEMENT_MODE="strict"        # Block ANY errors
```

---

## 📋 Daily Workflow

### Rano (Start of day)
```bash
pnpm type-check:status
```
→ Zobacz progress od wczoraj

### Podczas pracy (Before commit)
```bash
pnpm type-check:monitor
```
→ Sprawdź czy nie dodałeś nowych błędów

### Wieczorem (End of day)
```bash
pnpm type-check:full > errors-$(date +%Y%m%d).txt
```
→ Zapisz snapshot na jutro

---

## 🎯 Success Metrics

### Week 1 Goal
- [ ] Baseline acknowledged (499)
- [ ] Route handlers fixed
- [ ] Down to ~250 errors

### Week 2 Goal
- [ ] Test factories implemented
- [ ] Test fixtures migrated
- [ ] Down to ~100 errors

### Week 3-4 Goal
- [ ] All errors fixed (0)
- [ ] Strict mode enabled
- [ ] CI/CD enforcement ON

---

## 🐛 Known Issues

### 1. HTML Report Generator
**Status**: Broken (JSON parser issue)
**Workaround**: Use `pnpm type-check:full` for details

### 2. JSON Output
**Status**: Multiline errors break parser
**Workaround**: Use `summary` or `full` modes

### 3. Pre-push Hook
**Status**: Disabled (warn mode)
**Target**: Enable in prevent-regression mode after Phase 1

---

## 📞 Support

**Questions?** Check `TYPE-CHECK-STATUS.md` for:
- Detailed error breakdown
- File-by-file analysis
- Step-by-step fixes

**Scripts broken?** Check:
- Execute permissions: `chmod +x scripts/type-check-*.sh`
- Node/TypeScript version: `node --version`, `npx tsc --version`
- Frontend dependencies: `cd apps/frontend && pnpm install`

---

**Last Updated**: 2026-01-13
**Status**: ⚠️ Regression detected, action required
**Priority**: HIGH
