# ARIA Evaluation Gate
## Run at Hour 13-14 before GitHub push

This is the structured review that happens BEFORE pushing.
Every item must pass or be explicitly accepted as known risk.

---

## Phase 1: Build completeness (run npm run build)

```bash
cd "C:\Users\Admin\Desktop\Sam Venture"
npm run build
```

Pass criteria: zero TypeScript errors, zero build failures.
If failures: assign to S4 to fix.

---

## Phase 2: Demo timing test

```bash
# Start dev server
npm run dev

# In another terminal, fire the demo incident and time it
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"database\",\"severity\":\"critical\",\"source\":\"PostgreSQL prod-db-01\",\"title\":\"Connection pool exhausted\",\"raw_data\":{\"metric\":\"pg_connections\",\"current_value\":500,\"threshold\":400}}"
```

Target: full pipeline (5 agents) completes in < 35 seconds
Acceptable: < 45 seconds
Fail (needs optimization): > 45 seconds

---

## Phase 3: Judging criteria scorecard

Score each 1-10. Need average >= 7 to ship.

| Criterion | Score | Notes |
|-----------|-------|-------|
| Application of Technology | /10 | Gemini Flash + Pro + Claude all doing distinct jobs? |
| Business Value | /10 | Would a CISO at PayPal find this useful? |
| Presentation | /10 | Is the demo visual, clear, under 35s? |
| Originality | /10 | Does it do something the 40+ other submissions don't? |
| **Average** | /10 | |

---

## Phase 4: Review session outputs (check all exist)

- [ ] CEO-PLAN.md exists and validates Track 2 alignment
- [ ] PITCH.md exists (2-minute pitch written)
- [ ] DEMO-SCRIPT.md exists (30-second demo scripted)
- [ ] DESIGN-REVIEW.md exists (UI feedback applied)
- [ ] ARCH-REVIEW.md exists (critical bugs fixed)
- [ ] RESEARCH.md exists (prompts optimized)
- [ ] TEST-PLAN.md exists (QA complete)
- [ ] DEMO-RECOVERY.md exists (failure plan ready)

---

## Phase 5: Submission checklist

- [ ] README.md — clear, has setup steps, has architecture diagram
- [ ] SUBMISSION.md — all lablab.ai form fields filled
- [ ] .env.example — created with placeholder keys (NO real keys in git)
- [ ] GitHub repo created and public
- [ ] Demo URL (Vercel) — optional but strong signal to judges
- [ ] Video presentation — 2-3 minute screen recording of demo

---

## Phase 6: Final merge sequence

Run IN ORDER to avoid conflicts:

```bash
cd "C:\Users\Admin\Desktop\Sam Venture"

# Build sessions
git merge --no-ff conductor/20260517-060515/session-3 -m "feat: backend API + Supabase schema"
git merge --no-ff conductor/20260517-060515/session-2 -m "feat: 5-agent pipeline (Gemini + Claude)"
git merge --no-ff conductor/20260517-060515/session-1 -m "feat: ARIA dashboard (Next.js + Tailwind)"
git merge --no-ff conductor/20260517-060515/session-4 -m "feat: integration, README, SUBMISSION"

# Specialist sessions
git merge --no-ff conductor/20260517-061428/session-1 -m "docs: CEO plan + pitch + demo script"
git merge --no-ff conductor/20260517-061428/session-2 -m "docs: design system + component review"
git merge --no-ff conductor/20260517-061428/session-3 -m "fix: architecture review + error handling"
git merge --no-ff conductor/20260517-061428/session-4 -m "docs: research + competitive analysis"
git merge --no-ff conductor/20260517-061428/session-5 -m "docs: QA test plan + demo recovery"
```

---

## Phase 7: GitHub push

```bash
# Authenticate first (run once in any terminal)
gh auth login

# Create repo
gh repo create aria-incident-response \
  --public \
  --description "ARIA: Autonomous Incident Response Intelligence Agent. 5-agent pipeline using Gemini Flash, Gemini Pro, and Claude for enterprise incident resolution." \
  --source . \
  --push

# Verify
gh repo view
```

Submission URL goes into lablab.ai as the GitHub Repository field.

---

## Phase 8: Vercel deploy (optional, strong signal)

```bash
npm install -g vercel
vercel --prod
```

Add all env vars in Vercel dashboard before deploying.
The live URL goes into lablab.ai as the Application URL field.
