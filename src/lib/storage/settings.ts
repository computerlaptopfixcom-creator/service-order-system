import { prisma } from "./core";

export interface BusinessSettings {
    businessName: string;
    phone: string;
    email: string;
    address: string;
    whatsapp: string;
    logoUrl: string;
    brandColor: string;
    lowStockThreshold: number;
    currency: string;
    schedule: string;
    whatsappTemplateCreated: string;
    whatsappTemplateReady: string;
    countryCode: string;
    cancellationFee: number;
}

const DEFAULT_SETTINGS: BusinessSettings = {
    businessName: "Mi Taller",
    phone: "",
    email: "",
    address: "",
    whatsapp: "",
    logoUrl: "",
    brandColor: "#2563eb",
    lowStockThreshold: 3,
    currency: "MXN",
    schedule: "Lun - Vie: 9:00 - 18:00\nSábado: 9:00 - 14:00",
    whatsappTemplateCreated:
        "Hola {nombre}, su equipo {equipo} ha sido recibido. Su número de orden es: {orden}. Le mantendremos informado sobre el progreso.",
    whatsappTemplateReady:
        "Hola {nombre}, su equipo {equipo} está listo para recoger. Orden: {orden}. ¡Gracias por su preferencia!",
    countryCode: "52",
    cancellationFee: 0,
};

export async function getSettings(): Promise<BusinessSettings> {
    try {
        const settings = await prisma.settings.findUnique({
            where: { id: 1 },
        });
        if (!settings) return DEFAULT_SETTINGS;

        // Remove DB metadata if necessary, but here we just return the fields match
        const { id, ...rest } = settings;
        return rest as BusinessSettings;
    } catch (e) {
        console.error("Error fetching settings:", e);
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(settings: BusinessSettings): Promise<BusinessSettings> {
    try {
        const saved = await prisma.settings.upsert({
            where: { id: 1 },
            update: { ...settings },
            create: { id: 1, ...settings },
        });
        const { id, ...rest } = saved;
        return rest as BusinessSettings;
    } catch (e) {
        console.error("Error saving settings:", e);
        throw e;
    }
}
