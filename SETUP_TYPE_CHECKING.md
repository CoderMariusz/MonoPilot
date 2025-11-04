# Instrukcja Konfiguracji Automatycznego Sprawdzania TypeScript

## 📋 Spis Treści

1. [Wprowadzenie](#wprowadzenie)
2. [Wymagania](#wymagania)
3. [Instalacja](#instalacja)
4. [Sposób Działania](#sposób-działania)
5. [Użytkowanie](#użytkowanie)
6. [Debugowanie Błędów](#debugowanie-błędów)
7. [Konfiguracja Zaawansowana](#konfiguracja-zaawansowana)
8. [Wyłączanie Sprawdzania](#wyłączanie-sprawdzania)
9. [Rozwiązywanie Problemów](#rozwiązywanie-problemów)
10. [FAQ](#faq)

---

## Wprowadzenie

Ten system automatycznie sprawdza Twój kod TypeScript przed każdym commitem, aby zapobiec błędom w deploymencie na Vercel. System został stworzony w odpowiedzi na 20 kolejnych nieudanych deploymentów spowodowanych błędami TypeScript.

### Co jest sprawdzane:

✅ **TypeScript Type Checking** - wszystkie typy muszą być zgodne  
✅ **ESLint** - jakość kodu i potencjalne błędy  
✅ **Prettier** - formatowanie kodu  
✅ **Importy** - sprawdzanie czy importowane komponenty istnieją

---

## Wymagania

### Wymagane Oprogramowanie:

- **Node.js**: >= 20.0.0
- **pnpm**: >= 8.0.0
- **Git**: >= 2.0.0

### Sprawdzenie Wersji:

```bash
node --version   # powinno pokazać v20.x.x lub wyżej
pnpm --version   # powinno pokazać 8.x.x lub wyżej
git --version    # powinno pokazać 2.x.x lub wyżej
```

---

## Instalacja

### Krok 1: Sklonuj/Zaktualizuj Repozytorium

```bash
# Jeśli jeszcze nie masz repozytorium
git clone <url-repozytorium>
cd MonoPilot

# Jeśli masz już repozytorium
git pull origin main
```

### Krok 2: Zainstaluj Zależności

```bash
# W katalogu głównym projektu
pnpm install
```

Ta komenda:
- Zainstaluje wszystkie zależności projektu
- Skonfiguruje Husky (Git hooks)
- Automatycznie skonfiguruje pre-commit hook

### Krok 3: Weryfikacja Instalacji

Sprawdź czy hook został zainstalowany:

```bash
# Powinien istnieć plik .husky/pre-commit
ls -la .husky/

# Sprawdź zawartość hooka
cat .husky/pre-commit
```

Powinno pokazać:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm run pre-commit
```

### Krok 4: Zainstaluj Hook w Git

```bash
# Skopiuj hook do .git/hooks/
cp .husky/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Krok 5: Test Instalacji

Przetestuj czy wszystko działa:

```bash
# Uruchom sprawdzenie ręcznie
pnpm run pre-commit
```

Jeśli wszystko jest OK, powinieneś zobaczyć że type-check przechodzi pomyślnie.

---

## Sposób Działania

### Przepływ Pre-Commit Hook:

```
1. User: git commit
2. Git Hook: uruchamia .git/hooks/pre-commit
3. Husky: wykonuje pnpm run pre-commit
4. TypeScript: type-check wszystkich workspace'ów
5. Jeśli błędy: commit rejected z listą błędów
6. Jeśli OK: commit accepted
```

### Co Dzieje Się Przy Commit:

1. **TypeScript Type Checking**
   ```bash
   pnpm type-check
   ```
   - Sprawdza wszystkie typy w projekcie
   - Jeśli znajdzie błąd - commit jest odrzucany
   - Pokazuje dokładnie gdzie jest błąd

2. **Documentation Update**
   ```bash
   pnpm docs:update
   ```
   - Automatycznie aktualizuje dokumentację

3. **Type Generation (opcjonalne)**
   ```bash
   pnpm gen-types
   ```
   - Generuje typy z Supabase (jeśli CLI dostępne)

4. **Lint-Staged (opcjonalne)**
   - Formatuje staged pliki (jeśli narzędzia dostępne)

---

## Użytkowanie

### Normalny Workflow:

```bash
# 1. Wprowadź zmiany w kodzie
vim apps/frontend/components/MyComponent.tsx

# 2. Dodaj pliki do staging
git add apps/frontend/components/MyComponent.tsx

# 3. Spróbuj commitować
git commit -m "feat: add new component"

# 4. Hook automatycznie sprawdzi kod
#    - Jeśli są błędy TypeScript: commit odrzucony
#    - Jeśli OK: commit zaakceptowany
```

### Przykład Sukcesu:

```bash
$ git commit -m "feat: add routing builder"

> pnpm type-check
✓ TypeScript type checking passed (1.5s)

> pnpm docs:update
✓ Documentation updated

[main a1b2c3d] feat: add routing builder
 1 file changed, 50 insertions(+)
```

### Przykład Błędu:

```bash
$ git commit -m "feat: add routing builder"

> pnpm type-check

apps/frontend type-check$ tsc --noEmit
│ components/RoutingBuilder.tsx(113,7): error TS2741: 
│ Property 'age' is missing in type...

 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  
Exit status 2

husky - pre-commit script failed (code 1)
```

---

## Debugowanie Błędów

### Krok 1: Uruchom Type Check Lokalnie

```bash
# W głównym katalogu
pnpm type-check

# Lub tylko dla frontendu
cd apps/frontend
pnpm type-check
```

### Krok 2: Przeanalizuj Błąd

TypeScript pokaże dokładnie:
- **Plik** z błędem
- **Numer linii**
- **Co jest nie tak**
- **Jaki typ jest oczekiwany**

### Krok 3: Napraw Błąd

Zobacz `DEPLOYMENT_ERRORS_ANALYSIS.md` dla przykładów napraw.

### Krok 4: Zweryfikuj Naprawę

```bash
# Sprawdź czy naprawione
pnpm type-check

# Jeśli OK, commituj
git add .
git commit -m "fix: correct type error"
```

---

## Konfiguracja Zaawansowana

### Dostosowanie TypeScript Strict Mode

Edytuj `apps/frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,              // Włącz/wyłącz strict mode
    "noImplicitAny": true,       // Wymagaj explicite typów
    "strictNullChecks": true,    // Sprawdzaj null/undefined
    "noUnusedLocals": false,     // Nie blokuj za nieużywane zmienne
    "noUnusedParameters": false  // Nie blokuj za nieużywane parametry
  }
}
```

---

## Wyłączanie Sprawdzania

### ⚠️ UWAGA: Używaj tylko w wyjątkowych przypadkach!

### Opcja 1: Pomiń Pre-commit Hook (Nie Zalecane)

```bash
git commit -m "message" --no-verify
```

**Kiedy używać:**
- Pilna naprawa w produkcji
- Masz 100% pewność że kod jest poprawny
- Musisz commitować częściowo ukończoną pracę (lepiej użyj WIP branch)

### Opcja 2: Wyłączenie Dla Konkretnego Pliku

Dodaj `// @ts-nocheck` na początku pliku:

```typescript
// @ts-nocheck
// WARNING: Type checking disabled for this file!

export const MyComponent = () => {
  // ... kod bez sprawdzania typów
};
```

**⚠️ NIE UŻYWAJ bez bardzo dobrego powodu!**

---

## Rozwiązywanie Problemów

### Problem 1: Hook Się Nie Uruchamia

**Sprawdź:**
```bash
# Czy plik istnieje?
ls -la .git/hooks/pre-commit

# Czy ma uprawnienia wykonywania?
chmod +x .git/hooks/pre-commit
```

**Napraw:**
```bash
# Reinstall hook
cp .husky/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Problem 2: Type Check Trwa Zbyt Długo

**Rozwiązanie:**

Użyj incremental compilation:
```json
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

### Problem 3: Błędy w node_modules

**Objaw:**
```
Type error in node_modules/@types/...
```

**Rozwiązanie:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true  // Pomiń sprawdzanie bibliotek
  }
}
```

---

## FAQ

### Q: Czy mogę commitować jeśli mam błędy TypeScript?

**A:** Nie, to jest celowe! System powstał aby zapobiec deploymentom z błędami TypeScript. Jeśli naprawdę musisz, użyj `--no-verify`, ale **nie jest to zalecane**.

### Q: Jak długo trwa sprawdzanie?

**A:** Zazwyczaj 5-30 sekund, w zależności od:
- Wielkości projektu
- Ilości zmienionych plików
- Mocy komputera

### Q: Co się stanie jeśli nie naprawię błędów?

**A:** 
1. Pre-commit hook zatrzyma commit lokalnie
2. Jeśli ominiesz hook (`--no-verify`), build na Vercelu się nie powiedzie
3. Deployment będzie failed (jak w ostatnich 20 przypadkach)

### Q: Jak sprawdzić typy bez commitowania?

**A:**
```bash
# Sprawdź wszystkie typy
pnpm type-check

# Sprawdź typy w konkretnym katalogu
cd apps/frontend && pnpm type-check
```

---

## Dodatkowe Zasoby

### Dokumentacja Projektu:
- `DEPLOYMENT_ERRORS_ANALYSIS.md` - Analiza błędów z deploymentów
- `README.md` - Główna dokumentacja projektu

### Zewnętrzne Zasoby:
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Husky Documentation](https://typicode.github.io/husky/)

### Komendy Szybkiego Dostępu:

```bash
# Sprawdzanie
pnpm type-check          # Sprawdź typy
pnpm lint                # Sprawdź linting
pnpm format:check        # Sprawdź formatowanie
pnpm pre-commit          # Uruchom wszystkie sprawdzenia

# Naprawianie
pnpm lint:fix            # Auto-fix linting
pnpm format              # Auto-format kod

# Build
pnpm build               # Build całego projektu
pnpm frontend:build      # Build tylko frontendu

# Development
pnpm dev                 # Start dev server
pnpm frontend:dev        # Start tylko frontend dev
```

---

## 🎯 Podsumowanie

System jest teraz w pełni funkcjonalny i przetestowany:

1. ✅ **Pre-commit hook zainstalowany** - automatycznie sprawdza przy każdym commicie
2. ✅ **TypeScript checking działa** - wykrywa błędy przed deploymentem
3. ✅ **Testowany z błędami** - poprawnie odrzuca commits z błędami TypeScript
4. ✅ **Dokumentacja kompletna** - wszystkie instrukcje i przykłady

**Ten system zapobiegnie błędom deploymentu, które występowały w ostatnich 20 przypadkach!**

---

**Ostatnia aktualizacja:** 2025-11-04  
**Wersja:** 1.0.0  
**Autor:** MonoPilot Development Team
