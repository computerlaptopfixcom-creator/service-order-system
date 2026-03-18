import { NextRequest, NextResponse } from "next/server";
import { prisma, hashPasswordSecure, verifyPasswordSecure } from "@/lib/storage/core";
import { logAudit } from "@/lib/audit";
import { createSessionToken, AUTH_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // If not forced change, verify current password
    if (!user.mustChangePassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "La contraseña actual es requerida" },
          { status: 400 }
        );
      }
      if (!verifyPasswordSecure(currentPassword, user.passwordHash)) {
        return NextResponse.json(
          { error: "La contraseña actual es incorrecta" },
          { status: 401 }
        );
      }
    }

    // Update password and clear mustChangePassword flag
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashPasswordSecure(newPassword),
        mustChangePassword: false,
      },
    });

    await logAudit({
      userId,
      action: user.mustChangePassword ? "FORCE_PASSWORD_CHANGE" : "PASSWORD_CHANGED",
      entity: "auth",
    });

    // Issue new session token with updated mustChangePassword=false
    const newSession = {
      userId: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      mustChangePassword: false,
    };
    const token = createSessionToken(newSession);

    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("[api/auth/change-password] Error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
