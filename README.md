# GST Invoice Buddy

**GST Invoice Buddy** is a planned SaaS invoicing and customer-management platform for Indian freelancers, professionals, shops, and small businesses. The goal is to make everyday billing easier while supporting Indian GST workflows, INR pricing, UPI payments, and a multilingual experience.

> **Project status:** The repository now includes a responsive React + TypeScript frontend with a public marketing landing page and an interactive invoice workspace. Supabase Auth, business, customer and draft-invoice flows are wired in the frontend, but a successful build/CI run and live staging deployment still need verification. Razorpay, Resend, PDF generation, statutory e-invoicing and production GST compliance are not implemented.

## Product vision

Build one simple workspace where a small business can:
- Create and manage GST-oriented invoices.
- Maintain customer profiles, GSTINs, contact details and billing addresses.
- Calculate applicable GST components such as CGST + SGST or IGST using verified tax configuration.
- Share invoices and reminders by email.
- Let customers pay invoices using UPI QR codes or payment links.
- Subscribe to the SaaS using UPI-enabled payment methods where supported by the payment provider.
- Use the product in English first, then progressively add India's scheduled languages with reviewed translations and suitable PDF fonts.
- See invoice history, payment status and business-level analytics.

The product is intended to support both UPI use cases:
1. **SaaS subscription payments** for Starter, Pro and Business plans.
2. **Customer invoice payments** using UPI QR/payment links.

The product's intended additional platform fee on invoice payments is ₹0. This does **not** mean payment processing is free: Razorpay or another payment provider may charge gateway/processing fees according to its current terms.

## Subscription plans

| Plan | Price | Intended features |
|---|---:|---|
| Starter | ₹199/month | Up to 25 invoices per month, customer management and basic GST invoice workflows |
| Pro | ₹499/month | Unlimited invoices, automatic GST calculations and invoice payment options |
| Business | ₹999/month | Pro features plus multi-user access, API access and analytics |

These are proposed prices. Before enabling checkout, confirm whether prices are GST-inclusive or exclusive, configure provider plan IDs, and implement server-side entitlements and quota enforcement.

## Intended product modules

### 1. Business onboarding
- Business/legal name, address, contact details and GSTIN.
- Supplier state and invoice preferences.
- Business-specific invoice numbering and financial-year handling.

### 2. Customer management
- Customer name, GSTIN, email and phone.
- Billing address and state/place-of-supply information.
- Searchable customer list and invoice history.

### 3. GST invoice workflow
- Supplier and recipient information.
- Invoice number, issue date, due date and supply details.
- Item description, HSN/SAC, quantity, unit price, discount and taxable value.
- CGST/SGST or IGST split, cess where applicable, and invoice totals.
- Draft, sent, paid, overdue and cancelled lifecycle.
- PDF generation, email sharing and audit history.

GST calculations must be based on validated transaction facts and a maintained, reviewed tax configuration. GST rates are not universal; classification, exemptions, place of supply and current legal requirements must be checked. The product must not claim to file GST returns or issue an IRN/e-invoice unless the relevant authorized integrations and eligibility checks are implemented.

### 4. UPI and payment management
- Subscription checkout for the SaaS plans.
- Invoice-specific UPI QR/payment links for the business's customers.
- Server-side payment order creation and signature verification.
- Signed webhook validation, idempotency, payment reconciliation, refunds and failure handling.
- Clear separation between subscription transactions and invoice settlement transactions.

Never trust a browser callback as proof of payment. Store provider secrets only in server-side environment variables. Verify current Razorpay product availability, UPI support, fees, settlement rules and recurring-payment constraints before enabling live payments.

### 5. Email and notifications
Planned Resend integration for invoice delivery, payment receipts, status notifications, due-date reminders, and subscription/account emails. A verified sending domain and production-ready templates are required before sending live customer email.

### 6. Localization
- English is the initial/default language.
- The roadmap targets India's 22 scheduled languages.
- Translation, GST terminology, date/number/currency formatting, Unicode PDF font rendering and QA are required for each supported language.
- Do not advertise full 22-language support until translations and invoice/PDF rendering have been tested.

