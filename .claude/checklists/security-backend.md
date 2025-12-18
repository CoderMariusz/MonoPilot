# Backend Security Checklist

> Używane przez: BACKEND-DEV, CODE-REVIEWER, QA-AGENT

## Input Validation

- [ ] WSZYSTKIE dane od użytkownika są walidowane
- [ ] Walidacja po stronie serwera (nie tylko frontend)
- [ ] Whitelist > blacklist (akceptuj znane dobre, nie blokuj znane złe)
- [ ] Limity długości na wszystkich polach tekstowych
- [ ] Walidacja typów (number jest numberem, email jest emailem)

## SQL Injection Prevention

```typescript
// ❌ NIGDY - string concatenation
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ ZAWSZE - parameterized queries
const query = 'SELECT * FROM users WHERE id = $1';
await db.query(query, [userId]);

// ✅ ORM z parametrami
await User.findOne({ where: { id: userId } });
```

- [ ] Używaj TYLKO parameterized queries
- [ ] Nigdy nie konkatenuj user input do SQL
- [ ] ORM/Query builder z escapowaniem

## Authentication & Authorization

- [ ] Hasła hashowane (bcrypt, argon2) - NIGDY plaintext
- [ ] Session tokens są random i wystarczająco długie
- [ ] Sprawdzanie autoryzacji na KAŻDYM ENDPOINT (nie tylko UI)
- [ ] Rate limiting na login/register/password reset
- [ ] Logout invaliduje sesję po stronie serwera

## Secrets Management

```typescript
// ❌ NIGDY
const apiKey = 'sk-1234567890abcdef';
const dbPassword = 'admin123';

// ✅ ZAWSZE
const apiKey = process.env.API_KEY;
const dbPassword = process.env.DB_PASSWORD;
```

- [ ] Żadne sekrety w kodzie źródłowym
- [ ] Sekrety w zmiennych środowiskowych lub secret manager
- [ ] Różne sekrety dla dev/staging/prod
- [ ] .env w .gitignore

## Error Handling

```typescript
// ❌ Za dużo info dla atakującego
catch (error) {
  return res.status(500).json({
    error: error.message,
    stack: error.stack,
    query: sql
  });
}

// ✅ Ogólny komunikat, szczegóły w logach
catch (error) {
  logger.error('Database error', { error, userId });
  return res.status(500).json({ error: 'Internal server error' });
}
```

- [ ] Nie eksponuj stack traces w produkcji
- [ ] Nie pokazuj szczegółów bazy/infrastruktury w błędach
- [ ] Loguj szczegóły wewnętrznie, zwracaj ogólne komunikaty

## Data Protection

- [ ] Sensitive data (SSN, karty) nie logowane
- [ ] PII minimalizowane (zbieraj tylko potrzebne)
- [ ] Dane w transit: HTTPS everywhere
- [ ] Dane at rest: encryption dla sensitive fields
- [ ] Backup encryption

## API Security

- [ ] CORS skonfigurowany restrykcyjnie
- [ ] Rate limiting na wszystkich endpointach
- [ ] Request size limits
- [ ] Timeout na długie operacje
- [ ] Idempotency keys dla operacji finansowych

## Headers Security

```typescript
// Recommended headers
app.use(helmet()); // lub ręcznie:

res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('X-XSS-Protection', '1; mode=block');
res.setHeader('Strict-Transport-Security', 'max-age=31536000');
res.setHeader('Content-Security-Policy', "default-src 'self'");
```

## File Upload Security

- [ ] Walidacja MIME type (nie tylko extension)
- [ ] Limity rozmiaru pliku
- [ ] Przechowywanie poza webroot lub w cloud storage
- [ ] Randomizowane nazwy plików
- [ ] Skanowanie antywirusowe (dla wrażliwych aplikacji)

## Logging for Security

```typescript
// Loguj security-relevant events
logger.info('User login', { userId, ip, userAgent });
logger.warn('Failed login attempt', { email, ip, attemptCount });
logger.error('Authorization denied', { userId, resource, action });
```

- [ ] Loguj udane i nieudane logowania
- [ ] Loguj zmiany uprawnień
- [ ] Loguj dostęp do sensitive data
- [ ] NIE loguj haseł, tokenów, pełnych numerów kart

## Quick Security Review

Przed każdym PR sprawdź:
1. [ ] Input validation na nowych endpointach?
2. [ ] Parameterized queries wszędzie?
3. [ ] Autoryzacja sprawdzana?
4. [ ] Żadnych hardcoded secrets?
5. [ ] Error handling nie leakuje info?
