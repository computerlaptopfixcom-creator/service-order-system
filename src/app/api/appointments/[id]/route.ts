import { NextRequest, NextResponse } from "next/server";
import { getAppointmentById, saveAppointment, deleteAppointment } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const existing = await getAppointmentById(id);

        if (!existing) {
            return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
        }

        const body = await request.json();

        const updated = await saveAppointment({
            ...existing,
            ...body,
            id, // protect ID
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[api/appointments/[id]] PUT error:", error);
        return NextResponse.json(
            { error: "Error al actualizar cita" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const existing = await getAppointmentById(id);

        if (!existing) {
            return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
        }

        const success = await deleteAppointment(id);
        
        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
        }
    } catch (error) {
        console.error("[api/appointments/[id]] DELETE error:", error);
        return NextResponse.json(
            { error: "Error al eliminar cita" },
            { status: 500 }
        );
    }
}
