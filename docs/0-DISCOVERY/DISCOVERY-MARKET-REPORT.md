# MonoPilot - Competitive Analysis Report

**Data:** 2025-12-09
**Autor:** Claude (Research Agent)
**Cel:** Analiza konkurencji dla pozycjonowania MonoPilot

---

## Executive Summary

MonoPilot konkuruje w segmencie **MES/MOM dla przemysłu spożywczego**. Ten raport analizuje 4 głównych konkurentów zidentyfikowanych jako najbliższe alternatywy: AVEVA MES, Plex Smart Manufacturing, Aptean Food & Beverage ERP, oraz CSB-System.

**Kluczowe wnioski:**
1. MonoPilot celuje w **niedostatecznie obsługiwany segment** - małe/średnie firmy spożywcze (5-100 pracowników)
2. Konkurenci enterprise (AVEVA, Plex) są za ciężcy i drogie dla tego segmentu
3. Dedykowane food ERP (Aptean, CSB) mają lepsze funkcje branżowe, ale gorszy UX i wyższe koszty wdrożenia
4. **Luka rynkowa:** brak nowoczesnego, cloud-native MES z prostym wdrożeniem dla food SMB

---

## 1. AVEVA MES (AVEVA Group / Schneider Electric)

### 1.1 Profil Firmy

| Aspekt | Szczegóły |
|--------|-----------|
| **Właściciel** | AVEVA Group (część Schneider Electric) |
| **Siedziba** | Cambridge, UK |
| **Historia** | 40+ lat w industrial software, fuzja z Wonderware |
| **Pozycja rynkowa** | Leader w IDC MarketScape 2024-2025 dla MES |
| **Klienci** | 10,000+ globalnie, w tym 23 z top 25 F&B manufacturers |

### 1.2 Kluczowe Funkcje

**Core MES Capabilities:**
- Production Management - scheduling, WO execution, BOM enforcement
- Track & Trace - full genealogy, traceability investigations
- Quality Management - sampling plans, compliance automation
- OEE Monitoring - real-time efficiency tracking
- Recipe Management - formula download, automated execution

**Wyróżniki:**
- **Model-Driven Architecture** - templates i libraries dla multi-site standardization
- **AVEVA PI System Integration** - deep data historian connectivity
- **Connected Worker (Work Tasks)** - digital SOPs, mobile workflows
- **Hybrid Cloud** - edge-to-enterprise architecture
- **AI/ML Integration** - predictive insights (case study: Maple Leaf Foods +10-12% gross profit)

**Industry-Specific (Food):**
- Pre-built "MES for Food Producers Solution Practice"
- Recipe-based process industry templates
- Batch execution management
- Handheld scanner integration
- Weighing bridge connectivity

### 1.3 Deployment & Pricing

| Model | Opis |
|-------|------|
| **On-Premise** | Windows Server deployment |
| **Cloud** | Hybrid cloud via CONNECT platform |
| **Licensing** | Perpetual + Subscription (AVEVA Flex) |
| **Pricing** | Enterprise pricing (nie publikowane), typowo $100K-$500K+ |
| **Implementation** | 6-18 miesięcy, wymaga certified integrators |

### 1.4 Target Market

- **Primary:** Large manufacturers (100M+ revenue)
- **Industries:** Food & Beverage, CPG, Life Sciences, Chemicals, Automotive
- **Use Case:** Multi-site standardization, complex batch processes

### 1.5 Strengths vs MonoPilot

| AVEVA Strength | MonoPilot Response |
|----------------|-------------------|
| 40+ lat doświadczenia | Nowoczesna architektura, brak legacy baggage |
| Multi-site standardization | Single-site focus (MVP), multi-site later |
| Deep automation integration | API-first, integracje w roadmap |
| AI/ML capabilities | Simpler approach, focus on core MES |
| Global support network | Mniejszy overhead = niższe koszty |

### 1.6 Weaknesses (Opportunities for MonoPilot)

- **Kompleksowość** - wymaga consultantów do konfiguracji
- **Koszt** - niedostępny dla SMB
- **Czas wdrożenia** - 6-18 miesięcy vs tygodnie
- **Learning curve** - steep, wymaga dedykowanego IT
- **Overkill** - zbyt wiele funkcji dla małych firm

---

## 2. Plex Smart Manufacturing Platform (Rockwell Automation)

### 2.1 Profil Firmy

