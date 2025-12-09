Gap Analysis and Improvement Suggestions for MonoPilot
Overview

This report reviews the MonoPilot discovery report and competitive analysis to identify missing considerations and opportunities for improvement. It also brings in current industry trends from credible sources to inform future directions. Where possible, recommendations are backed by recent research or industry articles.

Gap Analysis
Missing Industry‑trend Features
Area	Observed Gap	Why It Matters	Evidence/Industry Trend
Artificial Intelligence (AI) & Machine Learning	The discovery report lists performance optimisation and future analytics (Epic 9), but AI is not integrated into core workflows. Competitors like AVEVA and Plex tout AI‑driven scheduling and predictive maintenance.	AI can improve planning accuracy, optimize schedules, detect anomalies and predict machine failures. Industry experts note that AI enables real‑time adjustments and reduces downtime
znt-richter.com
.	A 2025 MES trends report identifies AI as one of the four central developments for smart manufacturing; it enhances production planning, predictive maintenance and advanced analytics
znt-richter.com
.
Digital Twins	Digital twins are absent from the product roadmap. Competitors and industry reports highlight digital twins for simulating processes, optimizing resource use and predicting issues.	Digital twins allow manufacturers to simulate production scenarios before changes are implemented, reducing risk and enabling data‑driven process optimisation. They can be used for predictive maintenance and process optimisation
znt-richter.com
.	The ISA describes a digital twin as a virtual replica integrated with MES, enabling real‑time monitoring, process optimisation and predictive maintenance
blog.isa.org
. The znt‑Richter report lists digital twins as a top trend, emphasising process simulation and resource optimisation
znt-richter.com
.
IIoT & Edge Integration	The existing architecture uses scanners and Supabase, but there is little mention of collecting machine or sensor data via the Industrial Internet of Things (IIoT) or edge devices.	Connecting machines and sensors through IIoT can provide real‑time production data, enabling better scheduling, predictive maintenance and energy monitoring.	Industry analysis notes that IIoT and edge computing bring valuable shop‑floor data into MES systems
znt-richter.com
. Rockwell Automation emphasises that edge computing provides low‑latency real‑time control while cloud computing supports analytics
rockwellautomation.com
.
Sustainability & Energy Monitoring	MonoPilot does not yet include sustainability or energy‑consumption tracking.	Food producers face increasing pressure to meet environmental goals; capturing energy use and material waste can reduce costs and comply with ESG regulations.	The MES trends report highlights sustainability as a key trend and mentions energy monitoring, CO₂ tracking and scrap reduction as functions of a modern MES
znt-richter.com
.
Advanced Quality Management (HACCP, 21 CFR 11)	Quality and HACCP support are planned in Phase 2, but details are limited. There is no plan for electronic signatures (21 CFR Part 11) or CAPA management.	Food regulations demand strict control of critical points, documented corrective actions and secure electronic records. Without these features, adoption by larger firms could be limited.	The discovery report notes that HACCP and electronic signatures are deferred decisions; a risk exists that compliance requirements could delay adoption.
Supply‑Chain Connectivity & Collaboration	Purchase orders and transfer orders are supported, but there is no facility for supplier collaboration (EDI/portal), demand forecasting or dynamic re‑ordering.	Modern MES systems often link with suppliers to automate restocking, track deliveries and adapt to supply‑chain disruptions. SME food companies could gain efficiency through simple supplier portals.	Industry sources note that integration between MES and supply‑chain systems (e.g., via API or EDI) supports dynamic inventory management and can automate orders when AI detects raw‑material shortages
blog.isa.org
.
Cybersecurity & Zero‑Trust Networking	The discovery report focuses on RLS and authentication but does not address network‑level security, zero‑trust architecture or on‑premise deployment options.	As data flows between edge devices, cloud services and suppliers, robust security (e.g., zero‑trust, 5G private networks) becomes critical. Customers may require on‑premise or hybrid deployment for compliance.	Rockwell’s 2025 automation trends emphasise private 5G and secure wireless connectivity for real‑time, reliable data exchange
rockwellautomation.com
. Digital Carbon notes that a secure digital foundation and SASE (secure access service edge) are prerequisites for embracing AI, automation and digital twins
digitalcarbon.io
.
User Experience & Guidance	The reports mention UX specs but don’t discuss operator guidance, digital work instructions or augmented reality.	Modern MES platforms provide guided workflows, step‑by‑step instructions and error‑proofing through AR or smart HMIs. These improve training and reduce mistakes.	AI‑assisted HMIs and augmented reality are among the IIoT technologies that create smart, connected operations
rockwellautomation.com
.
Scalability & Multi‑Site Support	MonoPilot is multi‑tenant but not clearly multi‑site within a tenant. Large SMBs may operate multiple factories.	Multi‑site support with centralised management and site‑level configuration is often essential when scaling to multi‑factory operations.	
Event‑Driven Architecture & Integration Layer	The current architecture uses Next.js API routes and service‑layer calls. Integration with external systems (accounting, IoT) is planned but not architected.	A message bus (e.g., NATS, Kafka) and event‑driven integration layer can decouple services, support extensibility and enable real‑time updates across modules and partners.	
Test Automation & Continuous Delivery	Test coverage is targeted at >70%, but there is no mention of automated performance testing, security testing or continuous delivery pipelines.	To meet uptime goals and ensure secure multi‑tenant isolation, automated testing beyond unit tests (e.g., load, penetration tests) and mature CI/CD pipelines are required.	
Customer‑facing Analytics & Dashboards	Basic KPIs (uptime, MTTR) are listed, but there is no plan for interactive dashboards that allow managers to analyse yields, downtime causes, energy use or cost variance.	Data visualisation and self‑service analytics differentiate modern MES systems. Competitors like Plex offer OEE dashboards and yield reports.	
Market Expansion Strategy	Competitive analysis notes the unique position in Poland and EU; however, the plan for internationalisation (multi‑language, legal compliance across regions) is not fully detailed.	As the product grows, supporting additional languages, tax regimes and packaging regulations (e.g., US FSMA, FDA CFR 21) becomes essential.	
Architectural and Operational Risks

