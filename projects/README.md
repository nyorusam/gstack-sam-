# Sam Venture — Projects

Each subdirectory is a self-contained project with its own `package.json`, `supabase/schema.sql`, and deployment config.

## Registry

| Slug | Name | Status | Repo |
|------|------|--------|------|
| `aria-incident-response` | ARIA: Autonomous Incident Response | active | [GitHub](https://github.com/nyorusam/aria-incident-response) |

## Adding a new project

1. Create `projects/<slug>/` with its own Next.js (or other) scaffold
2. Add `projects/<slug>/supabase/schema.sql` for its tables
3. Register it in `supabase/schema.sql` (root) by inserting a row into `projects`
4. Add a row to the table above

## Schema migration order

Run schemas in this order when setting up a fresh Supabase project:

1. `supabase/schema.sql` — creates `projects` table + seeds entries
2. `projects/<slug>/supabase/schema.sql` — per-project domain tables
