import { prisma } from "./core";
import { ServiceOrder } from "@/types/order";

// Helper to map Prisma Order to ServiceOrder
function mapOrder(o: any): ServiceOrder {
    return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail: o.customerEmail || "",
        deviceType: o.deviceType,
        deviceBrand: o.deviceBrand,
        deviceModel: o.deviceModel,
        serialNumber: o.serialNumber || "",
        accessories: o.accessories || "",
        problemDescription: o.problemDescription,
        diagnosis: o.diagnosis || "",
        detailedDiagnosis: o.detailedDiagnosis || "",
        estimatedCost: o.estimatedCost,
        partsCost: o.partsCost,
        estimatedDelivery: o.estimatedDelivery || "",
        signature: o.signature || "",
        devicePhotos: o.photos ? o.photos.map((p: any) => p.url) : [],
        usedParts: o.usedParts ? o.usedParts.map((p: any) => ({
            partId: p.partId || "",
            partName: p.partName,
            quantity: p.quantity,
            unitCost: p.unitCost
        })) : [],
        selectedServices: o.selectedServices ? o.selectedServices.map((s: any) => ({
            id: s.serviceId || "",
            name: s.serviceName,
            basePrice: s.basePrice,
            linkedPartId: s.linkedPartId || undefined,
            linkedPartName: s.linkedPartName || undefined,
            linkedPartCost: s.linkedPartCost || undefined
        })) : [],
        payments: o.payments ? o.payments.map((p: any) => ({
            id: p.id,
            amount: p.amount,
            method: p.method as any,
            date: typeof p.date === 'string' ? p.date : p.date.toISOString(),
            note: p.note || undefined
        })) : [],
        paymentStatus: o.paymentStatus as any || "PENDIENTE",
        totalPaid: o.payments ? o.payments.reduce((sum: number, p: any) => sum + p.amount, 0) : 0,
        balanceDue: (o.estimatedCost || 0) - (o.payments ? o.payments.reduce((sum: number, p: any) => sum + p.amount, 0) : 0),
        status: o.status as any,
        statusHistory: o.statusHistory ? o.statusHistory.map((h: any) => ({
            from: h.from,
            to: h.to,
            date: typeof h.date === 'string' ? h.date : h.date.toISOString(),
            note: h.note || undefined
        })) : [],
        internalNotes: o.notes ? o.notes.map((n: any) => ({
            id: n.id,
            text: n.text,
            date: typeof n.date === 'string' ? n.date : n.date.toISOString()
        })) : [],
        budgetStatus: o.budgetStatus as any,
        budgetSentAt: o.budgetSentAt ? (typeof o.budgetSentAt === 'string' ? o.budgetSentAt : o.budgetSentAt.toISOString()) : undefined,
        budgetRespondedAt: o.budgetRespondedAt ? (typeof o.budgetRespondedAt === 'string' ? o.budgetRespondedAt : o.budgetRespondedAt.toISOString()) : undefined,
        budgetNote: o.budgetNote || undefined,
        clientNote: o.clientNote || undefined,
        approvalSignature: o.approvalSignature || undefined,
        createdAt: typeof o.createdAt === 'string' ? o.createdAt : o.createdAt.toISOString(),
        updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : o.updatedAt.toISOString(),
    };
}

const includeAll = {
    usedParts: true,
    selectedServices: true,
    statusHistory: true,
    notes: true,
    photos: true,
    payments: true,
};

export async function getOrders(): Promise<ServiceOrder[]> {
    try {
        const orders = await prisma.order.findMany({
            include: includeAll,
            orderBy: { createdAt: 'desc' }
        });
        return orders.map(mapOrder);
    } catch (e) {
        console.error("Error fetching orders:", e);
        return [];
    }
}

export async function getOrderById(id: string): Promise<ServiceOrder | undefined> {
    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: includeAll
        });
        if (!order) return undefined;
        return mapOrder(order);
    } catch (e) {
        console.error("getOrderById error:", e);
        return undefined;
    }
}

export async function getOrderByNumber(orderNumber: string): Promise<ServiceOrder | undefined> {
    try {
        const order = await prisma.order.findFirst({
            where: { orderNumber },
            include: includeAll
        });
        if (!order) return undefined;
        return mapOrder(order);
    } catch {
        return undefined;
    }
}

export async function searchOrdersByPhone(phone: string): Promise<ServiceOrder[]> {
    try {
        const clean = phone.replace(/\D/g, "");
        const orders = await prisma.order.findMany({
            where: {
                customerPhone: { contains: clean }
            },
            include: includeAll
        });
        return orders.map(mapOrder);
    } catch {
        return [];
    }
}

export async function searchOrdersBySerial(serial: string): Promise<ServiceOrder[]> {
    try {
        const orders = await prisma.order.findMany({
            where: {
                serialNumber: { contains: serial }
            },
            include: includeAll
        });
        return orders.map(mapOrder);
    } catch {
        return [];
    }
}

