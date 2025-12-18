# Migracja Cache System do Innych Projektów

**Wersja:** 2.0.0
**Cel:** Zero-Config Portability - skopiuj i działa!
**Czas migracji:** 5-10 minut

---

## 🎯 FILOZOFIA: ZERO-CONFIG PORTABILITY

Universal Cache System został zaprojektowany tak, aby:
- ✅ **Skopiuj folder** → działa natychmiast
- ✅ **Brak konfiguracji** → auto-detect wszystkiego
- ✅ **Działa wszędzie** → Python, Node.js, Go, Rust...
- ✅ **Share across projects** → globalny cache opcjonalny

---

## 🚀 SZYBKA MIGRACJA (3 KROKI)

### KROK 1: Skopiuj Cache System

```bash
# Źródło: agent-methodology-pack
# Cel: twój nowy projekt

# Z agent-methodology-pack (źródło):
cd ~/Documents/Projects/agent-methodology-pack

# Do nowego projektu (cel):
cp -r .claude/cache ~/Documents/Projects/twoj-nowy-projekt/.claude/

# Lub skopiuj całą strukturę .claude:
cp -r .claude ~/Documents/Projects/twoj-nowy-projekt/

# Gotowe! ✅
```

**To wszystko!** System powinien już działać.

---

### KROK 2: Zweryfikuj Instalację

```bash
cd ~/Documents/Projects/twoj-nowy-projekt

# Sprawdź strukturę
ls -la .claude/cache/

# Powinno pokazać:
# config.json
# cache_manager.py
# semantic_cache.py
# hot/, cold/, semantic/, qa-patterns/, logs/

# Test
python .claude/cache/cache_manager.py

# Jeśli ✅ "Cache manager working!" - GOTOWE!
```

---

### KROK 3: (Opcjonalnie) Dostosuj Config

```bash
# Jeśli chcesz zmienić ustawienia:
nano .claude/cache/config.json

# Możesz zmienić:
# - TTL (czas życia cache)
# - Similarity threshold (semantic cache)
# - Enable/disable poszczególne warstwy
# - Ścieżki do storage

# Domyślnie wszystko działa out-of-the-box
```

---

## 📦 CO ZOSTAJE W NOWYM PROJEKCIE?

### Minimalna Migracja (tylko cache)

```
twoj-nowy-projekt/
└── .claude/
    └── cache/
        ├── config.json           # ✅ Konfiguracja
        ├── cache_manager.py      # ✅ Core module
        ├── semantic_cache.py     # ✅ Semantic search
        ├── hot/                  # Puste (auto-create)
        ├── cold/                 # Puste (auto-create)
        ├── semantic/             # Puste (auto-create)
        ├── qa-patterns/          # Puste (auto-create)
        └── logs/                 # Puste (auto-create)
```

**Rozmiar:** ~50KB (tylko kod i config)

---

### Pełna Migracja (z agents, patterns, workflows)

```bash
# Jeśli chcesz całą infrastrukturę:
cp -r .claude ~/Documents/Projects/twoj-nowy-projekt/

# To skopiuje:
# - cache/ (system cachowania)
# - agents/ (definicje agentów)
# - patterns/ (wzorce)
# - workflows/ (przepływy pracy)
# - state/ (zarządzanie stanem)
# - templates/ (szablony)
```

**Rozmiar:** ~5MB (całość)

---

## 🌍 GLOBAL CACHE (Cross-Project Sharing)

Jeśli chcesz **współdzielić cache między projektami**:

### Setup Global Cache (raz, na początku)

```bash
# Utwórz globalny katalog (tylko raz!)
mkdir -p ~/.claude-agent-pack/global/{agents,patterns,skills,qa-patterns}

# Windows:
mkdir -p ~/AppData/Roaming/claude-agent-pack/global/{agents,patterns,skills,qa-patterns}

# Włącz w config.json (w KAŻDYM projekcie):
{
  "sharedCache": {
    "enabled": true,
    "location": "~/.claude-agent-pack/global",
    "shareAgents": true,
    "sharePatterns": true,
    "shareSkills": true,
    "shareQA": true
  }
}
```

### Jak to działa?