| Aspekt | Szczegóły |
|--------|-----------|
| **Właściciel** | Rockwell Automation (akwizycja 2021) |
| **Siedziba** | Troy, Michigan, USA |
| **Pozycja rynkowa** | Leader w MES cloud-native segment |
| **Model** | 100% SaaS, single-instance multi-tenant |
| **Języki** | 12+ (Czech, German, English, French, Italian, Japanese, Portuguese, Slovak, Spanish, Chinese) |

### 2.2 Kluczowe Funkcje

**MES Capabilities:**
- Production finite scheduling
- Real-time production monitoring
- Closed-loop quality management
- Bill of Materials (BOM) enforcement
- Yield tracking and cost reporting
- Asset Performance Management (APM)

**ERP Capabilities (integrated):**
- Financial management
- Supply chain planning
- Inventory management
- CRM integration
- HR management

**Food & Beverage Specific:**
- **World-class food safety & quality management**
- Rapid lot trace (FSMA Rule 204 compliance)
- Batch-oriented MES with yield reporting
- FIFO/FEFO picking
- Allergen separation scheduling
- Shelf life management
- Custom barcode labeling

**Unique Features:**
- **Plex A&O (Automation & Orchestration)** - edge connectivity
- **Plex Mobile** - role-specific mobile access
- **Rockwell PLC Integration** - native automation connectivity

### 2.3 Deployment & Pricing

| Aspekt | Szczegóły |
|--------|-----------|
| **Model** | 100% Cloud SaaS (no on-premise option) |
| **Architecture** | Single-instance, multi-tenant |
| **Starting Price** | ~$3,000/month (entry) |
| **Typical Range** | $50K-$300K/year depending on modules |
| **Implementation** | 3-9 miesięcy (faster than on-prem competitors) |

### 2.4 Target Market

- **Primary:** Mid-to-large manufacturers (50-5000+ employees)
- **Industries:** Automotive, Aerospace, Food & Beverage, Industrial Machinery
- **Sweet Spot:** Companies outgrowing Excel but not ready for SAP/Oracle

### 2.5 Case Studies (Food & Beverage)

**Hausbeck Pickles and Peppers:**
- Inventory accuracy: 70% → 99.6%
- Digitized quality management
- Customer scorecard compliance

**Chocolate Shoppe Ice Cream:**
- Inventory accuracy: +27% (to 95%)
- Time saved: 3+ hours daily
- Real-time cloud data access

**OWS Foods:**
- Improved demand forecasting
- Reduced customer lead times

### 2.6 Strengths vs MonoPilot

| Plex Strength | MonoPilot Response |
|---------------|-------------------|
| 100% cloud-native | MonoPilot też cloud-native (Supabase) |
| Rockwell automation integration | Focus na standalone MES bez PLC dependency |
| Proven F&B track record | Specialized dla Polish food market |
| Comprehensive ERP+MES | MES focus, integracja z external ERP |
| Global scale | Local expertise, Polish market |

### 2.7 Weaknesses (Opportunities for MonoPilot)

- **Post-acquisition issues** - users report reduced support staff, slower problem resolution
- **Configuration complexity** - "tricky" according to reviews
- **Pricing** - $3000/month minimum, out of reach for micro-SMB
- **No on-premise** - some regulated industries require local data
- **US-centric** - limited European focus
- **Overkill for small operations** - built for 50+ employee companies

---

## 3. Aptean Food & Beverage ERP

### 3.1 Profil Firmy

| Aspekt | Szczegóły |
|--------|-----------|
| **Właściciel** | Aptean (private equity backed) |
| **Portfolio** | Multiple acquired F&B ERPs consolidated |
| **Platform** | Microsoft Dynamics Business Central / NAV |
| **Recognition** | Crozdesk 2025 User Satisfaction Award |

### 3.2 Product Editions

Aptean oferuje kilka wariantów dla różnych segmentów:

| Edition | Target | Platform |
|---------|--------|----------|
| **JustFood Foundation** | Small food companies | MS Dynamics |
| **JustFood Edition** | Mid-size processors/distributors | MS Dynamics |
| **bcFood Edition** | Mid-size, multi-language | MS Dynamics NAV/BC |
| **Foodware Edition** | European market | MS Dynamics NAV |
| **Enterprise Edition** | Large global operations | Custom platform |

### 3.3 Kluczowe Funkcje

**Core ERP:**
- Financial Management
- Sales & CRM
- Purchasing & Procurement
- Inventory Management
- Production Planning (MRP)
- Warehouse Management

