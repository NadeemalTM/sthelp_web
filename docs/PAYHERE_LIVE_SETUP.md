# PayHere live setup for StHelp

The website implements PayHere Checkout as a redirect. StHelp calculates the
accepted quotation on the server, PayHere collects the card/payment details,
and the signed PayHere notification verifies the payment. The browser return
URL is never treated as proof of payment.

## 1. Apply the database migration

Open Supabase **SQL Editor**, paste the complete contents of:

`supabase/migrations/20260902_add_payhere_payment_attempts.sql`

Run it once. It creates the private PayHere attempt ledger used for unique
orders, retries, duplicate-payment review and exact chargeback matching.

## 2. Copy the live PayHere credentials

In the live PayHere merchant dashboard, open **Integrations**.

- Copy the account **Merchant ID**.
- Use the **Merchant Secret** shown for the approved StHelp production domain.
- Do not use sandbox credentials in production.
- Do not place the Merchant Secret in a variable beginning with
  `NEXT_PUBLIC_`, source code, screenshots or Git.

## 3. Add Vercel Production environment variables

In Vercel, open the StHelp project, then **Settings → Environment Variables**.
Add these values to the **Production** environment:

```text
NEXT_PUBLIC_APP_URL=https://www.sthelp.edu.lk
PAYHERE_ENABLED=true
PAYHERE_MODE=live
PAYHERE_MERCHANT_ID=your_live_merchant_id
PAYHERE_MERCHANT_SECRET=your_secret_for_the_approved_sthelp_domain
```

The application posts checkout requests to the exact live URL
`https://www.payhere.lk/pay/checkout`. Its public server callback is:

```text
https://www.sthelp.edu.lk/api/payhere/notify
```

The browser returns through `/payment/return`; the private portal link is kept
in the customer's browser session and is not included in the PayHere URL.

Keep the Merchant ID and Merchant Secret configured if checkout is temporarily
paused with `PAYHERE_ENABLED=false`; delayed signed notifications can then
still be processed safely.

## 4. Redeploy

Redeploy the latest commit after the migration and environment variables are
ready. Environment-variable changes do not alter an already completed build.

## 5. Test the complete business flow

1. Submit a custom request from `/place-assignment?service=custom` using a real
   email address and phone number.
2. Open the order in Admin, enter the final amount and currency, then select
   **Send final quote**.
3. Open the customer's private portal and accept the quote.
4. Enter billing address and city, then select **Continue to PayHere**.
5. Complete a small live payment. Do not use PayHere sandbox card numbers on
   the live checkout.
6. Return to the portal. It polls for the signed server notification and should
   change to **Payment verified**.
7. Confirm the same payment ID and amount in the PayHere dashboard and in the
   Admin assignment's **PayHere checkout history**.
8. Release final downloads from Admin when the deliverables are ready.

The existing bank-transfer and payment-slip option remains available. Bank
payments still require manual Admin verification; PayHere payments are marked
verified only after a valid signed server callback.

## Exceptional-payment controls

Most successful payments require no admin action. If a callback needs review,
first compare its order ID, PayHere payment ID, amount, currency and status in
the PayHere dashboard. Admin then provides these controlled actions:

- **Apply payment** verifies an exact paid transaction that matches the current
  accepted quote.
- **Close checkout** releases a stuck initiated/pending transaction only after
  you confirm in PayHere that it is not paid or processing.
- **Already refunded** records a refund that you already completed in PayHere.
  It does not send money by itself.
- **Resolve chargeback** releases the order for another payment after you have
  completed the chargeback review in PayHere.

Never ask the customer to pay again while the portal says PayHere is processing
or the payment is under review.

## Troubleshooting

- **PayHere option is missing:** verify all five environment values, especially
  `PAYHERE_ENABLED=true`, and redeploy.
- **Unauthorized payment request:** confirm the production domain and its
  domain-specific Merchant Secret match the PayHere Integration record.
- **Checkout opens but the portal stays pending:** inspect Vercel logs for
  `POST /api/payhere/notify`, confirm the URL is publicly reachable, and check
  that the Supabase migration was applied.
- **Payment appears as Review in Admin:** compare the order, payment ID, amount
  and currency with the PayHere dashboard before refunding or manually
  reconciling it.
