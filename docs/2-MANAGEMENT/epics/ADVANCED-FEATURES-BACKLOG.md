# MonoPilot - Advanced Features Backlog

**Last Updated:** 2025-12-09
**Status:** Draft - High-Level Stories
**Source:** DISCOVERY-REPORT-V4.md, PHASE-3-ROADMAP.md

---

## Przeglad Epicow

| Epic | Nazwa | Stories | Faza | Priorytet |
|------|-------|---------|------|-----------|
| 8 | AI & Machine Learning | 12 | Phase 3 | HIGH |
| 9 | Digital Twin & Simulation | 10 | Phase 3 | MEDIUM-HIGH |
| 10 | IIoT & Edge Integration | 14 | Phase 3 | HIGH |
| 11 | Sustainability & ESG | 10 | Phase 3 | MEDIUM |
| 12 | Supply Chain Collaboration | 12 | Phase 4 | HIGH |
| 13 | Advanced Security | 10 | Phase 4 | HIGH |

**Suma:** 68 high-level stories (rozbudowane do 150+ w implementacji)

---

## Epic 8: AI & Machine Learning

### Story 8.1: Podstawowa Analityka Anomalii

**Jako** Manager Produkcji
**Chce** widziec automatyczne wykrywanie anomalii w danych produkcyjnych
**Aby** szybko reagowac na problemy zanim eskaluja

**Acceptance Criteria:**
- [ ] System wykrywa odchylenia od normy w czasie rzeczywistym
- [ ] Alert wyswietlany na dashboard z severity level
- [ ] Historia anomalii dostepna w raporcie
- [ ] Konfigurowalny prog wrazliwosci

**Technical Notes:**
- Statistical anomaly detection (Z-score, IQR) jako baseline
- ML model (Isolation Forest) jako upgrade path
- Integracja z danymi z Epic 10 (IIoT)

**Priority:** P1
**Estimate:** L
**Phase:** 3

---

### Story 8.2: Predictive Maintenance - Dashboard

**Jako** Manager Produkcji
**Chce** widziec prognoze stanu maszyn
**Aby** planowac konserwacje zapobiegawczo

**Acceptance Criteria:**
- [ ] Dashboard z lista maszyn i ich "health score"
- [ ] Prognoza awarii na podstawie trendow
- [ ] Rekomendacja terminu konserwacji
- [ ] Historia serwisowania maszyny

**Technical Notes:**
- Wymaga danych historycznych z sensorow (min 30 dni)
- Model regresji do prognozowania czasu do awarii (MTBF)
- Integracja z kalendarzem produkcyjnym

**Priority:** P1
**Estimate:** XL
**Phase:** 3

---

### Story 8.3: Predictive Maintenance - Alerty

**Jako** Operator
**Chce** otrzymywac powiadomienia o przewidywanej awarii
**Aby** poinformowac nadzor przed wystąpieniem problemu

**Acceptance Criteria:**
- [ ] Push notification na telefon/tablet
- [ ] Email alert do maintenance team
- [ ] Alert widoczny na panelu maszyny
- [ ] Mozliwosc "acknowledge" alertu

**Technical Notes:**
- Wykorzystanie istniejacego systemu notyfikacji
- Integracja z user preferences dla kanalow

**Priority:** P1
**Estimate:** M
**Phase:** 3

---

### Story 8.4: AI-Optimized Scheduling - Sugestie

**Jako** Planner
**Chce** otrzymywac sugestie optymalnej kolejnosci WO
**Aby** zmaksymalizowac efektywnosc produkcji

**Acceptance Criteria:**
- [ ] System proponuje alternatywna kolejnosc WO
- [ ] Widoczny expected improvement (% lub czas)
- [ ] Mozliwosc akceptacji lub odrzucenia sugestii
- [ ] Uwzglednienie constraints (due dates, material availability)

**Technical Notes:**
- Algorytm heurystyczny (genetic algorithm lub simulated annealing)
- API do pobierania current schedule i constraints
- Batch processing - sugestie generowane co godzine

**Priority:** P2
**Estimate:** XL
**Phase:** 3

---

### Story 8.5: AI Scheduling - Automatyczna Optymalizacja

**Jako** Manager Operacyjny
**Chce** wlaczyc automatyczna optymalizacje harmonogramu
**Aby** system sam dostosowywal kolejnosc WO

**Acceptance Criteria:**
- [ ] Toggle "Auto-optimize" w ustawieniach
- [ ] Konfigurowalne reguły (np. nie przestawiaj confirmed WO)
- [ ] Audit log zmian dokonanych przez AI
- [ ] Rollback do poprzedniego harmonogramu

**Technical Notes:**
- Wymaga Story 8.4 jako base
- Reinforcement learning do uczenia sie preferencji uzytkownika
- Tryb "shadow" - sugestie bez automatycznego wdrazania

**Priority:** P2
**Estimate:** L
**Phase:** 3

---

### Story 8.6: Quality Trend Analysis

**Jako** Quality Manager
**Chce** widziec trendy jakosciowe z predykcja
**Aby** zapobiegac problemom jakosciowym

**Acceptance Criteria:**
- [ ] Wykres trendow parametrow jakosciowych w czasie
- [ ] Prognoza przyszlych wartosci (7 dni)
- [ ] Alert przy trendzie zblizajacym sie do limitu
- [ ] Korelacja z parametrami procesu

**Technical Notes:**
- Time-series forecasting (ARIMA lub Prophet)
- Integracja z Epic 6 (Quality module)
- Dashboard widget

**Priority:** P2
**Estimate:** L
**Phase:** 3

