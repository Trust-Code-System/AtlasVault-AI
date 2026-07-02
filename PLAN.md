# AtlasVault AI — Implementation Plan

> **Positioning:** an AI knowledge compiler for companies. First wedge: the
> **Proposal & Tender Operating System** — upload company documents once,
> generate evidence-backed proposals, compliance matrices and missing-document
> checklists forever.

## 1. Phased roadmap

| Phase | Scope | Status |
|---|---|---|
| **MVP** | Auth, workspaces, roles, upload + processing, AI summaries/classification, knowledge base compile, Ask AI with citations, opportunity analysis + compliance matrix + readiness score, proposal generator with per-section citations/confidence, evidence library, health check, approval-gated export, audit log | ✅ Built |
| **Platform layer (this build)** | Marketing landing + transparent pricing, branded **PDF engine** (pdfmake: cover page, TOC, headers/footers, tables, callouts, sources), **Output Studio** (5 templates: company profile, case study, capability statement, CV pack, executive brief), **Analytics** (hours saved, win rate, evidence reuse, weekly activity), **feedback → workspace-memory learning loop**, brand kit (color + voice applied to generation/exports), workspace AI/privacy settings, integrations directory (admin-gated, scoped, revocable; OAuth connectors Phase 2), **platform admin portal** (overview, sanitized error monitoring, privacy-safe org list), clean error pages (404/500/global boundary) + `withApi` error wrapper with ERR reference IDs + sanitized ErrorLog, rate limiting (ask/upload/generate/login), win/loss tracking UI, onboarding checklist, mobile-responsive sidebar | ✅ Built & verified |
| **V2** | Google Drive/OAuth connectors (settings already gate them), OCR for scanned docs, certificate expiry notifications (email), PPTX export, client/project pages, background job queue, real embeddings (pgvector + Voyage) + reranking, billing (Stripe) | Planned |
| **V3** | Knowledge graph, Gmail/WhatsApp ingestion, external research agent (toggle already stored), SSO/SAML, API keys, private deployment, consent-based support access | Planned |

## 2. Tech stack (and why)

- **Next.js 15 (App Router) + TypeScript** — one codebase for UI + API, server components for fast enterprise pages.
- **Tailwind CSS + lucide-react** — Notion/Linear-grade UI without a heavy design system.
- **Prisma + SQLite** locally; the schema is Postgres-portable (swap datasource, move `DocumentChunk.embedding` to pgvector).
- **Auth:** bcrypt + JWT session cookie (jose), membership re-validated on every request. SSO is a V3 concern.
- **Extraction:** pdf-parse (PDF), mammoth (DOCX), direct read for text formats. OCR is V2.
- **AI layer:** `@anthropic-ai/sdk` behind a task router (`src/lib/ai/`). Every task (classify, extract requirements, answer, compile wiki, draft section) has:
  - a **Claude path** (strict-JSON prompts, citation enforcement, "insufficient evidence" contract), and
  - a **deterministic Local Knowledge Mode fallback** (extractive, keyword-based) used when no API key is set or a call fails — the product never breaks and never invents facts.
- **Retrieval:** lexical TF + title-boost scoring over chunks scoped by workspace/category/confidentiality (`src/lib/search.ts`). The interface returns scored chunks with document metadata, so swapping in hybrid vector search + reranker later changes nothing at call sites.
- **Export:** `docx` package for Word, plus Markdown. Approval-gated.

## 3. Database schema (Prisma)

Users → Memberships (role) → Workspaces → Organizations.
Content: Documents → DocumentChunks (+ embedding column), WikiPages, EvidenceItems.
Workflow: Opportunities → Requirements (compliance matrix rows), Proposals → ProposalSections, Approvals, Tasks, Comments.
Trust: Citations (polymorphic: wiki page / answer / proposal section / requirement), AuditLogs, UsageLogs, Answers.

## 4. Page map

| Route | Purpose |
|---|---|
| `/login`, `/signup` | Auth + workspace creation (company, industry, country) |
| `/dashboard` | Health score, deadlines, expiring certs, tasks, activity |
| `/documents`, `/documents/[id]` | Library with category filters, upload dropzone; detail with AI summary, chunks, metadata, citation usage, review/confidential/delete actions |
| `/wiki`, `/wiki/[slug]` | Compile knowledge base; pages with confidence, status, source citations, markdown editing, approval |
| `/ask` | Cited Q&A with confidence and "not enough evidence" handling |
| `/opportunities`, `/opportunities/[id]` | Tender upload + analysis; readiness ring, disqualification warnings, missing-document checklist, full compliance matrix |
| `/proposals`, `/proposals/[id]` | Generated drafts; per-section edit/regenerate/approve, evidence panel, approval workflow, gated export |
| `/evidence` | Reusable proof with strength tags and external-use approval |
| `/health` | Rule-based health report: expiry, coverage gaps, weak pages, unsupported claims |
| `/settings` | Workspace info, AI engine status, team roles, invite flow, audit log |

## 5. API routes

- `POST /api/auth/signup | login | logout`
- `POST /api/documents` (upload→extract→classify→chunk), `PATCH/DELETE /api/documents/[id]`
- `POST /api/wiki/compile`, `PATCH /api/wiki/[id]`
- `POST /api/ask`
- `POST /api/opportunities` (upload brief→analyze), `PATCH /api/opportunities/[id]` (reanalyze/status)
- `POST /api/proposals` (generate), `PATCH /api/proposals/[id]/sections/[sectionId]` (edit/regenerate/approve), `POST /api/proposals/[id]/approval`, `GET /api/proposals/[id]/export?format=docx|md`
- `POST/PATCH /api/evidence`, `POST/PATCH /api/team`

## 6. AI workflow design

1. **Ingestion:** file → preserve original in `/uploads` → extract text → chunk (paragraph-aware, ~1200 chars) → classify + summarize (+ expiry-date detection for certificates).
2. **Compile:** per canonical wiki page (overview, services, projects, team, certificates): category-scoped retrieval → grounded generation → citations stored per chunk → confidence set → human approval flow.
3. **Opportunity analysis:** brief → requirement extraction (category, mandatory) → each requirement matched against company chunks → MET/PARTIAL/MISSING with evidence links; **expired documents can never satisfy a requirement**; readiness = (met + 0.5·partial)/total.
4. **Proposal generation:** per section spec: blended retrieval query (section intent + opportunity subject), tender excluded from evidence sections → grounded drafting with per-claim citations, confidence, and explicit `missing` notes → sections stored individually for the builder.
5. **Trust chain:** citations at every step, confidence badges, "not enough evidence" instead of hallucination, human approval before export, sensitive-data scan at export, everything audit-logged.

## 7. Security & trust checklist (MVP)

- RBAC (Owner/Admin/Member/Viewer) enforced in every mutating route
- Viewers excluded from confidential-document retrieval in Ask AI
- Workspace isolation on every query (`workspaceId` scoping)
- Approval required before proposal export (admin override is audit-logged)
- Sensitive-data heuristics on export; confidential flags on documents/evidence
- Full audit log; usage log for AI calls/exports
- Zod validation on all inputs; upload size/type limits; passwords bcrypt-hashed; HTTP-only signed session cookies
