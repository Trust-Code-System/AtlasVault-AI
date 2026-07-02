# AtlasVault AI — Complete UI Design Brief

Hand this document to Google Stitch, v0, or Figma (as an AI-design prompt or human reference). It describes a product that is **already built and running** — the goal of any redesign is to match or elevate this exact spec, not invent a new direction. Every color, spacing value, and page layout below is pulled directly from the live Next.js + Tailwind codebase.

---

## 1. Product identity

**Name:** AtlasVault AI
**Category:** AI Knowledge Compiler & Proposal/Tender Operating System (B2B SaaS)
**One-line positioning:** "Upload your company documents once. Win contracts with them forever."
**Elevator pitch:** AtlasVault ingests a company's scattered documents (proposals, project reports, staff CVs, certificates), compiles them into a living, cited knowledge base, then generates evidence-backed proposals, compliance matrices, and missing-document checklists when a tender or RFP is uploaded.

**Target user:** Proposal managers, business development leads, and founders at service companies (software agencies, consultancies, construction/engineering firms, NGOs) that repeatedly bid for contracts.

**Emotional target:** Trustworthy enough to upload sensitive company documents. Feels like **Notion** (knowledge organization) crossed with **Linear** (clean SaaS chrome) and **Glean** (enterprise AI search) — never like a hackathon AI-wrapper demo.

**Explicit non-goals for visual design:** no purple-gradient-AI-startup clichés, no glassmorphism overload, no emoji-heavy UI, no dense enterprise-software clutter (think Salesforce), no playful/toy aesthetic.

---

## 2. Design tokens

### 2.1 Color palette

Primary brand color is a confident indigo-blue. Neutral scale is Tailwind's **Slate** (cool gray, not warm gray — important, it reads more "engineering-grade trustworthy" than warm neutrals).

**Brand (primary) — indigo-blue:**
| Token | Hex | Usage |
|---|---|---|
| brand-50 | `#eef4ff` | subtle backgrounds, hover tints, active nav item background |
| brand-100 | `#dce7fd` | badge backgrounds, light borders |
| brand-200 | `#c0d4fc` | hover borders on cards |
| brand-300 | `#95b8f9` | — |
| brand-400 | `#6392f4` | focus ring accents |
| brand-500 | `#3f6eee` | — |
| brand-600 | `#2a4fe2` | **primary action color** — buttons, active nav text/icon, links, logo mark background |
| brand-700 | `#223cd0` | button hover state |
| brand-800 | `#2233a9` | — |
| brand-900 | `#213085` | dark accent text on light brand backgrounds (e.g. landing page trust-note card) |
| brand-950 | `#181f51` | — |

**Neutrals — Slate:**
| Token | Hex (approx) | Usage |
|---|---|---|
| slate-50 | `#f8fafc` | page background (app shell), subtle row stripes |
| slate-100 | `#f1f5f9` | borders, dividers, disabled backgrounds |
| slate-200 | `#e2e8f0` | default card/input borders |
| slate-300 | `#cbd5e1` | — |
| slate-400 | `#94a3b8` | placeholder text, muted icons |
| slate-500 | `#64748b` | secondary/meta text |
| slate-600 | `#475569` | body text on cards, nav inactive text |
| slate-700 | `#334155` | strong secondary text |
| slate-800 | `#1e293b` | headings on white cards |
| slate-900 | `#0f172a` | primary text, page titles, dark section background (landing "Security" section, admin header) |

**Semantic status colors** (used consistently across badges, score rings, health indicators):
| Meaning | Color family | Hex (mid-tone used) |
|---|---|---|
| Success / Met / Approved / Strong | Emerald | `#059669` text, `#ecfdf5` bg (emerald-50), `#a7f3d0` ring |
| Warning / Partial / Needs Review / Medium confidence | Amber | `#d97706` text, `#fffbeb` bg (amber-50), `#fde68a` ring |
| Danger / Missing / Expired / High risk | Red | `#dc2626` text, `#fef2f2` bg (red-50), `#fecaca` ring |
| Info / AI-generated / Draft | Violet | `#7c3aed`-ish text, `#f5f3ff` bg (violet-50) |
| Neutral / Slate status | Slate | `#475569` text, `#f1f5f9` bg |

