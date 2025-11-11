# BMAD Method - Instrukcja Użycia

**BMAD (Breakthrough Method for Agile AI-Driven Development)** to platforma wspierająca współpracę człowieka z AI, umożliwiająca tworzenie i zarządzanie specjalistycznymi agentami AI oraz zautomatyzowanymi procesami.

## 📦 Instalacja

### Poprawna nazwa pakietu

⚠️ **WAŻNE**: Pakiet nazywa się `bmad-method`, **nie** `bmad`!

```bash
# ❌ BŁĘDNIE - pakiet nie istnieje
npx bmad --version

# ✅ POPRAWNIE
npx bmad-method@alpha --version
```

### Instalacja w projekcie

```bash
# Z katalogu głównego projektu
npx bmad-method@alpha install
```

## 🚀 Komendy

### Skrypty npm (dodane do package.json)

```bash
# Sprawdź status instalacji
pnpm bmad:status

# Wyświetl dostępne moduły
pnpm bmad:list

# Aktualizuj BMAD
pnpm bmad:update

# Bezpośrednie użycie (wszystkie komendy)
pnpm bmad [command]
```

### Bezpośrednie użycie npx

```bash
# Wersja
npx bmad-method@alpha --version

# Status instalacji
npx bmad-method@alpha status

# Lista modułów
npx bmad-method@alpha list

# Aktualizacja
npx bmad-method@alpha update

# Pomoc
npx bmad-method@alpha --help
```

## 📊 Status Instalacji

Aktualnie zainstalowane w projekcie MonoPilot:

- **Lokacja**: `.bmad/`
- **Wersja**: `6.0.0-alpha.8`
- **Core**: ✓ Zainstalowany
- **Moduły**:
  - ✓ `core` (vunknown)
  - ✓ `bmm` (vunknown)

## 📦 Dostępne Moduły

- **bmb** - BMAD Module (v5.0.0)
- **bmgd** - BMAD Module (v5.0.0)
- **bmm** - BMAD Module (v5.0.0) [zainstalowany]
- **cis** - BMAD Module (v5.0.0)

## 🔧 Komendy CLI

```bash
# Build agent XML files from YAML sources
npx bmad-method@alpha build [options] [agent]

# Install BMAD Core agents and tools
npx bmad-method@alpha install

# List available modules
npx bmad-method@alpha list

# Show installation status
npx bmad-method@alpha status [options]

# Remove BMAD installation
npx bmad-method@alpha uninstall [options]

# Update existing BMAD installation
npx bmad-method@alpha update [options]

# Display help
npx bmad-method@alpha help [command]
```

## 📁 Struktura Projektu

Po instalacji, BMAD tworzy strukturę w `.bmad/`:

```
.bmad/
├── _cfg/              # Konfiguracja agentów i manifestów
├── bmm/               # BMAD Method Module
│   ├── agents/        # Definicje agentów AI
│   ├── docs/          # Dokumentacja
│   ├── tasks/         # Definicje zadań
│   ├── workflows/     # Workflows (analiza, planowanie, implementacja)
│   └── testarch/      # Architektura testów
└── core/              # BMAD Core
    ├── agents/        # Core agents
    ├── tasks/         # Core tasks
    └── workflows/     # Core workflows
```

## 🎯 Następne Kroki

1. **Uruchom agenta**: Możesz uruchomić dowolnego agenta i wykonać polecenie `*workflow-init`, aby przejść przez proces konfiguracji.

2. **Eksploruj workflows**: Sprawdź dostępne workflow w `.bmad/bmm/workflows/`:
   - `1-analysis/` - Analiza i research
   - `2-plan-workflows/` - Planowanie (PRD, Tech Spec, UX)
   - `3-solutioning/` - Solutioning i architektura
   - `4-implementation/` - Implementacja i code review

3. **Skonfiguruj agentów**: Zobacz `.bmad/_cfg/agents/` dla dostosowania agentów AI

## ⚠️ Uwagi

- **Wersja Alpha**: Ta wersja może zawierać błędy i nie jest jeszcze w pełni stabilna
- **Dokumentacja**: Zobacz `.bmad/bmm/docs/` dla pełnej dokumentacji
- **Repozytorium**: https://github.com/bmad-code-org/BMAD-METHOD

## 🐛 Troubleshooting

### Błąd: "404 Not Found - bmad"

**Przyczyna**: Używasz niepoprawnej nazwy pakietu

**Rozwiązanie**: Użyj `bmad-method@alpha` zamiast `bmad`

```bash
# ❌ Błąd
npm install bmad
npx bmad --version

# ✅ Poprawnie
npx bmad-method@alpha install
npx bmad-method@alpha --version
```

### Instalacja nie działa

1. Sprawdź wersję Node.js: `node --version` (wymagane ≥20.0.0)
2. Wyczyść cache npm: `npm cache clean --force`
3. Spróbuj ponownie: `npx bmad-method@alpha install`

## 📚 Dodatkowe Zasoby

- **GitHub**: https://github.com/bmad-code-org/BMAD-METHOD
- **Dokumentacja lokalna**: `.bmad/bmm/docs/README.md`
- **Quick Start**: `.bmad/bmm/docs/quick-start.md`
- **FAQ**: `.bmad/bmm/docs/faq.md`

---

**Ostatnia aktualizacja**: 2025-01-11  
**Wersja BMAD**: 6.0.0-alpha.8

