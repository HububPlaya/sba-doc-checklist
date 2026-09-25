# What's Next

What we'd build with another sprint, roughly in priority order, and why each one is ranked where it is.

## 1. Move the email alert trigger to a real schedule

Right now, expiration alerts fire when someone opens the dashboard — the honest local-tool stand-in for a cron job, since there's no scheduler available for a non-deployed app. The underlying logic (`getAlertEligibleDocuments`, `sendExpirationAlert`) doesn't need to change at all; only what calls it does. This is the top priority because it's the one place "automatic" currently has a real gap: if nobody opens the dashboard for a few days, no alert fires either.

**Effort:** small. This is a config/infra change (add a scheduled function or cron trigger calling the existing dashboard-check logic), not a rewrite.

## 2. Move email sending off the shared test domain

`onboarding@resend.dev` was the right call for a fast, zero-DNS-setup build. Production use needs a verified company domain and the real team's email addresses in place of the placeholder recipient.

**Effort:** small, mostly DNS/account setup rather than code.

## 3. Notification delivery — customization and scalability

The current setup sends one email, to one recipient, via a direct call to Resend from inside the dashboard route. A few real gaps worth closing before this goes beyond 3 users:

- **Batch sending to multiple recipients** — right now `ALERT_RECIPIENT_EMAIL` is a single address; both processors and the team lead would realistically want their own alerts, possibly filtered to their own assigned applications rather than everyone getting everything.
- **A more scalable delivery path** — calling Resend synchronously from inside an API route works at this scale, but doesn't hold up well if alert volume grows or a send is slow/fails mid-request. Routing through a queue (SQS) with a decoupled sender (a Lambda or worker subscribed via SNS) would make sends retryable, decouple "detect what's expiring" from "actually deliver it," and scale independently of the app's own request/response cycle.
- **Per-user notification preferences** — which types of alerts, how often, in-app vs. email vs. both — none of this exists yet; everyone gets the same behavior today.

**Effort:** medium. The detection logic (`getAlertEligibleDocuments`) doesn't change — this is entirely about what sits between "we know what's expiring" and "someone gets told," which is currently the thinnest, least production-ready part of the notification system.

## 4. UI polish — consistency and smoothness

The current UI is functional but has real rough edges worth a dedicated pass: status updates and imports don't have consistent loading/transition states, so some actions feel abrupt rather than confirmed; spacing, type scale, and component styling drifted slightly across pages as they were built independently rather than against a shared design system. Nothing here blocks usability, but it's the difference between "works" and "feels considered" for a tool the team will use daily.

**Effort:** small-to-medium — mostly a consistency pass (shared spacing/type tokens, consistent transitions on status changes and imports) rather than new functionality.

## 5. Missing-document-type detection

Currently the tool only tracks documents it has a record for — it can't tell you "this application is missing 4 of its 12 required document types" because there's no master checklist per application, and it's unconfirmed whether the team currently tracks against one. Worth validating with the team directly, then adding a diff between a defined set of required types and what's present per application.

**Effort:** small once confirmed as a real need — reuses the existing domain layer, mainly a new comparison function plus a UI treatment for "not started" vs. "pending."

## 6. Real company SSO

Auth.js's provider list is already structured for this — adding Google Workspace or Microsoft Entra ID login is a new provider entry, not a rewrite of the session/middleware logic. Worth doing once this moves beyond 3 known users on a shared login screen.

**Effort:** small-to-medium, mostly external app registration/configuration.

## 7. Raw import file retention

Currently no uploaded CSV is persisted after parsing — only the parsed data. If an audit trail of "here's the exact file that was imported on this date" becomes a real need, the cheapest options are a local filesystem write or a small `import_log` table capturing summary counts, timestamp, and uploader. Hosted file storage (e.g. Vercel Blob) would be the right call only if this tool gets deployed rather than run locally.

**Effort:** small.

## 8. New-application intake

The tool currently assumes applications arrive via CSV import, not manual entry — matches the team's stated pain point (tracking existing applications) rather than originating new ones. A dedicated "add new application" form is a reasonable next step once the tool is in daily use and new loans start arriving between CSV exports.

**Effort:** medium — needs a form, validation, and a decision on which document types apply per loan type.

## 9. Conflict resolution for simultaneous edits

Last-write-wins is fine at 3 users editing independently-owned document rows, but if usage grows or editing patterns change, a lightweight "someone else updated this — reload?" check would be worth adding.

**Effort:** medium.

## Not on this list on purpose

Hard delete, broader role-based permissions, and a general audit/undo history beyond the existing `updated_by`/`updated_at` trail were all considered and intentionally not built — see `DECISIONS.md` for the reasoning on each. None of them are flagged here as "next," since the current design (soft delete, one gated action, attribution-without-undo) is believed to be the right long-term shape, not just a shortcut taken for time.