---

### Story 8.7: Yield Optimization Recommendations

**Jako** Process Engineer
**Chce** otrzymywac rekomendacje optymalizacji wydajnosci
**Aby** redukowac straty materialowe

**Acceptance Criteria:**
- [ ] Analiza korelacji parametrow procesu z yield
- [ ] Top 3 rekomendacje dzialania
- [ ] Szacowany impact (% poprawa yield)
- [ ] Tracking wdrozonych rekomendacji

**Technical Notes:**
- Feature importance analysis z ML
- A/B testing framework dla rekomendacji
- Integration z consumption data z Epic 4

**Priority:** P2
**Estimate:** L
**Phase:** 3

---

### Story 8.8: Computer Vision - Setup

**Jako** Admin
**Chce** skonfigurowac kamery do automatycznej inspekcji
**Aby** umozliwic AI-based quality inspection

**Acceptance Criteria:**
- [ ] CRUD dla konfiguracji kamer
- [ ] Test connection z kamera
- [ ] Preview obrazu w real-time
- [ ] Konfiguracja strefy inspekcji (ROI)

**Technical Notes:**
- RTSP/HTTP streaming support
- Edge processing preferowane (latency)
- Popularne kamery: Cognex, Keyence, Basler

**Priority:** P3
**Estimate:** L
**Phase:** 3

---

### Story 8.9: Automated Quality Inspection - Detection

**Jako** Quality Inspector
**Chce** aby system automatycznie wykrywal defekty
**Aby** redukowac reczna inspekcje i bledy ludzkie

**Acceptance Criteria:**
- [ ] Real-time defect detection na linii
- [ ] Klasyfikacja typu defektu
- [ ] Automatyczne zatrzymanie linii (opcjonalne)
- [ ] Zdjecie defektu zapisane do NCR

**Technical Notes:**
- YOLO lub similar object detection model
- Transfer learning z pretrained models
- GPU-accelerated inference (edge lub cloud)

**Priority:** P3
**Estimate:** XL
**Phase:** 3

---

### Story 8.10: AI Training Dashboard

**Jako** Admin
**Chce** trenowac modele AI na danych mojej organizacji
**Aby** poprawic accuracy dla moich procesow

**Acceptance Criteria:**
- [ ] Upload zbiorow danych treningowych
- [ ] Start/monitor treningu modelu
- [ ] Porownanie wersji modeli (A/B)
- [ ] Deploy nowej wersji modelu

**Technical Notes:**
- MLflow lub Kubeflow dla model management
- AutoML dla low-code approach
- Data privacy - trenowanie per tenant

**Priority:** P3
**Estimate:** XL
**Phase:** 3

---

### Story 8.11: Natural Language Query

**Jako** Manager
**Chce** zadawac pytania systemowi w jezyku naturalnym
**Aby** szybko uzyskiwac odpowiedzi bez znajomosci raportow

**Acceptance Criteria:**
- [ ] Chat interface w aplikacji
- [ ] Odpowiedzi na pytania typu "ile wyprodukowano wczoraj?"
- [ ] Generowanie wykresow na podstawie query
- [ ] Historia rozmow

**Technical Notes:**
- LLM integration (OpenAI API lub local LLM)
- Text-to-SQL conversion
- Guardrails dla bezpieczenstwa (brak modyfikacji danych)

**Priority:** P3
**Estimate:** L
**Phase:** 3

---

### Story 8.12: AI Insights Weekly Report

**Jako** Manager
**Chce** otrzymywac cotygodniowy raport AI z insights
**Aby** byc na biezaco z wazymi trendami i rekomendacjami

**Acceptance Criteria:**
- [ ] Email z podsumowaniem tygodnia
- [ ] Top 5 anomalii/problemow
- [ ] Top 3 rekomendacje dzialania
- [ ] Porownanie z poprzednim tygodniem

**Technical Notes:**
- Scheduled job (cron lub Supabase Edge Functions)
- Template email z wykresami
- Personalizacja per user role

**Priority:** P2
**Estimate:** M
**Phase:** 3

---

## Epic 9: Digital Twin & Simulation

### Story 9.1: Process Model Definition

**Jako** Process Engineer
**Chce** definiowac wirtualne modele linii produkcyjnych
**Aby** moc symulowac zmiany przed wdrozeniem

**Acceptance Criteria:**
- [ ] CRUD dla modeli procesow
- [ ] Wizualna reprezentacja linii (diagram)
- [ ] Parametry maszyn (capacity, efficiency, downtime)
- [ ] Polaczenie modelu z rzeczywistymi maszynami

**Technical Notes:**
- JSON schema dla definicji modelu
- React Flow lub podobne dla wizualizacji
- Wersjonowanie modeli

**Priority:** P1
**Estimate:** L
**Phase:** 3

---

### Story 9.2: BOM What-If Analysis

**Jako** R&D Engineer
**Chce** symulowac alternatywne receptury
**Aby** ocenic wplyw na koszt i wydajnosc

**Acceptance Criteria:**
- [ ] Kopia BOM jako "wersja symulacyjna"
- [ ] Edycja skladnikow/proporcji
- [ ] Kalkulacja szacowanego kosztu
- [ ] Porownanie z oryginalem

**Technical Notes:**
- Kopiowanie BOM z flag "simulation"
- Costing engine z Epic 2 rozszerzony
- Integracja z NPD workflow (Epic 8 oryginalny)

**Priority:** P1
**Estimate:** M
**Phase:** 3

---

### Story 9.3: Routing Simulation

