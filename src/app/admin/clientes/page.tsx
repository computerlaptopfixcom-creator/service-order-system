"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ChevronRight,
  ClipboardList,
  X,
  Eye,
  ChevronLeft,
  Download,
} from "lucide-react";
import { formatMoney } from "@/lib/currencies";
import { useCurrency } from "@/components/providers/currency-provider";
import { ServiceOrder, STATUS_CONFIG } from "@/types/order";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  lastVisit: string;
  totalSpent: number;
  totalPaid: number;
  orderIds: string[];
}

const PAGE_SIZE = 20;

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const { currency } = useCurrency();

  // Modal state for customer history
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<ServiceOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(Array.isArray(data?.customers) ? data.customers : []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const openCustomerHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    setCustomerOrders([]);

    try {
      const res = await fetch("/api/orders?limit=10000");
      const data = await res.json();
      const allOrders: ServiceOrder[] = Array.isArray(data?.orders)
        ? data.orders
        : Array.isArray(data)
        ? data
        : [];

      // Filter orders for this customer
      const filtered = allOrders
        .filter((o) => customer.orderIds.includes(o.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setCustomerOrders(filtered);
    } catch {
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const closeModal = () => {
    setSelectedCustomer(null);
    setCustomerOrders([]);
  };

  const filtered = customers.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const exportCSV = () => {
    const headers = [
      "Nombre",
      "Teléfono",
      "Email",
      "Total Órdenes",
      "Última Visita",
      "Total Gastado",
      "Total Pagado",
    ];
    const rows = filtered.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      c.phone,
      c.email,
      c.totalOrders,
      new Date(c.lastVisit).toLocaleDateString("es-MX"),
      c.totalSpent,
      c.totalPaid,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const avgOrdersPerCustomer =
    totalCustomers > 0
      ? (customers.reduce((acc, c) => acc + c.totalOrders, 0) / totalCustomers).toFixed(1)
      : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h2>
          <p className="text-gray-500 text-sm mt-1">
            {totalCustomers} cliente{totalCustomers !== 1 ? "s" : ""} registrado
            {totalCustomers !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="btn-secondary flex items-center gap-2 w-fit"
          title="Exportar CSV"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
              <p className="text-sm text-gray-500">Clientes únicos</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMoney(totalRevenue, currency)}
              </p>
              <p className="text-sm text-gray-500">Ingresos totales</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-xl">
              <ClipboardList className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgOrdersPerCustomer}</p>
              <p className="text-sm text-gray-500">Órdenes/cliente promedio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre, teléfono o email..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Customer List */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg">No se encontraron clientes</p>
          <p className="text-sm mt-1">Los clientes aparecerán automáticamente al crear órdenes</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-3">
            {paged.map((customer) => (
              <div
                key={customer.id}
                onClick={() => openCustomerHistory(customer)}
                className="bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{customer.name}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Phone className="h-3 w-3" />
                      <span>{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {formatMoney(customer.totalSpent, currency)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {customer.totalOrders} orden{customer.totalOrders !== 1 ? "es" : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Última visita: {new Date(customer.lastVisit).toLocaleDateString("es-MX")}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Cliente</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Teléfono</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-center py-3 px-4 text-gray-600 font-semibold">Órdenes</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold hidden lg:table-cell">
                    Última Visita
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">Total Gastado</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{customer.phone}</td>
                    <td className="py-3 px-4 text-gray-500 hidden md:table-cell">
                      {customer.email || "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs hidden lg:table-cell">
                      {new Date(customer.lastVisit).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className="font-semibold text-gray-800">
                        {formatMoney(customer.totalSpent, currency)}
                      </p>
                      {customer.totalPaid < customer.totalSpent && (
                        <p className="text-xs text-orange-600">
                          Debe: {formatMoney(customer.totalSpent - customer.totalPaid, currency)}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => openCustomerHistory(customer)}
                          className="p-2 hover:bg-primary-50 rounded-lg transition-colors text-gray-500 hover:text-primary-600"
                          title="Ver historial"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-gray-500 shrink-0">
            {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} de{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <span key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <span className="px-1 text-gray-300">...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      p === page
                        ? "bg-primary-600 text-white"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Customer History Modal */}
      {selectedCustomer && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={closeModal}
          />
          <div className="fixed inset-x-4 top-[5%] bottom-[5%] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[85vh] bg-white rounded-2xl z-50 flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedCustomer.name}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {selectedCustomer.phone}
                  </span>
                  {selectedCustomer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedCustomer.email}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Stats */}
            <div className="grid grid-cols-3 gap-3 p-4 sm:px-6 border-b border-gray-100 shrink-0">
              <div className="text-center">
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {selectedCustomer.totalOrders}
                </p>
                <p className="text-xs text-gray-500">Órdenes</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {formatMoney(selectedCustomer.totalSpent, currency)}
                </p>
                <p className="text-xs text-gray-500">Gastado</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {formatMoney(selectedCustomer.totalPaid, currency)}
                </p>
                <p className="text-xs text-gray-500">Pagado</p>
              </div>
            </div>

            {/* Modal Content - Orders List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Historial de Órdenes</h4>

              {loadingOrders ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : customerOrders.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No hay órdenes registradas</p>
              ) : (
                <div className="space-y-2">
                  {customerOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/ordenes/${order.id}`}
                      onClick={closeModal}
                      className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold text-primary-600">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`status-badge text-[10px] ${
                              STATUS_CONFIG[order.status]?.bgColor ?? "bg-gray-100"
                            } ${STATUS_CONFIG[order.status]?.color ?? "text-gray-700"}`}
                          >
                            {STATUS_CONFIG[order.status]?.label ?? order.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {order.deviceBrand} {order.deviceType}
                          {order.deviceModel ? ` · ${order.deviceModel}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {order.estimatedCost > 0 && (
                          <p className="text-sm font-semibold text-gray-800">
                            {formatMoney(order.estimatedCost, currency)}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-200 shrink-0">
              <Link
                href={`/admin/nueva-orden?phone=${encodeURIComponent(selectedCustomer.phone)}`}
                onClick={closeModal}
                className="btn-primary w-full justify-center"
              >
                + Nueva orden para este cliente
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
