import { NextRequest, NextResponse } from "next/server";
import { getOrderById, saveOrder, deleteOrder } from "@/lib/storage";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error("[api/orders/[id]] GET error:", error);
    return NextResponse.json({ error: "Error al obtener orden" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const now = new Date().toISOString();

    // Block advancing to reparando/listo/entregado if budget not approved
    const blockedStatuses = ["reparando", "listo", "entregado"];
    if (body.status && body.status !== order.status && blockedStatuses.includes(body.status)) {
      const bs = order.budgetStatus || "none";
      if (bs === "pending" || bs === "rejected") {
        return NextResponse.json({ error: "No se puede avanzar sin aprobación del presupuesto" }, { status: 400 });
      }
    }

    // Track status changes in history
    let statusHistory = order.statusHistory || [];
    if (body.status && body.status !== order.status) {
      statusHistory = [
        ...statusHistory,
        {
          from: order.status,
          to: body.status,
          date: now,
          note: body.statusChangeNote || undefined,
        },
      ];
    }

    const updated = {
      ...order,
      ...body,
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      statusHistory,
      internalNotes: body.internalNotes || order.internalNotes || [],
      usedParts: body.usedParts || order.usedParts || [],
      selectedServices: body.selectedServices || order.selectedServices || [],
      devicePhotos: body.devicePhotos || order.devicePhotos || [],
      payments: body.payments || order.payments || [],
      updatedAt: now,
    };

    const saved = await saveOrder(updated);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("[api/orders/[id]] PUT error:", error);
    return NextResponse.json({ error: "Error al actualizar orden" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteOrder(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ message: "Orden eliminada" });
  } catch (error) {
    console.error("[api/orders/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Error al eliminar orden" }, { status: 500 });
  }
}