**Jako** Process Engineer
**Chce** symulowac alternatywne routing'i
**Aby** znalezc optymalna sciezke produkcji

**Acceptance Criteria:**
- [ ] Warianty routing dla produktu
- [ ] Symulacja czasu produkcji per wariant
- [ ] Symulacja obciazenia maszyn
- [ ] Rekomendacja najlepszego routing

**Technical Notes:**
- Discrete event simulation (SimPy-style)
- Monte Carlo dla uncertainty
- Wizualizacja timeline

**Priority:** P2
**Estimate:** L
**Phase:** 3

---

### Story 9.4: Real-Time Digital Twin Sync

**Jako** Manager
**Chce** widziec aktualny stan produkcji jako digital twin
**Aby** miec pelna wizualizacje operacji

**Acceptance Criteria:**
- [ ] Live visualization stanu linii
- [ ] Synchronizacja z danymi IIoT (real-time)
- [ ] Wskazniki OEE per maszyna
- [ ] Historyczny playback

**Technical Notes:**
- WebSocket dla real-time updates
- Integracja z Epic 10 (IIoT data)
- Canvas-based rendering dla wydajnosci

**Priority:** P2
**Estimate:** XL
**Phase:** 3

---

### Story 9.5: Capacity Planning Simulation

**Jako** Planner
**Chce** symulowac obciazenie zasobow w przyszlosci
**Aby** identyfikowac wąskie gardla

**Acceptance Criteria:**
- [ ] Wybor horyzontu symulacji (tydzien/miesiac)
- [ ] Load heatmap per maszyna
- [ ] Identyfikacja bottleneck'ow
- [ ] Sugestie rozwiazania (dodatkowa zmiana, outsourcing)

**Technical Notes:**
- Forward scheduling algorithm
- Integracja z WO backlog i production calendar
- Export do Excel dla planistow

**Priority:** P2
**Estimate:** L
**Phase:** 3

---

### Story 9.6: Energy Consumption Prediction

**Jako** Facility Manager
**Chce** symulowac zuzycie energii dla roznych scenariuszy
**Aby** optymalizowac koszty energii

**Acceptance Criteria:**
- [ ] Prognoza zuzycia na podstawie planu produkcji
- [ ] Porownanie scenariuszy (rozne shift patterns)
- [ ] Identyfikacja peak hours
- [ ] Szacunkowy koszt energii

**Technical Notes:**
- Dane energetyczne z Epic 11
- Integracja z taryfami energetycznymi
- Visualisation w formie Sankey diagram

**Priority:** P3
**Estimate:** M
**Phase:** 3

---

### Story 9.7: New Product Simulation

**Jako** R&D Manager
**Chce** symulowac produkcje nowego produktu
**Aby** ocenic wykonalnosc przed trial'em

**Acceptance Criteria:**
- [ ] Input: draft BOM + draft Routing
- [ ] Symulacja execution time
- [ ] Identyfikacja missing capabilities
- [ ] Cost estimation z uncertainty range

**Technical Notes:**
- Integracja z NPD module
- Confidence intervals dla szacunkow
- Comparison z podobnymi produktami

**Priority:** P2
**Estimate:** M
**Phase:** 3

---

### Story 9.8: Maintenance Impact Simulation

**Jako** Maintenance Manager
**Chce** symulowac wplyw planowanego downtime
**Aby** wybrac optymalny termin konserwacji

**Acceptance Criteria:**
- [ ] Wybor maszyny i czasu trwania maintenance
- [ ] Symulacja wplywu na plan produkcji
- [ ] Alternatywne terminy z najmniejszym impaktem
- [ ] Automatyczna sugestia optymalnego okna

**Technical Notes:**
- Integracja z WO schedule
- Constraint satisfaction algorithm
- Notyfikacja do planisty

**Priority:** P2
**Estimate:** M
**Phase:** 3

---

### Story 9.9: Scenario Comparison Dashboard

**Jako** Manager
**Chce** porownywac wiele scenariuszy symulacji
**Aby** podejmowac decyzje na podstawie danych

**Acceptance Criteria:**
- [ ] Save/load scenariuszy
- [ ] Side-by-side comparison (max 4)
- [ ] KPI comparison table (cost, time, efficiency)
- [ ] Export raportu porownawczego

**Technical Notes:**
- Persisted scenarios w database
- Parametric comparison
- PDF export

**Priority:** P2
**Estimate:** M
**Phase:** 3

---

### Story 9.10: 3D Visualization (Optional)

**Jako** Visitor/Manager
**Chce** widziec 3D wizualizacje fabryki
**Aby** miec imponujaca prezentacje dla gosci/inwestorow

**Acceptance Criteria:**
- [ ] 3D model hali z maszynami
- [ ] Real-time status overlay
- [ ] Navigation/rotation controls
- [ ] VR-ready export (opcjonalnie)

**Technical Notes:**
- Three.js lub Unity WebGL
- glTF format dla modeli maszyn
- Performance optimization dla mobile

**Priority:** P3
**Estimate:** XL
**Phase:** 3

---

## Epic 10: IIoT & Edge Integration

### Story 10.1: MQTT Gateway Configuration

**Jako** Admin
**Chce** skonfigurowac polaczenie MQTT
**Aby** laczyc sie z maszynami przesylajacymi dane MQTT

**Acceptance Criteria:**
- [ ] CRUD dla konfiguracji MQTT broker
- [ ] Test connection z brokerem
- [ ] Subscription na topics
- [ ] Mapping topic -> machine/sensor

**Technical Notes:**
- MQTT.js client dla browser
- Edge gateway dla on-premise (Mosquitto)
- TLS/SSL dla security

