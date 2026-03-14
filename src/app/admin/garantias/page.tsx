"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ServiceOrder,
  STATUS_CONFIG,
  getWarrantyStatus,
  WarrantyStatus,
} from "@/types/order";
import {
  ShieldCheck,
  ShieldX,
  Shield,
  Search,
  AlertTriangle,
  ChevronRight,
  Calendar,
  User,
  Monitor,
} from "lucide-react";

type FilterType = "all" | "active" | "expiring" | "expired";

export default function GarantiasPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("active");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        // Filter only orders with warranty
        const ordersWithWarranty = (data || []).filter(
          (o: ServiceOrder) =>
            o.status === "entregado" &&
            o.warrantyDays &&
            o.warrantyDays > 0 &&
            o.warrantyStartDate &&
            o.warrantyEndDate
        );
        setOrders(ordersWithWarranty);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Process orders with warranty status
  const processedOrders = orders.map((order) => {
    const warranty = getWarrantyStatus(order);
    return { ...order, warrantyInfo: warranty };
  });

  // Apply filters
  const filteredOrders = processedOrders.filter((order) => {
    // Search filter
    const matchesSearch =
      search === "" ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.deviceBrand.toLowerCase().includes(search.toLowerCase()) ||
      order.deviceType.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    switch (filter) {
      case "active":
        return order.warrantyInfo.status === "active";
      case "expiring":
        return (
          order.warrantyInfo.status === "active" &&
          order.warrantyInfo.daysRemaining <= 7
        );
      case "expired":
        return order.warrantyInfo.status === "expired";
      default:
        return true;
    }
  });

  // Sort by days remaining (ascending for active, most recently expired first for expired)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.warrantyInfo.status === "active" && b.warrantyInfo.status === "active") {
      return a.warrantyInfo.daysRemaining - b.warrantyInfo.daysRemaining;
    }
    if (a.warrantyInfo.status === "expired" && b.warrantyInfo.status === "expired") {
      return new Date(b.warrantyEndDate!).getTime() - new Date(a.warrantyEndDate!).getTime();
    }
    return a.warrantyInfo.status === "active" ? -1 : 1;
  });

  // Stats
  const stats = {
    total: processedOrders.length,
    active: processedOrders.filter((o) => o.warrantyInfo.status === "active").length,
    expiring: processedOrders.filter(
      (o) => o.warrantyInfo.status === "active" && o.warrantyInfo.daysRemaining <= 7
    ).length,
    expired: processedOrders.filter((o) => o.warrantyInfo.status === "expired").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-green-600" />
          </div>
          Garantías
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Seguimiento de órdenes con garantía vigente y vencida
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            filter === "all"
              ? "border-slate-600 bg-slate-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <Shield className="h-5 w-5 text-slate-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </button>

        <button
          onClick={() => setFilter("active")}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            filter === "active"
              ? "border-green-500 bg-green-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <ShieldCheck className="h-5 w-5 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-green-700">{stats.active}</p>
          <p className="text-xs text-gray-500">Activas</p>
        </button>

        <button
          onClick={() => setFilter("expiring")}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            filter === "expiring"
              ? "border-amber-500 bg-amber-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-amber-700">{stats.expiring}</p>
          <p className="text-xs text-gray-500">Por vencer (7d)</p>
        </button>

        <button
          onClick={() => setFilter("expired")}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            filter === "expired"
              ? "border-red-500 bg-red-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <ShieldX className="h-5 w-5 text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
          <p className="text-xs text-gray-500">Vencidas</p>
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por orden, cliente o equipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Orders List */}
      {sortedOrders.length === 0 ? (
        <div className="card text-center py-12">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {filter === "all"
              ? "No hay órdenes con garantía"
              : filter === "active"
              ? "No hay garantías activas"
              : filter === "expiring"
              ? "No hay garantías por vencer"
              : "No hay garantías vencidas"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedOrders.map((order) => {
            const isExpiring =
              order.warrantyInfo.status === "active" &&
              order.warrantyInfo.daysRemaining <= 7;

            return (
              <Link
                key={order.id}
                href={`/admin/ordenes/${order.id}`}
                className="card block hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  {/* Warranty Status Icon */}
                  <div
                    className={`p-3 rounded-xl shrink-0 ${
                      order.warrantyInfo.status === "active"
                        ? isExpiring
                          ? "bg-amber-100"
                          : "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    {order.warrantyInfo.status === "active" ? (
                      isExpiring ? (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      ) : (
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                      )
                    ) : (
                      <ShieldX className="h-5 w-5 text-red-500" />
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 dark:text-white font-mono">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.warrantyInfo.status === "active"
                            ? isExpiring
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {order.warrantyInfo.status === "active"
                          ? `${order.warrantyInfo.daysRemaining}d restantes`
                          : "Vencida"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {order.customerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3.5 w-3.5" />
                        {order.deviceBrand} {order.deviceType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {order.warrantyDays}d de garantía
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 mt-1">
                      Vence:{" "}
                      {new Date(order.warrantyEndDate! + "T12:00:00").toLocaleDateString(
                        "es-MX",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
