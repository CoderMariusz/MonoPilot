# BUG-018: Cookie Persistence Fix - Verification Report
Teraz przetestujesz w przeglądarce. Oto podsumowanie.

  ---
  Podsumowanie naprawy

  Problem z nieskończonym redirectem do /login miał dwie przyczyny:

  Przyczyna 1: Nieprawidłowy format cookie (naprawione w kodzie)

  Plik: apps/frontend/app/api/auth/login/route.ts

  Stary kod używał zwykłego @supabase/supabase-js i ręcznie ustawiał cookies z surowym JWT. Middleware (@supabase/ssr) oczekiwał base64-{sesja JSON}. Format się nie zgadzał ->
  middleware nie mógł odtworzyć sesji -> redirect.

  Fix: Zamieniono na createServerClient z @supabase/ssr z wzorcem "pending cookies" (zebranie cookies i aplikacja na response).

  Przyczyna 2: Brakujące polityki RLS SELECT (naprawione w bazie)

  Tabele users i organizations nie miały polityk SELECT - tylko UPDATE. Efekt:
  - getUser() w middleware działał (token OK)
  - Ale query .from('users').select(...) w layout zwracało 0 wierszy (RLS blokuje)
  - Layout wywoływał redirect('/login') -> pętlas