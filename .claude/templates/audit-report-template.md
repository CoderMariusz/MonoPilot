# Raport Audytu Dokumentacji

> **Data audytu:** {DATA}
> **Audytor:** DOC-AUDITOR (Viktor)
> **Zakres:** {Full audit | Targeted review | Pre-release | Gap analysis}
> **Głębokość:** {Standard | Deep | Exhaustive}

---

## Executive Summary

### Quality Score

```
QUALITY SCORE: {XX}%
████████████████░░░░░░░░░░░░░░░░

Status: {PASS | PASS WITH WARNINGS | FAIL}
```

| Wymiar | Ocena | Waga |
|--------|-------|------|
| Struktura | {X}/100 | 15% |
| Klarowność | {X}/100 | 25% |
| Kompletność | {X}/100 | 25% |
| Spójność | {X}/100 | 20% |
| Dokładność techniczna | {X}/100 | 15% |

### Podsumowanie Problemów

| Severity | Liczba | Blokujące? |
|----------|--------|------------|
| 🔴 Critical | {X} | Tak |
| 🟠 Major | {X} | Nie |
| 🟡 Minor | {X} | Nie |
| 💡 Suggestion | {X} | Nie |

### Rekomendacja

**{PASS / PASS WITH WARNINGS / FAIL}**

{1-2 zdania uzasadnienia decyzji}

---

## Audytowane Dokumenty

| # | Dokument | Typ | Ocena | Status |
|---|----------|-----|-------|--------|
| 1 | {ścieżka} | PRD | {X}% | ✅ OK |
| 2 | {ścieżka} | Architecture | {X}% | ⚠️ Warnings |
| 3 | {ścieżka} | Epic | {X}% | ❌ Failed |

---

## Cross-Reference Check

### PRD ↔ Architecture

| Wymaganie | W Architecture? | Uwagi |
|-----------|-----------------|-------|
| FR-01 | ✅ Tak | |
| FR-02 | ⚠️ Częściowo | Brak szczegółów API |
| FR-03 | ❌ Nie | CRITICAL: Brak mapowania |

### Architecture ↔ Stories

| Komponent | Stories | Pokrycie |
|-----------|---------|----------|
| {Auth module} | 1.1, 1.2, 1.3 | ✅ 100% |
| {Payment} | 2.1 | ⚠️ 60% |

### Stories ↔ Implementation Docs

| Story | Doc exists? | Aktualna? |
|-------|-------------|-----------|
| 1.1 | ✅ | ✅ |
| 1.2 | ✅ | ⚠️ Outdated |
| 1.3 | ❌ | N/A |

---

## Znalezione Problemy

### 🔴 Critical ({X})

| # | Dokument | Problem | Wpływ | Rekomendacja |
|---|----------|---------|-------|--------------|
| C1 | {doc} | {opis problemu} | {wpływ na projekt} | {co zrobić} |
| C2 | {doc} | {opis problemu} | {wpływ na projekt} | {co zrobić} |

### 🟠 Major ({X})

| # | Dokument | Problem | Rekomendacja |
|---|----------|---------|--------------|
| M1 | {doc} | {opis} | {fix} |
| M2 | {doc} | {opis} | {fix} |

### 🟡 Minor ({X})

| # | Dokument | Problem | Rekomendacja |
|---|----------|---------|--------------|
| m1 | {doc} | {opis} | {fix} |
| m2 | {doc} | {opis} | {fix} |

### 💡 Suggestions ({X})

| # | Dokument | Sugestia |
|---|----------|----------|
| S1 | {doc} | {propozycja usprawnienia} |
| S2 | {doc} | {propozycja usprawnienia} |

---

## Szczegóły per Dokument

### {Dokument 1: ścieżka}

**Ocena:** {X}% | **Status:** {OK/Warning/Fail}

#### Struktura
- [x] Jasny cel dokumentu
- [x] Logiczna organizacja sekcji
- [ ] ❌ Brak sekcji: {nazwa}

#### Klarowność
- [x] Brak niejasnych sformułowań
- [ ] ⚠️ Niejasne: "{cytat}" w linii {X}

#### Kompletność
- [x] Wszystkie sekcje wypełnione
- [ ] ❌ TODO/TBD w linii {X}

#### Spójność
- [x] Terminologia spójna wewnętrznie
- [ ] ⚠️ Konflikt z {inny_doc}: {opis}

#### Dokładność techniczna
- [ ] ❌ Przykład kodu nie działa (linia {X})
- [x] Linki działają

---

## Action Items

### Wymagane przed release

| # | Akcja | Owner | Priorytet | Deadline |
|---|-------|-------|-----------|----------|
| 1 | {Napraw C1} | {osoba} | 🔴 Critical | {data} |
| 2 | {Napraw C2} | {osoba} | 🔴 Critical | {data} |
| 3 | {Napraw M1} | {osoba} | 🟠 Major | {data} |

### Rekomendowane

| # | Akcja | Owner | Priorytet |
|---|-------|-------|-----------|
| 4 | {Napraw m1} | {osoba} | 🟡 Minor |
| 5 | {Rozważ S1} | {osoba} | 💡 Low |

---

## Następny Audyt

**Rekomendowany termin:** {data}
**Zakres:** {co sprawdzić ponownie}
**Trigger:** {po naprawie Critical issues / przed release / regularny}

---

**Handoff do:** TECH-WRITER (jeśli FAIL) | ORCHESTRATOR (jeśli PASS)
