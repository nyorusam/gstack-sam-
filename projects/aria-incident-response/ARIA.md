# ARIA — Autonomous Incident Response Intelligence Agent
## TechEx × lablab.ai Hackathon | Track 2: AI Agents with Google AI Studio

> Deadline: May 19, 2026 at 3:00 AM EAT  
> Demo: May 19, 2026 live on stage  
> Prize pool: $10,000

---

## What ARIA does

Enterprises receive alerts constantly. Most tools *report* problems. ARIA *resolves* them.

When an enterprise incident fires — a database spike, a security anomaly, an API failure, a compliance violation — ARIA's 5-agent pipeline activates automatically:

1. **Monitor Agent** (Gemini Flash): real-time alert classification + severity scoring
2. **Triage Agent** (Gemini Pro): affected systems, blast radius, urgency ranking
3. **Investigate Agent** (Claude Sonnet): deep root-cause analysis with full chain-of-thought
4. **Respond Agent** (Claude Sonnet): action plan — tickets, notifications, runbook selection
5. **Audit Agent** (internal): immutable audit record to Supabase

Every decision is visible. Every agent shows its reasoning. Every action is logged.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Styling | Tailwind CSS (dark theme) |
| Database | Supabase (Postgres + Realtime) |
| Fast AI | Gemini 2.0 Flash (Monitor + stream responses) |
| Reasoning AI | Gemini 2.0 Pro (Triage) |
| Deep AI | Claude claude-sonnet-4-6 (Investigate + Respond) |
| Real-time UI | Server-Sent Events (SSE) |
| Deployment | Vercel (for demo URL) |

---

## File structure

```
aria-incident-response/
├── app/
│   ├── layout.tsx                    # Root layout, dark theme
│   ├── page.tsx                      # Main dashboard
│   ├── globals.css                   # Tailwind base
│   └── api/
│       ├── incidents/
│       │   └── route.ts              # POST: ingest new incident
│       ├── agents/
│       │   └── run/
│       │       └── route.ts          # POST: trigger agent pipeline
│       ├── stream/
│       │   └── route.ts              # GET: SSE stream for agent updates
│       └── audit/
│           └── route.ts              # GET: fetch audit log
├── components/
│   ├── Dashboard.tsx                 # Top-level layout
│   ├── IncidentFeed.tsx              # Live incident list with severity badges
│   ├── AgentFlow.tsx                 # 5-agent pipeline visualization
│   ├── ChainOfThought.tsx            # Per-agent reasoning panel
│   ├── AuditTrail.tsx                # Immutable log table
│   └── DemoTrigger.tsx               # "Fire Incident" button for demo
├── lib/
│   ├── orchestrator.ts               # Runs all 5 agents in sequence
│   ├── agents/
│   │   ├── monitor.ts                # Gemini Flash agent
│   │   ├── triage.ts                 # Gemini Pro agent
│   │   ├── investigate.ts            # Claude agent
│   │   ├── respond.ts                # Claude agent
│   │   └── audit.ts                  # Supabase write
│   ├── gemini.ts                     # Gemini client (Flash + Pro)
│   ├── claude.ts                     # Anthropic client
│   └── supabase/
│       ├── client.ts                 # Browser client
│       └── server.ts                 # Server client
├── types/
│   └── aria.ts                       # All TypeScript types
├── supabase/
│   └── schema.sql                    # Full DB schema
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.local                        # (already exists)
```

---

## Database schema (Supabase)