**Priority:** P1
**Estimate:** L
**Phase:** 3

---

### Story 10.2: OPC UA Connector

**Jako** Admin
**Chce** laczyc sie z PLC przez OPC UA
**Aby** zbierac dane z przemyslowych kontrolerow

**Acceptance Criteria:**
- [ ] CRUD dla polaczen OPC UA
- [ ] Browse node tree serwera OPC UA
- [ ] Wybor node'ow do monitorowania
- [ ] Konfiguracja interwalu pollingu

**Technical Notes:**
- node-opcua library
- Edge gateway wymagany (OPC UA server nie jest web-accessible)
- Security modes: None, Sign, SignAndEncrypt

**Priority:** P1
**Estimate:** XL
**Phase:** 3

---

### Story 10.3: Custom Sensor Definition

**Jako** Admin
**Chce** definiowac custom sensory i ich parametry
**Aby** modelowac unikalne urzadzenia w mojej fabryce

**Acceptance Criteria:**
- [ ] CRUD dla typow sensorow
- [ ] Definicja parametrow (name, unit, range)
- [ ] Przypisanie sensora do maszyny
- [ ] Tagging dla grupowania

**Technical Notes:**
- Flexible JSON schema dla parametrow
- Units library (SI + custom)
- Sensor templates dla popularnych typow

**Priority:** P1
**Estimate:** M
**Phase:** 3

---

### Story 10.4: Real-Time Data Display

**Jako** Operator
**Chce** widziec dane z sensorow w real-time
**Aby** monitorowac stan maszyny

**Acceptance Criteria:**
- [ ] Live value display per sensor
- [ ] Sparkline/mini-chart last 5 min
- [ ] Color coding (green/yellow/red)
- [ ] Threshold alerts

**Technical Notes:**
- WebSocket subscription
- React Query dla caching
- Debouncing dla high-frequency data

**Priority:** P1
**Estimate:** M
**Phase:** 3

---

### Story 10.5: Time-Series Storage

**Jako** System
**Chce** przechowywac dane sensorowe w time-series DB
**Aby** umozliwic analize historyczna

**Acceptance Criteria:**
- [ ] Automatyczne zapisywanie danych z sensorow
- [ ] Retention policy (hot/cold storage)
- [ ] Agregacja danych (1min -> 1h -> 1d)
- [ ] Query API dla historical data

**Technical Notes:**
- TimescaleDB extension dla Supabase
- Continuous aggregates
- Partitioning per month

**Priority:** P1
**Estimate:** M
**Phase:** 3

---

### Story 10.6: Edge Gateway Deployment

**Jako** Admin
**Chce** wdrozyc edge gateway w mojej sieci
**Aby** laczyc maszyny z MonoPilot cloud

**Acceptance Criteria:**
- [ ] Dokumentacja deployment'u (Raspberry Pi / Industrial PC)
- [ ] One-click provisioning przez cloud UI
- [ ] Auto-update firmware
- [ ] Health monitoring gateway'a

**Technical Notes:**
- Docker-based deployment
- Zero-trust connection (mTLS)
- Offline buffering dla resilience

**Priority:** P2
**Estimate:** XL
**Phase:** 3

---

### Story 10.7: Local Edge Processing

**Jako** System
**Chce** przetwarzac dane lokalnie na edge
**Aby** redukowac latency i bandwidth

**Acceptance Criteria:**
- [ ] Rules engine na edge (if-then)
- [ ] Local alerting
- [ ] Data filtering przed wyslaniem do cloud
- [ ] Konfiguracja reguł z cloud UI

**Technical Notes:**
- Node-RED lub custom rules engine
- WASM dla custom logic
- Store-and-forward dla offline

**Priority:** P2
**Estimate:** XL
**Phase:** 3

---

### Story 10.8: Event Bus (NATS) Integration

**Jako** Developer
**Chce** uzywac event bus do komunikacji miedzy serwisami
**Aby** miec decoupled architecture

**Acceptance Criteria:**
- [ ] NATS cluster deployed
- [ ] Publish/Subscribe pattern dla events
- [ ] Message persistence (JetStream)
- [ ] Dead letter queue

**Technical Notes:**
- NATS.io jako lightweight event bus
- Alternatywa: Kafka (dla enterprise scale)
- Event schema registry

**Priority:** P2
**Estimate:** L
**Phase:** 3

---

### Story 10.9: Machine Status Integration

**Jako** Manager
**Chce** widziec status maszyn automatycznie aktualizowany
**Aby** nie polegac na recznym raportowaniu

**Acceptance Criteria:**
- [ ] Auto-detection running/stopped/error
- [ ] Mapping sygnalu PLC -> status
- [ ] Timeline view statusow
- [ ] OEE automatic calculation

**Technical Notes:**
- State machine dla statusow
- Integracja z machines table
- Retroactive status correction

**Priority:** P1
**Estimate:** L
**Phase:** 3

---

### Story 10.10: Downtime Auto-Recording

**Jako** Manager
**Chce** automatycznego rejestrowania downtime'u
**Aby** miec dokladne dane do analizy

**Acceptance Criteria:**
- [ ] Automatyczne wykrycie zatrzymania maszyny
- [ ] Czas trwania downtime
- [ ] Prompt dla operatora o przyczyne (optional)
- [ ] Raport downtime'ow per maszyna/okres

**Technical Notes:**
- Threshold-based detection
- Integracja z existing downtime tracking
- Mobile notification dla przypisania przyczyny

**Priority:** P1
**Estimate:** M
**Phase:** 3

---

