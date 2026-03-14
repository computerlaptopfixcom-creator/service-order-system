import { prisma } from "./core";

export type AppointmentType = "diagnostico" | "entrega" | "seguimiento";
export type AppointmentStatus = "pendiente" | "confirmada" | "completada" | "cancelada";

export interface Appointment {
    id: string;
    title: string;
    type: AppointmentType;
    date: string; // ISO date string
    time: string; // HH:mm format
    duration: number; // minutes
    notes?: string;
    customerName: string;
    customerPhone: string;
    orderId?: string;
    orderNumber?: string;
    status: AppointmentStatus;
    createdAt: string;
    updatedAt: string;
}

export async function getAppointments(): Promise<Appointment[]> {
    try {
        const appointments = await prisma.appointment.findMany({
            orderBy: [{ date: "asc" }, { time: "asc" }],
        });
        return appointments.map((a) => ({
            ...a,
            type: a.type as AppointmentType,
            status: a.status as AppointmentStatus,
            notes: a.notes || undefined,
            orderId: a.orderId || undefined,
            orderNumber: a.orderNumber || undefined,
            date: a.date.toISOString(),
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
        }));
    } catch {
        return [];
    }
}

export async function getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date
): Promise<Appointment[]> {
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: [{ date: "asc" }, { time: "asc" }],
        });
        return appointments.map((a) => ({
            ...a,
            type: a.type as AppointmentType,
            status: a.status as AppointmentStatus,
            notes: a.notes || undefined,
            orderId: a.orderId || undefined,
            orderNumber: a.orderNumber || undefined,
            date: a.date.toISOString(),
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
        }));
    } catch {
        return [];
    }
}

export async function getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return getAppointmentsByDateRange(startOfDay, endOfDay);
}

export async function getTodayAppointments(): Promise<Appointment[]> {
    const today = new Date();
    return getAppointmentsByDate(today);
}

export async function getAppointmentById(id: string): Promise<Appointment | undefined> {
    try {
        const appointment = await prisma.appointment.findUnique({ where: { id } });
        if (!appointment) return undefined;
        return {
            ...appointment,
            type: appointment.type as AppointmentType,
            status: appointment.status as AppointmentStatus,
            notes: appointment.notes || undefined,
            orderId: appointment.orderId || undefined,
            orderNumber: appointment.orderNumber || undefined,
            date: appointment.date.toISOString(),
            createdAt: appointment.createdAt.toISOString(),
            updatedAt: appointment.updatedAt.toISOString(),
        };
    } catch {
        return undefined;
    }
}

export async function saveAppointment(appointment: Omit<Appointment, "createdAt" | "updatedAt"> & { createdAt?: string; updatedAt?: string }): Promise<Appointment> {
    const { createdAt, updatedAt, ...data } = appointment;
    const saved = await prisma.appointment.upsert({
        where: { id: appointment.id },
        update: {
            ...data,
            date: new Date(data.date),
            notes: data.notes || null,
            orderId: data.orderId || null,
            orderNumber: data.orderNumber || null,
        },
        create: {
            ...data,
            date: new Date(data.date),
            notes: data.notes || null,
            orderId: data.orderId || null,
            orderNumber: data.orderNumber || null,
        },
    });
    return {
        ...saved,
        type: saved.type as AppointmentType,
        status: saved.status as AppointmentStatus,
        notes: saved.notes || undefined,
        orderId: saved.orderId || undefined,
        orderNumber: saved.orderNumber || undefined,
        date: saved.date.toISOString(),
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
    };
}

export async function deleteAppointment(id: string): Promise<boolean> {
    try {
        await prisma.appointment.delete({ where: { id } });
        return true;
    } catch {
        return false;
    }
}

export async function getAppointmentsByOrderId(orderId: string): Promise<Appointment[]> {
    try {
        const appointments = await prisma.appointment.findMany({
            where: { orderId },
            orderBy: [{ date: "asc" }, { time: "asc" }],
        });
        return appointments.map((a) => ({
            ...a,
            type: a.type as AppointmentType,
            status: a.status as AppointmentStatus,
            notes: a.notes || undefined,
            orderId: a.orderId || undefined,
            orderNumber: a.orderNumber || undefined,
            date: a.date.toISOString(),
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
        }));
    } catch {
        return [];
    }
}