```sql
-- incidents: incoming alerts
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,          -- 'database' | 'security' | 'api' | 'compliance' | 'service'
  severity TEXT NOT NULL,      -- 'critical' | 'high' | 'medium' | 'low'
  source TEXT NOT NULL,        -- system name e.g. 'PostgreSQL prod-db-01'
  title TEXT NOT NULL,
  raw_data JSONB NOT NULL,     -- full alert payload
  status TEXT DEFAULT 'open',  -- 'open' | 'triaged' | 'investigating' | 'resolved'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- agent_runs: each agent's execution record
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,    -- 'monitor' | 'triage' | 'investigate' | 'respond' | 'audit'
  model TEXT NOT NULL,         -- 'gemini-2.0-flash' | 'gemini-2.0-pro' | 'claude-sonnet-4-6'
  status TEXT DEFAULT 'running', -- 'running' | 'done' | 'error'
  input JSONB NOT NULL,
  output JSONB,
  chain_of_thought TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- actions: what ARIA decided to do
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,   -- 'ticket' | 'notification' | 'runbook' | 'escalation'
  priority TEXT NOT NULL,      -- 'immediate' | 'urgent' | 'normal'
  assignee TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- audit_log: immutable record (append-only)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  actor TEXT NOT NULL,         -- which agent or 'system'
  details JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime on incidents and agent_runs
ALTER TABLE incidents REPLICA IDENTITY FULL;
ALTER TABLE agent_runs REPLICA IDENTITY FULL;
```

---

## TypeScript types (types/aria.ts)

```typescript
export type IncidentType = 'database' | 'security' | 'api' | 'compliance' | 'service';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'triaged' | 'investigating' | 'resolved';
export type AgentName = 'monitor' | 'triage' | 'investigate' | 'respond' | 'audit';
export type AgentStatus = 'idle' | 'running' | 'done' | 'error';

export interface Incident {
  id: string;
  type: IncidentType;
  severity: Severity;
  source: string;
  title: string;
  raw_data: Record<string, unknown>;
  status: IncidentStatus;
  created_at: string;
  resolved_at?: string;
}

export interface AgentRun {
  id: string;
  incident_id: string;
  agent_name: AgentName;
  model: string;
  status: AgentStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  chain_of_thought?: string;
  duration_ms?: number;
  created_at: string;
}

export interface Action {
  id: string;
  incident_id: string;
  action_type: 'ticket' | 'notification' | 'runbook' | 'escalation';
  priority: 'immediate' | 'urgent' | 'normal';
  assignee?: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export interface AgentStreamEvent {
  agent: AgentName;
  status: AgentStatus;
  model: string;
  thought?: string;
  output?: Record<string, unknown>;
  duration_ms?: number;
}
```

---

## Agent responsibilities

### Monitor Agent — Gemini Flash
**Input:** raw alert payload  
**Job:** classify the incident type, assign initial severity, extract key signals  
**Output:** `{ type, severity, signals: string[], summary: string }`  
**Speed:** must respond in < 2 seconds — this is the real-time gate

### Triage Agent — Gemini Pro
**Input:** incident + monitor output  
**Job:** assess blast radius, affected systems, urgency. Multi-step reasoning.  
**Output:** `{ affected_systems: string[], blast_radius: 'contained'|'spreading'|'wide', urgency_score: 1-10, escalate_to_human: boolean }`

### Investigate Agent — Claude Sonnet
**Input:** incident + triage output  
**Job:** deep root-cause analysis. Show full chain-of-thought. This is ARIA's differentiator.  
**Output:** `{ root_cause: string, contributing_factors: string[], confidence: number, evidence: string[] }`  
**Prompt style:** Force explicit reasoning: "Think step by step. Show your work. State what evidence supports each conclusion."

### Respond Agent — Claude Sonnet  
**Input:** full context (incident + monitor + triage + investigate)  
**Job:** generate action plan  
**Output:** `{ actions: Action[], runbook: string, estimated_resolution_time: string, severity_final: Severity }`

### Audit Agent — internal
**Input:** full pipeline result  
**Job:** write immutable record to Supabase audit_log. No AI needed — pure DB write.  
**Output:** confirmation of audit record ID

---

## Demo scenarios (build all 3 — judges pick)

### Scenario A: Database Connection Spike — CRITICAL
```json
{
  "type": "database",
  "source": "PostgreSQL prod-db-01 (us-east-1)",
  "title": "Connection pool exhausted — 500 active connections",
  "raw_data": {
    "metric": "pg_connections",
    "current_value": 500,
    "threshold": 400,
    "duration_seconds": 180,
    "affected_queries": ["user_auth", "order_processing", "inventory_sync"],
    "error_rate_pct": 23.4,
    "p99_latency_ms": 8420
  }
}
```

