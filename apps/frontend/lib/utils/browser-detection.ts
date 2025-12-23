/**
 * Story 01.4: Browser Detection Utilities
 * Epic: 01-settings
 *
 * Auto-detect user's timezone and language from browser settings.
 * Used in OrganizationProfileStep component for smart defaults.
 */

/**
 * Get browser's timezone using Intl API
 *
 * Returns IANA timezone string (e.g., "Europe/Warsaw", "America/New_York")
 * Falls back to "UTC" if detection fails.
 *
 * @returns IANA timezone string
 *
 * @example
 * const tz = getBrowserTimezone(); // "Europe/Warsaw"
 */
export function getBrowserTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || 'UTC';
  } catch (error) {
    console.warn('Failed to detect browser timezone:', error);
    return 'UTC';
  }
}

/**
 * Get browser's language and map to supported language codes
 *
 * Supported languages: pl, en, de, fr
 * Falls back to "en" if browser language is not supported.
 *
 * @returns Language code ('pl' | 'en' | 'de' | 'fr')
 *
 * @example
 * const lang = getBrowserLanguage(); // "pl" if browser is set to Polish
 */
export function getBrowserLanguage(): 'pl' | 'en' | 'de' | 'fr' {
  try {
    // Get browser language (e.g., "pl-PL", "en-US", "de-DE")
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';

    // Extract language code (first 2 characters)
    const langCode = browserLang.substring(0, 2).toLowerCase();

    // Map to supported languages
    const supportedLanguages = ['pl', 'en', 'de', 'fr'];

    if (supportedLanguages.includes(langCode)) {
      return langCode as 'pl' | 'en' | 'de' | 'fr';
    }

    // Fallback to English
    return 'en';
  } catch (error) {
    console.warn('Failed to detect browser language:', error);
    return 'en';
  }
}

/**
 * Get browser's preferred currency based on locale
 *
 * Supported currencies: PLN, EUR, USD, GBP
 * Falls back to "EUR" if browser locale currency is not supported.
 *
 * @returns Currency code ('PLN' | 'EUR' | 'USD' | 'GBP')
 *
 * @example
 * const currency = getBrowserCurrency(); // "PLN" if browser is set to Polish locale
 */
export function getBrowserCurrency(): 'PLN' | 'EUR' | 'USD' | 'GBP' {
  try {
    const browserLang = navigator.language || 'en-US';

    // Map common locales to currencies
    const currencyMap: Record<string, 'PLN' | 'EUR' | 'USD' | 'GBP'> = {
      'pl': 'PLN',
      'pl-PL': 'PLN',
      'en-US': 'USD',
      'en-GB': 'GBP',
      'de': 'EUR',
      'de-DE': 'EUR',
      'fr': 'EUR',
      'fr-FR': 'EUR',
    };

    // Try full locale first, then language code
    const currency = currencyMap[browserLang] || currencyMap[browserLang.substring(0, 2)];

    return currency || 'EUR';
  } catch (error) {
    console.warn('Failed to detect browser currency:', error);
    return 'EUR';
  }
}