```
~/.claude-agent-pack/global/     # GLOBAL (wszystkie projekty)
├── agents/
│   └── MY-CUSTOM-AGENT.md       # Dostępny wszędzie!
├── patterns/
│   └── my-pattern.md
├── skills/
│   └── my-skill.md
└── qa-patterns/                 # Q&A z wszystkich projektów
    └── embeddings/

/project-A/.claude/               # PROJECT A
├── cache/ (local)               # Izolowany cache
└── agents/
    └── local-agent.md           # Tylko w tym projekcie

/project-B/.claude/               # PROJECT B
├── cache/ (local)               # Izolowany cache
└── patterns/
    └── local-pattern.md         # Tylko w tym projekcie

# Logika resolucji:
# 1. Sprawdź local (project/.claude/)
# 2. Jeśli nie ma, sprawdź global (~/.claude-agent-pack/global/)
# 3. Jeśli nie ma, użyj default
```

---

## 🛠️ MIGRACJA KROK PO KROKU (Szczegółowa)

### SCENARIUSZ 1: Nowy Projekt (od zera)

```bash
# 1. Utwórz nowy projekt
mkdir ~/Documents/Projects/new-project
cd ~/Documents/Projects/new-project

# 2. Skopiuj cache system
cp -r ~/Documents/Projects/agent-methodology-pack/.claude/cache .claude/

# 3. Skopiuj scripts (opcjonalnie)
mkdir scripts
cp ~/Documents/Projects/agent-methodology-pack/scripts/cache-*.sh scripts/

# 4. API keys (użyj globalnych env variables lub .env)
cat > .env << 'EOF'
OPENAI_API_KEY=twoj-klucz
EOF

# 5. Test
python .claude/cache/cache_manager.py

# ✅ Działa!
```

---

### SCENARIUSZ 2: Istniejący Projekt (add cache)

```bash
# Masz już projekt z kodem
cd ~/Documents/Projects/existing-project

# 1. Dodaj folder .claude (jeśli nie ma)
mkdir -p .claude

# 2. Skopiuj cache system
cp -r ~/Documents/Projects/agent-methodology-pack/.claude/cache .claude/

# 3. Dodaj .gitignore entries
cat >> .gitignore << 'EOF'
# Cache
.claude/cache/hot/*
.claude/cache/cold/*
.claude/cache/semantic/*
.claude/cache/logs/*
!.claude/cache/config.json
!.claude/cache/*.py
EOF

# 4. Test
python .claude/cache/cache_manager.py

# ✅ Cache dodany do istniejącego projektu!
```

---

### SCENARIUSZ 3: Monorepo (wiele projektów w jednym repo)

```bash
# Struktura:
monorepo/
├── frontend/
├── backend/
└── shared/

# Opcja A: Cache per-project (izolacja)
cp -r .claude/cache monorepo/frontend/.claude/
cp -r .claude/cache monorepo/backend/.claude/

# Opcja B: Shared cache (współdzielony)
cp -r .claude/cache monorepo/shared/.claude/

# W frontend/backend - symlink do shared:
cd monorepo/frontend
ln -s ../shared/.claude .claude

cd monorepo/backend
ln -s ../shared/.claude .claude

# Oba projekty używają tego samego cache! ✅
```

---

### SCENARIUSZ 4: Docker/Container

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Skopiuj cache system
COPY .claude/cache /app/.claude/cache

# Zainstaluj dependencies
RUN pip install chromadb openai

# API keys jako ENV
ENV OPENAI_API_KEY=your-key-here

# Twoja aplikacja
COPY . /app

CMD ["python", "your_app.py"]
```

```yaml
# docker-compose.yml
services:
  app:
    build: .
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./.claude/cache:/app/.claude/cache  # Persist cache
```

---

### SCENARIUSZ 5: CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI with Cache

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Cache pip packages
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}

      - name: Cache Claude cache
        uses: actions/cache@v3
        with:
          path: .claude/cache
          key: ${{ runner.os }}-claude-cache-${{ hashFiles('.claude/cache/config.json') }}

      - name: Install dependencies
        run: pip install chromadb openai

      - name: Run tests with cache
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          python .claude/cache/cache_manager.py
          bash scripts/cache-stats.sh
```

---

## 🔄 SYNCHRONIZACJA MIĘDZY PROJEKTAMI

### Automatyczna Sync (Global Cache)

