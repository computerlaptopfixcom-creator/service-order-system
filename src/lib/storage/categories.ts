import { prisma } from "./core";

export interface Category {
    id: string;
    name: string;
}

export async function getCategories(): Promise<Category[]> {
    try {
        const categories = await prisma.category.findMany();
        return categories;
    } catch (e) {
        console.error("Error fetching categories:", e);
        return [];
    }
}

export async function saveCategory(category: Category): Promise<Category> {
    const saved = await prisma.category.upsert({
        where: { id: category.id },
        update: { name: category.name },
        create: { id: category.id, name: category.name },
    });
    return saved;
}

export async function deleteCategory(id: string): Promise<boolean> {
    try {
        await prisma.category.delete({ where: { id } });
        return true;
    } catch {
        return false;
    }
}
