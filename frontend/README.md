# GST Invoice Buddy — Web frontend

React + TypeScript + Vite frontend for the GST Invoice Buddy SaaS. The layout is an original adaptation of modern shadcn-style open dashboard patterns; it does not copy a paid UI kit. Inspiration/reference: [ShadcnStore dashboard + landing template](https://github.com/shadcnstore/shadcn-dashboard-landing-template) (MIT; attribution appreciated) and [shadcn dashboard](https://github.com/shadcndashboard/shadcndashboard) (MIT; attribution requested by upstream).

## Run locally

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Without Supabase environment values, the UI opens in clearly-labelled demo mode with sample-only data. With a Supabase URL and publishable/anon key, it uses Supabase Auth magic-link login and the existing `businesses`, `customers`, and `invoices` tables. Do not put service-role keys in Vite environment variables.

## Current integration boundary

- Supabase Auth: magic-link sign-in and sign-out.
- Business: create and load the signed-in user's business workspace.
- Customers: create and list customer records.
- Invoices: create draft invoices and list recent invoices.
- Demo mode data is local-only and never written to Supabase.
- Razorpay, Resend, invoice PDF generation, live UPI collection, subscription checkout, statutory e-invoicing/IRN and GST return filing are not implemented by this frontend.

For Render, set root directory to `frontend`, build command `npm install && npm run build`, and publish directory `dist` if using a static site. Set the two Vite environment variables before building. Vite embeds VITE_ variables in browser assets; only the Supabase publishable/anon key is appropriate.
