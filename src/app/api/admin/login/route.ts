import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSessionToken, verifyAdminCredentials } from "@/lib/auth";
import { apiError } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const valid = await verifyAdminCredentials(String(email || ""), String(password || ""));
    if (!valid) return apiError("Incorrect email or password.", 401);
    const token = await createAdminSessionToken(String(email).trim().toLowerCase());
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
