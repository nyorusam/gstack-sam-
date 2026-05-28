# Sam Venture — Projects Reference

Your command centre for product research, prototyping, and building.
Built on the gstack framework. All projects live under `projects/`.

---

## How this workspace is structured

```
Sam Venture/                        ← git repo → github.com/nyorusam/gstack-sam-
├── projects/
│   ├── README.md                   project registry (update this when adding a project)
│   └── aria-incident-response/     first project — 5-agent incident response
├── supabase/migrations/
│   ├── 001–004                     gstack/GBrain core tables
│   └── 005_projects_registry.sql   Sam Venture projects table
├── browse, ship, review, qa …      gstack skills (tools Claude uses)
├── CLAUDE.md                       gstack dev instructions
└── PROJECTS.md                     ← this file
```

---

## Git remotes — two repos, one working copy

| Remote | GitHub Repo | When to push |
|--------|-------------|-------------|
| `origin` | `github.com/nyorusam/gstack-sam-` | Every commit — your full workspace history |
| `aria` | `github.com/nyorusam/aria-incident-response` | When deploying ARIA or sharing with others |

**Check your remotes anytime:**
```bash
git remote -v
```

---

## Day-to-day workflow

```bash
# Work normally — edit files, commit to the workspace
git add projects/aria-incident-response/...
git commit -m "feat: ..."

# Push to workspace (always do this)
git push origin main

# Push ARIA to its dedicated repo (for Vercel deploy, sharing, demo)
git subtree push --prefix=projects/aria-incident-response aria main
```

> **Note:** The first subtree push is slow (rewrites full history). After that it's fast — only new commits are processed.

---

## Adding a new project

### Step 1 — Create the project folder
```bash
mkdir projects/my-new-project
cd projects/my-new-project
npm init   # or: npx create-next-app@latest .
```

### Step 2 — Add a Supabase schema file
Create `projects/my-new-project/supabase/schema.sql` with your project's tables.
Always include a `project_id` FK referencing the `projects` registry table:
```sql
ALTER TABLE my_main_table
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
```

### Step 3 — Register in the projects table
Add a row to `supabase/migrations/` (name it `006_<project-slug>.sql`):
```sql
INSERT INTO projects (slug, name, description, status, repo_url)
VALUES ('my-new-project', 'My New Project', 'What it does', 'development', '')
ON CONFLICT (slug) DO NOTHING;
```

### Step 4 — Update the project registry
Add a row to `projects/README.md`:
```markdown
| `my-new-project` | My New Project | development | [GitHub](...) |
```

### Step 5 — Give it a dedicated GitHub repo (when ready)
```bash
# Create the repo on GitHub first, then:
git remote add my-project https://github.com/nyorusam/my-new-project.git

# Push project folder as its own repo
git subtree push --prefix=projects/my-new-project my-project main
```

### Step 6 — Commit everything to the workspace
```bash
git add projects/my-new-project/ supabase/migrations/006_...
git commit -m "feat: scaffold my-new-project"
git push origin main
```

---

## Subtree push cheatsheet

```bash
# First time — register the remote
git remote add <alias> https://github.com/nyorusam/<repo-name>.git

# Push project subfolder → dedicated repo
git subtree push --prefix=projects/<slug> <alias> main

# List all remotes
git remote -v

# Remove a remote
git remote remove <alias>
```

---

## Supabase setup for a new machine / fresh project

Run migrations in this order:
1. `supabase/migrations/001_telemetry.sql`
2. `supabase/migrations/002_tighten_rls.sql`
3. `supabase/migrations/003_installations_upsert_policy.sql`
4. `supabase/migrations/004_attack_telemetry.sql`
5. `supabase/migrations/005_projects_registry.sql`  ← creates `projects` table
6. `projects/<slug>/supabase/schema.sql`            ← per-project domain tables

---

## Active projects

| Slug | Name | Status | Workspace path | Dedicated repo |
|------|------|--------|---------------|----------------|
| `aria-incident-response` | ARIA: Autonomous Incident Response | active | `projects/aria-incident-response/` | `aria` remote |

---

## Running ARIA locally

```bash
cd projects/aria-incident-response
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
# → http://localhost:3000
```

Keys needed in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```
