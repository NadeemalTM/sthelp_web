import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

type PayHereConfig = {
  merchantId: string;
  merchantSecret: string;
  appUrl: string;
  checkoutUrl: string;
};

function md5(value: string) {
  return createHash("md5").update(value, "utf8").digest("hex").toUpperCase();
}

export function formatPayHereAmount(value: number | string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("A valid quoted amount is required for PayHere checkout.");
  return amount.toFixed(2);
}

export function isPayHereEnabled() {
  return process.env.PAYHERE_ENABLED === "true"
    && Boolean(process.env.PAYHERE_MERCHANT_ID)
    && Boolean(process.env.PAYHERE_MERCHANT_SECRET)
    && Boolean(process.env.NEXT_PUBLIC_APP_URL);
}

export function getPayHereConfig(): PayHereConfig {
  if (!isPayHereEnabled()) throw new Error("PayHere checkout is not enabled.");
  const sandbox = process.env.PAYHERE_MODE !== "live";
  return {
    merchantId: process.env.PAYHERE_MERCHANT_ID!,
    merchantSecret: process.env.PAYHERE_MERCHANT_SECRET!,
    appUrl: process.env.NEXT_PUBLIC_APP_URL!.replace(/\/$/, ""),
    checkoutUrl: sandbox
      ? "https://sandbox.payhere.lk/pay/checkout"
      : "https://www.payhere.lk/pay/checkout"
  };
}

export function createPayHereCheckoutHash(input: {
  merchantId: string;
  merchantSecret: string;
  orderId: string;
  amount: string;
  currency: string;
}) {
  return md5(`${input.merchantId}${input.orderId}${input.amount}${input.currency}${md5(input.merchantSecret)}`);
}

export function verifyPayHereNotification(input: {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  statusCode: string;
  signature: string;
  merchantSecret: string;
}) {
  const expected = md5(
    `${input.merchantId}${input.orderId}${input.amount}${input.currency}${input.statusCode}${md5(input.merchantSecret)}`
  );
  const received = input.signature.toUpperCase();
  if (expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected, "ascii"), Buffer.from(received, "ascii"));
}
