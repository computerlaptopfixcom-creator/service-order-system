import { NextRequest, NextResponse } from "next/server";
import { searchKnowledgeArticles } from "@/lib/storage";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q") || "";

        if (!query.trim()) {
            return NextResponse.json([]);
        }

        const articles = await searchKnowledgeArticles(query);
        return NextResponse.json(articles);
    } catch (error) {
        console.error("Error searching knowledge articles:", error);
        return NextResponse.json({ error: "Error en la búsqueda" }, { status: 500 });
    }
}
