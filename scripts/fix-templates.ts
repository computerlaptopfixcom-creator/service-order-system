import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Plantillas profesionales por defecto
    const defaultCreated = "Hola *{nombre}*, recibimos tu equipo *{equipo}*. Tu número de orden es *{orden}*. Te notificaremos en cuanto tengamos el diagnóstico. 🔧";

    const defaultReady = "Hola *{nombre}*, buenas noticias. Tu equipo *{equipo}* (Orden: *{orden}*) ya está listo ✅. Puedes pasar a recogerlo en nuestro horario de servicio. ¡Gracias por tu confianza!";

    console.log("Actualizando plantillas de WhatsApp...");

    await prisma.settings.upsert({
        where: { id: 1 },
        update: {
            whatsappTemplateCreated: defaultCreated,
            whatsappTemplateReady: defaultReady
        },
        create: {
            // Valores mínimos por si no existiera la configuración (raro)
            id: 1,
            businessName: "Mi Taller",
            whatsappTemplateCreated: defaultCreated,
            whatsappTemplateReady: defaultReady
        }
    });

    console.log("✅ Plantillas actualizadas correctamente.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
