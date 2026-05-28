# ARIA — Autonomous Incident Response Intelligence Agent

> TechEx × lablab.ai Hackathon | Track 2: AI Agents with Google AI Studio  
> 5-agent pipeline that resolves enterprise incidents in under 35 seconds.

---

## What ARIA does

Enterprises receive thousands of alerts daily. Most tools report problems. **ARIA resolves them.**

When an enterprise incident fires — a database spike, a security anomaly, a compliance violation — ARIA's 5-agent AI pipeline activates automatically, reasoning through root causes and generating concrete response plans with full chain-of-thought transparency.

```
Monitor (Gemini Flash)     → real-time classification in ~1s
Triage (Gemini Pro)        → blast radius + urgency assessment
Investigate (Claude Sonnet) → deep root-cause analysis with visible reasoning
Respond (Claude Sonnet)    → concrete action plan + runbook
Audit (Supabase)           → immutable compliance record
```

**Every decision is visible. Every agent shows its reasoning. Every action is logged.**

---

## Demo

Click **FIRE DEMO** in the top-right corner. Choose a scenario:
- **DB Spike** — PostgreSQL connection pool exhausted (CRITICAL)
- **Auth Attack** — Credential stuffing via TOR exit node (HIGH)
- **PII Leak** — GDPR-regulated data in public S3 bucket (HIGH)

Watch all 5 agents activate in real-time. The chain-of-thought panel shows Claude's step-by-step reasoning. Actions appear as the Respond agent completes.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| UI | React + Tailwind CSS (dark enterprise theme) |
| Database | Supabase (Postgres + Realtime) |
| Fast AI | Gemini 2.0 Flash — Monitor agent |
| Reasoning AI | Gemini 1.5 Pro — Triage agent |
| Deep AI | Claude Sonnet 4.6 — Investigate + Respond agents |
| Real-time | Server-Sent Events (SSE) |

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd aria-incident-response
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Get your keys from Settings → API

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIzaSy...
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **FIRE DEMO**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  ARIA  •  Autonomous Incident Response     [FIRE DEMO ▶] │
├──────────────┬──────────────────────┬───────────────────┤
│ INCIDENTS    │   AGENT PIPELINE     │  CHAIN OF THOUGHT │
│              │                      │                   │
│ ● CRITICAL   │ ① Monitor  ✓ 1.2s   │  [Agent name]     │
│ DB Spike     │ ② Triage   ✓ 2.8s   │  Step 1: ...      │
│ 2m ago       │ ③ Investigate ⟳     │  Step 2: ...      │
│              │ ④ Respond  idle      │  Step 3: ...      │
│ ▲ HIGH       │ ⑤ Audit    idle      │                   │
│ Auth Attack  │                      │  ACTIONS:         │
│ 8m ago       │ ACTIONS GENERATED:   │  → Create P1 ticket│
│              │ → Create ticket P1   │  → Page on-call   │
│              │ → Page on-call SRE   │                   │
│              │                      │  AUDIT TRAIL      │
└──────────────┴──────────────────────┴───────────────────┘
```

### Agent Pipeline (sequential, real-time SSE)

```
POST /api/incidents → creates incident in Supabase
     ↓
GET /api/stream?incident_id=X → SSE stream
     ↓
[Monitor] → Gemini 2.0 Flash → classify + severity
     ↓
[Triage]  → Gemini 1.5 Pro   → blast radius + urgency
     ↓
[Investigate] → Claude Sonnet → root cause + chain-of-thought
     ↓
[Respond]     → Claude Sonnet → action plan + runbook
     ↓
[Audit]       → Supabase      → immutable audit log
```

---

## Project Structure

```
aria-incident-response/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Dashboard
│   └── api/
│       ├── incidents/route.ts  # POST: ingest incident
│       ├── agents/run/route.ts # POST: trigger pipeline
│       ├── stream/route.ts     # GET: SSE stream
│       ├── audit/route.ts      # GET: audit log
│       └── seed/route.ts       # POST: demo seeder
├── components/
│   ├── DemoTrigger.tsx         # Scenario selector + fire button
│   ├── IncidentFeed.tsx        # Live incident list (Supabase Realtime)
│   ├── AgentFlow.tsx           # 5-agent pipeline visualization
│   ├── ChainOfThought.tsx      # Reasoning display + actions
│   └── AuditTrail.tsx          # Immutable audit log
├── lib/
│   ├── orchestrator.ts         # Pipeline runner
│   ├── gemini.ts               # Gemini Flash + Pro clients
│   ├── claude.ts               # Anthropic client
│   ├── agents/
│   │   ├── monitor.ts          # Agent 1: Gemini Flash
│   │   ├── triage.ts           # Agent 2: Gemini Pro
│   │   ├── investigate.ts      # Agent 3: Claude Sonnet
│   │   ├── respond.ts          # Agent 4: Claude Sonnet
│   │   └── audit.ts            # Agent 5: Supabase write
│   └── supabase/
│       ├── client.ts           # Browser Supabase client
│       └── server.ts           # Server Supabase client
├── types/aria.ts               # TypeScript interfaces
└── supabase/schema.sql         # Database schema (run once)
```

---

## Why ARIA wins

| Criterion | ARIA's answer |
|-----------|--------------|
| **Application of Technology** | 3 distinct AI models (Gemini Flash, Gemini Pro, Claude) each doing a job tailored to their strengths |
| **Business Value** | Real enterprise incident types, real metrics, real GDPR/CCPA data — a CISO at PayPal would use this |
| **Presentation** | 30-second demo: click → watch all 5 agents fire → see the reasoning → read the action plan |
| **Originality** | No other submission does live incident resolution with visible chain-of-thought reasoning |

---

## License

MIT