### Scenario B: Unauthorized API Access — SECURITY
```json
{
  "type": "security",
  "source": "API Gateway (prod)",
  "title": "Repeated 401s from unknown IP — potential credential stuffing",
  "raw_data": {
    "source_ip": "185.220.101.47",
    "attempts": 847,
    "window_minutes": 5,
    "targeted_endpoints": ["/api/auth/login", "/api/users/me"],
    "geo": "TOR exit node",
    "user_agents": ["python-requests/2.28", "curl/7.81"],
    "success_rate_pct": 0.2
  }
}
```

### Scenario C: Compliance Data Leak Risk — COMPLIANCE
```json
{
  "type": "compliance",
  "source": "DLP Scanner (prod)",
  "title": "PII detected in unencrypted S3 bucket — GDPR exposure",
  "raw_data": {
    "bucket": "prod-analytics-exports",
    "files_flagged": 14,
    "record_types": ["email", "phone", "ssn_partial"],
    "estimated_records": 48000,
    "public_access": true,
    "regulations": ["GDPR", "CCPA"],
    "first_detected": "2026-05-18T06:23:11Z"
  }
}
```

---

## UI design (dark enterprise theme)

- Background: `#0a0a0f` (near black)
- Surface: `#111118` cards
- Accent: `#6366f1` (indigo) for active agents
- Success: `#22c55e` (green) for resolved
- Warning: `#f59e0b` (amber) for high
- Critical: `#ef4444` (red) for critical
- Font: system-ui, monospace for code/logs

**Dashboard layout (3 columns):**
```
┌─────────────────────────────────────────────────────────┐
│  ARIA  •  Autonomous Incident Response     [FIRE DEMO ▶] │
├──────────────┬──────────────────────┬───────────────────┤
│ INCIDENTS    │   AGENT PIPELINE     │  CHAIN OF THOUGHT │
│              │                      │                   │
│ ● CRITICAL   │ ① Monitor  ✓ 1.2s   │  [Agent name]     │
│ DB Spike     │ ② Triage   ⟳ 2.1s   │  Reasoning text   │
│ 2m ago       │ ③ Investigate  ...   │  streams here...  │
│              │ ④ Respond  idle      │                   │
│ ▲ HIGH       │ ⑤ Audit    idle      │                   │
│ API anomaly  │                      │                   │
│ 8m ago       │ ACTIONS GENERATED:   │  AUDIT TRAIL      │
│              │ → Create ticket P1   │  [timestamp] [actor]│
│              │ → Page on-call SRE   │  [event]          │
│              │ → Apply rate limit   │                   │
└──────────────┴──────────────────────┴───────────────────┘
```

---

## Environment variables needed

```env
# Already in .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://zghdvjwzdvqhgltrirrm.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Add these:
ANTHROPIC_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIzaSy...
SUPABASE_SERVICE_ROLE_KEY=  # needed for server-side writes
```

---

## Garry's rules for this build

1. **Demo path is sacred.** Every hour spent on a non-demo feature is a bad hour.
2. **Complete lake.** All 5 agents must be real — no stubs. Judges notice.
3. **Chain-of-thought is the product.** The visible reasoning IS the differentiator. Make it beautiful.
4. **Real incident data.** All 3 demo scenarios use enterprise-realistic payloads.
5. **30-second demo.** Click "Fire Demo" → 30 seconds → full resolution. Time it. It must hit.
6. **Ship, then polish.** Pipeline first, UI second, animations third.

---

## Session assignments

| Session | Role | Primary work |
|---------|------|-------------|
| S1 | Frontend Lead | Dashboard, AgentFlow, ChainOfThought, real-time SSE UI |
| S2 | AI/Agents Lead | All 5 agents, orchestrator.ts, Gemini + Claude integration |
| S3 | Backend/DB Lead | Supabase schema, API routes, SSE endpoint, demo seeder |
| S4 | Integration + QA | Wire everything, demo script, Lobster Trap bonus, submission |