```bash
# 1. Włącz shared cache w config.json (każdy projekt):
{
  "sharedCache": {
    "enabled": true,
    "syncMode": "auto"
  }
}

# 2. Q&A patterns automatycznie sync do global
# Projekt A:
# Pytanie → odpowiedź → zapisz local + global

# Projekt B:
# To samo pytanie → znajdzie w global cache! ✅
```

### Manualna Sync

```bash
# Export cache z Projektu A
cd ~/Documents/Projects/project-a
python .claude/cache/cache_manager.py export > cache-export.json

# Import do Projektu B
cd ~/Documents/Projects/project-b
python .claude/cache/cache_manager.py import < cache-export.json

# Lub skopiuj cold cache bezpośrednio
cp -r ~/Documents/Projects/project-a/.claude/cache/cold/* \
      ~/Documents/Projects/project-b/.claude/cache/cold/
```

---

## ⚙️ DOSTOSOWANIE CONFIG PER-PROJECT

### Template Config (project-specific)

```json
{
  "version": "2.0.0",
  "mode": "per-project",

  // Wyłącz semantic cache jeśli nie potrzebujesz OpenAI
  "semanticCache": {
    "enabled": false
  },

  // Zwiększ TTL dla długotrwałych projektów
  "coldCache": {
    "ttlHours": 168  // 7 dni zamiast 24h
  },

  // Włącz global sharing
  "sharedCache": {
    "enabled": true,
    "shareQA": true
  }
}
```

### Przykładowe Konfiguracje

#### Projekt: Rapid Prototyping (oszczędzaj maksymalnie)
```json
{
  "semanticCache": {
    "enabled": true,
    "similarityThreshold": 0.80  // Więcej matches
  },
  "coldCache": {
    "ttlHours": 168  // 7 dni
  }
}
```

#### Projekt: Production (stabilność)
```json
{
  "semanticCache": {
    "enabled": true,
    "similarityThreshold": 0.90  // Tylko pewne matches
  },
  "coldCache": {
    "ttlHours": 24  // Standard
  }
}
```

#### Projekt: Offline/No OpenAI
```json
{
  "semanticCache": {
    "enabled": false  // Bez OpenAI
  },
  "sharedCache": {
    "enabled": false  // Tylko local
  }
}
```

---

## 📊 MONITORING WIELU PROJEKTÓW

### Dashboard dla wszystkich projektów

```bash
#!/bin/bash
# scripts/multi-project-stats.sh

echo "📊 MULTI-PROJECT CACHE STATS"
echo "================================"

for project in ~/Documents/Projects/*/; do
  if [ -f "$project/.claude/cache/logs/metrics.json" ]; then
    echo ""
    echo "Project: $(basename $project)"
    cd "$project"
    bash scripts/cache-stats.sh | head -30
  fi
done
```

### Global Cache Stats

```bash
# Statystyki globalnego cache
echo "🌍 Global Cache Statistics:"
echo "Agents: $(ls -1 ~/.claude-agent-pack/global/agents/ | wc -l)"
echo "Patterns: $(ls -1 ~/.claude-agent-pack/global/patterns/ | wc -l)"
echo "Skills: $(ls -1 ~/.claude-agent-pack/global/skills/ | wc -l)"
echo "Q&A: $(ls -1 ~/.claude-agent-pack/global/qa-patterns/ | wc -l)"
```

---

## 🔒 BEZPIECZEŃSTWO PRZY MIGRACJI

### Co NIE kopiować między projektami

```bash
# ❌ NIE kopiuj:
.claude/cache/hot/*        # Session cache (project-specific)
.claude/cache/logs/*       # Logi (project-specific)
.env                       # API keys (może mieć różne klucze)

# ✅ Kopiuj:
.claude/cache/config.json  # Konfiguracja
.claude/cache/*.py         # Code
.claude/cache/cold/*       # Long-term cache (opcjonalnie)
```

### .gitignore Template

```bash
# W KAŻDYM projekcie dodaj do .gitignore:
cat >> .gitignore << 'EOF'

# Claude Cache System
.claude/cache/hot/*
.claude/cache/cold/*
.claude/cache/semantic/*
.claude/cache/qa-patterns/*
.claude/cache/logs/*

# Keep structure but not data
!.claude/cache/.gitkeep
!.claude/cache/*/.gitkeep

# Keep code and config
!.claude/cache/config.json
!.claude/cache/*.py
!.claude/cache/*.sh

# API Keys
.env
.env.local
.env.*.local

EOF
```

