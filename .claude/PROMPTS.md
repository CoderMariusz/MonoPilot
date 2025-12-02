# AI Prompts - Szablony

> Kopiuj i wypełnij `[placeholdery]`

---

## Quick Fix
```
Fix: [opis błędu]
Plik: [ścieżka:linia]
NIE czytaj innych plików.
```

## Nowy API Endpoint
```
Dodaj [GET/POST/PUT/DELETE] /api/[module]/[resource]
Tabela: [nazwa]
Pola: [lista pól]
Przeczytaj PATTERNS.md dla wzorca.
```

## Nowy Component
```
Dodaj komponent [nazwa] do [moduł]
Funkcja: [opis]
Bazuj na: [istniejący komponent jako wzorzec]
```

## Modyfikacja istniejącego
```
W pliku [ścieżka]
Dodaj/Zmień: [co]
NIE zmieniaj innych części.
```

## Bug z błędem
```
Błąd: [treść błędu]
Grep "[keyword]" żeby znaleźć plik.
NIE czytaj niepowiązanych plików.
```

## Story Implementation
```
/bmad:bmm:workflows:dev-story
Story: [numer np. 4-1]
```

## Code Review (małe zmiany)
```
git diff --stat
git diff [plik]
Sprawdź tylko zmienione linie.
```

## Code Review (duże zmiany >5 plików)
```
/bmad:bmm:workflows:code-review
```

## Status Check
```
cat docs/sprint-artifacts/sprint-status.yaml | head -60
```

## Nowa migracja
```
Dodaj migrację dla [tabela/zmiana]
Przeczytaj PATTERNS.md dla RLS.
Lokalizacja: apps/frontend/lib/supabase/migrations/
```

---

## Tips dla AI

### Zanim zaczniesz:
1. **Pytaj** o lokalizację jeśli nie wiesz
2. **Grep** zamiast czytać wiele plików
3. **Sprawdź** FILE-MAP.md dla struktury
4. **Sprawdź** TABLES.md dla schematu DB

### Po zakończeniu:
1. **Update** sprint-status.yaml jeśli story done
2. **Pokaż** tylko diff, nie cały plik
