import crypto from "node:crypto";

export function hashClientPin(pin: string) {
  const secret = process.env.PIN_HASH_SECRET;
  if (!secret || secret.length < 16) throw new Error("PIN_HASH_SECRET is not configured.");
  return crypto.createHmac("sha256", secret).update(pin).digest("hex");
}

export function createClientPin() {
  return String(crypto.randomInt(100000, 1000000));
}

export function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const extension = dot >= 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "file";
  return `${base}${extension}`;
}

export function randomPathSegment() {
  return crypto.randomUUID();
}
