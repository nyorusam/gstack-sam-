# ARIA Team Coordination Protocol
## 9-Session Hackathon Sprint | May 17-19, 2026

---

## Active worktree paths (build sessions — READ from these)

| Session | Role | Path |
|---------|------|------|
| S1 | Frontend | C:\Users\Admin\Desktop\conductor-20260517-060515-s1 |
| S2 | Agents | C:\Users\Admin\Desktop\conductor-20260517-060515-s2 |
| S3 | Backend | C:\Users\Admin\Desktop\conductor-20260517-060515-s3 |
| S4 | Integration/QA | C:\Users\Admin\Desktop\conductor-20260517-060515-s4 |

To read another session's latest work:
  Get-Content "C:\Users\Admin\Desktop\conductor-20260517-060515-s2\lib\orchestrator.ts"

---

## Sprint timeline (16 hours)

| Hour | Phase | Sessions active |
|------|-------|----------------|
| 0-2  | Foundation build | S1, S2, S3 |
| 2-6  | Core implementation | S1, S2, S3, S4, S5 (CEO), S6 (Design), S7 (Arch) |
| 6-10 | Integration + research | All 9 |
| 10-13 | QA + hardening | S4, S8 (Research), S9 (QA) |
| 13-15 | Evaluation + polish | Main session + all review |
| 15-16 | GitHub push + submission | Main session |

---

## Merge order (main session runs these)

1. git merge --no-ff conductor/.../session-3  (DB schema + API)
2. git merge --no-ff conductor/.../session-2  (agents)
3. git merge --no-ff conductor/.../session-1  (frontend)
4. git merge --no-ff conductor/.../session-6  (design tokens)
5. git merge --no-ff conductor/.../session-7  (arch fixes)
6. git merge --no-ff conductor/.../session-4  (integration + README)
7. git merge --no-ff conductor/.../session-9  (QA report)

---

## Deliverables per session

### S1 Frontend
- [ ] app/layout.tsx
- [ ] app/page.tsx
- [ ] components/IncidentFeed.tsx
- [ ] components/AgentFlow.tsx
- [ ] components/ChainOfThought.tsx
- [ ] components/AuditTrail.tsx
- [ ] components/DemoTrigger.tsx

### S2 Agents
- [ ] lib/gemini.ts
- [ ] lib/claude.ts
- [ ] lib/agents/monitor.ts
- [ ] lib/agents/triage.ts
- [ ] lib/agents/investigate.ts
- [ ] lib/agents/respond.ts
- [ ] lib/agents/audit.ts
- [ ] lib/orchestrator.ts

### S3 Backend
- [ ] lib/supabase/server.ts
- [ ] lib/supabase/client.ts
- [ ] app/api/incidents/route.ts
- [ ] app/api/agents/run/route.ts
- [ ] app/api/stream/route.ts
- [ ] app/api/audit/route.ts
- [ ] app/api/seed/route.ts

### S4 Integration/QA
- [ ] useAgentStream hook wired
- [ ] Full pipeline tested end-to-end
- [ ] npm run build passes (zero TS errors)
- [ ] Demo timing under 35 seconds
- [ ] README.md
- [ ] SUBMISSION.md

### S5 CEO
- [ ] CEO-PLAN.md (product strategy + hackathon alignment)
- [ ] PITCH.md (2-min verbal pitch for judges)
- [ ] DEMO-SCRIPT.md (exact 30-second demo flow, step by step)
- [ ] Scope validation (no feature creep)

### S6 Design
- [ ] DESIGN-SYSTEM.md (colors, typography, spacing tokens)
- [ ] Component review notes in DESIGN-REVIEW.md
- [ ] UI feedback for S1 (posted as comments in DESIGN-REVIEW.md)

### S7 Engineering Architect
- [ ] ARCH-REVIEW.md (architecture audit against ARIA.md)
- [ ] Error handling spec (what happens when Gemini/Claude fails)
- [ ] Rate limit mitigation plan
- [ ] Type consistency review across S1-S3

### S8 Research
- [ ] RESEARCH.md (Gemini API limits, Claude limits, optimal prompts)
- [ ] Lobster Trap Windows setup notes
- [ ] Winning submission format analysis from lablab.ai
- [ ] Prompting best practices per agent type

### S9 QA Master
- [ ] TEST-PLAN.md (all test scenarios)
- [ ] Edge case list (what breaks the pipeline)
- [ ] Demo failure recovery procedures
- [ ] Performance benchmark results

---

## GitHub push checklist (Hour 15)

- [ ] All sessions merged to master
- [ ] npm run build passes
- [ ] .env.example created (no real keys)
- [ ] README.md complete
- [ ] SUBMISSION.md complete
- [ ] Demo recorded or screenshotted
- [ ] gh repo create aria-incident-response --public
- [ ] git push origin master
- [ ] Submit on lablab.ai

---

## Evaluation criteria (judging alignment)

| Criterion | Weight | How we win |
|-----------|--------|-----------|
| Application of Technology | High | Gemini Flash + Pro + Claude all used distinctly |
| Business Value | High | Real enterprise incident types, real metrics |
| Presentation | High | 30-second demo, visible chain-of-thought |
| Originality | Medium | No other submission does live incident resolution |
