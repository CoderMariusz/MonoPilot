# Accessibility Checklist

> Używane przez: FRONTEND-DEV, QA-AGENT

## Keyboard Navigation

- [ ] Wszystkie interaktywne elementy są focusowalne (button, link, input)
- [ ] Kolejność TAB jest logiczna (lewo→prawo, góra→dół)
- [ ] Focus jest wyraźnie widoczny (outline, ring)
- [ ] Brak keyboard traps (można wyjść z każdego elementu)
- [ ] Skip links dla nawigacji (opcjonalne dla dużych stron)
- [ ] Escape zamyka modale/dropdowny

## Screen Readers

- [ ] Obrazy mają sensowny `alt` (lub `alt=""` dla dekoracyjnych)
- [ ] Formularze: `<label>` powiązane z `<input>` przez `for`/`id`
- [ ] ARIA labels dla elementów bez widocznego tekstu
- [ ] `aria-live` dla dynamicznych zmian (toasty, loading)
- [ ] Nagłówki (`h1`-`h6`) tworzą logiczną hierarchię
- [ ] Tabele mają `<th>` i `scope`

## ARIA Attributes

```html
<!-- Button bez tekstu -->
<button aria-label="Zamknij">×</button>

<!-- Loading state -->
<div aria-busy="true" aria-live="polite">Ładowanie...</div>

<!-- Expanded/collapsed -->
<button aria-expanded="false" aria-controls="menu">Menu</button>

<!-- Modal -->
<div role="dialog" aria-modal="true" aria-labelledby="title">
```

## Visual Accessibility

- [ ] Kontrast tekstu ≥ 4.5:1 (AA) lub ≥ 7:1 (AAA)
- [ ] Kontrast dużego tekstu (18px+) ≥ 3:1
- [ ] Informacja nie przekazywana TYLKO kolorem
- [ ] Tekst można powiększyć do 200% bez utraty funkcjonalności
- [ ] Animacje respektują `prefers-reduced-motion`

## Focus Management

- [ ] Przy otwarciu modala focus przechodzi DO modala
- [ ] Przy zamknięciu modala focus wraca do triggera
- [ ] Focus trap wewnątrz modali (Tab nie wychodzi poza)
- [ ] Po usunięciu elementu focus przechodzi na sensowny następny element

## Forms

- [ ] Każdy input ma label (widoczny lub `aria-label`)
- [ ] Błędy walidacji powiązane przez `aria-describedby`
- [ ] Required fields oznaczone (`aria-required` + wizualnie)
- [ ] Error messages czytelne dla screen readers

## Testing Tools

```bash
# Lighthouse accessibility audit
npx lighthouse URL --only-categories=accessibility

# axe-core w testach
npm install @axe-core/react
```

## Responsive Touch Targets

- [ ] Touch targets minimum 44x44px na mobile
- [ ] Odstęp między targetami minimum 8px
- [ ] Hover states mają też focus states

## Quick Validation

```javascript
// W devtools console
document.querySelectorAll('img:not([alt])');  // Obrazy bez alt
document.querySelectorAll('input:not([id])'); // Inputy bez id (dla label)
document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])'); // Niestandardowy tabindex
```