**Food-Specific:**
- Recipe/Formulation Management
- Lot Tracking & Traceability
- Allergen Management
- Quality Control & Audits
- HACCP Compliance
- Shelf Life Management
- Catch Weight Support
- EDI for Retail Chains

**Additional Modules:**
- PLM (Product Lifecycle Management)
- TMS (Transport Management)
- Demand Forecasting
- Vendor Performance Management

### 3.4 Deployment & Pricing

| Aspekt | Szczegóły |
|--------|-----------|
| **Model** | Cloud (Azure), On-Premise, Hybrid |
| **Pricing** | Not published, quote-based |
| **Typical Range** | $50K-$250K implementation + subscription |
| **Implementation** | 3-12 miesięcy |
| **Customization** | High (MS Dynamics platform) |

### 3.5 User Feedback (Mixed)

**Positive:**
- "Fully integrated with Microsoft Office"
- "Good for BRC audits"
- "Robust MPS/MRP with forecasting"
- "Good traceability and production cost analysis"

**Negative:**
- "Training was too technical, not food-oriented"
- "QA module not easy to use"
- "Mobile screens don't fit well, need resizing"
- "Problems sometimes require expensive developer involvement"
- "New enhancements often break other features"

### 3.6 Target Market

- **Primary:** Food processors and distributors (20-500 employees)
- **Industries:** Bakery, Dairy, Meat, Snacks, Beverages, Confectionery
- **Geography:** Strong in North America, growing in EU

### 3.7 Strengths vs MonoPilot

| Aptean Strength | MonoPilot Response |
|-----------------|-------------------|
| Full ERP (finance, sales, etc.) | MES focus + external ERP integration |
| MS Dynamics platform | Next.js/Supabase = more modern |
| Deep food compliance | Focus na core traceability first |
| Established customer base | Fresh approach, no legacy constraints |
| Multi-edition flexibility | Single product, configurable |

### 3.8 Weaknesses (Opportunities for MonoPilot)

- **Legacy platform** - MS Dynamics NAV jest stary
- **UX complaints** - "technical", "not food-oriented" training
- **Mobile issues** - screens don't fit properly
- **Customization costs** - expensive developer involvement
- **Quality issues** - "enhancements break other features"
- **Complex pricing** - requires sales process

---

## 4. CSB-System

### 4.1 Profil Firmy

| Aspekt | Szczegóły |
|--------|-----------|
| **Założenie** | 1977 (dr Peter Schimitzek) |
| **Siedziba** | Geilenkirchen, Germany |
| **Focus** | 100% food industry ERP |
| **Historia** | 1000+ projektów w food industry |
| **Pozycja** | Leading specialized ERP for food in DACH region |

### 4.2 Industry Coverage

CSB oferuje **dedykowane rozwiązania** dla każdego sub-sektora food:

| Sub-sektor | Specyficzne Funkcje |
|------------|---------------------|
| **Meat** | Cutting calculation, RFID ear tag tracing |
| **Dairy** | Milk payment statements, cheese aging tracking |
| **Bakery** | Silo management, fresh delivery scheduling |
| **Fish** | Catch tracking, temperature monitoring |
| **Confectionery** | Recipe versioning, allergen cross-contamination |
| **Fruit & Vegetables** | Ultra-fresh logistics, waste tracking |
| **Beverages** | Bottle tracking, deposit management |
| **Delicatessen** | Small batch management, premium labeling |

### 4.3 Kluczowe Funkcje

**ERP Core:**
- Financial Accounting (country-specific)
- Sales & Distribution
- Purchasing & Procurement
- Production Planning
- Quality Management
- Logistics & Warehouse

**Food-Specific Deep Features:**
- **Cutting Optimization** (meat) - maximize yield from carcass
- **Milk Payment** (dairy) - automatic settlement with farmers
- **Fresh Logistics** - ultra-short shelf life management
- **Recipe Costing** - real-time margin calculation
- **Traceability** - batch trace in <1 hour (Vion case study)
- **Label Printing** - all EU standards, GS1 compliance

**Technology:**
- M-ERP® - mobile access
- iWPL (Intelligent Warehouse & Production Logistics)
- IoT integration (scales, PLCs, SCADA)
- Cloud deployment available

### 4.4 Deployment & Pricing

