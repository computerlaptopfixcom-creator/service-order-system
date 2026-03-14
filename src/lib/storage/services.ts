import { prisma } from "./core";

export interface RepairService {
    id: string;
    name: string;
    description?: string;
    category?: string;
    basePrice: number;
    linkedPartId?: string;
    linkedPartName?: string;
    linkedPartCost?: number;
    createdAt: string;
    updatedAt: string;
}

export async function getServices(): Promise<RepairService[]> {
    try {
        const services = await prisma.service.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return services.map(s => ({
            ...s,
            description: s.description || undefined,
            category: s.category || undefined,
            linkedPartId: s.linkedPartId || undefined,
            linkedPartName: s.linkedPartName || undefined,
            linkedPartCost: s.linkedPartCost || undefined,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
        }));
    } catch {
        return [];
    }
}

export async function saveService(service: RepairService): Promise<RepairService> {
    const { createdAt, updatedAt, ...data } = service;
    const saved = await prisma.service.upsert({
        where: { id: service.id },
        update: {
            name: data.name,
            description: data.description || null,
            category: data.category || null,
            basePrice: data.basePrice,
            linkedPartId: data.linkedPartId || null,
            linkedPartName: data.linkedPartName || null,
            linkedPartCost: data.linkedPartCost || null,
        },
        create: {
            id: data.id,
            name: data.name,
            description: data.description || null,
            category: data.category || null,
            basePrice: data.basePrice,
            linkedPartId: data.linkedPartId || null,
            linkedPartName: data.linkedPartName || null,
            linkedPartCost: data.linkedPartCost || null,
        },
    });
    return {
        ...saved,
        description: saved.description || undefined,
        category: saved.category || undefined,
        linkedPartId: saved.linkedPartId || undefined,
        linkedPartName: saved.linkedPartName || undefined,
        linkedPartCost: saved.linkedPartCost || undefined,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
    };
}

export async function deleteService(id: string): Promise<boolean> {
    try {
        await prisma.service.delete({ where: { id } });
        return true;
    } catch {
        return false;
    }
}