### Story 10.11: Production Counter Integration

**Jako** Operator
**Chce** automatyczne liczenie sztuk z maszyny
**Aby** nie wpisywac reccznie output'u

**Acceptance Criteria:**
- [ ] Odczyt licznika z PLC/sensora
- [ ] Automatyczne tworzenie LP przy threshhold
- [ ] Reconciliation z recznym input'em
- [ ] Drift detection (rozbieznosc licznik vs LP)

**Technical Notes:**
- Pulse counter lub register read
- Buffer przed utworzeniem LP
- Manual override option

**Priority:** P2
**Estimate:** L
**Phase:** 3

---

### Story 10.12: Scale Integration

**Jako** Operator
**Chce** automatyczne odczyty z wagi
**Aby** przyspieszyc receiving i consumption

**Acceptance Criteria:**
- [ ] Polaczenie z waga (RS232/USB/Ethernet)
- [ ] Przycisk "Odczytaj wage" w UI
- [ ] Auto-populate quantity field
- [ ] Unit conversion (kg -> g)

**Technical Notes:**
- Serial-over-IP dla legacy wag
- Popular protocols: Mettler, Ohaus
- Edge gateway dla komunikacji

**Priority:** P2
**Estimate:** M
**Phase:** 3

---

### Story 10.13: Barcode Scanner Integration (Hardware)

**Jako** Operator
**Chce** uzywac skanera podlaczonego przez USB/Bluetooth
**Aby** miec szybsze skanowanie niz kamera

**Acceptance Criteria:**
- [ ] Obsluga Zebra, Honeywell, Datalogic
- [ ] HID keyboard mode (plug-and-play)
- [ ] Wedge mode dla web app
- [ ] Bateria/connection status

**Technical Notes:**
- Keyboard wedge jako baseline (no driver needed)
- Bluetooth pairing dla mobile
- Custom integration dla advanced features

**Priority:** P2
**Estimate:** M
**Phase:** 3

---

### Story 10.14: Device Health Dashboard

**Jako** Admin
**Chce** monitorowac zdrowie wszystkich polaczonych urzadzen
**Aby** proaktywnie rozwiazywac problemy

**Acceptance Criteria:**
- [ ] Lista wszystkich polaczonych urzadzen
- [ ] Status online/offline
- [ ] Last seen timestamp
- [ ] Alerty przy utracie polaczenia

**Technical Notes:**
- Heartbeat mechanism
- Aggregated view
- Integration z alerting system

**Priority:** P2
**Estimate:** M
**Phase:** 3

---

## Epic 11: Sustainability & ESG

### Story 11.1: Machine Energy Profile

**Jako** Admin
**Chce** definiowac profil energetyczny maszyn
**Aby** sledzic zuzycie energii

**Acceptance Criteria:**
- [ ] Pole "power consumption (kW)" na maszynie
- [ ] Opcjonalnie: profil (idle vs running vs peak)
- [ ] Link do energy meter (sensor z Epic 10)
- [ ] Default values dla typow maszyn

**Technical Notes:**
- Rozszerzenie tabeli machines
- Integracja z IIoT dla real measurement
- Estimation mode dla maszyn bez sensorow

**Priority:** P1
**Estimate:** M
**Phase:** 3

---

### Story 11.2: Energy Consumption per WO

**Jako** Manager
**Chce** widziec zuzycie energii per zlecenie produkcyjne
**Aby** kalkulowac energy cost per product

**Acceptance Criteria:**
- [ ] Automatyczna kalkulacja na podstawie czasu produkcji
- [ ] Pole "energy consumed (kWh)" na WO
- [ ] Comparison z szacunkiem (actual vs expected)
- [ ] Raport energy per product

**Technical Notes:**
- Kalkulacja = machine power * production time
- Real data gdy dostepny sensor
- Alokacja dla multi-product runs

**Priority:** P1
**Estimate:** M
**Phase:** 3

---

### Story 11.3: CO2 Emission Calculator

**Jako** Sustainability Manager
**Chce** widziec CO2 emissions dla produktow
**Aby** raportowac slad weglowy

**Acceptance Criteria:**
- [ ] Emission factors per energy source (grid, solar, etc.)
- [ ] CO2 per WO = energy * emission factor
- [ ] CO2 per product (allocated)
- [ ] Trend chart over time

**Technical Notes:**
- Emission factors database (EU average, per country)
- Scope 1 & 2 emissions
- Scope 3 jako rozszerzenie (material footprint)

**Priority:** P1
**Estimate:** M
**Phase:** 3

---

### Story 11.4: Waste & Scrap Tracking

**Jako** Quality Manager
**Chce** sledzic odpady i scrap szczegolowo
**Aby** identyfikowac zrodla strat

**Acceptance Criteria:**
- [ ] Kategorie odpadow (scrap, trim, rework, dispose)
- [ ] Quantity per kategoria na WO output
- [ ] Przyczyna scrapping (quality, damage, expired)
- [ ] Dashboard trendow waste

**Technical Notes:**
- Rozszerzenie wo_outputs tabeli
- Integracja z NCR workflow
- Cost calculation dla waste

**Priority:** P1
**Estimate:** M
**Phase:** 3

---

### Story 11.5: Material Efficiency Report

**Jako** Production Manager
**Chce** raport efektywnosci materialowej
**Aby** redukowac zuzycie surowcow

**Acceptance Criteria:**
- [ ] Yield % per product (output / input)
- [ ] Trend analysis
- [ ] Benchmark vs target
- [ ] Root cause breakdown (where is loss?)