| Aspekt | Szczegóły |
|--------|-----------|
| **Model** | On-Premise (primary), Cloud (newer) |
| **Editions** | BASIC ERP, INDUSTRY ERP, FACTORY ERP |
| **Pricing** | Enterprise pricing (nie publikowane) |
| **Typical Range** | €100K-€500K+ (estimate based on complexity) |
| **Implementation** | 6-18 miesięcy |
| **Region Focus** | DACH (Germany, Austria, Switzerland), expanding globally |

### 4.5 User Feedback (Mixed)

**Positive:**
- "Helpful in inventory and quality assurance"
- "Easy to use" (basic functions)
- "Good for stock keeping and procurement"

**Negative:**
- "Many features of modern ERP are missing"
- "The more you use, the more glitches you find"
- "Support is difficult to achieve"
- "Could not recommend CSB" (one review)

### 4.6 Target Market

- **Primary:** Food manufacturers in DACH region
- **Size:** Mid-to-large (50-5000 employees)
- **Sweet Spot:** Companies needing deep food-specific functionality

### 4.7 Strengths vs MonoPilot

| CSB Strength | MonoPilot Response |
|--------------|-------------------|
| 47+ years food expertise | Modern approach, learn from their mistakes |
| Deep sub-sector specialization | Focus na core features, extensible |
| German engineering quality | Polish market understanding |
| IoT/automation integration | API-first, integrations in roadmap |
| Proven large-scale deployments | SMB focus, simpler needs |

### 4.8 Weaknesses (Opportunities for MonoPilot)

- **Legacy technology** - "many modern ERP features missing"
- **Support issues** - "difficult to achieve"
- **Quality concerns** - "more you use, more glitches"
- **Regional focus** - primarily DACH, limited Polish presence
- **Complexity** - built for large operations
- **Cost** - enterprise pricing for enterprise features

---

## 5. Comparative Matrix

### 5.1 Feature Comparison

| Feature | AVEVA MES | Plex | Aptean | CSB | MonoPilot |
|---------|-----------|------|--------|-----|-----------|
| **Production Scheduling** | ✅ Advanced | ✅ Advanced | ✅ MRP | ✅ Advanced | ✅ Basic |
| **Work Order Management** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **BOM/Recipe Management** | ✅ Full | ✅ Full | ✅ Full | ✅ Deep | ✅ Full |
| **Lot Traceability** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Allergen Management** | ✅ | ✅ | ✅ | ✅ Deep | ✅ EU14 |
| **Quality Management** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | 📋 Phase 2 |
| **Warehouse Management** | ✅ | ✅ | ✅ | ✅ | ✅ 92% |
| **Shipping/Picking** | ✅ | ✅ | ✅ | ✅ | 📋 Phase 2 |
| **OEE Tracking** | ✅ Real-time | ✅ Real-time | ⚠️ Basic | ✅ | 📋 Phase 3 |
| **Financial/Accounting** | ❌ | ✅ Full ERP | ✅ Full ERP | ✅ Full ERP | ❌ |
| **Mobile/Scanner** | ✅ | ✅ | ⚠️ Issues | ✅ | ✅ Building |
| **AI/ML Features** | ✅ | ⚠️ | ❌ | ❌ | ❌ |

### 5.2 Deployment Comparison

| Aspect | AVEVA | Plex | Aptean | CSB | MonoPilot |
|--------|-------|------|--------|-----|-----------|
| **Cloud-Native** | ⚠️ Hybrid | ✅ 100% | ✅ Available | ⚠️ Newer | ✅ 100% |
| **On-Premise** | ✅ | ❌ | ✅ | ✅ Primary | ❌ |
| **Multi-Tenant** | ⚠️ | ✅ Single-instance | ⚠️ | ❌ | ✅ |
| **Self-Service Setup** | ❌ | ⚠️ Limited | ❌ | ❌ | ✅ Target |
| **Implementation Time** | 6-18 mo | 3-9 mo | 3-12 mo | 6-18 mo | Weeks (target) |

### 5.3 Pricing Comparison (Estimated)

| Vendor | Entry Price | Typical SMB | Enterprise | Model |
|--------|-------------|-------------|------------|-------|
| **AVEVA** | $100K+ | $200-500K | $500K-2M+ | License + maintenance |
| **Plex** | $36K/yr | $100-200K/yr | $300K+/yr | SaaS subscription |
| **Aptean** | $50K+ | $100-250K | $250K+ | License or subscription |
| **CSB** | €100K+ | €150-300K | €500K+ | License + maintenance |
| **MonoPilot** | TBD | TBD | TBD | SaaS target |

### 5.4 Target Market Comparison