Manual Tenant Isolation: The service layer requires every query to include org_id. This is error‑prone and may lead to data leakage. Using database views with security definers or a query wrapper enforcing tenant constraints would reduce risk.

Printing Stub & Device Integration: The print API is not fully implemented. There is also no general device‑integration layer for scales, sensors or PLCs.

Offline Support & Resilience: Scanner workflows currently break without network connectivity, and there is no offline queue. A Progressive Web App (PWA) with offline caching would improve resilience.

Performance & Scalability: Potential N+1 queries, missing indexes and a monolithic Next.js API may limit performance as data volumes grow.

Improvement Suggestions
1. Integrate AI‑Driven Features

Predictive Maintenance & Anomaly Detection: Utilize machine‑learning models to analyse sensor and production data. Predictive maintenance reduces unplanned downtime, a key benefit highlighted in industry reports
znt-richter.com
. Start with pilot projects using available machine data and extend models across machines.

AI‑Optimized Scheduling: Implement heuristic or reinforcement‑learning algorithms to optimise work‑order sequencing, taking into account machine availability, material constraints and due dates. This will differentiate MonoPilot from manual scheduling offered by spreadsheets.

Automated Quality Inspection: Use computer vision and AI (e.g., integration with camera‑equipped scanners) to detect defects during production, particularly for packaged foods. Real‑time inspection reduces waste and ensures compliance.

2. Implement Digital Twin & Simulation Capabilities

Process Modelling: Create virtual models of production lines, machines and workflows. Using real‑time data from IoT sensors, the digital twin can simulate the impact of parameter changes on throughput, yield and quality. As the ISA notes, digital twins enable manufacturers to simulate and optimise before implementing changes
blog.isa.org
.

What‑If Analysis for BOM & Routing: Simulate alternative recipes or routing steps to evaluate cost, energy consumption and expected yield. This is particularly useful for recipe development (NPD) and continuous improvement.

Predictive Quality & Energy Optimisation: Use digital twins to predict energy consumption and material use, supporting sustainability goals
znt-richter.com
.

3. Extend IIoT & Edge Integration

Machine Connectivity: Provide a modular gateway (e.g., using MQTT, OPC UA) to collect real‑time data from PLCs, scales and sensors. Combine with edge computing to process data locally for low‑latency control, as recommended by industry sources
rockwellautomation.com
.

Flexible Data Model: Allow customers to define custom sensor types and metrics in the database. Use time‑series storage (e.g., Supabase’s Postgres with TimescaleDB) for high‑frequency data.

Event‑Driven System: Introduce an event bus (e.g., NATS, Kafka) to decouple micro‑services and handle asynchronous events such as machine status updates, print jobs or supplier notifications.

4. Build Sustainability & Energy‑Monitoring Features

Energy & CO₂ Tracking: Add fields to the machines table for power consumption rates and log actual usage from sensors. Provide dashboards summarising energy use and CO₂ emissions per product. This aligns with sustainability trends
znt-richter.com
.

