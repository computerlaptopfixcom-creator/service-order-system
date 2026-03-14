import { NextResponse } from "next/server";
import { getOrders } from "@/lib/storage";

export const dynamic = "force-dynamic";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  lastVisit: string;
  totalSpent: number;
  totalPaid: number;
  orderIds: string[];
}

export async function GET() {
  try {
    const orders = await getOrders();

    // Group orders by customer phone (unique identifier)
    const customersMap = new Map<string, Customer>();

    for (const order of orders) {
      const phone = order.customerPhone?.trim();
      if (!phone) continue;

      const existing = customersMap.get(phone);

      if (existing) {
        // Update existing customer
        existing.totalOrders += 1;
        existing.totalSpent += order.estimatedCost || 0;
        existing.totalPaid += order.totalPaid || 0;
        existing.orderIds.push(order.id);

        // Update last visit if this order is more recent
        if (new Date(order.createdAt) > new Date(existing.lastVisit)) {
          existing.lastVisit = order.createdAt;
          // Update name/email if the newer order has them
          if (order.customerName) existing.name = order.customerName;
          if (order.customerEmail) existing.email = order.customerEmail;
        }
      } else {
        // Create new customer
        customersMap.set(phone, {
          id: phone, // Use phone as unique ID
          name: order.customerName || "",
          phone: phone,
          email: order.customerEmail || "",
          totalOrders: 1,
          lastVisit: order.createdAt,
          totalSpent: order.estimatedCost || 0,
          totalPaid: order.totalPaid || 0,
          orderIds: [order.id],
        });
      }
    }

    // Convert to array and sort by lastVisit descending
    const customers = Array.from(customersMap.values()).sort(
      (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
    );

    return NextResponse.json({
      customers,
      total: customers.length,
    });
  } catch (error) {
    console.error("[api/customers] GET error:", error);
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 });
  }
}