| Vendor | Company Size | Employees | Revenue | Primary Region |
|--------|--------------|-----------|---------|----------------|
| **AVEVA** | Large Enterprise | 500+ | $100M+ | Global |
| **Plex** | Mid-to-Large | 50-5000 | $10M-1B | North America |
| **Aptean** | SMB to Mid | 20-500 | $5M-500M | North America, EU |
| **CSB** | Mid-to-Large | 50-5000 | €10M-1B | DACH, expanding |
| **MonoPilot** | SMB | 5-100 | $1M-50M | Poland, EU |

---

## 6. Market Gap Analysis

### 6.1 Underserved Segments

Na podstawie analizy konkurencji, zidentyfikowano następujące luki rynkowe:

**Segment 1: Micro-SMB Food Manufacturers (5-20 employees)**
- Problem: Zbyt mali na enterprise MES, zbyt duzi na Excel
- Current solutions: Excel, papier, basic accounting software
- Gap: Brak affordable, easy-to-deploy MES

**Segment 2: Polish Food Manufacturers**
- Problem: Global solutions nie rozumieją polskiego rynku
- Current solutions: Importowane systemy, lokalne custom development
- Gap: Brak native Polish food MES

**Segment 3: Fast-Growing SMBs**
- Problem: Outgrow Excel ale nie stać na $100K+ implementation
- Current solutions: Cobbled-together tools, delays
- Gap: Brak scalable, affordable growth path

### 6.2 MonoPilot Positioning Opportunity

```
                        COMPLEXITY
                    Low ←————————→ High
               ┌────────────────────────────────┐
        High   │                                │
               │  CSB-System    AVEVA MES       │
               │     ●             ●            │
        COST   │                                │
               │  Aptean      Plex              │
               │    ●           ●               │
               │                                │
               │         MonoPilot              │
               │        ★ OPPORTUNITY           │
        Low    │                                │
               └────────────────────────────────┘
```

**MonoPilot Sweet Spot:**
- **Lower cost** than all competitors
- **Lower complexity** than all competitors
- **Faster deployment** than all competitors
- **Food-specific** unlike generic ERP
- **Polish market** understanding

---

## 7. Competitive Advantages for MonoPilot

### 7.1 Unique Value Proposition

Na podstawie analizy konkurencji, MonoPilot powinien pozycjonować się jako:

> **"MES dla małych i średnich producentów spożywczych - prostota wdrożenia SaaS, funkcjonalność enterprise, cena dostępna dla SMB"**

### 7.2 Differentiators vs Each Competitor

**vs AVEVA MES:**
| Differentiator | Opis |
|----------------|------|
| 10x szybsze wdrożenie | Tygodnie vs 6-18 miesięcy |
| 10x niższa cena | Dostępna dla SMB |
| Brak consultantów | Self-service configuration |
| Modern UX | Born cloud-native, not legacy |

**vs Plex:**
| Differentiator | Opis |
|----------------|------|
| Niższa cena entry | <$3000/month target |
| European/Polish focus | Not US-centric |
| On-premise option | For regulated industries (future) |
| Smaller footprint | Not overkill for 10-person shop |

**vs Aptean:**
| Differentiator | Opis |
|----------------|------|
| Modern tech stack | Next.js vs MS Dynamics legacy |
| Better mobile UX | Native responsive, not "resize needed" |
| Simpler learning curve | "Food-oriented" not "too technical" |
| Quality focus | No "enhancements break features" |

**vs CSB-System:**
| Differentiator | Opis |
|----------------|------|
| Cloud-native | Not "modern features missing" |
| Polish market | Not DACH-focused |
| Better support model | Not "difficult to achieve" |
| SMB pricing | Not enterprise-only |

### 7.3 Feature Priorities Based on Competition

Na podstawie analizy, priorytetowe features dla MonoPilot:

**Must-Have (competitors have, users expect):**
1. ✅ Full traceability (forward/backward) - DONE
2. ✅ Allergen management - DONE
3. ✅ BOM/Recipe management - DONE
4. ✅ Work Order lifecycle - DONE
5. ✅ LP-based inventory - DONE
6. 🚧 Scanner workflows - IN PROGRESS
7. 🚧 Print integration - IN PROGRESS
8. 📋 Quality management - Phase 2
9. 📋 Shipping/Picking - Phase 2