export async function saveOrder(order: ServiceOrder): Promise<ServiceOrder> {
    const {
        id,
        usedParts,
        selectedServices,
        statusHistory,
        internalNotes,
        devicePhotos,
        payments,
        createdAt,
        updatedAt,
        // These are computed fields, don't save them
        totalPaid: _totalPaid,
        balanceDue: _balanceDue,
        ...scalars
    } = order;

    // Prepare scalar data for Prisma
    const dataPayload = {
        orderNumber: scalars.orderNumber,
        customerName: scalars.customerName,
        customerPhone: scalars.customerPhone,
        deviceType: scalars.deviceType,
        deviceBrand: scalars.deviceBrand,
        deviceModel: scalars.deviceModel,
        problemDescription: scalars.problemDescription,
        estimatedCost: scalars.estimatedCost,
        partsCost: scalars.partsCost,
        status: scalars.status,
        budgetStatus: scalars.budgetStatus || "none",
        paymentStatus: scalars.paymentStatus || "PENDIENTE",

        // Nullable fields
        customerEmail: scalars.customerEmail || null,
        serialNumber: scalars.serialNumber || null,
        accessories: scalars.accessories || null,
        diagnosis: scalars.diagnosis || null,
        detailedDiagnosis: scalars.detailedDiagnosis || null,
        estimatedDelivery: scalars.estimatedDelivery || null,
        signature: scalars.signature || null,
        budgetSentAt: scalars.budgetSentAt ? new Date(scalars.budgetSentAt) : null,
        budgetRespondedAt: scalars.budgetRespondedAt ? new Date(scalars.budgetRespondedAt) : null,
        budgetNote: scalars.budgetNote || null,
        clientNote: scalars.clientNote || null,
        approvalSignature: scalars.approvalSignature || null,
    };

    // Relation data builders
    const usedPartsData = (usedParts || []).map(p => ({
        partId: p.partId || null,
        partName: p.partName,
        quantity: p.quantity,
        unitCost: p.unitCost
    }));

    const selectedServicesData = (selectedServices || []).map(s => ({
        serviceId: s.id || null,
        serviceName: s.name,
        basePrice: s.basePrice,
        linkedPartId: s.linkedPartId || null,
        linkedPartName: s.linkedPartName || null,
        linkedPartCost: s.linkedPartCost || null
    }));

    const statusHistoryData = (statusHistory || []).map(h => ({
        from: h.from,
        to: h.to,
        date: new Date(h.date),
        note: h.note || null
    }));

    const notesData = (internalNotes || []).map(n => ({
        id: n.id,
        text: n.text,
        date: new Date(n.date)
    }));

    const photosData = (devicePhotos || []).map(url => ({ url }));

    const paymentsData = (payments || []).map(p => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        date: new Date(p.date),
        note: p.note || null
    }));

    // Transaction to ensure atomicity
    const saved = await prisma.$transaction(async (tx) => {
        const exists = await tx.order.findUnique({ where: { id } });

        if (exists) {
            // Delete old relations (recreate pattern)
            await tx.orderPart.deleteMany({ where: { orderId: id } });
            await tx.orderService.deleteMany({ where: { orderId: id } });
            await tx.statusHistory.deleteMany({ where: { orderId: id } });
            await tx.note.deleteMany({ where: { orderId: id } });
            await tx.devicePhoto.deleteMany({ where: { orderId: id } });
            await tx.payment.deleteMany({ where: { orderId: id } });

            return await tx.order.update({
                where: { id },
                data: {
                    ...dataPayload,
                    updatedAt: new Date(),
                    usedParts: { create: usedPartsData },
                    selectedServices: { create: selectedServicesData },
                    statusHistory: { create: statusHistoryData },
                    notes: { create: notesData },
                    photos: { create: photosData },
                    payments: { create: paymentsData },
                },
                include: includeAll
            });
        } else {
            return await tx.order.create({
                data: {
                    id,
                    ...dataPayload,
                    createdAt: createdAt ? new Date(createdAt) : new Date(),
                    updatedAt: new Date(),
                    usedParts: { create: usedPartsData },
                    selectedServices: { create: selectedServicesData },
                    statusHistory: { create: statusHistoryData },
                    notes: { create: notesData },
                    photos: { create: photosData },
                    payments: { create: paymentsData },
                },
                include: includeAll
            });
        }
    });

    return mapOrder(saved);
}

export async function deleteOrder(id: string): Promise<boolean> {
    try {
        await prisma.order.delete({ where: { id } });
        return true;
    } catch {
        return false;
    }
}

export async function generateOrderNumber(): Promise<string> {
    const now = new Date();
    const prefix = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

    const lastOrder = await prisma.order.findFirst({
        where: { orderNumber: { startsWith: prefix } },
        orderBy: { orderNumber: 'desc' }
    });

    let nextNum = 1;
    if (lastOrder) {
        const parts = lastOrder.orderNumber.split("-");
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num)) nextNum = num + 1;
    }

    return `${prefix}-${String(nextNum).padStart(4, "0")}`;
}
