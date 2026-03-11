import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), "data");

function readJson(filename: string) {
    const file = path.join(DATA_DIR, filename);
    if (!fs.existsSync(file)) return null;
    try {
        return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch (e) {
        console.error(`Error reading ${filename}`, e);
        return null;
    }
}

async function main() {
    console.log("Starting migration from JSON to SQLite...");

    // 1. Settings
    const settingsData = readJson("settings.json");
    if (settingsData) {
        console.log("Migrating Settings...");
        await prisma.settings.upsert({
            where: { id: 1 },
            update: {
                businessName: settingsData.businessName || "Mi Taller",
                phone: settingsData.phone || "",
                email: settingsData.email || "",
                address: settingsData.address || "",
                whatsapp: settingsData.whatsapp || "",
                logoUrl: settingsData.logoUrl || "",
                brandColor: settingsData.brandColor || "#2563eb",
                lowStockThreshold: settingsData.lowStockThreshold || 3,
                currency: settingsData.currency || "MXN",
                schedule: settingsData.schedule || "",
                whatsappTemplateCreated: settingsData.whatsappTemplateCreated || "",
                whatsappTemplateReady: settingsData.whatsappTemplateReady || "",
                countryCode: settingsData.countryCode || "52",
            },
            create: {
                id: 1,
                businessName: settingsData.businessName || "Mi Taller",
                phone: settingsData.phone || "",
                email: settingsData.email || "",
                address: settingsData.address || "",
                whatsapp: settingsData.whatsapp || "",
                logoUrl: settingsData.logoUrl || "",
                brandColor: settingsData.brandColor || "#2563eb",
                lowStockThreshold: settingsData.lowStockThreshold || 3,
                currency: settingsData.currency || "MXN",
                schedule: settingsData.schedule || "",
                whatsappTemplateCreated: settingsData.whatsappTemplateCreated || "",
                whatsappTemplateReady: settingsData.whatsappTemplateReady || "",
                countryCode: settingsData.countryCode || "52",
            },
        });
    }

    // 2. Categories
    const categoriesData = readJson("categories.json");
    if (Array.isArray(categoriesData)) {
        console.log(`Migrating ${categoriesData.length} Categories...`);
        for (const cat of categoriesData) {
            await prisma.category.upsert({
                where: { id: cat.id },
                update: { name: cat.name },
                create: { id: cat.id, name: cat.name },
            });
        }
    }

    // 3. Parts
    const partsData = readJson("parts.json");
    if (Array.isArray(partsData)) {
        console.log(`Migrating ${partsData.length} Parts...`);
        for (const part of partsData) {
            await prisma.part.upsert({
                where: { id: part.id },
                update: {
                    name: part.name,
                    cost: part.cost,
                    stock: part.stock,
                    timesUsed: part.timesUsed || 0,
                    createdAt: part.createdAt ? new Date(part.createdAt) : new Date(),
                    updatedAt: part.updatedAt ? new Date(part.updatedAt) : new Date(),
                },
                create: {
                    id: part.id,
                    name: part.name,
                    cost: part.cost,
                    stock: part.stock,
                    timesUsed: part.timesUsed || 0,
                    createdAt: part.createdAt ? new Date(part.createdAt) : new Date(),
                    updatedAt: part.updatedAt ? new Date(part.updatedAt) : new Date(),
                },
            });
        }
    }

    // 4. Services
    const servicesData = readJson("services.json");
    if (Array.isArray(servicesData)) {
        console.log(`Migrating ${servicesData.length} Services...`);
        for (const service of servicesData) {
            await prisma.service.upsert({
                where: { id: service.id },
                update: {
                    name: service.name,
                    description: service.description,
                    category: service.category,
                    basePrice: service.basePrice,
                    linkedPartId: service.linkedPartId,
                    linkedPartName: service.linkedPartName,
                    linkedPartCost: service.linkedPartCost,
                    createdAt: service.createdAt ? new Date(service.createdAt) : new Date(),
                    updatedAt: service.updatedAt ? new Date(service.updatedAt) : new Date(),
                },
                create: {
                    id: service.id,
                    name: service.name,
                    description: service.description,
                    category: service.category,
                    basePrice: service.basePrice,
                    linkedPartId: service.linkedPartId,
                    linkedPartName: service.linkedPartName,
                    linkedPartCost: service.linkedPartCost,
                    createdAt: service.createdAt ? new Date(service.createdAt) : new Date(),
                    updatedAt: service.updatedAt ? new Date(service.updatedAt) : new Date(),
                },
            });
        }
    }

    // 5. Orders
    const ordersData = readJson("orders.json");
    if (Array.isArray(ordersData)) {
        console.log(`Migrating ${ordersData.length} Orders...`);
        for (const order of ordersData) {
            // Prepare nested data
            const statusHistory = Array.isArray(order.statusHistory)
                ? order.statusHistory.map((h: any) => ({
                    from: h.from || "",
                    to: h.to || "",
                    date: h.date ? new Date(h.date) : new Date(),
                    note: h.note || "",
                }))
                : [];

            const notes = Array.isArray(order.internalNotes)
                ? order.internalNotes.map((n: any) => ({
                    id: n.id, // preserve ID if existing
                    text: n.text || "",
                    date: n.date ? new Date(n.date) : new Date(),
                }))
                : [];

            const photos = Array.isArray(order.devicePhotos)
                ? order.devicePhotos.map((url: string) => ({
                    url: url,
                }))
                : [];

            const usedParts = Array.isArray(order.usedParts)
                ? order.usedParts.map((p: any) => ({
                    partName: p.partName || "",
                    quantity: p.quantity || 1,
                    unitCost: p.unitCost || 0,
                    partId: p.partId || null, // Might be broken link if part deleted
                }))
                : [];

            const selectedServices = Array.isArray(order.selectedServices)
                ? order.selectedServices.map((s: any) => ({
                    serviceName: s.name || "",
                    basePrice: s.basePrice || 0,
                    linkedPartId: s.linkedPartId || null,
                    linkedPartName: s.linkedPartName || null,
                    linkedPartCost: s.linkedPartCost || null,
                    serviceId: s.id || null, // Might be broken link if service deleted
                }))
                : [];

            await prisma.order.upsert({
                where: { id: order.id },
                update: {
                    // Updating complex relations is hard in one go, usually standard update ignores them or needs explicit disconnect/connect.
                    // For migration, upsert is okay but relations might duplicate if run twice.
                    // We assume this is a one-time migration or handling duplication is too complex for this script.
                    // Using deleteMany for relations before create is safer for idempotency.
                    status: order.status,
                    updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
                },
                create: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    customerEmail: order.customerEmail,
                    deviceType: order.deviceType,
                    deviceBrand: order.deviceBrand,
                    deviceModel: order.deviceModel,
                    serialNumber: order.serialNumber,
                    accessories: order.accessories,
                    problemDescription: order.problemDescription,
                    diagnosis: order.diagnosis,
                    detailedDiagnosis: order.detailedDiagnosis,
                    estimatedCost: order.estimatedCost,
                    partsCost: order.partsCost,
                    estimatedDelivery: order.estimatedDelivery,
                    signature: order.signature,
                    status: order.status,
                    budgetStatus: order.budgetStatus || "none",
                    budgetSentAt: order.budgetSentAt ? new Date(order.budgetSentAt) : null,
                    budgetRespondedAt: order.budgetRespondedAt ? new Date(order.budgetRespondedAt) : null,
                    budgetNote: order.budgetNote,
                    clientNote: order.clientNote,
                    approvalSignature: order.approvalSignature,
                    createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
                    updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),

                    statusHistory: {
                        create: statusHistory,
                    },
                    notes: {
                        create: notes,
                    },
                    photos: {
                        create: photos,
                    },
                    usedParts: {
                        create: usedParts,
                    },
                    selectedServices: {
                        create: selectedServices,
                    },
                },
            });
        }
    }

    console.log("Migration completed successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
