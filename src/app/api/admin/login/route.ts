import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSessionToken, verifyAdminCredentials } from "@/lib/auth";
import { apiError } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const normalizedUsername = String(username || "").trim().toLowerCase();
    const valid = await verifyAdminCredentials(normalizedUsername, String(password || ""));
    if (!valid) return apiError("Incorrect username or password.", 401);
    const token = await createAdminSessionToken(normalizedUsername);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    return response;
  } catch (error) {
    console.error(error);
    return apiError("Unable to sign in.", 500);
  }
}
