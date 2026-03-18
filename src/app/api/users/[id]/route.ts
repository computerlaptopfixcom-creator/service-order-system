import { NextRequest, NextResponse } from "next/server";
import { prisma, hashPasswordSecure } from "@/lib/storage/core";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// PATCH /api/users/[id] — update a user (admin only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const adminUserId = request.headers.get("x-user-id") || "system";

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.displayName !== undefined) updateData.displayName = body.displayName.trim();
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.role !== undefined) {
      if (!["admin", "tecnico", "recepcion"].includes(body.role)) {
        return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
      }
      if (params.id === adminUserId && body.role !== "admin") {
        return NextResponse.json({ error: "No puedes quitarte el rol de administrador tú mismo" }, { status: 403 });
      }
      updateData.role = body.role;
    }
    if (body.isActive !== undefined) {
      if (params.id === adminUserId && body.isActive === false) {
        return NextResponse.json({ error: "No puedes desactivar tu propia cuenta" }, { status: 403 });
      }
      updateData.isActive = body.isActive;
    }
    if (body.password && body.password.length >= 6) {
      updateData.passwordHash = hashPasswordSecure(body.password);
      updateData.mustChangePassword = false;
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    await logAudit({
      userId: adminUserId,
      action: body.isActive === false ? "DEACTIVATE_USER" : "UPDATE_USER",
      entity: "user",
      entityId: params.id,
      details: { fields: Object.keys(updateData) },
    });

    return NextResponse.json({
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      role: updated.role,
      isActive: updated.isActive,
    });
  } catch (error) {
    console.error("[api/users/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}
