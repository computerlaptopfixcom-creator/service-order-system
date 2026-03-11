import { NextRequest, NextResponse } from "next/server";
import { getOrders, getSettings, getParts, getServices, getCategories } from "@/lib/storage";
import { STATUS_CONFIG } from "@/types/order";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") || "csv";

  if (format === "json") {
    // Full backup: Fetch all data from DB
    try {
      const [orders, settings, parts, services, categories] = await Promise.all([
        getOrders(),
        getSettings(),
        getParts(),
        getServices(),
        getCategories()
      ]);

      const backup = {
        version: "2.0", // Bump version for SQLite/Prisma structure
        exportDate: new Date().toISOString(),
        orders,
        settings,
        parts,
        services,
        categories
      };

      const json = JSON.stringify(backup, null, 2);
      return new NextResponse(json, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="backup_${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    } catch (e) {
      console.error("Export JSON error:", e);
      return NextResponse.json({ error: "Error al exportar JSON" }, { status: 500 });
    }
  }

  // CSV export
  try {
    const orders = await getOrders();
    const headers = [
      "Número de Orden",
      "Fecha de Creación",
      "Estado",
      "Cliente",
      "Teléfono",
      "Email",
      "Tipo de Equipo",
      "Marca",
      "Modelo",
      "Número de Serie",
      "Accesorios",
      "Problema",
      "Diagnóstico",
      "Costo Estimado",
      "Costo Repuestos",
      "Entrega Estimada",
      "Notas Internas",
      "Última Actualización",
    ];

    const escapeCSV = (val: string | number | undefined | null): string => {
      if (val === undefined || val === null) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString("es-MX"),
      STATUS_CONFIG[o.status as keyof typeof STATUS_CONFIG]?.label || o.status,
      o.customerName,
      o.customerPhone,
      o.customerEmail || "",
      o.deviceType,
      o.deviceBrand,
      o.deviceModel || "",
      o.serialNumber || "",
      o.accessories || "",
      o.problemDescription,
      o.diagnosis || "",
      o.estimatedCost || 0,
      o.partsCost || 0,
      o.estimatedDelivery || "",
      Array.isArray(o.internalNotes) ? o.internalNotes.map((n) => n.text).join(" | ") : "",
      new Date(o.updatedAt).toLocaleDateString("es-MX"),
    ]);

    const BOM = "\uFEFF";
    const csv =
      BOM +
      headers.map(escapeCSV).join(",") +
      "\n" +
      rows.map((row) => row.map(escapeCSV).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ordenes_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    console.error("Export CSV error:", e);
    return NextResponse.json({ error: "Error al exportar CSV" }, { status: 500 });
  }
}
