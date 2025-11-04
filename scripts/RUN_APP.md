# Instrukcje uruchomienia aplikacji

## Zatrzymanie procesu na porcie 5000

Jeśli port 5000 jest zajęty, użyj jednego z poniższych skryptów:

### Windows (CMD/Batch):

```bash
scripts\kill-port-5000.bat
```

### Windows (PowerShell):

```powershell
.\scripts\kill-port-5000.ps1
```

## Uruchomienie aplikacji

### Opcja 1: Użyj skryptu automatycznego (zakończy proces i uruchomi aplikację)

**Windows (CMD/Batch):**

```bash
scripts\start-dev.bat
```

**Windows (PowerShell):**

```powershell
.\scripts\start-dev.ps1
```

### Opcja 2: Ręczne uruchomienie

1. Zatrzymaj proces na porcie 5000 (użyj skryptu powyżej)

2. Uruchom aplikację:

```bash
# Z głównego katalogu projektu
pnpm frontend:dev

# LUB bezpośrednio z katalogu frontend
cd apps/frontend
pnpm dev
```

## Konfiguracja zmiennych środowiskowych

Przed pierwszym uruchomieniem upewnij się, że masz skonfigurowane zmienne środowiskowe.

Utwórz plik `apps/frontend/.env.local` z następującą zawartością:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://pgroxddbtaevdegnidaz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_APP_URL=http://localhost:5000
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
```

## Po uruchomieniu

Aplikacja będzie dostępna pod adresem: **http://localhost:5000**
