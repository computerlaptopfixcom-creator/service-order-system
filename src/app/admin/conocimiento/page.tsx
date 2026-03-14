"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  Clock,
  Eye,
  CheckCircle,
  Lightbulb,
  Stethoscope,
  Wrench,
  Package,
  Tag,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { DEVICE_TYPES } from "@/types/order";

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
  createdAt: string;
  updatedAt: string;
}

interface PartItem {
  id: string;
  name: string;
  cost: number;
  stock: number;
}

const PROBLEM_CATEGORIES = [
  "Hardware",
  "Software",
  "Sistema Operativo",
  "Conectividad",
  "Almacenamiento",
  "Pantalla",
  "Audio",
  "Batería/Energía",
  "Rendimiento",
  "Virus/Malware",
  "Otro",
];

export default function ConocimientoPage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [availableParts, setAvailableParts] = useState<PartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedDeviceType, setSelectedDeviceType] = useState("Todos");

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    symptoms: "",
    diagnosis: "",
    solution: "",
    requiredParts: [] as string[],
    estimatedMinutes: 60,
    deviceType: "",
    category: "",
    keywords: [] as string[],
  });
  const [keywordInput, setKeywordInput] = useState("");

  // Expanded articles for viewing details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    Promise.all([
      fetch("/api/knowledge").then((r) => r.json()).catch(() => []),
      fetch("/api/parts").then((r) => r.json()).catch(() => []),
    ]).then(([articlesData, partsData]) => {
      setArticles(Array.isArray(articlesData) ? articlesData : []);
      setAvailableParts(Array.isArray(partsData) ? partsData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      symptoms: "",
      diagnosis: "",
      solution: "",
      requiredParts: [],
      estimatedMinutes: 60,
      deviceType: "",
      category: "",
      keywords: [],
    });
    setKeywordInput("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (article: KnowledgeArticle) => {
    setEditingId(article.id);
    setFormData({
      title: article.title,
      symptoms: article.symptoms,
      diagnosis: article.diagnosis,
      solution: article.solution,
      requiredParts: article.requiredParts ? JSON.parse(article.requiredParts) : [],
      estimatedMinutes: article.estimatedMinutes,
      deviceType: article.deviceType || "",
      category: article.category || "",
      keywords: article.keywords ? article.keywords.split(",").map(k => k.trim()) : [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !formData.keywords.includes(kw)) {
      setFormData({ ...formData, keywords: [...formData.keywords, kw] });
    }
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) => {
    setFormData({ ...formData, keywords: formData.keywords.filter(k => k !== kw) });
  };

  const togglePart = (partName: string) => {
    if (formData.requiredParts.includes(partName)) {
      setFormData({ ...formData, requiredParts: formData.requiredParts.filter(p => p !== partName) });
    } else {
      setFormData({ ...formData, requiredParts: [...formData.requiredParts, partName] });
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.symptoms.trim() || !formData.diagnosis.trim() || !formData.solution.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/knowledge/${editingId}` : "/api/knowledge";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        if (editingId) {
          setArticles(articles.map(a => a.id === editingId ? data : a));
        } else {
          setArticles([data, ...articles]);
        }
        resetForm();
      }
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const article = articles.find(a => a.id === id);
    if (!confirm(`¿Eliminar el artículo "${article?.title}"? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
      if (res.ok) {
        setArticles(articles.filter(a => a.id !== id));
        if (editingId === id) resetForm();
      }
    } catch {
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  const filteredArticles = articles.filter(a => {
    const matchesSearch = search === "" ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.symptoms.toLowerCase().includes(search.toLowerCase()) ||
      a.keywords.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "Todas" || a.category === selectedCategory;
    const matchesDevice = selectedDeviceType === "Todos" || a.deviceType === selectedDeviceType;
    return matchesSearch && matchesCategory && matchesDevice;
  });

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Base de Conocimientos
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Artículos de problemas comunes y soluciones para agilizar diagnósticos
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Artículo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card !p-4 border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Artículos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{articles.length}</p>
        </div>
        <div className="card !p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Veces Aplicados</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {articles.reduce((sum, a) => sum + a.useCount, 0)}
          </p>
        </div>
        <div className="card !p-4 border-l-4 border-l-purple-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Vistas Totales</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {articles.reduce((sum, a) => sum + a.views, 0)}
          </p>
        </div>
        <div className="card !p-4 border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Categorías</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {new Set(articles.map(a => a.category).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {editingId ? <Pencil className="h-5 w-5 text-primary-600" /> : <Plus className="h-5 w-5 text-primary-600" />}
              {editingId ? "Editar Artículo" : "Nuevo Artículo"}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título del Problema *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field w-full"
                  placeholder="Ej: Laptop no enciende - sin señales de vida"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Dispositivo
                  </label>
                  <select
                    value={formData.deviceType}
                    onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Todos</option>
                    {DEVICE_TYPES.map(dt => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Sin categoría</option>
                    {PROBLEM_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Stethoscope className="h-4 w-4 inline mr-1" />
                  Síntomas *
                </label>
                <textarea
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  className="input-field w-full resize-none"
                  rows={3}
                  placeholder="Describe los síntomas que presenta el equipo..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Lightbulb className="h-4 w-4 inline mr-1" />
                  Diagnóstico *
                </label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="input-field w-full resize-none"
                  rows={3}
                  placeholder="Pasos para diagnosticar el problema..."
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Wrench className="h-4 w-4 inline mr-1" />
                  Solución *
                </label>
                <textarea
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  className="input-field w-full resize-none"
                  rows={4}
                  placeholder="Pasos para solucionar el problema..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Tiempo Estimado (minutos)
                </label>
                <input
                  type="number"
                  value={formData.estimatedMinutes}
                  onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 60 })}
                  className="input-field w-32"
                  min="5"
                  step="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Package className="h-4 w-4 inline mr-1" />
                  Piezas Necesarias
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                  {availableParts.length === 0 ? (
                    <p className="text-xs text-gray-400">No hay piezas en inventario</p>
                  ) : (
                    availableParts.map(part => (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => togglePart(part.name)}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          formData.requiredParts.includes(part.name)
                            ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {part.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="h-4 w-4 inline mr-1" />
                  Palabras Clave
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                    className="input-field flex-1"
                    placeholder="Agregar palabra clave..."
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="btn-secondary px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {formData.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.keywords.map(kw => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        {kw}
                        <button onClick={() => removeKeyword(kw)} className="hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button onClick={resetForm} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.symptoms.trim() || !formData.diagnosis.trim() || !formData.solution.trim() || isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : editingId ? (
                "Guardar Cambios"
              ) : (
                "Crear Artículo"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full"
              placeholder="Buscar por título, síntomas o palabras clave..."
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field w-full sm:w-40"
          >
            <option value="Todas">Todas las categorías</option>
            {PROBLEM_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={selectedDeviceType}
            onChange={(e) => setSelectedDeviceType(e.target.value)}
            className="input-field w-full sm:w-40"
          >
            <option value="Todos">Todos los dispositivos</option>
            {DEVICE_TYPES.map(dt => (
              <option key={dt} value={dt}>{dt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-medium">No se encontraron artículos</h3>
            <p className="text-gray-500 text-sm">
              {articles.length === 0
                ? "Crea el primer artículo de la base de conocimientos"
                : "Prueba con otros términos de búsqueda o filtros"}
            </p>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div
              key={article.id}
              className={`card !p-0 overflow-hidden transition-all ${
                expandedId === article.id ? "ring-2 ring-primary-200" : ""
              }`}
            >
              {/* Header - Always visible */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {article.category && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-700">
                          {article.category}
                        </span>
                      )}
                      {article.deviceType && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gray-100 text-gray-600">
                          {article.deviceType}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{article.title}</h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.symptoms}</p>

                    {/* Tags */}
                    {article.keywords && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {article.keywords.split(",").slice(0, 5).map(kw => (
                          <span key={kw} className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded">
                            {kw.trim()}
                          </span>
                        ))}
                        {article.keywords.split(",").length > 5 && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded">
                            +{article.keywords.split(",").length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {article.useCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(article.estimatedMinutes)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(article); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(article.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {expandedId === article.id ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === article.id && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Diagnosis */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          Diagnóstico
                        </h5>
                        <button
                          onClick={() => copyToClipboard(article.diagnosis, "Diagnóstico")}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Copiar"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{article.diagnosis}</p>
                    </div>

                    {/* Solution */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                          <Wrench className="h-4 w-4 text-blue-500" />
                          Solución
                        </h5>
                        <button
                          onClick={() => copyToClipboard(article.solution, "Solución")}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Copiar"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{article.solution}</p>
                    </div>

                    {/* Parts & Info */}
                    <div className="space-y-3">
                      {article.requiredParts && JSON.parse(article.requiredParts).length > 0 && (
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <h5 className="font-semibold text-gray-700 text-sm flex items-center gap-1 mb-2">
                            <Package className="h-4 w-4 text-purple-500" />
                            Piezas Necesarias
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {JSON.parse(article.requiredParts).map((part: string) => (
                              <span
                                key={part}
                                className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded-full"
                              >
                                {part}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <h5 className="font-semibold text-gray-700 text-sm mb-2">Información</h5>
                        <div className="space-y-1 text-xs text-gray-500">
                          <p>
                            <span className="font-medium">Tiempo estimado:</span>{" "}
                            {formatTime(article.estimatedMinutes)}
                          </p>
                          <p>
                            <span className="font-medium">Vistas:</span> {article.views}
                          </p>
                          <p>
                            <span className="font-medium">Veces aplicado:</span> {article.useCount}
                          </p>
                          <p>
                            <span className="font-medium">Actualizado:</span>{" "}
                            {new Date(article.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
