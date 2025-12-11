# Instalacja na Lokalnej Maszynie (Windows/Mac/Linux)

**Wersja:** 2.0.0
**Data:** 2025-12-11
**Cel:** Przenieść Universal Cache System z devcontainera na lokalną maszynę

---

## 📋 WYMAGANIA

### Software
- ✅ **Python 3.8+** (sprawdź: `python --version` lub `python3 --version`)
- ✅ **Git** (sprawdź: `git --version`)
- ✅ **Bash/Terminal** (Windows: Git Bash lub WSL)
- ⬜ **pip** (menadżer pakietów Python)

### API Keys
- ✅ **Claude API Key** (masz: `sk-ant-api03-...`)
- ✅ **OpenAI API Key** (masz: `sk-proj-...`)

### Miejsce na dysku
- **Lokalnie:** ~500MB (cache + dependencies)
- **Globalnie:** ~2GB (opcjonalne - global knowledge base)

---

## 🚀 INSTALACJA KROK PO KROKU

### KROK 1: Pobierz Projekt z DevContainer

#### Opcja A: Git Clone (ZALECANE)
```bash
# Na lokalnej maszynie
cd ~/Documents/Projects  # lub gdzie chcesz

# Clone repozytorium
git clone https://github.com/twoj-username/agent-methodology-pack.git
cd agent-methodology-pack
```

#### Opcja B: Download ZIP
```bash
# Jeśli nie masz git, pobierz ZIP z GitHuba
# Rozpakuj do: ~/Documents/Projects/agent-methodology-pack
```

#### Opcja C: Skopiuj z DevContainer (jeśli chcesz lokalną wersję)
```bash
# Z devcontainera skopiuj pliki lokalnie
# W VS Code: File → Save Workspace As... → Local folder
```

---

### KROK 2: Instalacja Python Dependencies

```bash
# Przejdź do katalogu projektu
cd ~/Documents/Projects/agent-methodology-pack

# OPCJA 1: Globalnie (prostsze)
pip install chromadb openai

# OPCJA 2: Virtual Environment (zalecane dla izolacji)
python -m venv venv

# Aktywuj venv:
# Windows (Git Bash):
source venv/Scripts/activate

# Mac/Linux:
source venv/bin/activate

# Zainstaluj dependencies
pip install chromadb openai

# Zweryfikuj instalację
python -c "import chromadb; import openai; print('✅ Dependencies OK')"
```

---

### KROK 3: Konfiguracja API Keys

#### Windows

**Opcja A: Environment Variables (System)**
```
1. Wciśnij Win + X → System
2. Advanced system settings → Environment Variables
3. User variables → New

Dodaj:
Name: CLAUDE_API_KEY
Value: sk-ant-api03-YOUR_CLAUDE_API_KEY_HERE

Name: OPENAI_API_KEY
Value: sk-proj-YOUR_OPENAI_API_KEY_HERE

4. Kliknij OK → OK → OK
5. Restart terminala
```

**Opcja B: .env file (Per-Project)**
```bash
# W katalogu projektu
cat > .env << 'EOF'
CLAUDE_API_KEY=sk-ant-api03-YOUR_CLAUDE_API_KEY_HERE
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE
EOF

# Dodaj do .gitignore (WAŻNE!)
echo ".env" >> .gitignore
```

#### Mac/Linux

**Opcja A: Shell Profile**
```bash
# Dodaj do ~/.bashrc lub ~/.zshrc
echo 'export CLAUDE_API_KEY="sk-ant-api03-YOUR_CLAUDE_API_KEY_HERE"' >> ~/.bashrc
echo 'export OPENAI_API_KEY="sk-proj-YOUR_OPENAI_API_KEY_HERE"' >> ~/.bashrc

# Reload
source ~/.bashrc

# Zweryfikuj
echo $CLAUDE_API_KEY  # powinno wyświetlić klucz
```

**Opcja B: .env file (jw. jak Windows)**

---

### KROK 4: Inicjalizacja Cache System

