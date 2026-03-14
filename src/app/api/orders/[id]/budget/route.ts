import { NextRequest, NextResponse } from "next/server";
import { getOrderById, saveOrder } from "@/lib/storage";
import { verifyClientToken } from "@/lib/client-token";
import { createNotification } from "@/lib/notifications";
import { OrderStatus } from "@/types/order";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("str_client_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const verified = verifyClientToken(token);
    if (!verified) {
      return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
    }

    const order = await getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Verify the token matches this order
    if (order.orderNumber.toLowerCase() !== verified.orderNumber.toLowerCase()) {
      return NextResponse.json({ error: "No autorizado para esta orden" }, { status: 403 });
    }

    if (order.budgetStatus !== "pending") {
      return NextResponse.json({ error: "No hay presupuesto pendiente de aprobación" }, { status: 400 });
    }

    const body = await request.json();
    const { action, clientNote, approvalSignature } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    if (action === "approve" && !approvalSignature) {
      return NextResponse.json({ error: "Se requiere firma para aprobar el presupuesto" }, { status: 400 });
    }

    const now = new Date().toISOString();
    if (action === "approve") {
      const newStatus: OrderStatus = "reparando";
      let statusHistory = order.statusHistory || [];

      if (newStatus !== order.status) {
        statusHistory = [
          ...statusHistory,
          {
            from: order.status,
            to: newStatus,
            date: now,
            note: "Presupuesto aceptado por cliente",
          },
        ];
      }

      const updated = {
        ...order,
        status: newStatus,
        statusHistory,
        budgetStatus: "approved" as const,
        budgetRespondedAt: now,
        clientNote: clientNote || undefined,
        approvalSignature: approvalSignature,
        updatedAt: now,
      };

      const saved = await saveOrder(updated);

      createNotification(
        "budget_approved",
        "Presupuesto Aprobado",
        `El cliente aprobó el presupuesto. Orden en reparación.`,
        order.id,
        order.orderNumber
      );

      return NextResponse.json({ success: true, budgetStatus: saved.budgetStatus });
    } else {
      // REJECT LOGIC
      const { getSettings } = await import("@/lib/storage/settings");
      const settings = await getSettings();
      const cancellationFee = settings.cancellationFee || 0;

      const newStatus: OrderStatus = "cancelado";
      let statusHistory = order.statusHistory || [];
      if (newStatus !== order.status) {
        statusHistory = [
          ...statusHistory,
          {
            from: order.status,
            to: newStatus,
            date: now,
            note: "Presupuesto rechazado por cliente. Aplicado costo de cancelación.",
          },
        ];
      }

      const updated = {
        ...order,
        status: newStatus,
        statusHistory,
        budgetStatus: "rejected" as const,
        budgetRespondedAt: now,
        clientNote: clientNote || undefined,
        // Apply cancellation fee
        estimatedCost: cancellationFee,
        partsCost: 0,
        selectedServices: [], // Clear services as they are rejected
        updatedAt: now,
      };

      const saved = await saveOrder(updated);

      createNotification(
        "budget_rejected",
        "Presupuesto Rechazado",
        `El cliente rechazó el presupuesto. Se aplicó cargo de cancelación de $${cancellationFee}`,
        order.id,
        order.orderNumber
      );

      return NextResponse.json({ success: true, budgetStatus: saved.budgetStatus });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}