---

## 🎯 PRZYKŁADY INTEGRACJI

### Python Project

```python
# your_app.py
from claude.cache.cache_manager import CacheManager

cache = CacheManager()

def ask_claude(query):
    # Sprawdź cache
    result = cache.get(query)
    if result:
        return result["response"]

    # Cache miss - wywołaj API
    response = claude_api.call(query)

    # Zapisz w cache
    cache.set(query, response)
    return response

# Użycie
answer = ask_claude("How to implement authentication?")
```

### Node.js Project

```javascript
// Use Python cache from Node.js
const { spawn } = require('child_process');

function getFromCache(query) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [
      '.claude/cache/cache_manager.py',
      'get',
      query
    ]);

    python.stdout.on('data', (data) => {
      resolve(JSON.parse(data.toString()));
    });
  });
}

// Użycie
const result = await getFromCache("my query");
```

### Go Project

```go
// Execute Python cache manager
package main

import (
    "encoding/json"
    "os/exec"
)

func getFromCache(query string) (map[string]interface{}, error) {
    cmd := exec.Command("python", ".claude/cache/cache_manager.py", "get", query)
    output, err := cmd.Output()
    if err != nil {
        return nil, err
    }

    var result map[string]interface{}
    json.Unmarshal(output, &result)
    return result, nil
}
```

---

## ✅ CHECKLIST MIGRACJI

### Pre-Migration
- [ ] Mam zainstalowany Python 3.8+
- [ ] Mam zainstalowane: chromadb, openai
- [ ] Mam ustawione API keys (env variables lub .env)
- [ ] Mam kopię źródłowego projektu

### Migration
- [ ] Skopiowałem `.claude/cache/` do nowego projektu
- [ ] Skopiowałem `scripts/cache-*.sh` (opcjonalnie)
- [ ] Utworzyłem `.env` z kluczami API
- [ ] Dodałem `.gitignore` entries

### Post-Migration
- [ ] Test: `python .claude/cache/cache_manager.py`
- [ ] Test: `bash scripts/cache-stats.sh`
- [ ] Dostosowałem `config.json` (opcjonalnie)
- [ ] Włączyłem global cache (opcjonalnie)

### Verification
- [ ] Cache manager działa ✅
- [ ] Semantic cache działa (jeśli enabled) ✅
- [ ] Dashboard wyświetla metryki ✅
- [ ] Zapisuje/odczytuje z cache ✅

---

## 🚀 SZYBKIE SZABLONY

### Projekt 1: Frontend App

```bash
cp -r agent-methodology-pack/.claude/cache my-frontend/.claude/
cd my-frontend
echo 'OPENAI_API_KEY=...' > .env
python .claude/cache/cache_manager.py
```

### Projekt 2: Backend API

```bash
cp -r agent-methodology-pack/.claude my-backend/
cd my-backend
# Użyj global env variables
python .claude/cache/cache_manager.py
```

### Projekt 3: Full-Stack Monorepo

```bash
cp -r agent-methodology-pack/.claude monorepo/shared/
cd monorepo/frontend && ln -s ../shared/.claude .claude
cd monorepo/backend && ln -s ../shared/.claude .claude
```

---

## 📞 POMOC

**Problem:** Cache nie działa w nowym projekcie
```bash
# Sprawdź ścieżki
pwd
ls -la .claude/cache/

# Sprawdź Python path
python -c "import sys; print('\n'.join(sys.path))"

# Sprawdź dependencies
python -c "import chromadb; import openai; print('OK')"
```

**Problem:** Global cache nie sync
```bash
# Sprawdź config
cat .claude/cache/config.json | grep sharedCache

# Sprawdź katalog global
ls -la ~/.claude-agent-pack/global/

# Sprawdź permissions
chmod -R u+rw ~/.claude-agent-pack/
```

---

## ✨ PODSUMOWANIE

**Migracja = 3 komendy:**
```bash
cp -r agent-methodology-pack/.claude/cache nowy-projekt/.claude/
cd nowy-projekt
python .claude/cache/cache_manager.py  # Test
```

**To wszystko! Zero-config portability! 🎉**

---

**Next:** Zobacz `docs/CACHE-QUICK-START.md` jak używać w nowym projekcie.
