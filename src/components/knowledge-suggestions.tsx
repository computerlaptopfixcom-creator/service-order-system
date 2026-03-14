"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, ChevronDown, ChevronUp, Clock, Copy, Check, Lightbulb, Wrench, Package, X } from "lucide-react";

interface KnowledgeArticle {
  id: string;
  title: string;
  symptoms: string;
  diagnosis: string;
  solution: string;
  requiredParts?: string;
  estimatedMinutes: number;
  deviceType?: string;
  category?: string;
  keywords: string;
  views: number;
  useCount: number;
}

interface KnowledgeSuggestionsProps {
  problemDescription: string;
  deviceType?: string;
  onApplyDiagnosis?: (diagnosis: string, solution: string) => void;
}

export function KnowledgeSuggestions({
  problemDescription,
  deviceType,
  onApplyDiagnosis,
}: KnowledgeSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const searchArticles = useCallback(async () => {
    if (!problemDescription || problemDescription.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      let query = problemDescription;
      if (deviceType) {
        query = `${deviceType} ${query}`;
      }

      const res = await fetch(`/api/knowledge/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.slice(0, 5));
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [problemDescription, deviceType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchArticles();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchArticles]);

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleApply = async (article: KnowledgeArticle) => {
    if (onApplyDiagnosis) {
      onApplyDiagnosis(article.diagnosis, article.solution);
      setAppliedId(article.id);

      try {
        await fetch(`/api/knowledge/${article.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "incrementUseCount" }),
        });
      } catch {
        // Silent fail
      }

      setTimeout(() => setAppliedId(null), 2000);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (suggestions.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/30 active:bg-amber-100 dark:active:bg-amber-900/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {loading ? "Buscando sugerencias..." : `${suggestions.length} artículo${suggestions.length !== 1 ? "s" : ""} relacionado${suggestions.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-amber-200 dark:border-amber-800 p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            suggestions.map((article) => (
              <div
                key={article.id}
                className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-gray-700 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                  aria-expanded={expandedArticle === article.id}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-750 active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {article.category && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                            {article.category}
                          </span>
                        )}
                        {article.deviceType && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            {article.deviceType}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white dark:text-white line-clamp-1">
                        {article.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {article.symptoms}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(article.estimatedMinutes)}
                      </span>
                      {expandedArticle === article.id ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                  </div>
                </button>

                {expandedArticle === article.id && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-3 space-y-3 bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Lightbulb className="h-3 w-3 text-amber-500" />
                          Diagnóstico
                        </h5>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(article.diagnosis, `diag-${article.id}`)}
                          aria-label="Copiar diagnóstico"
                          className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                          title="Copiar diagnóstico"
                        >
                          {copiedField === `diag-${article.id}` ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                        {article.diagnosis}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Wrench className="h-3 w-3 text-blue-500" />
                          Solución
                        </h5>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(article.solution, `sol-${article.id}`)}
                          aria-label="Copiar solución"
                          className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                          title="Copiar solución"
                        >
                          {copiedField === `sol-${article.id}` ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                        {article.solution}
                      </p>
                    </div>

                    {article.requiredParts && JSON.parse(article.requiredParts).length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                          <Package className="h-3 w-3 text-purple-500" />
                          Piezas necesarias
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {JSON.parse(article.requiredParts).map((part: string) => (
                            <span
                              key={part}
                              className="px-1.5 py-0.5 text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded"
                            >
                              {part}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {onApplyDiagnosis && (
                      <button
                        type="button"
                        onClick={() => handleApply(article)}
                        className={`w-full py-2.5 min-h-[44px] text-xs font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 ${
                          appliedId === article.id
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                        }`}
                      >
                        {appliedId === article.id ? (
                          <>
                            <Check className="h-3 w-3" />
                            Aplicado
                          </>
                        ) : (
                          <>
                            <Wrench className="h-3 w-3" />
                            Aplicar al diagnóstico
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
