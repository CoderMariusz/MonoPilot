# Epic Discovery: {NAZWA_EPICA}

> **Epic źródłowy:** @docs/2-MANAGEMENT/epics/epic-{N}-{nazwa}.md
> **Data sesji:** {DATA}
> **Prowadzący:** DISCOVERY-AGENT (Mary)
> **Clarity Score:** {X}%

---

## 1. Overview

### 1.1 Cel Epica

{Krótki opis celu epica - 2-3 zdania}

### 1.2 Stories w Epicu

| Story | Tytuł | Status Discovery |
|-------|-------|------------------|
| {N}.1 | {tytuł} | ✅ Wyjaśnione |
| {N}.2 | {tytuł} | ⚠️ Częściowo |
| {N}.3 | {tytuł} | ❌ Wymaga dalszej analizy |

### 1.3 Kluczowi Interesariusze

- **Product Owner:** {imię}
- **Tech Lead:** {imię}
- **Domain Expert:** {imię}

---

## 2. Wyjaśnione Wymagania

### 2.1 Rozwiązane Niejasności

| # | Co było niejasne | Co ustalono | Story |
|---|------------------|-------------|-------|
| 1 | {oryginalne pytanie/wątpliwość} | {ustalona odpowiedź} | {N}.{M} |
| 2 | {oryginalne pytanie/wątpliwość} | {ustalona odpowiedź} | {N}.{M} |
| 3 | {oryginalne pytanie/wątpliwość} | {ustalona odpowiedź} | {N}.{M} |

### 2.2 Zmienione Acceptance Criteria

**Story {N}.{M}:**
```diff
- Stare AC: {oryginalne AC}
+ Nowe AC: {poprawione AC po discovery}
```

**Story {N}.{M}:**
```diff
- Stare AC: {oryginalne AC}
+ Nowe AC: {poprawione AC po discovery}
```

---

## 3. Edge Cases (Przypadki Brzegowe)

### 3.1 Story {N}.1: {tytuł}

| Przypadek | Oczekiwane zachowanie | Priorytet |
|-----------|----------------------|-----------|
| Puste dane wejściowe | {co powinno się stać} | Wysoki |
| Przekroczony limit | {co powinno się stać} | Wysoki |
| Równoczesna edycja | {co powinno się stać} | Średni |
| Timeout zewnętrznego API | {co powinno się stać} | Średni |
| Użytkownik bez uprawnień | {co powinno się stać} | Wysoki |

### 3.2 Story {N}.2: {tytuł}

| Przypadek | Oczekiwane zachowanie | Priorytet |
|-----------|----------------------|-----------|
| {przypadek 1} | {zachowanie} | {priorytet} |
| {przypadek 2} | {zachowanie} | {priorytet} |

---

## 4. Reguły Walidacji

### 4.1 Walidacje Frontendowe

| Pole | Reguła | Komunikat błędu |
|------|--------|-----------------|
| email | Format email, max 255 znaków | "Podaj poprawny adres email" |
| hasło | Min 8 znaków, 1 cyfra, 1 wielka | "Hasło musi mieć min. 8 znaków..." |
| {pole} | {reguła} | {komunikat} |

### 4.2 Walidacje Backendowe

| Pole/Operacja | Reguła | HTTP Status | Kod błędu |
|---------------|--------|-------------|-----------|
| email | Unikalność w bazie | 409 | EMAIL_EXISTS |
| zamówienie | Suma > 0 | 400 | INVALID_AMOUNT |
| {pole} | {reguła} | {status} | {kod} |

### 4.3 Walidacje Biznesowe

| Reguła | Kiedy sprawdzać | Akcja przy naruszeniu |
|--------|-----------------|----------------------|
| {np. Limit dzienny} | Przed zapisem | Zablokuj + powiadom |
| {np. Godziny pracy} | Przy tworzeniu | Ostrzeżenie |

---

## 5. Przejścia Stanów (State Transitions)