**Technical Notes:**
- Kalkulacja z consumption vs output
- BOM theoretical yield jako baseline
- Drill-down per component

**Priority:** P2
**Estimate:** L
**Phase:** 3

---

### Story 11.6: Water Usage Tracking

**Jako** Facility Manager
**Chce** sledzic zuzycie wody
**Aby** optymalizowac i raportowac

**Acceptance Criteria:**
- [ ] Water meter integration (sensor)
- [ ] Usage per production line/area
- [ ] Trend and target tracking
- [ ] Allocation to products (optional)

**Technical Notes:**
- Similar architecture to energy tracking
- Pulse counter dla water meters
- Industry average benchmarks

**Priority:** P2
**Estimate:** M
**Phase:** 3

---

### Story 11.7: ESG Dashboard

**Jako** CEO/Owner
**Chce** widziec kluczowe metryki ESG
**Aby** monitorowac sustainability performance

**Acceptance Criteria:**
- [ ] Energy consumption trend
- [ ] CO2 emissions trend
- [ ] Waste % trend
- [ ] Water usage trend
- [ ] YoY comparison

**Technical Notes:**
- Executive-level dashboard
- Configurable KPI cards
- Export dla raportow rocznych

**Priority:** P2
**Estimate:** L
**Phase:** 3

---

### Story 11.8: Certification Compliance Checklist

**Jako** Quality Manager
**Chce** sledzic wymagania certyfikacji (BRC, IFS)
**Aby** byc przygotowanym na audyt

**Acceptance Criteria:**
- [ ] Checklist wymagan per certyfikacja
- [ ] Status (compliant / non-compliant / N/A)
- [ ] Evidence linking (dokumenty)
- [ ] Gap analysis report

**Technical Notes:**
- Static checklists (updateable)
- Document management integration
- Audit trail dla zmian

**Priority:** P3
**Estimate:** L
**Phase:** 3

---

### Story 11.9: Supplier Sustainability Scorecard

**Jako** Procurement Manager
**Chce** oceniac dostawcow pod katem sustainability
**Aby** preferowac zrownowazonych partnerow

**Acceptance Criteria:**
- [ ] Kryteria oceny (certyfikaty, emissions, packaging)
- [ ] Score per dostawca
- [ ] Weighting per kryterium
- [ ] Ranking dostawcow

**Technical Notes:**
- Rozszerzenie suppliers table
- Manual input lub questionnaire
- Integration z Scope 3 emissions

**Priority:** P3
**Estimate:** M
**Phase:** 3

---

### Story 11.10: ESG Report Export

**Jako** CEO
**Chce** eksportowac raport ESG
**Aby** spelnic wymogi CSRD/reporting

**Acceptance Criteria:**
- [ ] PDF/Excel export
- [ ] Predefined templates (CSRD, GRI)
- [ ] Data period selection
- [ ] Charts i narrative text

**Technical Notes:**
- Template-based generation
- Data aggregation from all ESG modules
- Digital signature option

**Priority:** P3
**Estimate:** M
**Phase:** 3

---

## Epic 12: Supply Chain Collaboration

### Story 12.1: Supplier Portal - Registration

**Jako** Dostawca
**Chce** zarejestrowac sie w portalu dostawcy
**Aby** wspolpracowac z moim klientem (MonoPilot user)

**Acceptance Criteria:**
- [ ] Self-registration form
- [ ] Email verification
- [ ] Approval workflow dla buyer
- [ ] Terms acceptance

**Technical Notes:**
- Separate auth flow (supplier role)
- Limited access (tylko swoje PO)
- Multi-tenant aware

**Priority:** P1
**Estimate:** L
**Phase:** 4

---

### Story 12.2: Supplier Portal - PO Visibility

**Jako** Dostawca
**Chce** widziec moje PO w portalu
**Aby** wiedziec co mam dostarczyc

**Acceptance Criteria:**
- [ ] Lista PO przypisanych do dostawcy
- [ ] Szczegoly PO (produkty, ilosci, daty)
- [ ] Filtrowanie po statusie
- [ ] PDF download PO

**Technical Notes:**
- RLS dla supplier access
- Read-only view
- Mobile-friendly

**Priority:** P1
**Estimate:** M
**Phase:** 4

---

### Story 12.3: Supplier Portal - PO Confirmation

**Jako** Dostawca
**Chce** potwierdzic PO lub zaproponowac zmiany
**Aby** buyer wiedzial ze przyjelem zamowienie

**Acceptance Criteria:**
- [ ] Button "Confirm" / "Reject" / "Propose Change"
- [ ] Pole na komentarz/alternatywna data
- [ ] Notyfikacja do buyer'a
- [ ] Status update na PO

**Technical Notes:**
- State machine dla PO status
- Email notification
- Audit trail

**Priority:** P1
**Estimate:** M
**Phase:** 4

---

### Story 12.4: Supplier Portal - ASN (Advance Shipping Notice)

**Jako** Dostawca
**Chce** utworzyc ASN dla wysylki
**Aby** buyer wiedzial co i kiedy przyjezdza

**Acceptance Criteria:**
- [ ] Utworzenie ASN dla PO
- [ ] Szczegoly: tracking#, carrier, ETA
- [ ] Line items z ilosiciami
- [ ] Notyfikacja do warehouse

**Technical Notes:**
- Nowa tabela: advance_shipping_notices
- Integration z receiving workflow
- Partial shipment support

**Priority:** P2
**Estimate:** L
**Phase:** 4

---

### Story 12.5: Document Exchange (CoA, CoC)

