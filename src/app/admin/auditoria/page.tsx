"use client";

import { useState, useEffect } from "react";
import { ScrollText, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditEntry {
  id: string;
  userId: string;
  user: { username: string; displayName: string };
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Inicio de sesión",
  LOGOUT: "Cierre de sesión",
  LOGIN_FAILED: "Intento fallido",
  PASSWORD_CHANGED: "Cambió contraseña",
  FORCE_PASSWORD_CHANGE: "Cambio forzado de contraseña",
  CREATE_ORDER: "Creó orden",
  UPDATE_ORDER: "Editó orden",
  UPDATE_ORDER_STATUS: "Cambió estado",
  DELETE_ORDER: "Eliminó orden",
  APPROVE_BUDGET: "Aprobó presupuesto",
  REJECT_BUDGET: "Rechazó presupuesto",
  REGISTER_PAYMENT: "Registró pago",
  CREATE_PART: "Creó parte",
  UPDATE_PART: "Editó parte",
  DELETE_PART: "Eliminó parte",
  CREATE_SERVICE: "Creó servicio",
  UPDATE_SERVICE: "Editó servicio",
  DELETE_SERVICE: "Eliminó servicio",
  UPDATE_SETTINGS: "Editó configuración",
  CREATE_USER: "Creó usuario",
  UPDATE_USER: "Editó usuario",
  DEACTIVATE_USER: "Desactivó usuario",
  DOWNLOAD_BACKUP: "Descargó respaldo",
  DOWNLOAD_EXPORT: "Exportó datos",
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-green-100 text-green-700",
  LOGOUT: "bg-gray-100 text-gray-600",
  LOGIN_FAILED: "bg-red-100 text-red-700",
  PASSWORD_CHANGED: "bg-yellow-100 text-yellow-700",
  FORCE_PASSWORD_CHANGE: "bg-yellow-100 text-yellow-700",
  CREATE_ORDER: "bg-blue-100 text-blue-700",
  UPDATE_ORDER_STATUS: "bg-purple-100 text-purple-700",
  REGISTER_PAYMENT: "bg-emerald-100 text-emerald-700",
  CREATE_USER: "bg-indigo-100 text-indigo-700",
  DEACTIVATE_USER: "bg-red-100 text-red-700",
  DOWNLOAD_BACKUP: "bg-orange-100 text-orange-700",
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filterEntity, setFilterEntity] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const limit = 25;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      if (filterEntity) params.set("entity", filterEntity);
      if (filterAction) params.set("action", filterAction);

      const res = await fetch(`/api/audit?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page, filterEntity, filterAction]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ScrollText className="h-7 w-7 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bitácora de Auditoría</h1>
          <p className="text-sm text-gray-500">Registro de todas las acciones del sistema ({total} eventos)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-gray-400" />
        <select value={filterEntity} onChange={(e) => { setFilterEntity(e.target.value); setPage(0); }} className="input-field w-auto text-sm">
          <option value="">Todas las entidades</option>
          <option value="auth">Autenticación</option>
          <option value="order">Órdenes</option>
          <option value="part">Partes</option>
          <option value="service">Servicios</option>
          <option value="settings">Configuración</option>
          <option value="user">Usuarios</option>
          <option value="payment">Pagos</option>
          <option value="backup">Respaldos</option>
        </select>
        <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(0); }} className="input-field w-auto text-sm">
          <option value="">Todas las acciones</option>
          <option value="LOGIN">Login</option>
          <option value="CREATE_ORDER">Crear orden</option>
          <option value="UPDATE_ORDER_STATUS">Cambiar estado</option>
          <option value="REGISTER_PAYMENT">Registrar pago</option>
          <option value="CREATE_USER">Crear usuario</option>
          <option value="DEACTIVATE_USER">Desactivar usuario</option>
          <option value="DOWNLOAD_BACKUP">Descargar respaldo</option>
        </select>
      </div>

      {/* Logs table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No hay eventos registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acción</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entidad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "medium" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{log.user.displayName}</span>
                      <p className="text-xs text-gray-400">{log.user.username}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-600"}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 capitalize">{log.entity}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{log.entityId ? log.entityId.slice(0, 8) + "…" : "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{log.ipAddress || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-500">Página {page + 1} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-secondary text-sm flex items-center gap-1 disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="btn-secondary text-sm flex items-center gap-1 disabled:opacity-50">
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
