# Kontekst Migracji: {NAZWA_PROJEKTU}

> **Data:** {DATA}
> **Prowadzący:** DISCOVERY-AGENT (Mary)
> **Clarity Score:** {X}%
> **Status:** Draft | W trakcie | Gotowy

---

## 1. Stan Obecny (Current State)

### 1.1 Stack Technologiczny

| Warstwa | Technologia | Wersja | Uwagi |
|---------|-------------|--------|-------|
| Frontend | {np. React} | {18.x} | |
| Backend | {np. Node.js} | {20.x} | |
| Baza danych | {np. PostgreSQL} | {15.x} | |
| Infrastruktura | {np. AWS} | | |
| CI/CD | {np. GitHub Actions} | | |

### 1.2 Architektura

```
{Diagram ASCII lub opis słowny obecnej architektury}

Przykład:
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Frontend│────►│   API   │────►│   DB    │
└─────────┘     └─────────┘     └─────────┘
```

### 1.3 Integracje Zewnętrzne

| System | Typ integracji | Krytyczność | Dokumentacja |
|--------|----------------|-------------|--------------|
| {np. Stripe} | API REST | Wysoka | {link} |
| {np. SendGrid} | SMTP/API | Średnia | {link} |

### 1.4 Skala Systemu

- **Użytkownicy:** {liczba aktywnych użytkowników}
- **Dane:** {rozmiar bazy danych}
- **Ruch:** {requests/dzień}
- **Dostępność:** {SLA, uptime}

---

## 2. Co Działa Dobrze (Preserve)

### 2.1 Funkcjonalności do Zachowania

- [ ] {Funkcjonalność 1} — Powód: {dlaczego działa dobrze}
- [ ] {Funkcjonalność 2} — Powód: {dlaczego działa dobrze}
- [ ] {Funkcjonalność 3} — Powód: {dlaczego działa dobrze}

### 2.2 Wzorce do Zachowania

| Wzorzec | Gdzie używany | Dlaczego działa |
|---------|---------------|-----------------|
| {np. Repository pattern} | {moduł X} | {powód} |

### 2.3 Procesy Biznesowe

- {Proces 1 który działa i nie wymaga zmian}
- {Proces 2 który działa i nie wymaga zmian}

---

## 3. Punkty Bólu (Pain Points)

### 3.1 Problemy Techniczne

| Problem | Wpływ | Priorytet | Obecne obejście |
|---------|-------|-----------|-----------------|
| {np. Wolne zapytania} | {wpływ na UX} | Wysoki | {obecne rozwiązanie} |
| {np. Brak testów} | {ryzyko regresji} | Średni | {manualne testy} |

### 3.2 Problemy Biznesowe

- **{Problem 1}:** {Opis} → Koszt: {estymowany koszt/strata}
- **{Problem 2}:** {Opis} → Koszt: {estymowany koszt/strata}

### 3.3 Dług Techniczny

| Obszar | Opis długu | Estymowany koszt naprawy |
|--------|------------|--------------------------|
| {Kod} | {opis} | {S/M/L} |
| {Infra} | {opis} | {S/M/L} |

---

## 4. Zakres Migracji (Migration Scope)

### 4.1 W Zakresie (IN)

| Element | Typ | Priorytet | Zależności |
|---------|-----|-----------|------------|
| {Moduł użytkowników} | Pełna migracja | Must | Brak |
| {API płatności} | Przepisanie | Must | Moduł użytkowników |

### 4.2 Poza Zakresem (OUT)

| Element | Powód wykluczenia | Kiedy rozważyć |
|---------|-------------------|----------------|
| {Panel admina} | Działa dobrze | Faza 2 |
| {Raportowanie} | Osobny projekt | Q3 2025 |

### 4.3 Do Porzucenia (Deprecate)

- {Funkcjonalność 1} — Powód: {nie używana / zastąpiona}
- {Funkcjonalność 2} — Powód: {nie używana / zastąpiona}

---

## 5. Strategia Migracji Danych

### 5.1 Dane do Migracji

| Tabela/Kolekcja | Rozmiar | Strategia | Transformacje |
|-----------------|---------|-----------|---------------|
| users | {X GB} | Bulk import | {mapowanie pól} |
| orders | {X GB} | Inkrementalna | {zmiany schematu} |

### 5.2 Podejście do Migracji

- [ ] **Big Bang** — Jednorazowa migracja w oknie serwisowym
- [ ] **Strangler Fig** — Stopniowe zastępowanie modułów
- [ ] **Parallel Run** — Równoległe działanie obu systemów

**Wybrane podejście:** {uzasadnienie}

### 5.3 Walidacja Danych

```
Checklist walidacji:
- [ ] Liczba rekordów zgadza się
- [ ] Integralność referencyjna zachowana
- [ ] Dane wrażliwe poprawnie zaszyfrowane
- [ ] Testy smoke na kluczowych operacjach
```

---

## 6. Ryzyka i Plan Rollback

### 6.1 Zidentyfikowane Ryzyka

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| Utrata danych | Niskie | Krytyczny | Backup przed migracją |
| Downtime > planowany | Średnie | Wysoki | Parallel run |
| Integracje przestaną działać | Średnie | Wysoki | Testy integracyjne |

### 6.2 Plan Rollback

```
PUNKT DECYZJI O ROLLBACK:
- [ ] Krytyczny błąd w produkcji po migracji
- [ ] Utrata danych > {próg}
- [ ] Downtime > {X godzin}

KROKI ROLLBACK:
1. {Krok 1 - np. przełącz DNS na stary system}
2. {Krok 2 - np. przywróć backup bazy}
3. {Krok 3 - np. powiadom użytkowników}

CZAS ROLLBACK: {estymowany czas}
```

### 6.3 Kryteria Sukcesu

- [ ] Wszystkie funkcjonalności działają jak przed migracją
- [ ] Wydajność >= obecna (lub lepsza o {X}%)
- [ ] Zero utraty danych
- [ ] Downtime <= {X godzin}

---

## 7. Otwarte Pytania

| # | Pytanie | Owner | Deadline | Status |
|---|---------|-------|----------|--------|
| 1 | {Pytanie} | {Osoba} | {Data} | Otwarte |
| 2 | {Pytanie} | {Osoba} | {Data} | Otwarte |

---

## 8. Następne Kroki

1. **Natychmiastowe:** {akcja} — Owner: {kto}
2. **Ten tydzień:** {akcja} — Owner: {kto}
3. **Przed migracją:** {akcja} — Owner: {kto}

---

## Appendix

### A. Słownik Terminów

| Termin | Definicja |
|--------|-----------|
| {Termin 1} | {Definicja} |

### B. Linki do Dokumentacji

- Obecna dokumentacja: {link}
- Diagram architektury: {link}
- Runbook: {link}

---

**Handoff do:** ARCHITECT-AGENT (projektowanie nowej architektury)