**Jako** Dostawca
**Chce** zalaczyc dokumenty do dostawy
**Aby** buyer mial certyfikaty i dokumentacje

**Acceptance Criteria:**
- [ ] Upload PDF/images
- [ ] Typy dokumentow: CoA, CoC, MSDS
- [ ] Wymagane dokumenty per product
- [ ] Validation przed przyjemiem towaru

**Technical Notes:**
- Supabase Storage dla files
- Document type configuration
- Mandatory vs optional

**Priority:** P2
**Estimate:** M
**Phase:** 4

---

### Story 12.6: Demand Forecasting Dashboard

**Jako** Planner
**Chce** widziec prognoze zapotrzebowania na materialy
**Aby** planowac zakupy z wyprzedzeniem

**Acceptance Criteria:**
- [ ] Forecast na podstawie historii i planow produkcji
- [ ] Horyzont: 1-12 tygodni
- [ ] Confidence intervals
- [ ] Material-level breakdown

**Technical Notes:**
- Time-series forecasting (Prophet lub ARIMA)
- WO pipeline jako input
- Seasonality detection

**Priority:** P2
**Estimate:** XL
**Phase:** 4

---

### Story 12.7: Auto-Replenishment Rules

**Jako** Procurement Manager
**Chce** ustawic reguly automatycznego zamawiania
**Aby** unikac braków materialow

**Acceptance Criteria:**
- [ ] Reorder point per material
- [ ] Safety stock level
- [ ] Preferred supplier
- [ ] Auto-generate draft PO

**Technical Notes:**
- Rozszerzenie products table (reorder settings)
- Scheduled job dla sprawdzania stanow
- Approval workflow dla auto-PO

**Priority:** P2
**Estimate:** L
**Phase:** 4

---

### Story 12.8: Auto-Replenishment Execution

**Jako** System
**Chce** automatycznie generowac PO
**Aby** uzupelniac stany bez recznej interwencji

**Acceptance Criteria:**
- [ ] Trigger gdy stock < reorder point
- [ ] Quantity = reorder point + safety stock - current
- [ ] PO created as draft lub auto-sent
- [ ] Notification do procurement

**Technical Notes:**
- Dependency na Story 12.7
- Configurable: draft vs auto-send
- Rate limiting (max 1 PO/day/material)

**Priority:** P2
**Estimate:** M
**Phase:** 4

---

### Story 12.9: EDI Integration - Outbound

**Jako** Admin
**Chce** wysylac PO przez EDI
**Aby** automatyzowac komunikacje z duzymi dostawcami

**Acceptance Criteria:**
- [ ] EDI format configuration (EDIFACT, X12)
- [ ] Mapping MonoPilot fields -> EDI
- [ ] VAN integration lub AS2
- [ ] Transmission log

**Technical Notes:**
- EDI libraries (bots-edi, edifact-parser)
- Partner-specific mapping
- Retry logic

**Priority:** P3
**Estimate:** XL
**Phase:** 4

---

### Story 12.10: EDI Integration - Inbound

**Jako** System
**Chce** odbierac dokumenty EDI (ASN, Invoice)
**Aby** automatycznie aktualizowac system

**Acceptance Criteria:**
- [ ] Parse incoming EDI messages
- [ ] Create/update ASN lub invoice
- [ ] Validation i error handling
- [ ] Manual review queue