**Base surfaces:** page background = `slate-50` (#f8fafc). Cards = white (`#ffffff`) with `slate-200` border. Dark surfaces (landing security section, admin top bar, error illustrations) = `slate-900` (#0f172a) with `slate-300`/`slate-400` text and `emerald-400` accent for status dots.

### 2.2 Typography

**Font family:** Inter (Google Font), loaded as variable font. Fallback: system-ui, sans-serif. **No serif fonts anywhere.**

**Type scale actually used in the product** (Tailwind arbitrary + standard sizes):
| Role | Size / weight | Example |
|---|---|---|
| Landing hero H1 | 36–48px (`text-4xl`/`md:text-5xl`), font-semibold, tracking-tight, line-height 1.15 | "Upload your company documents once." |
| Page title (app) | 20px (`text-xl`), font-semibold, tracking-tight | "Welcome back, Demo" / "Document Library" |
| Section heading (landing) | 24px (`text-2xl`), font-semibold, tracking-tight | "Built for teams that bid to win" |
| Card title | 14px (`text-sm`), font-semibold | "Knowledge health" |
| Body text (cards, prose) | 13–15px, leading-6/7 | descriptions, wiki content |
| Meta / secondary text | 12px (`text-xs`), text-slate-500 | timestamps, hints, subtitles |
| Micro labels | 11px (`text-[11px]`), text-slate-400, sometimes uppercase tracking-wide | table headers, "PREPARED BY" cover-page labels, badge text |
| Buttons | 12–13px, font-semibold or font-medium | consistent across primary/secondary buttons |

**Weights used:** 400 (regular body), 500 (medium — nav labels, secondary buttons), 600 (semibold — headings, primary buttons, emphasis). **Never bold (700+) except rare emphasis inside markdown content.**

**Letter spacing:** default/normal for body; `tracking-tight` on all headings; `tracking-wide` + slight `letterSpacing` on tiny uppercase micro-labels and the PDF cover-page eyebrow text.

### 2.3 Spacing, radius, shadow

- **Border radius:** generous but not pill-everywhere. Cards/panels = `rounded-xl` (12px). Buttons/inputs/badges = `rounded-lg` (8px) or `rounded-full` for pill badges and score-ring container. Small icon chips = `rounded-lg` (8–10px square-ish with rounded corners), logo mark = `rounded-lg`/`rounded-xl`.
- **Shadow:** one soft shadow token used everywhere, called `shadow-card`: `0 1px 2px 0 rgb(16 24 40 / 0.06), 0 1px 3px 0 rgb(16 24 40 / 0.1)`. This is a **very subtle** shadow — barely-there elevation, not heavy drop shadows. Hover states on interactive cards add `hover:shadow-md` (slightly stronger) plus a border color shift to `brand-200`.
- **Card padding:** `px-5 py-4` typical for card headers/bodies; `px-6 py-5` for larger content cards (proposal section text, wiki content).
- **Page padding:** app shell content area padded `px-8 py-7` desktop / `px-4 pt-16 pb-8` mobile (top padding accounts for fixed mobile header), max content width `max-w-6xl` centered.
- **Grid gaps:** `gap-4` standard between cards in a grid; `gap-3` for tighter lists.
- **Border weight:** 1px hairline borders throughout (`border border-slate-200` or `border-slate-100` for subtler dividers). No heavy 2px+ borders except focus rings.

### 2.4 Interactive states

- **Focus ring:** `focus:border-brand-400 focus:ring-2 focus:ring-brand-100` — a soft light-blue glow, not a harsh outline.
- **Buttons — primary:** solid `brand-600` background, white text, `hover:bg-brand-700`, `rounded-lg`, `disabled:opacity-50/60`.
- **Buttons — secondary:** white background, `border-slate-200`, `text-slate-600`, `hover:bg-slate-50`.
- **Buttons — destructive:** white background, `border-red-200`, `text-red-600`, `hover:bg-red-50`.
- **Toggle switches:** pill track, `bg-brand-600` when on / `bg-slate-200` when off, white circular thumb sliding via `left` position transition.
- **Links:** `text-brand-600` with `hover:underline`.

---

## 3. Layout architecture

### 3.1 Marketing / landing page (`/`, logged-out)

Full-width, white background, centered `max-w-6xl` content container. Structure top to bottom:

1. **Sticky translucent header** (`backdrop-blur`, white/80% opacity, bottom hairline border): logo mark (rounded-lg brand-600 square with Vault icon, white) + wordmark "AtlasVault AI" on the left; center nav links (How it works, Features, Security, Pricing) hidden below `md`; right-aligned "Sign in" (ghost) + "Start free" (solid brand button).
2. **Hero section**, centered text, generous vertical padding (`pt-20 pb-20`):
   - Small pill badge above headline: light brand-50 background, brand-700 text, sparkle icon, "The AI proposal & tender operating system"
   - H1 (max-w-3xl, centered): "Upload your company documents once. **Win contracts with them forever.**" (second sentence in brand-600 color)
   - Subhead paragraph, slate-500, max-w-2xl
   - Two CTA buttons side by side: solid brand "Create your workspace →" + outline "Try the live demo"
   - Small trust microcopy line below buttons
   - **4-column proof strip** below (2 cols on mobile): small stat cards with slate-50 background, rounded-xl, each showing a bold short claim + small caption (e.g. "Days → minutes" / "First proposal draft")
3. **"How it works" section** (slate-50 background band, full width): centered heading + subtext, then a **4-column card grid** (1 col mobile), each card = white, rounded-xl, shadow-card, icon chip (brand-50 bg, brand-600 icon) top-left, numbered step title, short body text.
4. **"Features" section** (white background): centered heading, **3-column grid** of 6 feature cards (icon chip + title + 2-sentence body), cards have transparent border by default, hover reveals brand-200 border + shadow.
5. **"Security" section**: full-bleed **dark slate-900 band**, white text. Two-column layout: left = heading + paragraph + checklist (emerald checkmark icons, 8 trust statements); right = a bordered dark card (slate-800/60 bg, slate-700 border) with an italic pull-quote styled as "the AtlasVault rule."
6. **"Pricing" section** (white): centered heading + subtext, **4-column pricing card grid**: Starter / Team (featured, highlighted with brand-600 border + ring + "Most popular" eyebrow) / Business / Enterprise. Each card: plan name, large price + "/month" suffix, short description, checkmark feature list, full-width CTA button at bottom.
7. **Final CTA band**: full-bleed solid `brand-600` background, white centered text, white CTA button with brand-700 text.
8. **Footer**: white, hairline top border, small logo + tagline left, small nav links right.

### 3.2 Authenticated app shell (all `/dashboard`, `/documents`, etc.)

**Desktop (≥1024px):** Fixed left sidebar, 240px wide (`w-60`), white background, right hairline border, full height, non-scrolling except its nav list. Main content area has `margin-left: 240px`, `slate-50` background, padded, `max-w-6xl` centered content inside.

**Sidebar contents top to bottom:**
- Logo lockup (same mark as landing) + workspace name below product name, small
- Vertical nav list, each item: icon (16px, lucide-react) + label, `rounded-lg`, `px-2.5 py-2`, active state = `brand-50` background + `brand-700` text + `brand-600` icon; inactive = `slate-600` text + `slate-400` icon, hover = `slate-50` bg
- Nav order: Dashboard, Documents, Knowledge Base, Ask AI, Opportunities, Proposals, Output Studio, Evidence Library, Analytics, Health Check, Settings
- Below main nav, separated visually: optional dashed-border "Platform Admin" link (only visible to platform admins)
- Bottom-pinned footer block (hairline top border): user name + role label, small circular avatar-less initial, sign-out icon button on the right

**Mobile (<1024px):** Sidebar hidden. Fixed top bar instead: 44px height, white/90% blur, hairline bottom border, small logo left, hamburger/X toggle button right. Tapping opens a **left drawer** (slides in, dark scrim behind, same nav content as desktop sidebar, closes on link tap or scrim tap). Main content gets top padding to clear the fixed bar, no left margin.

### 3.3 Common page pattern (used by nearly every app page)

```
PageHeader
  ├─ Title (text-xl font-semibold)
  ├─ Subtitle (text-sm text-slate-500, max-w-2xl)
  └─ Action (right-aligned button/controls, wraps below on mobile)

[optional filter/tab pills row]

Content — one of:
  - Stat grid (2 col mobile / 4 col desktop) of metric cards
  - Card grid (1–3 columns) of entity cards
  - Single Card wrapping a data table
  - Two/three-column grid: primary content (2/3 width) + sidebar cards (1/3 width)
```

**Card component (the core visual unit everywhere):** white background, `border border-slate-200`, `rounded-xl`, `shadow-card`. Optional **CardHeader** subcomponent: hairline bottom border, `px-5 py-4`, left = title (13px semibold) + optional subtitle (12px slate-500), right = optional action (button/link).

**Badge component:** small pill, `rounded-full`, `px-2 py-0.5`, `text-[11px] font-medium`, colored per semantic tone table above, always with a matching 1px ring in a slightly darker shade of the same hue (`ring-1 ring-inset`).

**Stat card:** same Card styling, label in small uppercase-tracked slate-400 text at top, big number below (`text-2xl font-semibold`, color shifts to emerald/amber/red for tone variants), optional hint line in slate-500 beneath.

**Score ring (circular progress):** SVG donut, background track = slate-200, progress arc color = emerald (≥80), amber (60–79), or red (<60), center shows the number in bold. Used for Knowledge Health and Tender Readiness scores.

---

## 4. Component inventory (design these as a reusable kit)

1. **Logo mark** — rounded-square, brand-600 fill, white vault/shield icon, ~32px in header, ~36px on auth pages
2. **Primary button** — solid brand-600, white text, icon+label, rounded-lg, subtle hover darken
3. **Secondary button** — white/bordered, slate text
4. **Destructive button** — white/red-bordered
5. **Icon-only button** — ghost, rounded-lg, slate-400 icon, hover bg slate-50
6. **Text input / textarea** — white bg, slate-200 border, rounded-lg, focus glow, small label above in slate-600
7. **Select dropdown** — same input styling, compact
8. **Toggle switch** — pill track/thumb as described above
9. **Badge / status pill** — see semantic colors
10. **Confidence badge** — same badge component, specifically labeled "Confidence: High/Medium/Low"
11. **Card** (+ CardHeader variant)
12. **Stat card**
13. **Score ring**
14. **Empty state block** — dashed border container, centered icon (slate-300, 32px), bold short title, muted body text, optional CTA button
15. **Data table** — hairline row dividers (`slate-50`), header row in `slate-400` text-xs, hover row tint `slate-50/60`, first column often clickable link with icon
16. **Progress bar (health breakdown)** — thin rounded track, colored fill by score
17. **Chat bubble pair** — user message = solid brand-600 pill-rounded bubble aligned right; AI response = white bordered card aligned left with rounded-bl-md corner, contains rendered markdown, source citation chips below, confidence badge + action icons (copy/thumbs-up/thumbs-down) in a footer row
18. **Citation/source chip** — small rounded-lg row, file icon + doc title + truncated snippet quote, clickable, subtle slate-50 background
19. **Upload dropzone** — large dashed-border rounded-xl zone, upload-cloud icon, "Drop files here or click to browse" primary text + format hint subtext, drag-over state highlights border/background in brand tones, busy state shows spinner + "Processing filename…"
20. **Modal / slide-over editor** — centered overlay with dark scrim, white rounded-xl panel, header with title + close X, scrollable body (often a monospace textarea for markdown editing), footer action buttons right-aligned
21. **Toast/inline error text** — small red text beneath the triggering control, no intrusive popups for expected validation errors
22. **Skeleton loader** — pulsing slate-200/slate-100 blocks mimicking the page's card grid, used on route transitions
23. **Onboarding checklist card** — list of steps each with a small circular checkmark badge (emerald when done, slate when pending) and a strikethrough label when complete, clickable to jump to the relevant page

---

## 5. Full page-by-page specification

### 5.1 Login (`/login`)
Centered single narrow card (max-w-sm) on slate-50 background. Above the card: logo mark + "Sign in to AtlasVault" heading + "Your company knowledge, compiled." subtext, all centered. Card (white, bordered, shadow-card, p-6): email field, password field, inline error text if any, full-width primary submit button "Sign in", small centered link "New company? Create a workspace". Below the card: muted helper text showing the demo credentials.

### 5.2 Signup (`/signup`)
Same centered-card layout, slightly wider (max-w-md). Heading: "Create your company workspace" / "Upload your documents once. Use them to win every opportunity." Form fields in a 2-column grid on desktop: Company name (full width), Industry (select) + Country (side by side), Your name (full width), Work email (full width), Password (full width, min-length hint). Primary submit "Create workspace", link to sign in below.

### 5.3 Dashboard (`/dashboard`)
Greeting title "Welcome back, {FirstName}" + subtitle.
- **Onboarding checklist card** (only shown until complete): title shows "Getting started — N/6 complete", 2–3 column grid of checklist rows.
- **4-column stat grid:** Documents / Knowledge pages / Active opportunities / Proposals.
- **3-column card row:** Knowledge health (score ring + top 3 critical issues list), Upcoming deadlines (list of opportunities with due date + readiness badge), Certificate & document expiry (list with expiry countdown badges colored by urgency).
- **3-column card row:** Recent documents (icon list with status badge), Open tasks (target-icon list), Team activity (audit log feed with actor + relative time).
- **Bottom CTA banner:** light brand-tinted rounded box, bold headline + description of the core workflow loop, primary button "Analyze a new tender →" on the right.

### 5.4 Documents Library (`/documents`)
Header + subtitle explaining the extract/summarize/classify pipeline.
- **Upload dropzone** directly below header (only for roles that can upload).
- **Horizontal filter pill row:** "All (N)" + one pill per document category with count, active pill filled brand-600, inactive pills white/bordered.
- **Single wide Card wrapping a table:** columns = Document (icon + title, lock icon if confidential), Category (badge), Status (status badge), Expiry (date, red if overdue), Size, Uploaded (date). Empty state message spans full width if no documents.

### 5.5 Document detail (`/documents/[id]`)
Header = document title + filename subtitle, action buttons top-right (Mark reviewed / Mark confidential / Delete — role-gated).
Two-column layout (2/3 + 1/3):
- Left: "AI summary" card (plain paragraph), "Extracted content" card (scrollable list of numbered chunk snippets in monospace-ish muted boxes).
- Right: "Metadata" definition-list card (status, category, confidential flag, dates, size, uploader, language), "Used as evidence in" card (badge counts linking to wiki/proposal/requirement citations), optional "Evidence library entries" card.

### 5.6 Knowledge Base index (`/wiki`)
Header + subtitle + "Compile knowledge base" primary button (sparkle icon) top-right.
Empty state (large centered dashed card) if no pages yet.
Otherwise: **2-column card grid**, each card = icon chip (type-specific icon: building/wrench/folder/users/shield) + page title + "Updated Xd ago · N citations" meta, 3-line content preview text below, footer row with Status badge + Confidence badge.

### 5.7 Wiki page detail (`/wiki/[slug]`)
Header = page title + "Last updated" subtitle, action buttons top-right (Edit / Approve, role-gated).
Status + Confidence badges row.
Two-column (2/3 + 1/3): left = large Card with rendered markdown content (headings, bullets, tables — clean prose typography); right = "Generated from these sources" card (clickable document list with quoted snippets) + a small trust-note card explaining AI-generated vs approved status.
Edit mode = full-screen modal overlay with monospace textarea.

### 5.8 Ask AI (`/ask`)
Centered narrow column (max-w-3xl), chat-app layout.
- If no conversation yet: 2-column grid of suggested-question buttons (bordered white cards).
- Chat thread: alternating right-aligned user bubbles (solid brand-600) and left-aligned AI response cards (white bordered) containing: optional amber "not enough evidence" warning banner, rendered markdown answer, footer row (confidence badge, source count, copy icon button, thumbs-up/down icons), list of source citation chips, occasional green "saved to workspace memory" confirmation strip after positive feedback.
- **Sticky input bar** pinned near bottom of viewport: rounded-xl white bar with shadow-lg, text input + circular send button (brand-600, spinner when busy).

### 5.9 Opportunities list (`/opportunities`)
Header/subtitle explaining tender analysis. Upload dropzone (tender/RFP specific copy) below header.
Vertical stacked list of opportunity cards (not grid): each row card shows title + client/requirement-count/value meta on the left, and on the right a cluster of badges — deadline badge (color by urgency), readiness % badge (color by score), status badge.

### 5.10 Opportunity detail (`/opportunities/[id]`)
Header = opportunity title + client/value/deadline subtitle. Action row top-right: status dropdown select (New/In progress/Ready/Submitted/Won 🎉/Lost/Archived), "Re-analyze" secondary button, "Generate proposal" primary button.
Status + source-brief link row.
3-column top section: left card = readiness score ring + met/partial/missing counts + red "disqualification risk" alert box if mandatory items missing; right 2/3 card = opportunity summary text + linked proposals list.
Below: "Missing document checklist" card (bulleted list, red/amber dot per severity).
Below: "Compliance matrix" — full-width Card wrapping a table: Requirement text (+ note), Category badge, Mandatory yes/no, Status badge, Evidence (linked doc title), Risk badge.

### 5.11 Proposals list (`/proposals`)
Empty state or vertical card list: title + client/section-count/author/relative-time meta left, status badge right.

### 5.12 Proposal builder (`/proposals/[id]`)
Header = proposal title + client/deadline subtitle. Toolbar top-right: Request approval / Approve / Reject buttons (state-dependent), Export buttons (Branded PDF primary, DOCX secondary, Markdown tertiary — all disabled/greyed with tooltip until approved).
Status badge + link to opportunity/compliance matrix.
Amber "human review required" banner if not yet approved.
**Stacked list of section cards** (this is the core editor), each:
- Header row: section title, status badge, confidence badge, right-aligned small icon-button toolbar (source count toggle, Edit, Regenerate, Approve)
- Optional amber "missing evidence" callout strip
- Rendered markdown body (or a monospace edit textarea in edit mode)
- Collapsible "Evidence behind this section" panel (slate-tinted) listing clickable source chips
Bottom: "Review comments" card, simple threaded list (author + relative time + text).

### 5.13 Output Studio (`/outputs`)
Header/subtitle. "Templates" subheading + **3-column grid of 5 template cards**: icon chip, template name + audience tag, description, full-width "Generate {Template}" primary button (sparkle icon, shows spinner + "Compiling…" while busy).
"Generated outputs" subheading below: vertical list of generated-output cards (icon + title + relative time, confidence + status badges right).

### 5.14 Output detail (`/outputs/[id]`)
Same layout family as wiki detail: header + action toolbar (Edit, Approve, Branded PDF, DOCX), status/confidence badges, 2-column content (markdown card + sources sidebar card + review-before-use trust note card).

### 5.15 Evidence Library (`/evidence`)
Header/subtitle. Empty state or **2-column grid of evidence cards**: title (+ lock icon if confidential) and type/expiry meta on top, strength status badge top-right, notes paragraph, footer row with "Approved for external use" / "Internal only" badge + link to source document + (role-gated) inline strength-select dropdown and approve-for-external toggle button.

### 5.16 Analytics (`/analytics`)
Header/subtitle. **4-column stat grid:** Est. hours saved (green tone), Proposals generated, Documents processed, Win rate (green if ≥50%).
2-column card row: "Team activity" (8-week vertical bar chart, thin bars, brand-500/80 fill, week labels below), "Most reused evidence" (ranked list with citation-count badges).
2-column card row: "AI feedback & learning" (big up/down counters + explanatory text), "Pipeline" (4-cell mini-stat grid: Active/Submitted/Won/Lost, colored numbers).

### 5.17 Health Check (`/health`)
Header/subtitle. Top row: score-ring card (large ring + interpretive sentence) + "Score breakdown" card (5 labeled progress bars: Document freshness, Knowledge coverage, Wiki quality, Evidence strength, Proposal readiness).
Below: one Card per issue category, each with a badge count and a list of issue rows (severity icon — red octagon/amber triangle/grey info — + message text + "Fix →" link).

### 5.18 Settings (`/settings`)
Header/subtitle. 2-column card row: "Workspace" (definition list: company, workspace, industry, country, created date), "AI engine" (connection status badge, model name, explanatory paragraph, usage-count badge row).
2-column card row: "Brand kit" (color swatch picker row of 8 preset swatches + custom color input + hex readout, brand-voice textarea, Save button) and "AI, learning & privacy" (list of toggle-switch rows: Workspace learning, Approval before export, Sensitive-data warnings, Public web research — each with a label + description).
Full-width "Integrations" card: grouped by category (Storage/Communication/Productivity/CRM/Finance/Documents/Developer/Research), each connector = small row with icon + name (+"Pre-approved" pill if enabled) + scope description + Pre-approve/Revoke button.
Full-width "Team & roles" card: member rows (name/email + role select or badge, Remove link) + an inline invite form (name/email/role fields + Invite button) at the bottom for admins.
Full-width "Audit log" card: scrollable table (action badge, detail text, actor, timestamp).

### 5.19 Platform Admin — Overview (`/admin`)
Distinct **dark header bar** (slate-900) across the top: shield icon + "AtlasVault Platform Admin" + small explanatory subtext, top nav (Overview/Errors/Organizations), "Back to app" button on the right.
Below (light content area): heading + explanatory paragraph.
4-column stat grid: Organizations, Documents processed, AI generations, Errors (24h) — tone-colored by severity.
2-column card row: "System status" definition list (AI engine badge, database status badge, exports count, usage-by-kind rows), "Latest errors" list (severity badge + monospace ref code + relative time + sanitized message + route/category).

### 5.20 Platform Admin — Errors (`/admin/errors`)
Heading/subtitle explaining sanitization. Badge row of category counts. Full-width table: Reference (mono), Severity badge, Category, sanitized Message, Route, When.

### 5.21 Platform Admin — Organizations (`/admin/organizations`)
Heading/subtitle emphasizing privacy-safe metadata only. Full-width table: Organization name, Industry/country, masked owner email (mono, e.g. "de***@trustcode.ng"), Members badge, Documents count, Proposals count, Created date.

### 5.22 Error / empty states
- **404 page:** centered, logo mark, "404" eyebrow in brand-600, "This page doesn't exist" heading, muted explanation, two buttons (Go to dashboard / Home).
- **500 / runtime error page:** centered, logo mark, "Something didn't go as planned" heading, reference-ID message (monospace ID), Try again + Back to dashboard buttons, small reassurance line about data safety.
- **Empty states throughout:** dashed-border card, centered muted icon, bold short title, one-sentence muted body, optional CTA button — never a bare "No data" text.

---

## 6. Iconography

Icon set: **Lucide** (outline style, 1.5–2px stroke, no fill). Consistent sizing: 13–14px inline in badges/buttons, 16–17px in nav/card headers, 18–24px for feature/section icon chips, 32px for empty-state/error illustrations. Icons are always paired with an icon-chip background (rounded-lg, `brand-50` bg, `brand-600` icon color) when used as a decorative header element, and bare/muted (`slate-400`) when used inline as a functional affordance (e.g. table row icons, nav icons when inactive).

Representative icon vocabulary already in use: Vault (logo), LayoutDashboard, FileText, BookOpen, MessageSquareText, Target, FileSignature, FileOutput, ShieldCheck, BarChart3, HeartPulse, Settings, Shield, Sparkles, UploadCloud, Loader2 (spinner), Send, Copy, Check, ThumbsUp/ThumbsDown, AlertTriangle/AlertOctagon, CheckCircle2, XCircle, PencilLine, RefreshCcw, Download, Lock/LockOpen, Trash2, Building2, Wrench, FolderKanban, Users, Award, Briefcase, BookMarked, Palette, ClipboardCheck, Eye, Layers, ArrowRight, Menu/X.

---

## 7. Motion & interaction principles

- Transitions are **fast and subtle** — 150–200ms color/border/shadow transitions on hover, no elaborate page-transition animation.
- No skeleton "shimmer" sweep — pulsing opacity only (Tailwind `animate-pulse`).
- Buttons show a spinner **inside the button in place of the icon** the moment they're clicked — never a separate loading overlay for simple actions.
- Score rings and progress bars can have a short (300–500ms) fill animation on mount, subtle easing.
- Modals/slide-overs fade+scale in over ~150ms with a dark scrim (`bg-slate-900/40`) behind.
- Hover on clickable cards: border color shifts from `slate-200` to `brand-200` and shadow deepens slightly — no scale/transform tricks.

---

## 8. Responsive rules

- **Breakpoint:** single primary breakpoint at `lg` (1024px) switches sidebar between fixed-desktop and drawer-mobile.
- Stat grids: 4 columns desktop → 2 columns mobile (never 1, keep it dense).
- Card grids: 2–3 columns desktop → 1 column mobile.
- Two-column detail layouts (content + sidebar): stack sidebar below content on mobile.
- Tables: horizontal scroll container on mobile rather than card-ification (acceptable for this admin-density product).
- Page header action buttons wrap onto a new line below the title on narrow viewports rather than compressing.
- Landing page nav links collapse (hidden) below `md`, leaving just Sign in / Start free.

---

## 9. Tone of voice for UI copy (for the design tool to reproduce placeholder copy accurately)

Calm, precise, confident, never hypey. Prefers concrete claims over adjectives ("38% reduction in patient waiting time" not "amazing results"). Error messages are apologetic but brief and always offer a next step or reference ID. Empty states explain *why* something is empty and what to do next, never just "No data." Trust and evidence language recurs constantly: "cited," "evidence-backed," "not enough evidence," "needs review," "generated from your documents."

---

*This document reflects the actual production UI of AtlasVault AI as of July 2026 — use it as ground truth, not inspiration.*