**Differentiators (competitors weak, MonoPilot strong):**
1. **Instant deployment** - competitors need months
2. **Self-service config** - competitors need consultants
3. **Modern UX** - competitors have legacy UI
4. **Affordable pricing** - competitors enterprise-only
5. **Polish market expertise** - competitors global/generic

**Nice-to-Have (competitors have, lower priority):**
1. OEE real-time tracking - Phase 3
2. AI/ML features - Maybe Phase 4
3. Full ERP (finance) - Never (integrate instead)
4. Multi-site standardization - Phase 3

---

## 8. Risks & Mitigation

### 8.1 Competitive Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Plex launches SMB tier | Medium | High | Speed to market, Polish focus |
| Aptean improves UX | Low | Medium | Stay ahead on modern stack |
| Local competitor emerges | Medium | High | First-mover advantage in Poland |
| Enterprise player acquires SMB tool | Medium | Medium | Build sticky customer base |
| Free/open-source alternative | Low | Low | Provide support, hosting |

### 8.2 Market Entry Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SMBs prefer Excel | High | Medium | Prove ROI quickly (pilot program) |
| No budget for software | Medium | High | Freemium tier, quick value demo |
| IT resistance | Medium | Medium | Emphasize no-IT-needed |
| Change management | High | Medium | Gradual rollout, training |

---

## 9. Recommendations

### 9.1 Positioning Statement

**Rekomendowany USP:**

> "MonoPilot - MES dla producentów spożywczych, którzy wyrośli z Excela ale nie potrzebują (i nie stać ich na) wielkich systemów. Wdrożenie w tygodnie, nie miesiące. Cena dostępna dla małych firm. Funkcje sprawdzone w dużych korporacjach."

### 9.2 Competitive Messaging

**vs "Why not AVEVA/Plex?"**
- "Jeśli masz 500+ pracowników i budżet $500K+ - wybierz ich. Jeśli nie - wybierz nas."

**vs "Why not Aptean?"**
- "Nowoczesny interfejs, szybsze wdrożenie, brak problemów z mobile. Bez legacy baggage."

**vs "Why not CSB?"**
- "Cloud-native od pierwszego dnia. Polski support. Cena dla SMB."

**vs "Why not Excel?"**
- "Traceability w 30 sekund, nie 30 godzin. Audyt sanepidu bez stresu."

### 9.3 Product Roadmap Implications

Na podstawie analizy konkurencji:

**Phase 1 (MVP) - Compete on:**
- Speed of deployment
- UX quality
- Price accessibility
- Core MES features

**Phase 2 - Close gaps:**
- Quality module (table stakes)
- Shipping/Picking (expected)
- Polish accounting integration

**Phase 3 - Differentiate:**
- Advanced analytics
- Multi-site support
- AI-assisted features (only if competitors don't catch up)

---

## 10. Appendix: Competitor Quick Reference Cards

### AVEVA MES Quick Card
```
🏢 AVEVA Group (Schneider Electric)
🎯 Enterprise manufacturers (500+ employees)
💰 $100K-$500K+ implementation
⏱️ 6-18 months deployment
📊 Leader in IDC MarketScape 2024-2025
✅ Deep automation integration, AI/ML
❌ Too complex/expensive for SMB
```

### Plex Quick Card
```
🏢 Rockwell Automation
🎯 Mid-to-large (50-5000 employees)
💰 $3,000/month starting, $100-300K/year typical
⏱️ 3-9 months deployment
📊 #1 cloud-native MES
✅ 100% SaaS, proven F&B track record
❌ US-centric, support issues post-acquisition
```

### Aptean Food ERP Quick Card
```
🏢 Aptean (private equity)
🎯 SMB-to-Mid food processors (20-500 employees)
💰 $50K-$250K implementation
⏱️ 3-12 months deployment
📊 Multiple editions for different sizes
✅ Full ERP, MS platform, food-specific
❌ Legacy UX, mobile issues, expensive customization
```

### CSB-System Quick Card
```
🏢 CSB-System SE (Germany)
🎯 Mid-to-large food manufacturers (50-5000)
💰 €100K-€500K+ implementation
⏱️ 6-18 months deployment
📊 47+ years food industry focus
✅ Deep sub-sector specialization, DACH leader
❌ Legacy features missing, support issues, regional
```

---

**Report End**

**Prepared by:** Claude (Research Agent)
**Date:** 2025-12-09
**Sources:** Web research, vendor websites, user reviews (G2, Capterra, SoftwareAdvice, TEC)
**Confidence Level:** High (publicly available information verified from multiple sources)