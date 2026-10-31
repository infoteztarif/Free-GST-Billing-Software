# Teztarif GST Billing SaaS foundation

The offline application remains the system used on a single PC. Cloud mode is
opt-in and synchronizes through the dedicated Supabase project in Mumbai:

- Project: `gst-billing-saas`
- Ref: `orohiihsizddmjgxxsxs`
- Public URL: `https://orohiihsizddmjgxxsxs.supabase.co`

Only the publishable browser key belongs in `.env`. Never add a secret or
service-role key to this repository.

## Implemented data model

- platform Super Admins
- companies with trial/active/suspended/cancelled lifecycle
- Company Admin, Department Admin and User memberships
- departments/teams and team members
- roles, permissions, allow/deny and OWN/TEAM/COMPANY scope
- Basic, Pro and Max plans
- plan modules and per-company module overrides
- subscription records (manual only for now)
- user, branch, storage and API usage counters
- application sessions and revocation timestamps
- automatic audit logs
- offline devices and versioned sync records

All 20 exposed tables have RLS. Tenant identifiers are immutable and composite
foreign keys prevent a team, role, membership, device or sync row from being
linked across companies.

## Verified

- Supabase security advisor: zero findings
- tenant isolation transaction: Tenant A saw one company and one sync record;
  Tenant B's rows were not visible
- database types generated into `src/cloud/database.types.ts`

## Hybrid sync policy

Financial records do not use blind last-write-wins. `cloudSync.detectConflict`
flags a conflict whenever both local and cloud versions advanced after the last
pull. The UI must ask the user which version to keep and preserve the rejected
copy in the audit trail.

## Still required before public launch

- first Super Admin Auth account and MFA enrollment
- login and cloud-connect screens
- Super Admin and Company Admin React dashboards
- permission-driven sidebar integration
- sync conflict-resolution UI and retry queue
- usage-counter enforcement
- subscription payment provider (deliberately deferred)
- backup/restore and disaster-recovery drill
- full E2E tests using two real Auth sessions
