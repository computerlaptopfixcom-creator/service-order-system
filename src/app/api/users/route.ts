import { NextRequest, NextResponse } from "next/server";
import { prisma, hashPasswordSecure } from "@/lib/storage/core";
import { logAudit } from "@/lib/audit";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

// GET /api/users — list all users (admin only)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("[api/users] GET error:", error);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

// POST /api/users — create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminUserId = request.headers.get("x-user-id") || "system";

    if (!body.username?.trim()) {
      return NextResponse.json({ error: "El nombre de usuario es requerido" }, { status: 400 });
    }
    if (!body.displayName?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }
    if (!body.password || body.password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }
    if (!["admin", "tecnico", "recepcion"].includes(body.role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    // Check unique username
    const existing = await prisma.user.findUnique({ where: { username: body.username.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        username: body.username.trim().toLowerCase(),
        displayName: body.displayName.trim(),
        email: body.email?.trim() || null,
        passwordHash: hashPasswordSecure(body.password),
        role: body.role,
        mustChangePassword: body.mustChangePassword ?? true,
      },
    });

    await logAudit({
      userId: adminUserId,
      action: "CREATE_USER",
      entity: "user",
      entityId: user.id,
      details: { username: user.username, role: user.role },
    });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    }, { status: 201 });
  } catch (error) {
    console.error("[api/users] POST error:", error);
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}