Waste & Scrap Reporting: Capture scrap amounts in work‑order outputs and provide analytics on waste sources. Suggest process improvements to reduce scrap.

Sustainability Certifications: Enable reporting for certifications (e.g., BRC, IFS, FSSC 22000) and integrate with ESG systems via API.

5. Enhance Quality & Compliance Modules

Full HACCP Support: Implement critical control point (CCP) definitions, automatic monitoring, deviation alerts and corrective action tracking.

21 CFR Part 11 Electronic Signatures: Provide secure electronic signatures and audit trails for records, enabling compliance for US exports. Use digital certificates and tamper‑proof logs.

CAPA & Supplier Quality: Add a CAPA workflow to document root cause analysis and preventive actions. Allow recording supplier audits and ratings.

Allergen & Nutritional Labelling: Extend allergen management to include nutritional information and automatically generate label data, supporting EU 1169/2011 and US FDA labelling.

6. Improve Supply‑Chain and Financial Integration

Supplier Portal & Collaboration: Provide a web portal for suppliers to confirm POs, attach certificates (e.g., CoA) and update delivery status. Integrate EDI for large customers.

Demand Forecasting & Auto‑Replenishment: Use historical consumption and AI to forecast material needs; generate recommended purchase orders when stock falls below safety levels.

Accounting Integration Layer: Build connectors to popular accounting systems (Comarch, Sage, Xero). Use a standard integration API (REST or GraphQL) with event triggers for invoices, receipts and cost updates.

7. Strengthen Security and Deployment Options

Zero‑Trust Architecture: Adopt zero‑trust principles by authenticating and authorising every service call. Implement SASE or similar secure networking for remote sites, as suggested by Digital Carbon
digitalcarbon.io
.

Role‑Based Access & Attribute‑Based Access Control (ABAC): Move beyond static roles by adding attribute‑based policies (e.g., location, shift) for fine‑grained control.

On‑Premise or Hybrid Deployment: Offer a deployable containerised version for customers with strict data‑residency or latency requirements. Use Kubernetes or Docker Compose with Supabase self‑hosted.

8. Improve UX & Operator Guidance

Guided Work Instructions: Integrate digital SOPs and step‑by‑step instructions into the scanner/mobile UI. Use dynamic forms based on product recipes and quality plans.

Augmented Reality (AR) Options: Explore integration with AR glasses (e.g., RealWear) to display instructions, highlight machine parts and capture data hands‑free. This ties into smart HMI trends
rockwellautomation.com
.

Self‑Service Analytics Dashboard: Provide drag‑and‑drop dashboards where managers can explore KPIs, yields, downtimes and energy usage without needing BI tools.

9. Strengthen Architecture & DevOps

Tenant‑Safe Data Access: Implement database views with security_definer functions to enforce org_id filtering automatically. Create a query‑wrapper library that enforces tenant parameters, reducing developer error.

Micro‑service or Modular Architecture: Split the monolithic Next.js API into independent services (e.g., auth, production, warehouse) communicating via event bus. This improves scalability and fault isolation.

Automated Testing & Continuous Delivery: Expand testing to include performance benchmarking, integration tests and security scans. Use CI/CD pipelines with staging and production environments; incorporate feature flags for safe rollouts.

Offline‑First PWA: Build the scanner interface as a PWA with offline caching and background sync. Implement an offline queue for transactions and ensure data integrity once connectivity is restored.

10. Market Strategy & Expansion

Phased Internationalisation: Prepare for new languages and regulations by abstracting all user‑facing text and date/number formats. Build multi‑currency and tax modules that can be extended by configuration.

Partner Ecosystem: Encourage third‑party developers and integrators by publishing API documentation and offering a sandbox environment. This helps build connectors (e.g., weighing scales, packaging machines) beyond the core team’s capacity.

Pricing & Packaging: Consider tiered plans: a low‑cost entry tier for micro‑SMBs (limited users/modules), a standard tier with advanced features and a premium tier with AI, digital twins and multi‑site support. Transparent pricing will help differentiate from competitors with hidden costs.

Conclusion

MonoPilot already covers the essential MES functions for small food manufacturers and has a strong competitive position in the Polish market. However, the industry is rapidly evolving, with AI, digital twins, IIoT and sustainability becoming core elements of modern MES solutions. By addressing the gaps identified in this analysis and incorporating the suggested improvements, MonoPilot can strengthen its product roadmap, meet the expectations of growing customers and maintain a competitive edge against enterprise‑level competitors.