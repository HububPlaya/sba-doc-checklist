# Testing

What's covered, at what level, with what tooling — and what's deliberately left as a described plan instead of code, given the project's time box.

## Frameworks

| Layer | Framework | Why |
|---|---|---|
| Unit + integration | **Vitest** | Minimal config with this Next.js/TypeScript setup, fast startup, familiar `describe/it/expect` API |
| Component | **React Testing Library** (on Vitest) | Queries rendered output the way a user would, not implementation details |
| E2E | **Playwright** | Auto-installs its own browser, no external service required, current default recommendation for Next.js |

None of these need an external account or network dependency to run — consistent with the project's "no existing systems, runs locally" constraint.

## Coverage map

| Domain / Layer | File(s) | Type | What's verified |
|---|---|---|---|
| Application status | `lib/domain/applicationStatus.ts` | Unit | Complete/Outstanding/Stalled classification; stalled-threshold boundary; backwards transition resets the stalled timer |
| Expiration logic | `lib/domain/expiration.ts` | Unit | 90-day / 3-year boundaries; blank expiration date excluded, not flagged; alert-eligibility (unsent only) |
| Import / upsert | `lib/domain/import.ts` | Unit | New pair inserted; existing pair — protected fields untouched, overwritable fields updated; unknown document type imported + flagged; malformed row skipped + reported, batch continues |
| Archive | `lib/domain/archive.ts` | Unit | Sets `archived_at`; never issues a real `DELETE`; non-team-lead callers rejected |
| Dashboard aggregation | `lib/domain/dashboard.ts` | Unit | Status counts correct against fixture data; stalled-applications list sorted correctly |
| Data access | `lib/db/*` | Integration | Domain functions run against a real (isolated, in-memory) SQLite instance — no mocking of the DB layer, since it's just a local file |
| Document status API | `app/api/documents/[id]/route.ts` | Integration | PATCH persists status + `updated_by`/`updated_at`; backwards transitions accepted; invalid status rejected cleanly |
| Import API | `app/api/import/route.ts` | Integration | Full CSV text → response summary, verified against `test/fixtures/sample.csv`, `malformed.csv`, `unknown-doc-type.csv` |
| Archive API — auth boundary | `app/api/applications/[id]/archive/route.ts` | Integration | `processor`-role session → 403; `team_lead`-role session → success. Treated as non-optional — the one real security boundary in the app |
| Dashboard API — alert trigger | `app/api/dashboard/route.ts` | Integration | First call with unsent expirations sends via Resend (mocked) and stamps `alert_sent_at`; second call does not re-send |
| Auth / session | `lib/auth/auth.ts` | Integration | Role correctly attached to session token; unrecognized login rejected with a plain-language message |
| UI components | `components/ui/*` | Component | StatusBadge/ExpirationFlag render correctly per prop; EmptyState shows guidance copy, not a blank table, when data is empty |
| Feature components | `components/features/*` | Component | ImportSummary renders the one-sentence message per outcome; NotificationBanner shows/hides based on expiring-document count |
| Full system | login → import → view → update status → sign out | E2E | The single highest-value path — exercises auth, import, domain logic, persistence, and UI together |
| Role gating (UI) | login as processor vs. team lead | E2E | Archive button hidden for processors; team-only dashboard content hidden for processors |
| Archive flow | login as team lead → archive an application | E2E | Application disappears from the active list after archiving |
| Import flow | login → navigate to import → upload → see summary | E2E | Full upload round-trip through the actual UI |
| Status update flow | login → change a document's status → see application status recompute | E2E | Confirms the computed Complete/Outstanding/Stalled status updates live in the UI, not just in the API response |

## Mocking strategy

Almost nothing in this app is external, which simplifies this considerably:

- **Database — not mocked.** SQLite is a local file; integration tests run against a real, isolated instance (`:memory:` for Vitest, a dedicated `e2e-test.db` seeded fresh before the Playwright suite via `global-setup.ts`). This verifies actual SQL behavior rather than a stand-in for it.
- **Auth — mocked at the session boundary for integration tests, run for real in E2E.** Integration tests fake "a session exists with role X" rather than exercising Auth.js's full Credentials flow, since that's testing Auth.js itself, not this app's authorization logic. The E2E critical path logs in for real, since that's specifically what E2E should verify.
- **Resend (email) — the one genuinely external dependency, always mocked.** Integration tests mock the `resend` module directly. E2E tests run with `MOCK_EMAIL=true`, which makes `sendExpirationAlert()` short-circuit to a console log inside the function itself, since Playwright can't intercept the server's outbound calls the way a module mock can.
- **CSV input — fixtures, no mocking needed.** There's no upload-storage service in this design (see `DECISIONS.md`), so test CSVs are just fixture files fed directly to the import route/UI.

## What's intentionally not covered

- Broad E2E coverage of every individual dashboard widget — one critical path plus the role/archive/import/status-update flows above were chosen deliberately; further granularity wasn't worth the time against the project's scope
- Load/performance testing — not relevant at the expected data volume (roughly 600–900 document rows, 3 concurrent users)
- Cross-browser testing — Playwright supports it trivially if needed later, not prioritized for an internal tool running locally
- Direct schema/migration testing — schema correctness is verified indirectly, since every integration test runs against a freshly-created instance of the real `schema.sql`; a schema mismatch would surface as a failing integration test rather than slip through silently

The brief treats writing automated tests as a bonus and thinking about testing as required — this document is both: the table above reflects what's actually written, and this section reflects what would be described in the demo rather than coded, and why that split is the right one given the time available.