### 7. Business plans and analytics
- Server-side monthly invoice quota enforcement for Starter.
- Subscription status and renewal lifecycle.
- Multi-user memberships and role-based permissions for Business.
- Usage, invoice, collection and revenue analytics.
- Audit history for sensitive business actions.

## Frontend application

A separate Vite + React + TypeScript application is available in [frontend/](frontend/). It includes:
- Public marketing landing page and proposed pricing.
- Responsive business dashboard, invoices, customers, payments-status and settings screens.
- Supabase Auth magic-link sign-in.
- Business workspace creation, customer creation and draft invoice creation against the existing Supabase tables.
- Clearly labelled local demo mode when Supabase environment variables are absent.
- GitHub Actions build workflow at `.github/workflows/frontend-ci.yml`.

Run it locally:

```bash
cd frontend
cp .env.example .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (publishable/anon key only)
npm install
npm run dev
```

The frontend is a separate app from the incomplete Wasp template under `template/app`; the two authentication/runtime stacks have not been merged. Do not deploy the Wasp template as if it were this frontend.

## Technology direction

The repository currently contains a **Wasp + React + Node.js + Prisma** starter configuration, with **Supabase-hosted PostgreSQL** as the intended database host.

Planned integrations and deployment:
- **Supabase PostgreSQL:** managed relational database.
- **Razorpay:** subscription and invoice payment processing, subject to provider capabilities and onboarding.
- **Resend:** transactional email.
- **Render:** planned application hosting.

Important architecture distinction:
- The current starter describes Wasp authentication and server-side operations with Prisma connecting to Supabase PostgreSQL.
- Supabase PostgreSQL hosting does not automatically mean Supabase Auth is used by the application.
- Browser-side database access must not be enabled unless authentication identity mapping and Row Level Security policies are deliberately designed and tested.
- Keep payment secrets, database credentials and privileged keys on the server. Never commit populated environment files or service-role credentials.

The final framework and integration design must be confirmed against the actual source tree before implementation. Do not assume the planned integrations are already wired.

## Repository status and roadmap

### Current repository foundation
- Initial Wasp/Open SaaS-derived starter structure.
- Supabase PostgreSQL setup documentation and environment examples.
- Prisma schema starter.
- A Supabase project has been provisioned for the database foundation.

### Next implementation milestones
1. Restore/add the missing Wasp application source files and make the repository build successfully.
2. Implement authentication, business onboarding, tenant membership and role enforcement.
3. Implement customer CRUD and server-authoritative invoice creation.
4. Add a reviewed GST tax configuration and validated calculation service.
5. Add PDF generation and invoice email delivery through Resend.
6. Implement Razorpay subscription checkout and invoice UPI payment flows separately.
7. Add verified, idempotent webhooks and payment reconciliation.
8. Enforce plan entitlements and invoice quotas server-side.
9. Add Business multi-user, API and analytics capabilities.
10. Add language packs, automated tests, security review and Render deployment.

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for database setup notes.

## Local development

Clone the repository:

```bash
git clone https://github.com/ARUNAGIRI011/saas-starter.git
cd saas-starter
```

Inspect the existing app template before installing dependencies:

```bash
ls
ls template/app
```

The repository is currently incomplete: referenced Wasp source files are missing. Therefore, a successful local build cannot yet be guaranteed. Do not treat dependency installation or deployment as proof that the product is ready. Once the application source is restored, the exact Wasp CLI version, build command, environment variables and start command must be documented here.

## Configuration and secrets

Use environment variables for all credentials. Keep local values in an ignored environment file and configure production secrets in the hosting provider's secret/environment settings.

Never commit database passwords or credential-bearing connection strings, Supabase service-role or other privileged keys, Razorpay key secrets or webhook secrets, Resend API keys, or customer/invoice/payment data.

## Compliance and production disclaimer

GST Invoice Buddy is a software workflow tool, not a substitute for professional tax advice. The product must be tested against current Indian GST rules and reviewed by a qualified GST professional before being used to issue statutory invoices. E-invoicing/IRN, e-way bills, GST return filing, tax-rate catalog completeness and legal certification are **not confirmed as implemented**.

## Contributing

Contributions should include a clear description of the change and affected workflows, tests for business logic/authorization/payment lifecycle changes, tenant-isolation and RLS checks for database changes, and no secrets, live customer data or unverified GST claims.
