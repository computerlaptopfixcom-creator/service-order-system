import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET /api/audit — query audit logs (admin only, enforced by middleware)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const logs = await getAuditLogs({
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
      userId: searchParams.get("userId") || undefined,
      action: searchParams.get("action") || undefined,
      entity: searchParams.get("entity") || undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[api/audit] GET error:", error);
    return NextResponse.json({ error: "Error al obtener bitácora" }, { status: 500 });
  }
}
