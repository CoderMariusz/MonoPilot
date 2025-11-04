# Vercel Environment Variables Configuration

## Required Environment Variables

Następujące zmienne środowiskowe MUSZĄ być skonfigurowane w Vercel Dashboard dla projektu `monopilot`:

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://pgroxddbtaevdegnidaz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU
SUPABASE_SERVICE_ROLE_KEY=[Pobierz z Supabase Dashboard -> Settings -> API -> service_role key]
```

**UWAGA**: `SUPABASE_SERVICE_ROLE_KEY` jest poufne i musi być pobrane z Supabase Dashboard:
1. Przejdź do https://supabase.com/dashboard/project/pgroxddbtaevdegnidaz/settings/api
2. Skopiuj wartość "service_role" key (sekretna, nie udostępniaj publicznie)

### Application Configuration
```
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production
```

## How to Set Environment Variables in Vercel

1. Przejdź do Vercel Dashboard: https://vercel.com/codermariuszs-projects/monopilot/settings/environment-variables
2. Dodaj każdą zmienną osobno:
   - **Name**: nazwa zmiennej (np. `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: wartość zmiennej
   - **Environment**: Wybierz wszystkie środowiska (Production, Preview, Development)
3. Kliknij "Save"
4. Po dodaniu wszystkich zmiennych, zrób redeploy aplikacji

## Verification

Po dodaniu zmiennych, sprawdź czy deployment przechodzi:
- Przejdź do: https://vercel.com/codermariuszs-projects/monopilot/deployments
- Ostatni deployment powinien mieć status "Ready" zamiast "Error"

## Important Notes

- `NEXT_PUBLIC_*` zmienne są dostępne w przeglądarce (publiczne)
- `SUPABASE_SERVICE_ROLE_KEY` jest poufne i dostępne tylko po stronie serwera
- Wszystkie zmienne powinny być ustawione dla wszystkich środowisk (Production, Preview, Development)
