import { prisma } from "./core";

export interface Part {
    id: string;
    name: string;
    cost: number;
    stock: number;
    timesUsed?: number;
    createdAt: string;
    updatedAt: string;
}

export async function getParts(): Promise<Part[]> {
    try {
        const parts = await prisma.part.findMany({ orderBy: { name: 'asc' } });
        return parts.map(p => ({
            ...p,
            timesUsed: p.timesUsed,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        }));
    } catch {
        return [];
    }
}

export async function getPartById(id: string): Promise<Part | undefined> {
    try {
        const part = await prisma.part.findUnique({ where: { id } });
        if (!part) return undefined;
        return {
            ...part,
            timesUsed: part.timesUsed,
            createdAt: part.createdAt.toISOString(),
            updatedAt: part.updatedAt.toISOString(),
        };
    } catch {
        return undefined;
    }
}

export async function savePart(part: Part): Promise<Part> {
    const { createdAt, updatedAt, ...data } = part;
    const saved = await prisma.part.upsert({
        where: { id: part.id },
        update: {
            ...data,
        },
        create: {
            ...data,
        },
    });
    return {
        ...saved,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
    };
}

export async function deletePart(id: string): Promise<boolean> {
    try {
        await prisma.part.delete({ where: { id } });
        return true;
    } catch {
        return false;
    }
}

export async function reducePartStock(partId: string, quantity: number): Promise<Part | null> {
    try {
        // Transaction to ensure read-then-write consistency
        return await prisma.$transaction(async (tx) => {
            const part = await tx.part.findUnique({ where: { id: partId } });
            if (!part) return null;

            const newStock = Math.max(0, part.stock - quantity);

            const updated = await tx.part.update({
                where: { id: partId },
                data: {
                    stock: newStock,
                    timesUsed: { increment: 1 },
                },
            });

            return {
                ...updated,
                createdAt: updated.createdAt.toISOString(),
                updatedAt: updated.updatedAt.toISOString(),
            };
        });
    } catch {
        return null;
    }
}

export async function restorePartStock(partId: string, quantity: number): Promise<Part | null> {
    try {
        const part = await prisma.part.update({
            where: { id: partId },
            data: {
                stock: { increment: quantity },
            },
        });
        return {
            ...part,
            createdAt: part.createdAt.toISOString(),
            updatedAt: part.updatedAt.toISOString(),
        };
    } catch {
        return null;
    }
}
