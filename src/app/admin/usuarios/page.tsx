"use client";

import { useState, useEffect, useMemo } from "react";
import { UserCog, Plus, Shield, Eye, EyeOff, Check, X, Pencil, Search, Loader2 } from "lucide-react";

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  tecnico: "Técnico",
  recepcion: "Recepción",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  tecnico: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  recepcion: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // States for UX improvements
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success'|'error' }>({ show: false, msg: "", type: "success" });

  const [form, setForm] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
    role: "tecnico",
    mustChangePassword: true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const resetForm = () => {
    setForm({ username: "", displayName: "", email: "", password: "", role: "tecnico", mustChangePassword: true });
    setEditingId(null);
    setShowForm(false);
    setError("");
    setSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingId) {
        const body: Record<string, unknown> = {
          displayName: form.displayName,
          email: form.email,
          role: form.role,
        };
        if (form.password) body.password = form.password;

        const res = await fetch(`/api/users/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al actualizar");
          setSaving(false);
          return;
        }
        showToast("Usuario actualizado exitosamente");
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al crear usuario");
          setSaving(false);
          return;
        }
        showToast("Usuario creado exitosamente");
      }

      resetForm();
      fetchUsers();
    } catch {
      setError("Error de conexión");
      setSaving(false);
    }
  };

  const toggleActive = async (user: User) => {
    const action = user.isActive ? "desactivar" : "activar";
    if (!window.confirm(`¿Estás seguro de que deseas ${action} al usuario ${user.displayName}?`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) {
        showToast(`Usuario ${user.isActive ? "desactivado" : "activado"} exitosamente.`);
        fetchUsers();
      } else {
        const data = await res.json();
        showToast(data.error || "Error al cambiar estado", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    }
  };

  const startEdit = (user: User) => {
    setForm({
      username: user.username,
      displayName: user.displayName,
      email: user.email || "",
      password: "",
      role: user.role,
      mustChangePassword: false,
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  return (
    <div className="relative">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-all duration-300 transform translate-y-0 opacity-100 ${
          toast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
        }`}>
          {toast.type === 'success' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 dark:bg-primary-900/30 p-2.5 rounded-xl">
            <UserCog className="h-7 w-7 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gestión de usuarios y roles del sistema</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Barra de Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Modal / Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overlay-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden sidebar-slide-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingId ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Usuario</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="input-field disabled:opacity-50"
                    placeholder="ej: juan.perez"
                    disabled={!!editingId}
                    required={!editingId}
                  />
                  {editingId && <p className="text-[10px] text-gray-500 mt-1">El username no se puede cambiar.</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nombre Completo</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className="input-field"
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {editingId ? "Nueva Contraseña" : "Contraseña"}
                    {editingId && <span className="text-gray-400 font-normal ml-1">(opcional)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="input-field pr-10"
                      placeholder={editingId ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
                      required={!editingId}
                      minLength={editingId ? 0 : 6}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className={editingId ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Rol de Sistema</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
                    <option value="admin">Administrador (Acceso total)</option>
                    <option value="tecnico">Técnico (Órdenes, Inventario y Diagnósticos)</option>
                    <option value="recepcion">Recepción (Pagos, Clientes y Reportes)</option>
                  </select>
                </div>
                {!editingId && (
                  <div className="md:col-span-2 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <input
                      type="checkbox"
                      id="mustChange"
                      checked={form.mustChangePassword}
                      onChange={(e) => setForm({ ...form, mustChangePassword: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4 transition-colors cursor-pointer"
                    />
                    <label htmlFor="mustChange" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      Requerir que el usuario cambie su contraseña al iniciar sesión por primera vez
                    </label>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-5 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-start gap-3 border border-red-100 dark:border-red-900/30">
                  <X className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="mt-8 flex items-center justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary min-w-[140px] flex items-center justify-center gap-2 disabled:bg-primary-400">
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                  ) : (
                    <>{editingId ? "Guardar Cambios" : "Crear Usuario"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center bg-gray-50/50 dark:bg-gray-800/50">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {searchTerm ? "No se encontraron resultados" : "No hay usuarios"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
              {searchTerm ? `No hay usuarios que coincidan con "${searchTerm}".` : "El sistema aún no tiene usuarios registrados."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre y Contacto</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Último Acceso</th>
                  <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors ${!user.isActive ? "bg-gray-50/50 dark:bg-gray-800/50" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${!user.isActive ? 'bg-gray-200 text-gray-500 dark:bg-gray-700' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400'}`}>
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className={`text-sm font-semibold font-mono ${!user.isActive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {user.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className={`text-sm font-medium ${!user.isActive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>{user.displayName}</p>
                      {user.email && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`status-badge ${!user.isActive ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' : ROLE_COLORS[user.role] || "bg-gray-100 text-gray-700"}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full"><Check className="h-3.5 w-3.5" /> Activo</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full"><X className="h-3.5 w-3.5" /> Inactivo</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "Nunca"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => startEdit(user)} 
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" 
                          title="Editar / Cambiar Rol"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => toggleActive(user)} 
                          className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                            user.isActive 
                              ? "hover:bg-red-50 hover:text-red-600 text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400" 
                              : "hover:bg-green-50 hover:text-green-600 text-gray-400 dark:hover:bg-green-900/30 dark:hover:text-green-400"
                          }`} 
                          title={user.isActive ? "Desactivar" : "Reactivar"}
                        >
                          {user.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
