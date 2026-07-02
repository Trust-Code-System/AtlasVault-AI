/**
 * Seed: demo workspace "TrustCode Systems" — a Lagos software agency that
 * bids for public and private sector contracts. Gives every page real data
 * on first login. Login: demo@atlasvault.ai / demo1234
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { chunkText } from "../src/lib/chunk";

const db = new PrismaClient();

type SeedDoc = {
  key: string;
  title: string;
  fileName: string;
  category: string;
  status?: string;
  summary: string;
  confidential?: boolean;
  expiryDate?: Date;
  docDate?: Date;
  updatedAt?: Date;
  text: string;
};

const DOCS: SeedDoc[] = [
  {
    key: "profile",
    title: "TrustCode Systems Company Profile",
    fileName: "TrustCode_Company_Profile.pdf",
    category: "COMPANY_PROFILE",
    summary:
      "Corporate profile of TrustCode Systems Ltd, a Lagos-based software company founded in 2018, covering services (custom software, health-tech platforms, data dashboards, training), sector experience, and key differentiators.",
    docDate: new Date("2025-11-10"),
    text: `TRUSTCODE SYSTEMS LTD — COMPANY PROFILE

About Us. TrustCode Systems Ltd is a software engineering company registered in Nigeria (RC 1482291) and headquartered in Lagos, with a delivery team of 24 engineers, designers and project managers. Founded in 2018, TrustCode builds secure, scalable digital platforms for healthcare, education and public sector clients across West Africa.

Mission. Our mission is to help institutions digitize critical operations with software that is reliable, secure and maintainable.

Services. TrustCode offers the following services: custom software development (web and mobile), health information systems and hospital automation, education management platforms, data analytics dashboards and reporting systems, cloud migration and DevOps, systems integration with legacy and government platforms, and ICT capacity building and user training.

Sector Experience. Since 2018 we have completed more than 30 engagements. Our strongest track record is in the healthcare sector, where we have delivered hospital records automation, clinic appointment systems and health data dashboards for hospitals, clinics and state health agencies. In education, we have built student information portals and school management tools used by more than 40,000 students.

Why Choose TrustCode. We maintain ISO 9001-aligned quality processes, we are fully compliant with Nigerian data protection regulation (NDPR), all our platforms include audit logging and role-based access control by default, and we provide 12 months of post-deployment support on every engagement.

Key Facts. Registered: 2018, Corporate Affairs Commission RC 1482291. Offices: Lagos (HQ) and Abuja. Team: 24 full-time staff. Certifications: ISO 9001 quality management, NITDA registration. Insurance: professional indemnity cover of N50,000,000.

Contact. 14B Admiralty Way, Lekki Phase 1, Lagos. hello@trustcode.ng. www.trustcode.ng.`,
  },
  {
    key: "prop_hospital",
    title: "Proposal — Hospital Records Automation (St. Francis Hospital, 2024)",
    fileName: "Proposal_Hospital_Records_Automation_2024.docx",
    category: "PROPOSAL",
    summary:
      "Winning 2024 proposal to St. Francis Hospital for an electronic medical records and hospital workflow automation platform, including methodology, phased work plan, team and pricing approach.",
    docDate: new Date("2024-03-18"),
    text: `PROPOSAL: HOSPITAL RECORDS AUTOMATION PLATFORM — ST. FRANCIS HOSPITAL, IBADAN (2024)

Executive Summary. TrustCode Systems proposes to design, build and deploy an electronic medical records (EMR) and workflow automation platform for St. Francis Hospital. The platform will digitize patient registration, clinical notes, laboratory requests, pharmacy dispensing and billing, replacing paper records across 12 departments.

Understanding of Requirements. St. Francis Hospital requires a secure EMR accessible by 180 clinical staff, integration with existing laboratory analyzers, offline-tolerant operation during network outages, and full audit trails to satisfy accreditation requirements.

Our Methodology. TrustCode applies an agile-with-gates delivery methodology. Phase 1 (Weeks 1-4): discovery, process mapping and data model design with hospital department heads. Phase 2 (Weeks 5-16): iterative development in two-week sprints with user acceptance testing at each increment. Phase 3 (Weeks 17-20): data migration from paper and legacy records, staff training for 180 users, and supervised go-live. Phase 4: 12 months of post-deployment support with a 4-hour response SLA for critical incidents.

Technical Approach. The platform is built on a modular service architecture using Node.js and PostgreSQL, deployed on a hospital-premises server with encrypted cloud backup. Role-based access control restricts each staff category to the minimum records required. All access is audit-logged.

Proposed Team. Project Manager: Adaeze Okafor (PMP, 9 years delivery experience, led 6 health-sector projects). Lead Engineer: Tunde Balogun (10 years, architect of three EMR deployments). Plus 4 developers, 1 QA engineer, 1 trainer.

Relevant Experience. TrustCode has delivered the Clinic Booking Platform for LifeSpring Clinics (2025), the State Health Data Dashboard (2025), and school portals serving 40,000+ users.

Commercials. Fixed price covering delivery, migration, training and 12-month support. Payment milestones: 30% mobilization, 40% on UAT sign-off, 30% on go-live.`,
  },
  {
    key: "prop_school",
    title: "Proposal — School Portal (Greenfield Academy, 2023)",
    fileName: "Proposal_School_Portal_2023.docx",
    category: "PROPOSAL",
    summary:
      "2023 proposal to Greenfield Academy for a student information and school management portal covering enrolment, results, fees and parent communication.",
    docDate: new Date("2023-09-05"),
    updatedAt: new Date("2023-09-05"),
    text: `PROPOSAL: SCHOOL MANAGEMENT PORTAL — GREENFIELD ACADEMY (2023)

Executive Summary. TrustCode Systems proposes a school management portal for Greenfield Academy covering student enrolment, class and timetable management, continuous assessment and results computation, fee invoicing and payments, and a parent communication portal.

Understanding of Needs. Greenfield Academy operates 3 campuses with 4,200 students. Manual result computation takes teachers three weeks per term and fee reconciliation is error-prone. The Academy requires a single portal for administrators, teachers and parents with offline-capable data entry.

Methodology. Discovery workshops with campus heads (2 weeks); iterative build in 2-week sprints (12 weeks); migration of 5 years of student records; teacher and administrator training across all campuses; term-start supervised go-live.

Technical Approach. Web platform with role-based portals for administrators, teachers, parents and students. Results engine supporting the national 9-point grading system with school-configurable weightings. Fee module integrated with Paystack for online payments and automatic reconciliation.

Team. Project Manager Adaeze Okafor; Lead Engineer Tunde Balogun; 3 developers; 1 trainer.

Outcome Reference. TrustCode's education platforms currently serve over 40,000 students across client schools. Result computation time at comparable schools dropped from three weeks to two days.`,
  },
  {
    key: "report_clinic",
    title: "Project Completion Report — Clinic Booking Platform (LifeSpring Clinics, 2025)",
    fileName: "Project_Report_Clinic_Booking_Platform_2025.pdf",
    category: "PROJECT_REPORT",
    summary:
      "Completion report for the LifeSpring Clinics appointment booking and patient flow platform delivered in 2025: scope, timeline, outcomes (38% reduction in patient waiting time) and lessons learned.",
    docDate: new Date("2025-06-30"),
    text: `PROJECT COMPLETION REPORT — CLINIC BOOKING PLATFORM
Client: LifeSpring Clinics Network. Period: January 2025 – June 2025. Status: Completed and signed off.

Scope Delivered. TrustCode designed and deployed an appointment booking and patient flow platform for LifeSpring Clinics' 8 locations. The system provides online and front-desk booking, SMS reminders, queue management displays, doctor scheduling and a management analytics dashboard.

Timeline. The project was delivered in 22 weeks against a 24-week plan: discovery (3 weeks), build (14 weeks across 7 sprints), migration and training (3 weeks), go-live and stabilization (2 weeks).

Outcomes. Average patient waiting time fell 38% within two months of go-live. No-show rates dropped from 19% to 8% after SMS reminders were enabled. 96% of front-desk staff rated the system easy to use in the post-deployment survey. The platform processed 61,000 appointments in its first four months.

Team. Project Manager: Adaeze Okafor. Lead Engineer: Tunde Balogun. Developers: 3. QA: 1.

Client Statement. "TrustCode delivered on time and trained our staff thoroughly. The queue system transformed our front desk." — Chief Operating Officer, LifeSpring Clinics.

Lessons Learned. Early involvement of front-desk staff in design reviews shortened UAT significantly. SMS delivery required a fallback provider for reliability; a dual-provider setup is now our standard for patient messaging.`,
  },
  {
    key: "report_dashboard",
    title: "Project Completion Report — State Health Data Dashboard (2025)",
    fileName: "Project_Report_Health_Data_Dashboard_2025.pdf",
    category: "PROJECT_REPORT",
    summary:
      "Completion report for a state ministry health data dashboard aggregating reporting from 214 facilities, delivered 2025, including data pipeline, indicator dashboards and DHIS2 integration.",
    docDate: new Date("2025-10-12"),
    text: `PROJECT COMPLETION REPORT — STATE HEALTH DATA DASHBOARD
Client: State Ministry of Health (name withheld under NDA). Period: March 2025 – October 2025. Status: Completed.

Scope Delivered. TrustCode built a health data aggregation pipeline and executive dashboard consolidating monthly reporting from 214 health facilities. The system ingests facility submissions, validates them against indicator rules, integrates with the national DHIS2 instance, and presents trend dashboards for 40 health indicators to ministry leadership.

Technical Notes. Data pipeline built with scheduled ingestion workers and a PostgreSQL warehouse; dashboards rendered with a web analytics front end; role-based access separating facility, LGA and state-level views; full audit logging of data corrections.

Outcomes. Monthly reporting compliance across facilities rose from 61% to 93% in six months. Data validation rules caught and returned 4,100 inconsistent submissions for correction in the first quarter, materially improving data quality. Ministry leadership now reviews a live dashboard in monthly performance meetings instead of quarterly spreadsheets.

Team. Project Manager: Adaeze Okafor. Lead Engineer: Tunde Balogun. Data Engineer: 1. Developers: 2.

Lessons Learned. Facility-level users needed low-bandwidth pages; we now performance-budget all public-sector builds for 3G connections. Government integrations require early engagement with the DHIS2 administrator — access approvals took 6 weeks.`,
  },
  {
    key: "cv_adaeze",
    title: "CV — Adaeze Okafor, Senior Project Manager",
    fileName: "CV_Adaeze_Okafor_Project_Manager.pdf",
    category: "STAFF_CV",
    summary:
      "CV of Adaeze Okafor: PMP-certified senior project manager, 9 years of experience, led 6 health-sector deliveries including hospital EMR, clinic booking and state dashboard projects.",
    docDate: new Date("2025-09-01"),
    text: `CURRICULUM VITAE — ADAEZE OKAFOR
Role: Senior Project Manager, TrustCode Systems. Years of experience: 9.

Profile. PMP-certified project manager specialising in health and public-sector software delivery. Has led 14 projects end-to-end at TrustCode, including 6 in the health sector. Known for rigorous stakeholder management with hospital departments and government agencies.

Selected Project Experience. Hospital Records Automation, St. Francis Hospital (2024): led delivery of an EMR across 12 departments and training of 180 clinical staff; delivered on schedule. Clinic Booking Platform, LifeSpring Clinics (2025): managed 22-week delivery across 8 clinic locations. State Health Data Dashboard (2025): managed ministry stakeholders and DHIS2 integration across 214 facilities. School Management Portal, Greenfield Academy (2023): delivered enrolment-to-results platform for 4,200 students.

Education & Certifications. B.Sc. Computer Science, University of Lagos (2014). Project Management Professional (PMP), valid to 2027. PRINCE2 Foundation. NDPR Data Protection training (2025).

Skills. Agile and stage-gated delivery, public procurement processes, clinical workflow mapping, user training programme design, risk and issue management.`,
  },
  {
    key: "cv_tunde",
    title: "CV — Tunde Balogun, Lead Engineer",
    fileName: "CV_Tunde_Balogun_Lead_Engineer.pdf",
    category: "STAFF_CV",
    summary:
      "CV of Tunde Balogun: lead engineer with 10 years of experience, architect of three EMR deployments, expert in Node.js, PostgreSQL, systems integration and secure architecture.",
    docDate: new Date("2025-09-01"),
    text: `CURRICULUM VITAE — TUNDE BALOGUN
Role: Lead Engineer / Solutions Architect, TrustCode Systems. Years of experience: 10.

Profile. Solutions architect responsible for TrustCode's platform architecture standards. Has architected three EMR deployments and multiple government data platforms. Deep expertise in Node.js, TypeScript, PostgreSQL, queue-based data pipelines, DHIS2 integration and secure-by-default design (RBAC, audit logging, encryption at rest).

Selected Project Experience. Hospital Records Automation, St. Francis Hospital (2024): platform architecture, laboratory analyzer integration, offline-tolerant sync design. State Health Data Dashboard (2025): designed ingestion pipeline validating submissions from 214 facilities; DHIS2 integration. Clinic Booking Platform (2025): queue management and SMS notification architecture with dual-provider failover.

Education & Certifications. B.Eng. Electrical/Electronics, Obafemi Awolowo University (2013). AWS Solutions Architect Associate (valid to 2026). Certified Information Systems Security Professional (CISSP) — in progress.

Skills. System architecture, API design, PostgreSQL performance, health data standards (HL7/FHIR basics, DHIS2), DevOps (Docker, CI/CD), security architecture.`,
  },
  {
    key: "tax",
    title: "Tax Clearance Certificate 2026",
    fileName: "Tax_Clearance_Certificate_2026.pdf",
    category: "CERTIFICATE",
    summary: "Federal Inland Revenue Service tax clearance certificate for TrustCode Systems Ltd, valid until August 31, 2026.",
    docDate: new Date("2025-09-14"),
    expiryDate: new Date("2026-08-31"),
    text: `FEDERAL INLAND REVENUE SERVICE — TAX CLEARANCE CERTIFICATE

This is to certify that TRUSTCODE SYSTEMS LTD (RC 1482291, TIN 2039448-0001) has fulfilled its tax obligations for the assessment years 2023, 2024 and 2025.

This certificate is valid until August 31, 2026.

Issued: September 14, 2025. Certificate No: FIRS/TCC/2025/118824. This certificate is issued for official purposes including participation in public procurement.`,
  },
  {
    key: "cac",
    title: "CAC Certificate of Incorporation",
    fileName: "CAC_Incorporation_Certificate.pdf",
    category: "CERTIFICATE",
    summary: "Corporate Affairs Commission certificate of incorporation for TrustCode Systems Ltd, RC 1482291, incorporated March 22, 2018.",
    docDate: new Date("2018-03-22"),
    updatedAt: new Date("2024-01-15"),
    text: `CORPORATE AFFAIRS COMMISSION — CERTIFICATE OF INCORPORATION

This is to certify that TRUSTCODE SYSTEMS LTD is this day incorporated under the Companies and Allied Matters Act and that the company is limited by shares.

Registration Number: RC 1482291. Given under my hand at Abuja this 22nd day of March 2018.

Registered office: 14B Admiralty Way, Lekki Phase 1, Lagos. Share capital: N10,000,000.`,
  },
  {
    key: "iso",
    title: "ISO 9001 Quality Management Certificate",
    fileName: "ISO_9001_Certificate.pdf",
    category: "CERTIFICATE",
    status: "EXPIRED",
    summary: "ISO 9001:2015 quality management system certificate for TrustCode Systems Ltd. Expired March 15, 2026 — renewal required.",
    docDate: new Date("2023-03-15"),
    expiryDate: new Date("2026-03-15"),
    updatedAt: new Date("2023-03-20"),
    text: `CERTIFICATE OF REGISTRATION — QUALITY MANAGEMENT SYSTEM ISO 9001:2015

This is to certify that TRUSTCODE SYSTEMS LTD, 14B Admiralty Way, Lekki Phase 1, Lagos, Nigeria, operates a Quality Management System which complies with the requirements of ISO 9001:2015 for the following scope: design, development and support of software systems for healthcare, education and public sector clients.

Certificate No: NG-QMS-31408. Initial certification: March 15, 2023. This certificate is valid until March 15, 2026, subject to satisfactory surveillance audits.`,
  },
  {
    key: "testimonial",
    title: "Client Testimonial — St. Francis Hospital",
    fileName: "Testimonial_StFrancis_Hospital.pdf",
    category: "OTHER",
    summary: "Reference letter from St. Francis Hospital confirming successful delivery of the hospital records automation platform in 2024 and commending training quality.",
    docDate: new Date("2024-12-02"),
    text: `ST. FRANCIS HOSPITAL, IBADAN — TO WHOM IT MAY CONCERN

This letter confirms that TrustCode Systems Ltd designed, built and deployed our hospital records automation platform between March and August 2024. The platform now runs across 12 departments and is used daily by over 180 clinical and administrative staff.

TrustCode delivered the project on schedule, migrated our historical records accurately, and trained our staff thoroughly. Post-deployment support has been responsive, with critical issues resolved within agreed timelines.

We are pleased to recommend TrustCode Systems for hospital information system projects of similar scale. Signed, Medical Director, St. Francis Hospital, Ibadan. December 2, 2024.`,
  },
  {
    key: "tender_school",
    title: "RFP — School Management Information System (Federal Ministry of Education)",
    fileName: "RFP_School_Management_System_FME.pdf",
    category: "OPPORTUNITY",
    summary: "Request for proposals from the Federal Ministry of Education for a national pilot school management information system across 120 schools. Submission deadline July 24, 2026.",
    docDate: new Date("2026-06-10"),
    text: `FEDERAL MINISTRY OF EDUCATION — REQUEST FOR PROPOSALS
RFP No: FME/ICT/2026/014 — SCHOOL MANAGEMENT INFORMATION SYSTEM (PILOT PHASE)

1. Introduction. The Federal Ministry of Education invites proposals from qualified firms for the design, development and deployment of a School Management Information System (SMIS) to be piloted in 120 public secondary schools across 6 states.

2. Scope of Work. The system shall provide student enrolment and records management, teacher and staff records, attendance capture (including offline-capable entry), continuous assessment and national examination results processing, fee and grant tracking, and dashboards for school, state and federal administrators. The contractor shall migrate existing records, train at least 600 school administrators, and provide 12 months of support.

3. Eligibility and Mandatory Requirements. Bidders must be registered with the Corporate Affairs Commission. Bidders must submit a valid Tax Clearance Certificate for the last three years. Bidders must provide evidence of at least two similar projects completed in the last three years in the education or public sector. Bidders must submit CVs of key personnel including a certified Project Manager and a Lead Engineer with a minimum of eight years of experience. Bidders must provide a valid ISO 9001 quality management certificate or equivalent. Bidders must show evidence of professional indemnity insurance of not less than N25,000,000. Bidders must be registered on the National Database of Contractors (BPP portal).

4. Technical Requirements. The system must operate on low-bandwidth connections and support offline data entry with synchronization. The system must implement role-based access control and maintain complete audit trails. The system must integrate with the national education data platform via documented APIs. Data must be hosted in Nigeria in compliance with NDPR.

5. Evaluation. Proposals shall be scored on technical approach (30), relevant experience (25), key personnel (20), work plan (15) and financial proposal (10). Incomplete submissions shall be disqualified.

6. Submission. Proposals must be submitted no later than July 24, 2026 at 12:00 noon. Late submissions shall be rejected. Estimated contract value: N480,000,000.`,
  },
];

async function main() {
  console.log("Seeding AtlasVault demo workspace…");
  // wipe (idempotent reseed)
  await db.$transaction([
    db.citation.deleteMany(), db.answer.deleteMany(), db.requirement.deleteMany(),
    db.proposalSection.deleteMany(), db.approval.deleteMany(), db.proposal.deleteMany(),
    db.opportunity.deleteMany(), db.evidenceItem.deleteMany(), db.wikiPage.deleteMany(),
    db.documentChunk.deleteMany(), db.document.deleteMany(), db.comment.deleteMany(),
    db.task.deleteMany(), db.auditLog.deleteMany(), db.usageLog.deleteMany(),
    db.feedback.deleteMany(), db.integration.deleteMany(), db.generatedOutput.deleteMany(),
    db.errorLog.deleteMany(),
    db.membership.deleteMany(), db.workspace.deleteMany(), db.organization.deleteMany(),
    db.user.deleteMany(),
  ]);

  const password = await bcrypt.hash("demo1234", 10);
  const owner = await db.user.create({ data: { email: "demo@atlasvault.ai", passwordHash: password, name: "Demo Founder", isPlatformAdmin: true } });
  const reviewer = await db.user.create({ data: { email: "adaeze@trustcode.ng", passwordHash: password, name: "Adaeze Okafor" } });
  const member = await db.user.create({ data: { email: "tunde@trustcode.ng", passwordHash: password, name: "Tunde Balogun" } });

  const org = await db.organization.create({
    data: {
      name: "TrustCode Systems Ltd", industry: "Software & IT Services", website: "https://trustcode.ng", country: "Nigeria",
      brandColor: "#0f766e",
      brandVoice: "Formal but plain-spoken. Prefer concrete delivery language ('we delivered', 'we trained') over aspiration ('we aim to'). Never overclaim beyond documented evidence.",
    },
  });
  const ws = await db.workspace.create({ data: { name: "TrustCode Systems", slug: "trustcode", orgId: org.id } });

  await db.membership.createMany({
    data: [
      { userId: owner.id, workspaceId: ws.id, role: "OWNER" },
      { userId: reviewer.id, workspaceId: ws.id, role: "ADMIN" },
      { userId: member.id, workspaceId: ws.id, role: "MEMBER" },
    ],
  });

  // documents + chunks
  const docIds: Record<string, string> = {};
  const chunkIndex: Record<string, { id: string; content: string }[]> = {};
  for (const d of DOCS) {
    const doc = await db.document.create({
      data: {
        workspaceId: ws.id,
        uploaderId: owner.id,
        title: d.title,
        fileName: d.fileName,
        mimeType: d.fileName.endsWith(".docx")
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/pdf",
        sizeBytes: d.text.length * 3,
        category: d.category,
        status: d.status ?? "PROCESSED",
        summary: d.summary,
        extractedText: d.text,
        language: "en",
        docDate: d.docDate,
        expiryDate: d.expiryDate,
        createdAt: d.docDate ?? new Date("2026-05-01"),
        updatedAt: d.updatedAt ?? new Date("2026-06-20"),
      },
    });
    docIds[d.key] = doc.id;
    const chunks = chunkText(d.text);
    chunkIndex[d.key] = [];
    for (let i = 0; i < chunks.length; i++) {
      const c = await db.documentChunk.create({ data: { documentId: doc.id, index: i, content: chunks[i] } });
      chunkIndex[d.key].push({ id: c.id, content: chunks[i] });
    }
  }

  const cite = (key: string, targetType: string, targetId: string, needle?: string) => {
    const chunks = chunkIndex[key];
    const chunk = needle ? chunks.find((c) => c.content.toLowerCase().includes(needle.toLowerCase())) ?? chunks[0] : chunks[0];
    return db.citation.create({
      data: {
        workspaceId: ws.id,
        documentId: docIds[key],
        chunkId: chunk.id,
        snippet: chunk.content.slice(0, 180),
        targetType,
        targetId,
      },
    });
  };

  // wiki pages
  const wiki = async (slug: string, title: string, type: string, confidence: string, content: string, sources: string[]) => {
    const page = await db.wikiPage.create({
      data: { workspaceId: ws.id, slug, title, type, content, confidence, status: slug === "company-overview" ? "APPROVED" : "AI_GENERATED" },
    });
    for (const s of sources) await cite(s, "WIKI_PAGE", page.id);
    return page;
  };

  await wiki("company-overview", "Company Overview", "COMPANY", "HIGH",
`## Who we are

TrustCode Systems Ltd is a software engineering company registered in Nigeria (RC 1482291), founded in 2018 and headquartered in Lagos with an office in Abuja. The team comprises 24 full-time engineers, designers and project managers.

## What we do

TrustCode builds secure, scalable digital platforms for **healthcare**, **education** and the **public sector** across West Africa — including hospital records automation, clinic operations systems, health data dashboards and school management platforms.

## Differentiators

- ISO 9001-aligned quality processes and NDPR compliance
- Role-based access control and audit logging by default on every platform
- 12 months of post-deployment support on every engagement
- 30+ completed engagements since 2018; education platforms serving 40,000+ students`,
    ["profile"]);

  await wiki("services", "Services", "SERVICES", "HIGH",
`## Core services

1. **Custom software development** — web and mobile platforms
2. **Health information systems** — EMR / hospital automation, clinic booking, patient flow
3. **Education management platforms** — enrolment, assessment/results, fees, parent portals
4. **Data analytics dashboards** — indicator pipelines, executive reporting, DHIS2 integration
5. **Cloud migration & DevOps**
6. **Systems integration** — legacy and government platforms
7. **ICT capacity building** — user training programmes (600+ users trained on recent projects)`,
    ["profile", "prop_hospital"]);

  await wiki("past-projects", "Past Projects", "PROJECTS", "HIGH",
`## Hospital Records Automation — St. Francis Hospital, Ibadan (2024)

EMR and workflow automation across 12 departments; 180 clinical staff trained; delivered on schedule with accurate migration of historical records. Confirmed by a signed client reference letter.

## Clinic Booking Platform — LifeSpring Clinics (2025)

Appointment booking and patient-flow platform across 8 locations, delivered in 22 weeks. Outcomes: patient waiting time down **38%**, no-shows down from 19% to **8%**, 61,000 appointments processed in the first four months.

## State Health Data Dashboard — State Ministry of Health (2025)

Aggregation pipeline and executive dashboards for **214 health facilities** with DHIS2 integration. Reporting compliance rose from 61% to **93%** in six months.

## School Management Portal — Greenfield Academy (2023)

Enrolment-to-results portal for 4,200 students across 3 campuses; result computation time cut from three weeks to two days.`,
    ["report_clinic", "report_dashboard", "prop_school", "testimonial"]);

  await wiki("team-expertise", "Team & Expertise", "PEOPLE", "MEDIUM",
`## Adaeze Okafor — Senior Project Manager

PMP-certified (valid to 2027), 9 years of experience, 14 projects led end-to-end including 6 health-sector deliveries (St. Francis EMR, LifeSpring booking platform, State Health Dashboard). PRINCE2 Foundation; NDPR data protection trained.

## Tunde Balogun — Lead Engineer / Solutions Architect

10 years of experience; architect of three EMR deployments and multiple government data platforms. Node.js, TypeScript, PostgreSQL, DHIS2 integration, secure-by-default design. AWS Solutions Architect Associate (valid to 2026).

> Only two staff CVs are in the library. Tender responses typically require 4–6 key personnel CVs — upload more to strengthen this page.`,
    ["cv_adaeze", "cv_tunde"]);

  await wiki("certificates-compliance", "Certificates & Compliance", "CERTIFICATES", "MEDIUM",
`| Document | Reference | Status | Valid until |
|---|---|---|---|
| CAC Certificate of Incorporation | RC 1482291 | ✅ Valid | — |
| Tax Clearance Certificate | FIRS/TCC/2025/118824 | ⚠️ Expiring | Aug 31, 2026 |
| ISO 9001:2015 QMS Certificate | NG-QMS-31408 | ❌ **Expired** | Mar 15, 2026 |

**Attention needed:** the ISO 9001 certificate expired on March 15, 2026 and is a mandatory requirement in many public tenders. The tax clearance certificate expires August 31, 2026 — begin renewal.

Professional indemnity insurance of N50,000,000 is stated in the company profile, but **no insurance certificate document is in the library**.`,
    ["cac", "tax", "iso", "profile"]);

  // evidence library
  const evidenceRows = [
    { key: "report_clinic", title: "LifeSpring Clinics — 38% waiting-time reduction", type: "PROJECT_PROOF", strength: "STRONG", approvedForExternal: true, notes: "Signed completion report with quantified outcomes. Best case study for health-sector bids." },
    { key: "testimonial", title: "St. Francis Hospital reference letter", type: "TESTIMONIAL", strength: "STRONG", approvedForExternal: true, notes: "Signed by Medical Director. Confirms on-schedule delivery and training quality." },
    { key: "report_dashboard", title: "State Health Dashboard — 214 facilities, DHIS2", type: "PROJECT_PROOF", strength: "STRONG", approvedForExternal: false, notes: "Client under NDA — get written approval before naming the ministry externally.", confidential: true },
    { key: "tax", title: "Tax Clearance Certificate (2023–2025)", type: "CERTIFICATE", strength: "STRONG", approvedForExternal: true, expiresAt: new Date("2026-08-31") },
    { key: "iso", title: "ISO 9001:2015 Certificate", type: "CERTIFICATE", strength: "EXPIRED", approvedForExternal: false, expiresAt: new Date("2026-03-15"), notes: "EXPIRED — renewal audit needed before it can be used in bids." },
    { key: "cv_adaeze", title: "CV — Adaeze Okafor (PM, PMP)", type: "CV", strength: "STRONG", approvedForExternal: true },
    { key: "cv_tunde", title: "CV — Tunde Balogun (Lead Engineer)", type: "CV", strength: "STRONG", approvedForExternal: true },
  ];
  for (const e of evidenceRows) {
    await db.evidenceItem.create({
      data: {
        workspaceId: ws.id, documentId: docIds[e.key], title: e.title, type: e.type,
        strength: e.strength, approvedForExternal: e.approvedForExternal ?? false,
        confidential: (e as { confidential?: boolean }).confidential ?? false,
        expiresAt: (e as { expiresAt?: Date }).expiresAt, notes: (e as { notes?: string }).notes,
      },
    });
  }

  // opportunity + requirements (analyzed state)
  const opp = await db.opportunity.create({
    data: {
      workspaceId: ws.id,
      title: "School Management Information System — Federal Ministry of Education",
      client: "Federal Ministry of Education",
      deadline: new Date("2026-07-24"),
      value: "₦480,000,000 (estimated)",
      status: "IN_PROGRESS",
      readinessScore: 74,
      summary: "National pilot SMIS for 120 public secondary schools across 6 states: enrolment, attendance (offline-capable), results processing, fee tracking and multi-level dashboards. Includes migration, training of 600 administrators and 12 months of support.",
      briefDocumentId: docIds["tender_school"],
      createdAt: new Date("2026-06-12"),
    },
  });

  const reqRows: { text: string; category: string; mandatory: boolean; status: string; risk: string; evidence?: string; note?: string }[] = [
    { text: "Registered with the Corporate Affairs Commission", category: "COMPLIANCE", mandatory: true, status: "MET", risk: "LOW", evidence: "cac" },
    { text: "Valid Tax Clearance Certificate for the last three years", category: "COMPLIANCE", mandatory: true, status: "MET", risk: "LOW", evidence: "tax", note: "Valid to Aug 31, 2026 — after submission date, OK." },
    { text: "Evidence of at least two similar projects completed in the last three years (education or public sector)", category: "EXPERIENCE", mandatory: true, status: "MET", risk: "LOW", evidence: "report_dashboard", note: "Greenfield school portal (2023) + State Health Dashboard (2025); clinic platform as additional proof." },
    { text: "CVs of key personnel: certified Project Manager and Lead Engineer with minimum 8 years of experience", category: "TEAM", mandatory: true, status: "MET", risk: "LOW", evidence: "cv_adaeze", note: "Adaeze Okafor (PMP, 9 yrs) and Tunde Balogun (10 yrs) both qualify." },
    { text: "Valid ISO 9001 quality management certificate or equivalent", category: "COMPLIANCE", mandatory: true, status: "MISSING", risk: "HIGH", evidence: "iso", note: "ISO 9001 certificate EXPIRED Mar 15, 2026. Renewal audit required before submission — disqualification risk." },
    { text: "Professional indemnity insurance of not less than ₦25,000,000", category: "COMPLIANCE", mandatory: true, status: "PARTIAL", risk: "MEDIUM", note: "Profile states ₦50m cover but no insurance certificate is uploaded. Obtain certificate from broker." },
    { text: "Registration on the National Database of Contractors (BPP portal)", category: "COMPLIANCE", mandatory: true, status: "MISSING", risk: "HIGH", note: "No BPP registration evidence in the library. Verify status and upload proof." },
    { text: "System must support offline data entry with synchronization on low-bandwidth connections", category: "TECHNICAL", mandatory: true, status: "MET", risk: "LOW", evidence: "prop_hospital", note: "Offline-tolerant design proven on St. Francis EMR; low-bandwidth budgeting standard from ministry dashboard project." },
    { text: "Role-based access control and complete audit trails", category: "TECHNICAL", mandatory: true, status: "MET", risk: "LOW", evidence: "profile" },
    { text: "Integration with the national education data platform via documented APIs", category: "TECHNICAL", mandatory: true, status: "PARTIAL", risk: "MEDIUM", evidence: "report_dashboard", note: "DHIS2 integration proves government-API capability; no direct education-platform integration yet." },
    { text: "Data hosted in Nigeria in compliance with NDPR", category: "TECHNICAL", mandatory: true, status: "MET", risk: "LOW", evidence: "profile" },
    { text: "Train at least 600 school administrators and provide 12 months of support", category: "GENERAL", mandatory: true, status: "MET", risk: "LOW", evidence: "prop_hospital", note: "Trained 180 clinical staff (St. Francis); 12-month support is standard on all engagements." },
  ];
  for (const r of reqRows) {
    const req = await db.requirement.create({
      data: {
        opportunityId: opp.id, text: r.text, category: r.category, mandatory: r.mandatory,
        status: r.status, risk: r.risk, note: r.note,
        evidenceDocumentId: r.evidence ? docIds[r.evidence] : null,
        evidenceSnippet: r.evidence ? chunkIndex[r.evidence][0].content.slice(0, 160) : null,
      },
    });
    if (r.evidence) await cite(r.evidence, "REQUIREMENT", req.id);
  }

  // proposal + sections
  const proposal = await db.proposal.create({
    data: {
      workspaceId: ws.id, opportunityId: opp.id, createdById: owner.id,
      title: "Proposal — SMIS Pilot for Federal Ministry of Education",
      status: "NEEDS_REVIEW",
      createdAt: new Date("2026-06-18"),
    },
  });

  const sections: { title: string; content: string; confidence: string; status?: string; missing?: string; sources: string[] }[] = [
    {
      title: "Executive Summary", confidence: "HIGH", sources: ["profile", "prop_school", "report_dashboard"],
      content: `TrustCode Systems Ltd is pleased to submit this proposal for the School Management Information System pilot. We are a Nigerian software company (RC 1482291) with a proven, directly relevant track record: a school management portal serving 4,200 students at Greenfield Academy, education platforms serving over 40,000 students, and a state-wide government data platform aggregating reporting from 214 health facilities with DHIS2 integration — the same integration and low-bandwidth engineering challenges this pilot presents.\n\nOur proposed team is led by a PMP-certified project manager with nine years of delivery experience and a lead engineer who has architected three national-scale data platforms. We deliver every engagement with role-based access control, complete audit trails and NDPR-compliant Nigerian hosting as defaults.`,
    },
    {
      title: "Company Introduction", confidence: "HIGH", sources: ["profile", "cac"],
      content: `TrustCode Systems Ltd was incorporated in 2018 (CAC RC 1482291) and is headquartered in Lagos with an office in Abuja. Our 24-person team builds secure digital platforms for education, healthcare and the public sector. We hold current tax clearance (FIRS/TCC/2025/118824) and maintain ISO 9001-aligned quality processes, with 12 months of post-deployment support standard on every engagement.`,
    },
    {
      title: "Understanding of the Assignment", confidence: "HIGH", sources: ["tender_school"],
      content: `The Ministry seeks a pilot SMIS across 120 public secondary schools in 6 states covering enrolment and records, staff records, offline-capable attendance, continuous assessment and national examination results processing, fee and grant tracking, and dashboards at school, state and federal levels. The contractor must migrate existing records, train at least 600 administrators, and support the system for 12 months. We understand the decisive constraints to be connectivity (offline-first data entry), scale of change management across 6 states, and NDPR-compliant national hosting with API integration to the national education data platform.`,
    },
    {
      title: "Technical Approach & Methodology", confidence: "HIGH", sources: ["prop_hospital", "report_dashboard"],
      content: `We propose our proven agile-with-gates methodology: discovery and process mapping with school and state administrators; iterative two-week build sprints with user acceptance testing per increment; supervised migration, training and go-live; then a 12-month support period with defined SLAs.\n\nArchitecture: an offline-first web application with local data entry and background synchronization — the approach we validated on the St. Francis Hospital EMR (offline-tolerant operation across 12 departments) — backed by a PostgreSQL data platform with validation rules of the kind that returned 4,100 inconsistent submissions for correction on our state health data pipeline. All pages are performance-budgeted for 3G connections, a standard we adopted from ministry dashboard delivery. RBAC and full audit logging are defaults.`,
    },
    {
      title: "Relevant Experience & Case Studies", confidence: "HIGH", sources: ["prop_school", "report_dashboard", "report_clinic", "testimonial"],
      content: `**Greenfield Academy School Management Portal (2023)** — enrolment, assessment/results, fees and parent portal for 4,200 students across 3 campuses; result computation reduced from three weeks to two days.\n\n**State Health Data Dashboard (2025)** — data pipeline and dashboards for 214 facilities with DHIS2 (government API) integration; reporting compliance rose from 61% to 93% in six months.\n\n**Clinic Booking Platform, LifeSpring Clinics (2025)** — 8-site operations platform delivered in 22 weeks; patient waiting time down 38%.\n\nA signed reference letter from St. Francis Hospital confirms on-schedule delivery and thorough training of 180 staff on our 2024 EMR deployment.`,
    },
    {
      title: "Proposed Team", confidence: "MEDIUM", sources: ["cv_adaeze", "cv_tunde"],
      missing: "RFP expects a fuller key-personnel roster (e.g., training lead, QA lead). Only 2 CVs are in the library.",
      content: `**Project Manager — Adaeze Okafor** (PMP valid to 2027; 9 years; 14 projects led including the Greenfield school portal and two ministry-facing deliveries).\n\n**Lead Engineer — Tunde Balogun** (10 years; architect of three EMR deployments and the 214-facility state data pipeline; AWS SAA certified).\n\nSupporting roles (developers ×4, QA ×1, trainers ×2) will be drawn from our 24-person delivery team; CVs available on request.`,
    },
    {
      title: "Work Plan & Timeline", confidence: "MEDIUM", sources: ["prop_hospital", "prop_school"],
      content: `Phase 1 — Discovery & design (Weeks 1–6): process mapping with the Ministry, state teams and 12 representative schools; data model and integration design.\nPhase 2 — Build (Weeks 7–22): two-week sprints; UAT each increment; integration with the national education data platform.\nPhase 3 — Pilot rollout (Weeks 23–34): staged deployment across the 6 states; migration of existing records; training of 600+ administrators in state-level cohorts.\nPhase 4 — Stabilization & support (Weeks 35–86): supervised operation, quarterly reviews, 12-month SLA-backed support.\n\nThis mirrors the phased structure that delivered the LifeSpring platform two weeks ahead of plan.`,
    },
    {
      title: "Risk Management", confidence: "MEDIUM", sources: ["report_dashboard", "report_clinic"],
      content: `**Connectivity risk** — offline-first design with background sync; pages performance-budgeted for 3G (standard adopted after our state dashboard delivery).\n**Government API dependency** — our DHIS2 experience showed access approvals can take 6 weeks; we initiate integration requests in Week 1.\n**Adoption risk across 600+ users** — early involvement of end users in design reviews (validated on LifeSpring, where it shortened UAT) and train-the-trainer cohorts per state.\n**Data quality in migration** — validation rules with rejection-and-correction workflow, as used to catch 4,100 inconsistent submissions on our health data pipeline.`,
    },
  ];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const sec = await db.proposalSection.create({
      data: {
        proposalId: proposal.id, index: i, title: s.title, content: s.content,
        status: s.status ?? (i === 0 ? "APPROVED" : "AI_GENERATED"),
        confidence: s.confidence, missing: s.missing,
      },
    });
    for (const src of s.sources) await cite(src, "PROPOSAL_SECTION", sec.id, undefined);
  }

  await db.approval.create({
    data: {
      workspaceId: ws.id, proposalId: proposal.id, targetType: "PROPOSAL", targetId: proposal.id,
      status: "PENDING", requestedById: owner.id, note: "Please review before the July 24 deadline.",
    },
  });

  await db.comment.create({
    data: {
      workspaceId: ws.id, authorId: reviewer.id, targetType: "PROPOSAL", targetId: proposal.id,
      body: "Team section is thin — we should add the training lead's CV before this goes out. Also chase the ISO renewal, it's a mandatory requirement.",
    },
  });

  await db.task.createMany({
    data: [
      { workspaceId: ws.id, title: "Renew ISO 9001 certificate (expired Mar 15) — mandatory for FME tender", assigneeId: owner.id, relatedType: "OPPORTUNITY", relatedId: opp.id },
      { workspaceId: ws.id, title: "Obtain professional indemnity insurance certificate from broker", assigneeId: reviewer.id, relatedType: "OPPORTUNITY", relatedId: opp.id },
      { workspaceId: ws.id, title: "Verify BPP contractor database registration and upload proof", assigneeId: member.id, relatedType: "OPPORTUNITY", relatedId: opp.id },
      { workspaceId: ws.id, title: "Upload CVs for training lead and QA lead", assigneeId: reviewer.id, relatedType: "PROPOSAL", relatedId: proposal.id },
    ],
  });

  const audits = [
    { action: "workspace.created", detail: "Workspace TrustCode Systems created" },
    { action: "document.uploaded", detail: "11 documents uploaded and processed" },
    { action: "wiki.compiled", detail: "5 wiki pages compiled from 11 source documents" },
    { action: "opportunity.analyzed", detail: "FME SMIS tender analyzed — 12 requirements extracted, readiness 74%" },
    { action: "proposal.generated", detail: "Proposal draft generated with 8 sections and 19 citations" },
    { action: "approval.requested", detail: "Approval requested for SMIS proposal" },
  ];
  for (const a of audits) {
    await db.auditLog.create({ data: { workspaceId: ws.id, userId: owner.id, ...a } });
  }

  // sample sanitized error logs so the admin portal demonstrates its shape
  await db.errorLog.createMany({
    data: [
      { ref: "ERR-2026-A1B2C3", severity: "WARNING", category: "DOCUMENT_UPLOAD", message: "Extraction produced no text for a scanned PDF (OCR is a Phase 2 feature)", route: "/api/documents", method: "POST", statusCode: 200, workspaceId: ws.id },
      { ref: "ERR-2026-D4E5F6", severity: "ERROR", category: "CLIENT", message: "Client error: failed to fetch (network interrupted during upload)", route: "/documents", statusCode: 0, workspaceId: ws.id },
    ],
  });

  console.log("Seed complete. Login: demo@atlasvault.ai / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