### 5.1 {Encja 1, np. Zamówienie}

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    │
│  DRAFT  │───►│ PENDING │───►│APPROVED │───►│COMPLETED│    │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    │
                    │              │                         │
                    │              │         ┌─────────┐     │
                    │              └────────►│REJECTED │─────┘
                    │                        └─────────┘
                    │
                    ▼
              ┌─────────┐
              │CANCELLED│
              └─────────┘
```

| Z stanu | Do stanu | Wyzwalacz | Warunek | Efekty uboczne |
|---------|----------|-----------|---------|----------------|
| DRAFT | PENDING | user.submit() | Walidacje OK | Email do admina |
| PENDING | APPROVED | admin.approve() | - | Email do usera |
| PENDING | REJECTED | admin.reject() | Podano powód | Email do usera |
| * | CANCELLED | user.cancel() | Stan != COMPLETED | Zwrot środków |

### 5.2 {Encja 2}

{Analogiczny diagram i tabela}

---

## 6. Integracje

### 6.1 Wymagane Integracje

| System | Operacje | Format | Uwierzytelnienie |
|--------|----------|--------|------------------|
| {np. Stripe} | createPayment, refund | REST JSON | API Key |
| {np. SendGrid} | sendEmail | REST JSON | API Key |
| {np. S3} | upload, download | SDK | IAM Role |

### 6.2 Szczegóły Integracji

**{System 1}:**
- Endpoint: `{URL}`
- Timeout: `{X}s`
- Retry policy: `{opis}`
- Fallback: `{co robić gdy niedostępny}`

**{System 2}:**
- Endpoint: `{URL}`
- Timeout: `{X}s`
- Retry policy: `{opis}`
- Fallback: `{co robić gdy niedostępny}`

---

## 7. Sugerowane Scenariusze Testowe

### 7.1 Happy Path

| # | Scenariusz | Oczekiwany rezultat |
|---|------------|---------------------|
| 1 | {Standardowy flow} | {Sukces} |
| 2 | {Wariant A} | {Sukces z wariantem} |

### 7.2 Scenariusze Negatywne

| # | Scenariusz | Oczekiwany rezultat |
|---|------------|---------------------|
| 1 | {Błędne dane} | {Odpowiedni błąd} |
| 2 | {Brak uprawnień} | {403 + komunikat} |
| 3 | {Zewnętrzny system niedostępny} | {Graceful degradation} |

### 7.3 Scenariusze Graniczne

| # | Scenariusz | Oczekiwany rezultat |
|---|------------|---------------------|
| 1 | {Max dozwolona wartość} | {Akceptacja} |
| 2 | {Max + 1} | {Odrzucenie} |
| 3 | {Równoczesne operacje} | {Prawidłowa obsługa} |

---

## 8. Otwarte Pytania

| # | Pytanie | Owner | Deadline | Status |
|---|---------|-------|----------|--------|
| 1 | {Pytanie wymagające decyzji biznesowej} | {PO} | {data} | 🔴 Otwarte |
| 2 | {Pytanie techniczne} | {Tech Lead} | {data} | 🟡 W trakcie |
| 3 | {Pytanie} | {Owner} | {data} | 🟢 Rozwiązane |

---

## 9. Rekomendacje dla ARCHITECT-AGENT

### 9.1 Sugerowane Zmiany w Stories

- **Story {N}.{M}:** {sugestia zmiany}
- **Story {N}.{M}:** {sugestia podziału na mniejsze}

### 9.2 Nowe Stories do Rozważenia

- {Nowe story wynikające z edge cases}
- {Story na obsługę błędów integracji}

### 9.3 Ryzyka Techniczne

| Ryzyko | Wpływ | Mitygacja |
|--------|-------|-----------|
| {ryzyko} | {wpływ} | {propozycja} |

---

**Handoff do:** ARCHITECT-AGENT (refinement epica)
**Clarity Score:** {X}% — {Gotowy do implementacji / Wymaga dodatkowej sesji}