**Technical Notes:**
- Webhook endpoint dla VAN
- Matching logic (PO# -> ASN)
- Reconciliation workflow

**Priority:** P3
**Estimate:** XL
**Phase:** 4

---

### Story 12.11: Supplier Performance Scorecard

**Jako** Procurement Manager
**Chce** oceniac performance dostawcow
**Aby** podejmowac decyzje o wspolpracy

**Acceptance Criteria:**
- [ ] On-time delivery %
- [ ] Quality rejection rate
- [ ] Price competitiveness
- [ ] Overall score i ranking

**Technical Notes:**
- Kalkulacja z GRN i NCR data
- Trend over time
- Comparison view

**Priority:** P2
**Estimate:** M
**Phase:** 4

---

### Story 12.12: Customer Portal (Future)

**Jako** Klient MonoPilot user'a
**Chce** widziec status moich zamowien
**Aby** wiedziec kiedy otrzymam towar

**Acceptance Criteria:**
- [ ] Portal dla klientow
- [ ] SO status visibility
- [ ] Shipment tracking
- [ ] Document download (Invoice, CoA)

**Technical Notes:**
- Similar architecture do Supplier Portal
- RLS dla customer access
- Integration z Epic 7 (Shipping)

**Priority:** P3
**Estimate:** L
**Phase:** 4

---

## Epic 13: Advanced Security

### Story 13.1: Zero-Trust Architecture Design

**Jako** Architect
**Chce** zaprojektowac zero-trust security model
**Aby** spelniac wymagania enterprise klientow

**Acceptance Criteria:**
- [ ] Architecture document
- [ ] Component diagram
- [ ] Threat model
- [ ] Implementation roadmap

**Technical Notes:**
- Document deliverable
- BeyondCorp principles
- Consultation z security expert

**Priority:** P1
**Estimate:** L
**Phase:** 4

---

### Story 13.2: Service-to-Service Authentication

**Jako** System
**Chce** weryfikowac kazde polaczenie miedzy serwisami
**Aby** uniemozliwic nieautoryzowany dostep

**Acceptance Criteria:**
- [ ] mTLS dla service-to-service
- [ ] Service accounts i tokens
- [ ] Certificate rotation
- [ ] Audit logging

**Technical Notes:**
- Istio/Linkerd dla service mesh lub custom
- Short-lived tokens
- Centralized CA

**Priority:** P1
**Estimate:** XL
**Phase:** 4

---

### Story 13.3: ABAC (Attribute-Based Access Control)

**Jako** Admin
**Chce** definiowac uprawnienia na podstawie atrybutow
**Aby** miec granularna kontrole dostepu

**Acceptance Criteria:**
- [ ] Policy language (OPA/Rego lub custom)
- [ ] Atrybuty: role, department, shift, location
- [ ] Policy editor UI
- [ ] Testing/simulation mode

**Technical Notes:**
- Open Policy Agent (OPA) jako engine
- Sidecar pattern dla enforcement
- Migration path from RBAC

**Priority:** P2
**Estimate:** XL
**Phase:** 4

---

### Story 13.4: Electronic Signature (21 CFR Part 11)

**Jako** Quality Manager
**Chce** elektronicznie podpisywac dokumenty
**Aby** spelnic wymagania FDA

**Acceptance Criteria:**
- [ ] Signature workflow dla krytycznych dokumentow
- [ ] User authentication at signing
- [ ] Timestamp i audit trail
- [ ] Non-repudiation

**Technical Notes:**
- Digital certificate lub password-based
- Tamper-evident storage
- Compliance checklist

**Priority:** P1
**Estimate:** L
**Phase:** 4

---

### Story 13.5: Audit Trail Enhancement

**Jako** Auditor
**Chce** kompletny audit trail wszystkich zmian
**Aby** spelnic wymagania regulacyjne

**Acceptance Criteria:**
- [ ] All CRUD operations logged
- [ ] Who, what, when, where
- [ ] Tamper-proof storage
- [ ] Query/search interface

**Technical Notes:**
- Rozszerzenie istniejącego audit_logs
- Append-only table
- Retention policy

**Priority:** P1
**Estimate:** M
**Phase:** 4

---

### Story 13.6: Data Encryption at Rest

**Jako** Security Officer
**Chce** aby wszystkie dane byly zaszyfrowane
**Aby** chronic w przypadku breach'u

**Acceptance Criteria:**
- [ ] Supabase encryption enabled
- [ ] Customer-managed keys (optional)
- [ ] Key rotation procedure
- [ ] Encryption verification

**Technical Notes:**
- Supabase Vault dla secrets
- TDE (Transparent Data Encryption)
- HSM integration dla enterprise

**Priority:** P2
**Estimate:** M
**Phase:** 4

---

### Story 13.7: SSO Integration (SAML/OIDC)

**Jako** Enterprise Admin
**Chce** logowac uzytkownikow przez firmowe SSO
**Aby** centralizowac zarzadzanie identity

**Acceptance Criteria:**
- [ ] SAML 2.0 support
- [ ] OIDC support
- [ ] Just-in-time provisioning
- [ ] Role mapping z IdP

**Technical Notes:**
- Supabase Auth SSO feature
- Popular IdPs: Azure AD, Okta, Google Workspace
- Fallback dla non-SSO users

**Priority:** P2
**Estimate:** L
**Phase:** 4

---

### Story 13.8: On-Premise Deployment Option

**Jako** Enterprise Customer
**Chce** deployowac MonoPilot on-premise
**Aby** spelnic wymagania data residency

**Acceptance Criteria:**
- [ ] Docker/Kubernetes deployment package
- [ ] Self-hosted Supabase support
- [ ] Air-gapped installation option
- [ ] Upgrade procedure

**Technical Notes:**
- Helm chart dla K8s
- Supabase self-hosted mode
- License management dla on-prem

**Priority:** P2
**Estimate:** XL
**Phase:** 4

---

### Story 13.9: Penetration Testing

**Jako** Security Officer
**Chce** przeprowadzic penetration test
**Aby** zidentyfikowac vulnerabilities

**Acceptance Criteria:**
- [ ] External pentest przez certified firm
- [ ] Report z findings
- [ ] Remediation plan
- [ ] Re-test after fixes

**Technical Notes:**
- Annual pentest minimum
- OWASP Top 10 coverage
- Bug bounty program (optional)

**Priority:** P1
**Estimate:** M (external cost)
**Phase:** 4

---

### Story 13.10: Security Compliance Dashboard

**Jako** Admin
**Chce** widziec status compliance security
**Aby** monitorowac security posture

**Acceptance Criteria:**
- [ ] Checklist ISO 27001 / SOC 2
- [ ] Status indicators
- [ ] Evidence linking
- [ ] Gap report

**Technical Notes:**
- Static checklist z mappingiem
- Integration z security controls
- Export dla audytorow

**Priority:** P3
**Estimate:** M
**Phase:** 4

---

## Podsumowanie

| Epic | Stories | Priorytet | Faza | Szacunek |
|------|---------|-----------|------|----------|
| 8 (AI/ML) | 12 | HIGH | 3 | XL |
| 9 (Digital Twin) | 10 | MED-HIGH | 3 | XL |
| 10 (IIoT) | 14 | HIGH | 3 | XXL |
| 11 (Sustainability) | 10 | MEDIUM | 3 | L |
| 12 (Supply Chain) | 12 | HIGH | 4 | XL |
| 13 (Security) | 10 | HIGH | 4 | XL |
| **Total** | **68** | - | - | - |

---

## Dokumenty Powiazane

- Phase 3 Roadmap: @docs/2-MANAGEMENT/PHASE-3-ROADMAP.md
- MVP Phases: @docs/MVP-PHASES.md
- Discovery V4: @docs/0-DISCOVERY/DISCOVERY-REPORT-V4.md

---

**Document End**