```bash
# Sprawdź czy wszystko działa
bash scripts/cache-stats.sh

# Jeśli widzisz dashboard - ✅ DZIAŁA!
```

Jeśli błędy, zobacz [Troubleshooting](#troubleshooting) poniżej.

---

### KROK 5: Test na Lokalnej Maszynie

```bash
# Test 1: Cache Manager
python .claude/cache/cache_manager.py

# Powinno wyświetlić:
# ✅ Cache MISS - would call API here
# ✅ Stored in cache
# ✅ Cache HIT on second try!

# Test 2: Semantic Cache (z OpenAI)
python .claude/cache/semantic_cache.py

# Powinno wyświetlić:
# 🧠 Semantic Cache Demo
# ✅ Stored in semantic cache...

# Test 3: Dashboard
bash scripts/cache-stats.sh

# Powinno wyświetlić kolorowy dashboard
```

---

### KROK 6: Opcjonalnie - Global Cache (Cross-Project)

Jeśli chcesz współdzielić cache między projektami:

```bash
# Utwórz globalny katalog
mkdir -p ~/.claude-agent-pack/global/{agents,patterns,skills,qa-patterns}

# Windows (Git Bash):
mkdir -p ~/AppData/Roaming/claude-agent-pack/global/{agents,patterns,skills,qa-patterns}

# Zweryfikuj
ls -la ~/.claude-agent-pack/global/

# W config.json ustaw:
# "sharedCache": { "enabled": true }
```

---

## 🔧 KONFIGURACJA DLA SYSTEMU

### Windows-Specific

#### Git Bash (zalecane)
```bash
# Pobierz Git for Windows (zawiera Git Bash)
# https://git-scm.com/download/win

# Wszystkie skrypty będą działać w Git Bash
```

#### WSL (Windows Subsystem for Linux)
```bash
# Jeśli masz WSL
wsl --install  # (jeśli nie masz)

# W WSL:
cd /mnt/c/Users/Mariusz/Documents/Projects/agent-methodology-pack
pip install chromadb openai
bash scripts/cache-stats.sh
```

#### PowerShell (alternatywa)
```powershell
# Skrypty bash nie działają natywnie
# Konwertuj na .ps1 lub użyj Git Bash/WSL
```

---

### Mac-Specific

```bash
# Upewnij się że masz Python 3
python3 --version

# Jeśli nie:
brew install python3

# Dependencies
pip3 install chromadb openai

# Wszystko powinno działać out-of-the-box
```

---

### Linux-Specific

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip git

# Fedora/RHEL
sudo dnf install python3 python3-pip git

# Dependencies
pip3 install chromadb openai
```

---

## ✅ WERYFIKACJA INSTALACJI

### Checklist

```bash
# 1. Python działa?
python --version  # lub python3 --version
# Expected: Python 3.8+

# 2. Dependencies zainstalowane?
python -c "import chromadb; import openai; print('✅ OK')"
# Expected: ✅ OK

# 3. API keys ustawione?
echo $OPENAI_API_KEY
# Expected: sk-proj-...

# 4. Cache directory istnieje?
ls -la .claude/cache/
# Expected: config.json, cache_manager.py, semantic_cache.py

# 5. Scripts wykonywalne?
bash scripts/cache-stats.sh
# Expected: Dashboard wyświetlony

# 6. Test działa?
python .claude/cache/cache_manager.py
# Expected: ✅ Cache manager working!
```

Jeśli wszystkie ✅ - **GOTOWE! System zainstalowany lokalnie!** 🎉

---

## 🐛 TROUBLESHOOTING

### Problem: "Python not found"

**Windows:**
```bash
# Pobierz Python z python.org
# https://www.python.org/downloads/

# Podczas instalacji ZAZNACZ: "Add Python to PATH"
```

**Mac:**
```bash
brew install python3
```

**Linux:**
```bash
sudo apt install python3 python3-pip  # Ubuntu/Debian
sudo dnf install python3 python3-pip  # Fedora
```

---

### Problem: "pip: command not found"

```bash
# Windows (jako Admin):
python -m ensurepip --upgrade

# Mac/Linux:
python3 -m ensurepip --upgrade

# Lub zainstaluj osobno:
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python get-pip.py
```

---

### Problem: "chromadb: No module named 'chromadb'"

```bash
# Sprawdź którą wersję Python używasz
which python   # lub: where python (Windows)
which pip      # lub: where pip (Windows)

# Zainstaluj w odpowiedniej wersji
python -m pip install chromadb openai
# lub
python3 -m pip install chromadb openai
```

---

### Problem: "Permission denied: scripts/cache-stats.sh"

```bash
# Windows (Git Bash):
chmod +x scripts/cache-*.sh

# Lub uruchom bezpośrednio:
bash scripts/cache-stats.sh
```

---

### Problem: "OPENAI_API_KEY not found"

**Sprawdź czy zmienna jest ustawiona:**
```bash
echo $OPENAI_API_KEY

# Jeśli puste:
# Windows - ustaw w System Properties (patrz KROK 3)
# Mac/Linux - dodaj do ~/.bashrc (patrz KROK 3)
```

**Alternatywa: .env file**
```bash
# Utwórz .env w root projektu
cat > .env << 'EOF'
OPENAI_API_KEY=twoj-klucz-tutaj
EOF

# W kodzie Python:
from dotenv import load_dotenv
load_dotenv()
```

---

### Problem: "Cache directory not found"

```bash
# Utwórz manualnie
mkdir -p .claude/cache/{hot,cold,semantic,qa-patterns,logs}
mkdir -p ~/.claude-agent-pack/global/{agents,patterns,skills,qa-patterns}

# Zweryfikuj strukturę
tree .claude/cache/  # lub: ls -R .claude/cache/
```

---

### Problem: Windows - "bash: command not found"

**Instaluj Git Bash:**
1. Pobierz Git for Windows: https://git-scm.com/download/win
2. Podczas instalacji wybierz: "Use Git and optional Unix tools from Command Prompt"
3. Restartuj terminal
4. Użyj "Git Bash" zamiast CMD/PowerShell

**Alternatywa: WSL**
```powershell
# W PowerShell jako Admin:
wsl --install

# Restartuj komputer
# Uruchom "Ubuntu" z Start Menu
# Kontynuuj instalację w WSL
```

---

## 📊 PORÓWNANIE: DevContainer vs Lokalna Maszyna

| Aspekt | DevContainer | Lokalna Maszyna |
|--------|-------------|-----------------|
| **Setup Time** | 0 min (gotowe) | 10-15 min |
| **Dependencies** | Pre-installed | Musisz zainstalować |
| **Performance** | Wolniejsze | Szybsze |
| **Persistence** | Może się resetować | Zawsze persists |
| **Portability** | Wymaga Docker | Działa natywnie |
| **Development** | Idealne do testów | Idealne do produkcji |

**Zalecenie:** Używaj lokalnej maszyny do codziennej pracy, devcontainer do testowania.

---

## 🎯 CO DALEJ?

Po zainstalowaniu na lokalnej maszynie:

1. ✅ **Przetestuj:** `bash scripts/cache-test.sh`
2. ✅ **Monitoruj:** `bash scripts/cache-stats.sh`
3. ✅ **Użyj w kodzie:** Patrz `docs/CACHE-QUICK-START.md`
4. ✅ **Przenieś do innych projektów:** Patrz `docs/MIGRATION-TO-OTHER-PROJECTS.md`

---

## 📞 POMOC

Jeśli coś nie działa:

1. **Przeczytaj troubleshooting** powyżej
2. **Check logs:** `.claude/cache/logs/access.log`
3. **Sprawdź config:** `.claude/cache/config.json`
4. **Run diagnostics:** `bash scripts/cache-test.sh`

---

**✅ Po wykonaniu tych kroków masz w pełni działający system cache na lokalnej maszynie!**
