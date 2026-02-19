# Checklist Przeglądu Dokumentu

> **Dokument:** {ścieżka}
> **Reviewer:** DOC-AUDITOR (Viktor)
> **Data:** {DATA}

---

## Quick Assessment

| Kryterium | Status | Uwagi |
|-----------|--------|-------|
| Cel dokumentu jasny? | ☐ Tak / ☐ Nie | |
| Audience zdefiniowane? | ☐ Tak / ☐ Nie | |
| Aktualna wersja? | ☐ Tak / ☐ Nie | |
| Brak TODO/TBD? | ☐ Tak / ☐ Nie | |

---

## 1. Struktura (15%)

### Organizacja
- [ ] Dokument ma jasny tytuł
- [ ] Sekcje są logicznie uporządkowane
- [ ] Nagłówki tworzą sensowną hierarchię
- [ ] Nie ma "osieroconych" sekcji (H4 bez H3)

### Nawigacja
- [ ] Spis treści (jeśli >3 strony)
- [ ] Linki wewnętrzne działają
- [ ] Sekcje mają kotwice

### Formatowanie
- [ ] Spójne użycie markdown
- [ ] Kod w blokach z syntax highlighting
- [ ] Tabele czytelne

**Ocena:** {X}/100

---

## 2. Klarowność (25%)

### Język
- [ ] Brak żargonu bez wyjaśnienia
- [ ] Akronimy rozwinięte przy pierwszym użyciu
- [ ] Zdania krótkie i konkretne

### Precyzja
- [ ] Brak słów: "niektóre", "różne", "odpowiednio", "właściwie"
- [ ] Liczby zamiast "dużo", "mało", "szybko"
- [ ] Konkretne przykłady dla abstrakcyjnych koncepcji

### Niejasności do wyjaśnienia
| Linia | Cytat | Problem |
|-------|-------|---------|
| {X} | "{cytat}" | {co niejasne} |

**Ocena:** {X}/100

---

## 3. Kompletność (25%)

### Wymagane sekcje
- [ ] Cel/Purpose
- [ ] Kontekst/Background
- [ ] Główna treść
- [ ] Następne kroki/References

### Brakujące elementy
- [ ] Brak TODO/TBD/FIXME
- [ ] Wszystkie placeholder'y wypełnione
- [ ] Wszystkie wymagane pola w tabelach

### Pokrycie tematu
- [ ] Wszystkie aspekty tematu omówione
- [ ] Edge cases uwzględnione
- [ ] Pytania "co jeśli?" odpowiedziane

**Ocena:** {X}/100

---

## 4. Spójność (20%)

### Wewnętrzna
- [ ] Terminologia spójna w całym dokumencie
- [ ] Nazwy encji/komponentów jednolite
- [ ] Format dat/liczb spójny

### Zewnętrzna (vs inne dokumenty)
| Termin/Wartość | W tym doc | W {inny doc} | Spójne? |
|----------------|-----------|--------------|---------|
| {termin} | {wartość} | {wartość} | ☐ |

### Konflikty znalezione
| Z dokumentem | Konflikt | Który prawidłowy? |
|--------------|----------|-------------------|
| {doc} | {opis} | ☐ Ten / ☐ Tamten |

**Ocena:** {X}/100

---

## 5. Dokładność Techniczna (15%)

### Kod
- [ ] Przykłady kodu są syntaktycznie poprawne
- [ ] Kod można uruchomić (przetestowane)
- [ ] Wersje dependencies aktualne

### Komendy
- [ ] Komendy shell działają
- [ ] Ścieżki są poprawne
- [ ] Flagi/opcje aktualne

### Linki
- [ ] Linki wewnętrzne działają
- [ ] Linki zewnętrzne działają
- [ ] Linki do kodu wskazują właściwe linie

### Błędy techniczne znalezione
| Linia | Typ | Problem |
|-------|-----|---------|
| {X} | Kod | {błąd} |
| {Y} | Link | {broken} |

**Ocena:** {X}/100

---

## Podsumowanie

### Ocena Końcowa

| Wymiar | Ocena | Waga | Ważona |
|--------|-------|------|--------|
| Struktura | {X} | 15% | {X*0.15} |
| Klarowność | {X} | 25% | {X*0.25} |
| Kompletność | {X} | 25% | {X*0.25} |
| Spójność | {X} | 20% | {X*0.20} |
| Dokładność | {X} | 15% | {X*0.15} |
| **TOTAL** | | | **{suma}** |

### Decyzja

- [ ] ✅ **PASS** — Dokument gotowy
- [ ] ⚠️ **PASS WITH WARNINGS** — Drobne poprawki zalecane
- [ ] ❌ **FAIL** — Wymagane poprawki przed akceptacją

### Wymagane Poprawki (jeśli FAIL)

1. {Poprawka 1}
2. {Poprawka 2}
3. {Poprawka 3}

---

**Reviewer:** {imię}
**Data:** {data}
**Następny review:** {data lub "po poprawkach"}
