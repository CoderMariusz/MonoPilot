# API Contract: User Preferences

**Story:** TD-208 - Language Selector for Allergen Names
**Epic:** 01-settings
**Date:** 2025-12-24
**Status:** DESIGNED

---

## Overview

This API provides endpoints for managing user preferences, specifically language preference for allergen names display.

**Design Decision:** User language preference is stored in the existing `users.language` column (migration 003). This approach was chosen over creating a separate `user_preferences` table because:
1. Users table already has `language` column
2. Single table reduces complexity
3. Direct relationship to user (no junction table needed)
4. Atomic updates with user profile

---

## Endpoints

### 1. Get User Preferences

**Endpoint:** `GET /api/v1/settings/users/me/preferences`

**Description:** Returns current user's preferences including language setting.

**Authentication:** Required (Supabase Auth JWT)

**Authorization:** User can only access their own preferences

#### Request

```http
GET /api/v1/settings/users/me/preferences
Authorization: Bearer {jwt_token}
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "language": "pl",
    "effective_language": "pl",
    "org_default_language": "en"
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `language` | string | null | User's explicit language preference, null if not set |
| `effective_language` | string | Computed language (user -> org -> 'en' fallback) |
| `org_default_language` | string | Organization's default locale |

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Not authenticated |
| 404 | NOT_FOUND | User profile not found |
| 500 | INTERNAL_ERROR | Database error |

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Not authenticated"
  }
}
```

---

### 2. Update User Preferences

**Endpoint:** `PUT /api/v1/settings/users/me/preferences`

**Description:** Updates current user's preferences.

**Authentication:** Required (Supabase Auth JWT)

**Authorization:** User can only update their own preferences

#### Request

```http
PUT /api/v1/settings/users/me/preferences
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "language": "pl"
}
```

**Request Body:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `language` | string | Yes | Must be one of: 'en', 'pl', 'de', 'fr' |

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "language": "pl",
    "effective_language": "pl",
    "updated_at": "2025-12-24T10:30:00Z"
  }
}
```

**Error Responses:**

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_LANGUAGE | Invalid language code: xx. Valid codes: en, pl, de, fr |
| 401 | UNAUTHORIZED | Not authenticated |
| 404 | NOT_FOUND | User profile not found |
| 500 | INTERNAL_ERROR | Database error |

---

### 3. Get Language Options

**Endpoint:** `GET /api/v1/settings/languages`

**Description:** Returns list of supported languages for UI dropdowns.

**Authentication:** Required (Supabase Auth JWT)

**Authorization:** Any authenticated user

#### Request

```http
GET /api/v1/settings/languages
Authorization: Bearer {jwt_token}
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "languages": [
      { "code": "en", "name": "English", "native_name": "English", "is_default": true },
      { "code": "pl", "name": "Polish", "native_name": "Polski", "is_default": false },
      { "code": "de", "name": "German", "native_name": "Deutsch", "is_default": false },
      { "code": "fr", "name": "French", "native_name": "Francais", "is_default": false }
    ]
  }
}
```

---

## Database Layer

### Table: users

The `users` table contains the `language` column for storing user preferences.

**Relevant Columns:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  language TEXT DEFAULT 'en',
  -- other columns...
  CONSTRAINT chk_users_language CHECK (language IN ('en', 'pl', 'de', 'fr'))
);
```

**Index:**
```sql
CREATE INDEX idx_users_language ON users(language);
```

### RPC Functions

**get_user_language(p_user_id UUID)**
- Returns effective language with fallback chain
- Fallback: user.language -> organization.locale -> 'en'

**set_user_language(p_language TEXT)**
- Updates current user's language preference
- Validates language code
- Raises exception for invalid codes

---

## Service Layer

**File:** `apps/frontend/lib/services/user-preference-service.ts`

```typescript
interface UserPreferenceService {
  // Get user's language preference with fallback
  getLanguagePreference(): Promise<{
    language: string | null;
    effective_language: string;
    org_default_language: string;
  }>;

  // Update user's language preference
  setLanguagePreference(lang: SupportedLanguage): Promise<void>;

  // Get list of supported languages
  getSupportedLanguages(): SupportedLanguage[];
}

type SupportedLanguage = 'en' | 'pl' | 'de' | 'fr';
```

---

## Validation Schema

**File:** `apps/frontend/lib/validation/user-preference-schemas.ts`

```typescript
import { z } from 'zod';

export const supportedLanguages = ['en', 'pl', 'de', 'fr'] as const;

export const languageSchema = z.enum(supportedLanguages, {
  errorMap: () => ({
    message: 'Invalid language code. Valid codes: en, pl, de, fr'
  })
});

export const updatePreferencesSchema = z.object({
  language: languageSchema
});

export type SupportedLanguage = z.infer<typeof languageSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
```

---

## API Route Implementation

**File:** `apps/frontend/app/api/v1/settings/users/me/preferences/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updatePreferencesSchema } from '@/lib/validation/user-preference-schemas';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  // Call RPC function for effective language with fallback
  const { data, error } = await supabase.rpc('get_user_language', { p_user_id: user.id });

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      language: data.language,
      effective_language: data.effective_language,
      org_default_language: data.org_default_language
    }
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  const body = await request.json();
  const validation = updatePreferencesSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_LANGUAGE', message: validation.error.issues[0].message } },
      { status: 400 }
    );
  }

  // Call RPC function to update language
  const { error } = await supabase.rpc('set_user_language', { p_language: validation.data.language });

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      language: validation.data.language,
      effective_language: validation.data.language,
      updated_at: new Date().toISOString()
    }
  });
}
```

---

## Frontend Integration

### React Hook

**File:** `apps/frontend/hooks/use-language-preference.ts`

```typescript
import { useState, useEffect } from 'react';
import { UserPreferenceService } from '@/lib/services/user-preference-service';

export function useLanguagePreference() {
  const [language, setLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadPreference() {
      try {
        const pref = await UserPreferenceService.getLanguagePreference();
        setLanguage(pref.effective_language);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPreference();
  }, []);

  const updateLanguage = async (newLang: string) => {
    setIsLoading(true);
    try {
      await UserPreferenceService.setLanguagePreference(newLang as SupportedLanguage);
      setLanguage(newLang);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { language, updateLanguage, isLoading, error };
}
```

---

## Test Scenarios

### Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Get preference (authenticated) | Returns user's language preference |
| Get preference (no user pref) | Returns org default language |
| Get preference (no org default) | Returns 'en' |
| Update to valid language | Updates successfully |
| Update to invalid language | Returns 400 INVALID_LANGUAGE |
| Get/Update unauthenticated | Returns 401 UNAUTHORIZED |

### Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Preference persists across sessions | Language saved to DB, loaded on next request |
| User changes language | Allergen names display in new language |
| Fallback chain works | user -> org -> 'en' fallback order correct |

---

## Security Considerations

1. **RLS Enforcement:** Users can only read/update their own preferences
2. **Input Validation:** Language code validated against whitelist
3. **No PII Exposure:** Only returns preference data, not user details
4. **Rate Limiting:** Consider adding rate limit for PUT endpoint

---

## Related Documents

- **Migration:** `supabase/migrations/031_add_user_language_preference.sql`
- **ADR-013:** RLS Org Isolation Pattern
- **Story TD-208:** Language Selector for Allergen Names
- **Wireframe SET-020:** Allergen List with Language Selector
