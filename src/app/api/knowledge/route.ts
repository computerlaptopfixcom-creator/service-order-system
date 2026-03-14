import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeArticles, createKnowledgeArticle } from "@/lib/storage";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const articles = await getKnowledgeArticles();
        return NextResponse.json(articles);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener artículos" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.title?.trim()) {
            return NextResponse.json({ error: "El título es requerido" }, { status: 400 });
        }
        if (!body.symptoms?.trim()) {
            return NextResponse.json({ error: "Los síntomas son requeridos" }, { status: 400 });
        }
        if (!body.diagnosis?.trim()) {
            return NextResponse.json({ error: "El diagnóstico es requerido" }, { status: 400 });
        }
        if (!body.solution?.trim()) {
            return NextResponse.json({ error: "La solución es requerida" }, { status: 400 });
        }

        const article = await createKnowledgeArticle({
            title: body.title.trim(),
            symptoms: body.symptoms.trim(),
            diagnosis: body.diagnosis.trim(),
            solution: body.solution.trim(),
            requiredParts: body.requiredParts || [],
            estimatedMinutes: body.estimatedMinutes || 60,
            deviceType: body.deviceType?.trim() || undefined,
            category: body.category?.trim() || undefined,
            keywords: body.keywords || [],
        });

        return NextResponse.json(article, { status: 201 });
    } catch (error) {
        console.error("Error creating knowledge article:", error);
        return NextResponse.json({ error: "Error al crear artículo" }, { status: 500 });
    }
}
