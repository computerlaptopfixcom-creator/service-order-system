import { prisma } from "./core";

export interface KnowledgeArticle {
    id: string;
    title: string;
    symptoms: string;
    diagnosis: string;
    solution: string;
    requiredParts?: string; // JSON array
    estimatedMinutes: number;
    deviceType?: string;
    category?: string;
    keywords: string;
    views: number;
    useCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface KnowledgeArticleInput {
    title: string;
    symptoms: string;
    diagnosis: string;
    solution: string;
    requiredParts?: string[];
    estimatedMinutes: number;
    deviceType?: string;
    category?: string;
    keywords: string[];
}

function mapArticle(article: any): KnowledgeArticle {
    return {
        id: article.id,
        title: article.title,
        symptoms: article.symptoms,
        diagnosis: article.diagnosis,
        solution: article.solution,
        requiredParts: article.requiredParts,
        estimatedMinutes: article.estimatedMinutes,
        deviceType: article.deviceType,
        category: article.category,
        keywords: article.keywords,
        views: article.views,
        useCount: article.useCount,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
    };
}

export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
    try {
        const articles = await prisma.knowledgeArticle.findMany({
            orderBy: { updatedAt: "desc" },
        });
        return articles.map(mapArticle);
    } catch (e) {
        console.error("Error fetching knowledge articles:", e);
        return [];
    }
}

export async function getKnowledgeArticle(id: string): Promise<KnowledgeArticle | null> {
    try {
        const article = await prisma.knowledgeArticle.findUnique({
            where: { id },
        });
        return article ? mapArticle(article) : null;
    } catch (e) {
        console.error("Error fetching knowledge article:", e);
        return null;
    }
}

export async function createKnowledgeArticle(input: KnowledgeArticleInput): Promise<KnowledgeArticle> {
    const article = await prisma.knowledgeArticle.create({
        data: {
            title: input.title,
            symptoms: input.symptoms,
            diagnosis: input.diagnosis,
            solution: input.solution,
            requiredParts: input.requiredParts ? JSON.stringify(input.requiredParts) : null,
            estimatedMinutes: input.estimatedMinutes,
            deviceType: input.deviceType,
            category: input.category,
            keywords: input.keywords.join(","),
        },
    });
    return mapArticle(article);
}

export async function updateKnowledgeArticle(id: string, input: Partial<KnowledgeArticleInput>): Promise<KnowledgeArticle | null> {
    try {
        const data: any = {};
        if (input.title !== undefined) data.title = input.title;
        if (input.symptoms !== undefined) data.symptoms = input.symptoms;
        if (input.diagnosis !== undefined) data.diagnosis = input.diagnosis;
        if (input.solution !== undefined) data.solution = input.solution;
        if (input.requiredParts !== undefined) data.requiredParts = JSON.stringify(input.requiredParts);
        if (input.estimatedMinutes !== undefined) data.estimatedMinutes = input.estimatedMinutes;
        if (input.deviceType !== undefined) data.deviceType = input.deviceType;
        if (input.category !== undefined) data.category = input.category;
        if (input.keywords !== undefined) data.keywords = input.keywords.join(",");

        const article = await prisma.knowledgeArticle.update({
            where: { id },
            data,
        });
        return mapArticle(article);
    } catch (e) {
        console.error("Error updating knowledge article:", e);
        return null;
    }
}

export async function deleteKnowledgeArticle(id: string): Promise<boolean> {
    try {
        await prisma.knowledgeArticle.delete({ where: { id } });
        return true;
    } catch {
        return false;
    }
}

export async function incrementArticleViews(id: string): Promise<void> {
    try {
        await prisma.knowledgeArticle.update({
            where: { id },
            data: { views: { increment: 1 } },
        });
    } catch (e) {
        console.error("Error incrementing article views:", e);
    }
}

export async function incrementArticleUseCount(id: string): Promise<void> {
    try {
        await prisma.knowledgeArticle.update({
            where: { id },
            data: { useCount: { increment: 1 } },
        });
    } catch (e) {
        console.error("Error incrementing article use count:", e);
    }
}

export async function searchKnowledgeArticles(query: string): Promise<KnowledgeArticle[]> {
    try {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

        const articles = await prisma.knowledgeArticle.findMany({
            orderBy: { useCount: "desc" },
        });

        // Score-based search
        const scored = articles.map(article => {
            let score = 0;
            const titleLower = article.title.toLowerCase();
            const symptomsLower = article.symptoms.toLowerCase();
            const keywordsLower = article.keywords.toLowerCase();
            const diagnosisLower = article.diagnosis.toLowerCase();
            const deviceTypeLower = (article.deviceType || "").toLowerCase();

            for (const term of searchTerms) {
                // Title match = high score
                if (titleLower.includes(term)) score += 10;
                // Keywords match = high score
                if (keywordsLower.includes(term)) score += 8;
                // Symptoms match
                if (symptomsLower.includes(term)) score += 5;
                // Diagnosis match
                if (diagnosisLower.includes(term)) score += 3;
                // Device type match
                if (deviceTypeLower.includes(term)) score += 4;
            }

            return { article, score };
        });

        // Filter by minimum score and sort
        return scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(s => mapArticle(s.article));
    } catch (e) {
        console.error("Error searching knowledge articles:", e);
        return [];
    }
}
