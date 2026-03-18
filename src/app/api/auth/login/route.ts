import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { verifyUserCredentials, createSessionToken, AUTH_COOKIE } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "La contraseña es requerida" },
        { status: 400 }
      );
    }

    const loginUsername = (username || "admin").trim().toLowerCase();
    const session = await verifyUserCredentials(loginUsername, password);

    if (!session) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const token = createSessionToken(session);

    // Get client IP for audit
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    await logAudit({
      userId: session.userId,
      action: "LOGIN",
      entity: "auth",
      ipAddress: ip,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        displayName: session.displayName,
        role: session.role,
        mustChangePassword: session.mustChangePassword,
      },
    });

    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("[api/auth/login] Error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
