import { NextRequest, NextResponse } from "next/server";
import {
    getAppointments,
    getAppointmentsByDateRange,
    getTodayAppointments,
    saveAppointment,
    Appointment,
} from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const today = searchParams.get("today");

        let appointments: Appointment[];

        if (today === "true") {
            appointments = await getTodayAppointments();
        } else if (startDate && endDate) {
            appointments = await getAppointmentsByDateRange(
                new Date(startDate),
                new Date(endDate)
            );
        } else {
            appointments = await getAppointments();
        }

        return NextResponse.json(appointments);
    } catch (error) {
        console.error("[api/appointments] GET error:", error);
        return NextResponse.json(
            { error: "Error al obtener citas" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.title?.trim()) {
            return NextResponse.json(
                { error: "El t\u00edtulo es requerido" },
                { status: 400 }
            );
        }
        if (!body.type) {
            return NextResponse.json(
                { error: "El tipo de cita es requerido" },
                { status: 400 }
            );
        }
        if (!body.date) {
            return NextResponse.json(
                { error: "La fecha es requerida" },
                { status: 400 }
            );
        }
        if (!body.time) {
            return NextResponse.json(
                { error: "La hora es requerida" },
                { status: 400 }
            );
        }
        if (!body.customerName?.trim()) {
            return NextResponse.json(
                { error: "El nombre del cliente es requerido" },
                { status: 400 }
            );
        }
        if (!body.customerPhone?.trim()) {
            return NextResponse.json(
                { error: "El tel\u00e9fono del cliente es requerido" },
                { status: 400 }
            );
        }

        const appointment = {
            id: uuidv4(),
            title: body.title.trim(),
            type: body.type,
            date: body.date,
            time: body.time,
            duration: body.duration || 30,
            notes: body.notes?.trim() || undefined,
            customerName: body.customerName.trim(),
            customerPhone: body.customerPhone.trim(),
            orderId: body.orderId || undefined,
            orderNumber: body.orderNumber || undefined,
            status: body.status || "pendiente",
        };

        const saved = await saveAppointment(appointment);
        return NextResponse.json(saved, { status: 201 });
    } catch (error) {
        console.error("[api/appointments] POST error:", error);
        return NextResponse.json(
            { error: "Error al crear cita" },
            { status: 500 }
        );
    }
}
