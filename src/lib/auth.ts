import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "sthelp_admin_session";
const encoder = new TextEncoder();

function sessionKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }
  return encoder.encode(secret);
}

export async function verifyAdminCredentials(username: string, password: string) {
  const configuredUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!configuredUsername || !hash) return false;
  if (username.trim().toLowerCase() !== configuredUsername) return false;
  return bcrypt.compare(password, hash);
}

export async function createAdminSessionToken(username: string) {
  return new SignJWT({ role: "admin", username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setIssuer("sthelp")
    .setAudience("sthelp-admin")
    .sign(sessionKey());
}

export async function verifyAdminSessionToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), {
      issuer: "sthelp",
      audience: "sthelp-admin"
    });
    if (payload.role !== "admin" || typeof payload.username !== "string") return null;
    return { username: payload.username };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const store = await cookies();
  return verifyAdminSessionToken(store.get(ADMIN_COOKIE)?.value);
}

export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireAdminApi() {
  return getAdminSession();
}
