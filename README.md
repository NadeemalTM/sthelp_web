# StHelp Assignment Support Portal

A mobile-responsive client and admin website for managing assignment-support requests from first contact through final delivery.

## What is included

- Public landing page with previous work and customer feedback
- Admin-generated client ID, 6-digit PIN and private direct link
- Client assignment request form
- One supporting document per request, limited to 5 MB
- Assignment acceptance, quoted price and live progress percentage
- Time-stamped progress updates
- Client/admin comments and revision requests
- Editable WhatsApp number and bank-account details
- Payment-reference and payment-proof submission
- Admin payment verification
- Private preview files and locked final files
- Download release after verified payment
- Client feedback submission with admin approval
- Mobile, tablet and desktop layouts

## Technology

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Postgres database
- Supabase private Storage
- Vercel-compatible server routes

## Important preview-security limitation

The system uses private storage, short-lived signed URLs, a watermark overlay, disabled text selection and restricted browser controls. These measures discourage casual copying. No website can completely prevent screenshots, screen recording or a technically advanced user from capturing content already displayed on their device.

For the safest workflow:

1. Upload the original work as a **Final file**.
2. Create a separate reduced-quality or watermarked PDF/image and upload it as a **Preview file**.
3. Verify payment before unlocking the original file.

## 1. Create a Supabase project

1. Create a project at `https://supabase.com`.
2. Open **SQL Editor**.
3. Paste and run the complete file: `supabase/schema.sql`.
4. Confirm that the private bucket `assignment-files` exists in Storage.

The schema enables Row Level Security on all application tables and intentionally creates no public table policies. The service-role key is used only inside server routes.

## 2. Create the environment file

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill these values:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ADMIN_USERNAME=nadeemal
ADMIN_PASSWORD_HASH=YOUR_BCRYPT_HASH
ADMIN_SESSION_SECRET=LONG_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
PIN_HASH_SECRET=ANOTHER_LONG_RANDOM_SECRET
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` or `PIN_HASH_SECRET` in browser code.

## 3. Generate the admin password hash

After installing packages:

```bash
npm run hash-password -- "Your-Strong-Admin-Password"
```

Copy the printed hash into `ADMIN_PASSWORD_HASH`.

Generate strong secrets with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Run it twice and use different values for the two secrets.

## 4. Run locally

```bash
npm install
npm run dev
```

Open:

- Website: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`

## 5. First-time admin setup

1. Sign in to `/admin/login`.
2. Open **Content & settings**.
3. Update:
   - Business name
   - WhatsApp number in international format, for example `94782067550`
   - Bank name
   - Account name
   - Account number
   - Branch
   - Currency and payment note
4. Replace the sample portfolio items and testimonials.
5. Return to the dashboard and create a client link.

## 6. Client workflow

1. Admin creates a private link with a client ID and PIN.
2. Admin sends either the direct link or the client ID + PIN through WhatsApp.
3. Client sees previous work and feedback, then submits assignment details.
4. Admin accepts the task, enters the price and publishes progress updates.
5. Client sees bank details, progress and comments on the same link.
6. Admin uploads a protected preview and one or more final files.
7. Client reviews the preview and requests revisions.
8. Client submits payment reference/proof.
9. Admin verifies payment and unlocks downloads.
10. Client downloads final files and submits feedback.

## 7. Deploy to Vercel

1. Put this project in a GitHub repository.
2. Import the repository into Vercel.
3. Add every variable from `.env.example` in **Project Settings → Environment Variables**.
4. Change `NEXT_PUBLIC_APP_URL` to your real Vercel/custom-domain URL.
5. Deploy.

Next.js is detected automatically. The project requires Node.js 22 or newer.

### Vercel plan note

Vercel's Hobby plan is described as a personal, non-commercial plan. This project is technically compatible with Hobby for development/testing, but a real commercial StHelp service should use a plan permitted for commercial use or another hosting provider whose terms allow it.

Official information: `https://vercel.com/docs/plans/hobby`

## Supabase free-tier note

The project is designed for Supabase's free tier, but storage, database and bandwidth quotas still apply. Monitor usage in the Supabase dashboard and upgrade before reaching limits.

Official information:

- `https://supabase.com/docs/guides/storage`
- `https://supabase.com/docs/guides/database/postgres/row-level-security`
- `https://supabase.com/docs/guides/storage/security/access-control`

## File rules

- Client support document: maximum 5 MB
- Client payment proof: maximum 5 MB
- Admin preview file: maximum 25 MB; PDF/JPG/PNG/WebP
- Admin final file: maximum 25 MB per file
- Storage bucket itself is private
- Final client download links expire after 60 seconds

## Academic-integrity wording

The site is written as an academic-support, tutoring, editing, research-guidance and software-development service. Clients should comply with their university's rules. Update the notice in the admin panel to match your exact services and local requirements.

## Production recommendations

Before handling a large number of paying clients, consider adding:

- Rate limiting for login, PIN and upload-signing routes
- Email/WhatsApp notifications through an approved provider
- Automated storage cleanup for abandoned uploads
- Admin audit logs
- Malware scanning for uploaded files
- Database backups and a written privacy policy
- A custom domain and legal terms

## Project structure

```text
src/app/                 Next.js pages and server routes
src/app/admin/           Admin login and management interface
src/app/portal/[token]/  Private client portal
src/app/api/             Backend route handlers
src/lib/                 Authentication, Supabase and upload helpers
supabase/schema.sql      Database and Storage setup
scripts/hash-password.mjs Admin password helper
```
# sthelp_web
