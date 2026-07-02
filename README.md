# AtlasVault AI

**An AI knowledge compiler for companies.** AtlasVault ingests your company's
documents, compiles them into a living, cited knowledge base, and uses them to
generate proposals, tender responses, compliance matrices and
missing-document checklists — with a source citation behind every claim.

> Upload your company knowledge once. Use it forever to win contracts.

## Quick start

```bash
npm install
npm run setup     # creates the SQLite database and seeds the demo workspace
npm run dev       # http://localhost:3000
```

**Demo login:** `demo@atlasvault.ai` / `demo1234` — a fully populated demo
workspace (TrustCode Systems: 11 documents, compiled wiki, an analyzed
government tender at 74% readiness, and a cited 8-section proposal draft
awaiting approval).

Other seeded users (same password): `adaeze@trustcode.ng` (Admin/reviewer),
`tunde@trustcode.ng` (Member).

## AI modes

- **Local Knowledge Mode (default, no key needed):** deterministic and
  extractive — summaries, classification, requirement extraction, evidence
  matching and answers are assembled verbatim from your documents. Honest by
  construction; great for offline demos.
- **Claude mode:** set `ANTHROPIC_API_KEY` in `.env` (model via
  `ATLASVAULT_MODEL`, default `claude-sonnet-5`) and restart. Generation
  becomes fully synthetic but stays grounded: prompts require inline citations
  to retrieved excerpts and an explicit "insufficient evidence" signal instead
  of invention.

## The magic-moment demo (3 minutes)

1. Sign in → **Dashboard** shows knowledge health, deadlines, expiring certificates.
2. **Documents** → drop in a company profile / proposals / CVs / certificates; each is extracted, summarized and classified.
3. **Knowledge Base** → *Compile knowledge base* → Company Overview, Services, Past Projects, Team, Certificates pages, each citing its sources.
4. **Ask AI** → "Which past projects prove we can deliver a school management system?" → cited, confidence-scored answer.
5. **Opportunities** → drop in a tender PDF → requirements extracted, compliance matrix built, readiness scored, missing documents listed (expired certificates are flagged as disqualification risks).
6. Click **Generate proposal** → 8 sections drafted from your own evidence, each with citations, confidence and missing-evidence notes.
7. Request approval → approve as Admin → **Export DOCX** (export is blocked until approval — that's the trust model).

## Architecture

Next.js 15 (App Router, TS) · Tailwind · Prisma (SQLite dev / Postgres-ready)
· JWT sessions · pdf-parse + mammoth extraction · Anthropic SDK task layer
with deterministic fallback · `docx` export. See [PLAN.md](PLAN.md) for the
full implementation plan, schema, page map, API surface and V2/V3 roadmap.

## Platform layer

Beyond the core workflow: a marketing landing page with transparent pricing at
`/`, a branded **PDF engine** (cover page, contents, headers/footers, brand
color) for proposals and outputs, an **Output Studio** with five
knowledge-grounded templates, **Analytics** (hours saved, win rate, evidence
reuse), a **feedback learning loop** (thumbs-up answers become searchable
workspace memory — never shared across companies), a brand kit, workspace
AI/privacy toggles, an integrations directory (admin-gated and revocable), and
a **platform admin portal** at `/admin` (demo owner account) with sanitized
error monitoring and privacy-safe org metadata — no customer content ever.

## Security model

Role-based access control (Owner/Admin/Member/Viewer) on every mutating route
· workspace isolation on every query (verified: cross-workspace export → 404,
cross-workspace Ask AI → "not enough evidence") · confidential documents
excluded from Viewer retrieval · human approval required before export ·
sensitive-data warnings at export · rate limiting on auth/ask/upload/generate
· branded error pages with support reference IDs; sanitized error logs (no
document content, prompts or outputs) · full audit log of uploads,
generations, approvals, exports and permission changes.
