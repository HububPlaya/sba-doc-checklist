# SBA Document Checklist

A browser-based tool that replaces the loan operations team's shared spreadsheet for tracking SBA loan document status across active applications — built for 2 processors and 1 team lead.

## Prerequisites

- Node.js 18.18 or later
- npm (comes with Node)

No database server, no Docker, no external accounts required to run the app itself. Email alerts need a free Resend account — see [Setting up email alerts](#setting-up-email-alerts-resend) below; the app runs fully without it, just with alerts skipped.

## Setup

```powershell
git clone <repo-url>
cd sba-doc-checklist
npm install
```

Create your local environment file:

```powershell
Copy-Item .env.example .env.local
```

> **Note:** if `.env.example` doesn't exist yet in the repo, create `.env.local` directly with the contents shown in [Environment variables](#environment-variables) below.

Start the app:

```powershell
npm run dev
```

Open **http://localhost:3000** in your browser. You'll land on the login page.

## First run

The database is empty on first boot — no data is pre-loaded. This is deliberate: the Import screen is the tool's true starting point, the same way a processor would start using it for real.

1. **Log in.** Select your name from the dropdown. The 3 known users (2 processors, 1 team lead) are seeded from the sample data — see [Seeding users](#seeding-users) if the dropdown is empty on a fresh database.
2. **Import.** You'll land on the Import screen automatically. Click **Import CSV**, select the provided sample data file (`NEWITY_Sample_Data_A_Document_Checklist.csv`), and confirm. You'll see a one-line summary of what was added.
3. **Browse.** From there, the main table, dashboard, and status updates are all live against that imported data.

Total time from `git clone` to a working, populated app: under 5 minutes.

## Seeding users

> **Flagging this explicitly:** the login dropdown is populated from a `users` table (name + role), not hardcoded — if your repo doesn't yet have a seed step that inserts the 3 real team members (2 `processor`, 1 `team_lead`) into that table, the login dropdown will be empty on a fresh database. If there's a `npm run seed:users` script (or equivalent) in your `package.json`, run it here before logging in. If there isn't one yet, this is worth adding before handing the app to the actual ops team — happy to draft it once confirmed.

## Environment variables

Create `.env.local` in the project root with:

```
RESEND_API_KEY=
ALERT_RECIPIENT_EMAIL=
```

Both are optional for local use — leave them blank and the app runs normally, it just skips sending expiration-alert emails (the in-app notification banner works regardless, since it doesn't depend on either).

## Setting up email alerts (Resend)

Email alerts fire automatically when the dashboard is opened and there are newly-expiring documents that haven't been alerted on yet — no scheduled job needed for local use. To turn this on:

1. Go to **[resend.com](https://resend.com)** and sign up. The free tier is enough for this project — no credit card required.
2. Verify your email if prompted.
3. In the Resend dashboard, go to **API Keys** in the left sidebar.
4. Click **Create API Key**. Name it something like `sba-doc-checklist-dev`. Leave permissions as **Full access** (or **Sending access** if that's offered separately).
5. **Copy the key immediately** — Resend only shows it once. If you lose it, you'll need to create a new one.
6. Paste it into `.env.local`:
   ```
   RESEND_API_KEY=re_your_actual_key_here
   ```
7. Set who receives the alerts:
   ```
   ALERT_RECIPIENT_EMAIL=your-test-email@example.com
   ```

**Important — sending domain restriction:** the app sends from `onboarding@resend.dev`, Resend's shared test domain. This requires no DNS setup at all, which is why it was chosen for this build — but test-domain sending is often restricted to only the email address you signed up to Resend with, until you verify your own domain. If alert emails aren't arriving, set `ALERT_RECIPIENT_EMAIL` to the same address you used to create your Resend account, and check Resend's dashboard **Logs** tab to confirm whether the send succeeded or was blocked.

For a real production rollout, this would move to a verified company domain and the real team's email addresses — see `FUTURE.md`.

## Running tests

```powershell
npm run test        # unit + integration (Vitest)
npm run test:e2e     # end-to-end (Playwright)
```

`npm run test:e2e` seeds its own isolated test database (`e2e-test.db`) with fixture users and applications before running — it does not touch your local `data.db`.

## Project documentation

- **`docs/DECISIONS.md`** — every scope and trade-off decision made, and why
- **`docs/ARCHITECTURE.md`** — how the codebase is layered
- **`docs/TESTING.md`** — what's tested at each level and what's intentionally left as a QA plan instead
- **`docs/FUTURE.md`** — what we'd build next, in priority order

## Troubleshooting

- **Login dropdown is empty** — see [Seeding users](#seeding-users) above.
- **Import screen doesn't appear on first load** — confirm `data.db` doesn't already exist from a previous run; delete it and restart `npm run dev` to get a true fresh state.
- **Alert emails not arriving** — see the sending-domain note under [Setting up email alerts](#setting-up-email-alerts-resend).