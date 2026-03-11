"use client";

import { useEffect, useState } from "react";
import { Save, Settings, Download, Building2, Paintbrush, BookText } from "lucide-react";
import { CURRENCIES } from "@/lib/currencies";
import { useToast } from "@/components/ui/ToastProvider";

interface BusinessSettings {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  whatsapp: string;
  logoUrl: string;
  brandColor: string;
  lowStockThreshold: number;
  currency: string;
  schedule: string;
  whatsappTemplateCreated: string;
  whatsappTemplateReady: string;
  whatsappTemplateBudget: string;
  countryCode: string;
  taxId: string;
  website: string;
  termsAndConditions: string;
  cancellationFee: number;
}

type TabType = "profile" | "system" | "legal";

export default function ConfiguracionPage() {
  const { toast, success, error } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: "Computer Laptop Fix",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    whatsapp: "",
    logoUrl: "",
    brandColor: "#2563eb",
    lowStockThreshold: 3,
    currency: "MXN",
    schedule: "",
    whatsappTemplateCreated: "",
    whatsappTemplateReady: "",
    whatsappTemplateBudget: "",
    countryCode: "52",
    taxId: "",
    website: "",
    termsAndConditions: "",
    cancellationFee: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const currentCurrency = CURRENCIES.find(c => c.code === settings.currency) || CURRENCIES[0];

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => {
      setSettings(data);
      setLoading(false);
    }).catch(() => {
      error("Error al cargar la configuración");
      setLoading(false);
    });
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: (name === "lowStockThreshold" || name === "cancellationFee") ? Number(value) : value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      error("La imagen es muy pesada. Máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setSettings(prev => ({ ...prev, logoUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      success("Configuración guardada correctamente");

      // Scroll to top to show feedback
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => window.location.reload(), 1500);
    } catch {
      error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success("Respaldo descargado correctamente");
    } catch {
      error("Error al descargar el respaldo");
    } finally {
      setDownloading(false);
    }
  };

  const SaveButton = () => (
    <div className="flex justify-end pt-4">
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 shadow-lg"
      >
        {saving ? (
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? "Guardando..." : "Guardar Cambios"}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configuración
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Administra los datos de tu negocio y personaliza el sistema.
          </p>
        </div>
        <button
          onClick={handleBackup}
          disabled={downloading}
          className="w-full sm:w-auto btn-secondary flex items-center justify-center gap-2"
        >
          {downloading ? (
            <div className="h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Descargar Respaldo (ZIP)
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("profile")}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap
              ${activeTab === "profile"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            `}
          >
            <Building2 className={`
              -ml-0.5 mr-2 h-5 w-5 transition-colors duration-200
              ${activeTab === "profile" ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500"}
            `} />
            Perfil del Negocio
          </button>

          <button
            onClick={() => setActiveTab("system")}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap
              ${activeTab === "system"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            `}
          >
            <Paintbrush className={`
              -ml-0.5 mr-2 h-5 w-5 transition-colors duration-200
              ${activeTab === "system" ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500"}
            `} />
            Sistema y Apariencia
          </button>

          <button
            onClick={() => setActiveTab("legal")}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap
              ${activeTab === "legal"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            `}
          >
            <BookText className={`
              -ml-0.5 mr-2 h-5 w-5 transition-colors duration-200
              ${activeTab === "legal" ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500"}
            `} />
            Legal y Comunicaciones
          </button>
        </nav>
      </div>

      {/* Tab 1: Perfil del Negocio */}
      {activeTab === "profile" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-500" />
              Identidad
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del negocio
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={settings.businessName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: FixLab Reparaciones"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RFC / Tax ID
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={settings.taxId || ""}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="RFC del negocio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={settings.website || ""}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="https://tunsitio.com"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Contacto</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono Fijo / Móvil
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={settings.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Teléfono de contacto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={settings.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="email@negocio.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp (con código de país)
                </label>
                <div className="flex gap-2">
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">+</span>
                    <input
                      type="text"
                      name="countryCode"
                      value={settings.countryCode}
                      onChange={handleChange}
                      className="input-field pl-7"
                      placeholder="52"
                    />
                  </div>
                  <input
                    type="text"
                    name="whatsapp"
                    value={settings.whatsapp}
                    onChange={handleChange}
                    className="input-field flex-1"
                    placeholder="Número de WhatsApp"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Ej: +52 para México, +1 para USA. Usado para enlaces directos de WhatsApp.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Ubicación</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calle y Número
                </label>
                <input
                  type="text"
                  name="address"
                  value={settings.address}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Av. Principal #123"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad / Municipio
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={settings.city || ""}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ciudad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado / Provincia
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={settings.state || ""}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Estado"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={settings.zipCode || ""}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="00000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={settings.country || ""}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="País"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Horarios</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horario de atención al público
              </label>
              <textarea
                name="schedule"
                value={settings.schedule}
                onChange={handleChange}
                rows={3}
                className="input-field resize-none"
                placeholder="Lunes - Viernes: 9:00 AM - 6:00 PM&#10;Sábado: 9:00 AM - 2:00 PM&#10;Domingo: Cerrado"
              />
              <p className="text-xs text-gray-400 mt-1">
                Aparecerá tal cual en el sitio público. Usa saltos de línea para separar días.
              </p>
            </div>
          </div>

          <SaveButton />
        </div>
      )}

      {/* Tab 2: Sistema y Apariencia */}
      {activeTab === "system" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Paintbrush className="h-5 w-5 text-gray-500" />
              Apariencia y Marca
            </h3>

            <div className="space-y-6">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logotipo
                </label>
                <div className="flex items-start gap-4">
                  {settings.logoUrl ? (
                    <div className="relative group w-32 h-32 shrink-0 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, logoUrl: "" }))}
                        className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                        title="Eliminar logo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 shrink-0 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                      <span className="text-xs text-center px-2">Sin Logo</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Subir imagen</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-colors"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Recomendado: PNG con fondo transparente. Máximo 2MB.
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500 text-xs">O usa una URL</span>
                      </div>
                    </div>

                    <input
                      type="url"
                      name="logoUrl"
                      value={settings.logoUrl}
                      onChange={handleChange}
                      className="input-field text-xs py-2"
                      placeholder="https://ejemplo.com/logo.png"
                    />
                  </div>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color Principal de la Marca
                </label>
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <input
                    type="color"
                    name="brandColor"
                    value={settings.brandColor || "#2563eb"}
                    onChange={handleChange}
                    className="h-12 w-16 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      name="brandColor"
                      value={settings.brandColor || "#2563eb"}
                      onChange={handleChange}
                      className="input-field font-mono text-sm uppercase"
                      placeholder="#2563eb"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Este color se usará en botones, encabezados y detalles importantes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Configuración del Sistema</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda Predeterminada
                </label>
                <select
                  name="currency"
                  value={settings.currency || "MXN"}
                  onChange={handleChange}
                  className="input-field"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} — {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Se usará en precios, reportes y recibos.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Umbral de Stock Bajo
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={settings.lowStockThreshold || 3}
                    onChange={handleChange}
                    className="input-field pr-16"
                    min="1"
                    placeholder="3"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">unidades</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Te avisaremos cuando el inventario llegue a este número.
                </p>
              </div>


            </div>
          </div>

          <SaveButton />
        </div>
      )}

      {/* Tab 3: Legal y Comunicaciones */}
      {activeTab === "legal" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookText className="h-5 w-5 text-gray-500" />
              Términos Legales
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo de Cancelación / Diagnóstico
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{currentCurrency.symbol}</span>
                  <input

                    type="number"
                    name="cancellationFee"
                    value={settings.cancellationFee || 0}
                    onChange={handleChange}
                    className="input-field pl-7"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Este monto se cobrará si el cliente rechaza el presupuesto (Costo de revisión).
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Términos y Condiciones del Servicio
                </label>
                <textarea
                  name="termsAndConditions"
                  value={settings.termsAndConditions || ""}
                  onChange={handleChange}
                  rows={8}
                  className="input-field resize-none leading-relaxed text-sm"
                  placeholder="Ej: 1. El diagnóstico tiene un costo de...&#10;2. No nos hacemos responsables por pérdida de información...&#10;3. Equipos abandonados..."
                />
                <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-md text-blue-700">
                  ℹ️ Este texto aparecerá impreso al pie de los recibos de recepción y será visible para el cliente al consultar su orden en línea.
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Plantillas de Mensajes</h3>
            <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
              Personaliza los mensajes automáticos de WhatsApp. <br />
              <span className="font-medium text-gray-700">Variables disponibles:</span> <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-xs text-primary-600 font-mono">{"{nombre}"}</code> <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-xs text-primary-600 font-mono">{"{equipo}"}</code> <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-xs text-primary-600 font-mono">{"{orden}"}</code> <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-xs text-primary-600 font-mono">{"{link}"}</code>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👋 Al recibir equipo (Crear Orden)
                </label>
                <textarea
                  name="whatsappTemplateCreated"
                  value={settings.whatsappTemplateCreated}
                  onChange={handleChange}
                  rows={6}
                  className="input-field resize-none"
                  placeholder="Hola {nombre}, su equipo {equipo} ha sido recibido..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ✅ Cuando el trabajo está terminado
                </label>
                <textarea
                  name="whatsappTemplateReady"
                  value={settings.whatsappTemplateReady}
                  onChange={handleChange}
                  rows={6}
                  className="input-field resize-none"
                  placeholder="Hola {nombre}, su equipo {equipo} está listo para recoger..."
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 Presupuesto preparado
              </label>
              <textarea
                name="whatsappTemplateBudget"
                value={settings.whatsappTemplateBudget}
                onChange={handleChange}
                rows={6}
                className="input-field resize-none"
                placeholder="Hola {nombre}, hemos preparado un presupuesto para tu equipo {equipo}. Revisa los detalles y apruébalo aquí: {link}"
              />
              <p className="text-xs text-gray-400 mt-1">
                La variable <code className="bg-gray-100 px-1 rounded">{"\{link\}"}</code> se reemplaza automáticamente con el enlace directo al portal del cliente.
              </p>
            </div>
          </div>

          <SaveButton />
        </div>
      )
      }
    </div >
  );
}
