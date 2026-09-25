# Architecture

Next.js App Router, single codebase. Frontend and API live together; SQLite (`better-sqlite3`) is the only persistence layer, no ORM.

## Layers

```
src/
  app/
    login/page.tsx                  # login form
    (app)/                          # protected route group
      page.tsx                      # Tier 1: main table
      dashboard/page.tsx            # Tier 3: widget grid, triggers alert check on load
      import/page.tsx               # true landing state on an empty database
    api/
      auth/[...nextauth]/route.ts   # Auth.js sign-in endpoint
      users/names/route.ts          # known-user list, powers the login dropdown
      applications/route.ts
      applications/[id]/route.ts
      applications/[id]/archive/route.ts   # team-lead-gated soft delete
      documents/[id]/route.ts       # status updates
      import/route.ts               # CSV upsert
      dashboard/route.ts            # aggregate counts + triggers email alert check
      notifications/route.ts        # powers the in-app banner
    middleware.ts                   # protects (app)/** routes, redirects unauthenticated → /login

  components/
    ui/                             # reusable, no business logic: StatusBadge, ExpirationFlag, EmptyState, Table
    features/
      dashboard/                    # StalledApplicationsWidget, StatusBreakdownWidget, ExpiringSoonWidget, …
      ImportSummary.tsx
      NotificationBanner.tsx

  lib/
    auth/
      auth.config.ts                # Credentials provider, session/role callbacks
      auth.ts                       # exports handlers/auth/signIn/signOut
    domain/                         # pure business logic — no HTTP, no direct SQL beyond what each file owns
      applicationStatus.ts          # Complete / Outstanding / Stalled
      expiration.ts                 # expiration flags, alert eligibility
      dashboard.ts                  # pipeline summary aggregation
      import.ts                     # CSV upsert logic
      archive.ts                    # soft delete
      settings.ts                   # alert recipient configuration
    notifications/
      sendExpirationAlert.ts        # Resend integration
      emailTemplate.ts              # HTML + CSV rendering for the alert email
    db/
      client.ts                     # better-sqlite3 singleton, configurable path for tests
      schema.sql
    types.ts

  test/
    fixtures/                       # sample.csv, malformed.csv, unknown-doc-type.csv
    setup.ts                        # Vitest setup — resets DB connection between tests

e2e/
  *.spec.ts                         # Playwright specs
  global-setup.ts                   # seeds an isolated e2e-test.db before the suite runs
```

## Responsibilities per layer

- **Presentation (`app/**`, `components/**`)** — what the ops team sees and clicks. No business logic lives here; components call API routes and render what comes back.
- **API (`app/api/**`)** — thin HTTP boundary. Parses requests, calls the domain layer, returns JSON. No SQL and no business rules live directly in a route handler.
- **Domain (`lib/domain/**`)** — the actual business rules, most of them pure functions. This is where "stalled," "expiring soon," and the upsert/protection rules are defined, and where nearly all of the unit test coverage lives.
- **Notifications (`lib/notifications/**`)** — the one layer that talks to an external service (Resend). Isolated deliberately so the rest of the app has no email-sending dependency to reason about.
- **Data access (`lib/db/**`)** — the SQLite connection and schema. `import.ts`, `archive.ts`, and `dashboard.ts` in the domain layer run their own SQL directly against this rather than going through a separate query-abstraction file — a deliberate simplification for a codebase this size, noted here so it isn't mistaken for an oversight.
- **Auth (`lib/auth/**`)** — Auth.js configuration: provider, session strategy, and the callbacks that attach a user's role to their session token. `middleware.ts` reads that session on every request to a protected route.

## Data model

```sql
CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  borrower_name TEXT,
  loan_amount INTEGER,
  application_date TEXT,
  assigned_processor TEXT,
  archived_at TEXT              -- NULL = active
);

CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id TEXT NOT NULL REFERENCES applications(id),
  document_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  date_received TEXT,
  expiration_date TEXT,
  notes TEXT,
  updated_at TEXT,
  updated_by TEXT,               -- plain string, not a foreign key — survives roster changes
  alert_sent_at TEXT,            -- dedup marker for email alerts
  UNIQUE(application_id, document_type)
);

CREATE TABLE users (
  name TEXT PRIMARY KEY,
  role TEXT NOT NULL             -- 'processor' | 'team_lead'
);
```

> Note: `users` was added during the build to back the login dropdown dynamically (via `/api/users/names`) rather than hardcoding the 3 names inside `auth.config.ts`. This is a real, deliberate improvement over the original plan — worth reflecting the same way in `DECISIONS.md` if it isn't already there.

## What's explicitly out of scope

- Real company SSO (structured for it via Auth.js's provider pattern; not built)
- Hard delete
- Role-based view differences beyond the one archive gate
- Conflict-resolution UI for simultaneous edits
- A scheduled job for email alerts (currently triggered on dashboard load instead)
- New-application intake form (CSV import covers new applications arriving)
- Missing-document-type detection (flagging a document that was never logged at all)