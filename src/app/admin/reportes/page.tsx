"use client";

import { useEffect, useState } from "react";
import { ServiceOrder, STATUS_CONFIG, OrderStatus } from "@/types/order";
import { BarChart3, TrendingUp, Clock, DollarSign, Calendar, AlertCircle, Percent, CheckCircle2, XCircle } from "lucide-react";
import { formatMoneyShort } from "@/lib/currencies";
import { useCurrency } from "@/components/providers/currency-provider";
import Link from "next/link";

export default function ReportesPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const { currency } = useCurrency();

  useEffect(() => {
    fetch("/api/orders?limit=10000")
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // --- FILTRADO POR PERIODO ---
  const now = new Date();
  const periodStart = new Date();
  if (period === "week") periodStart.setDate(now.getDate() - 7);
  else if (period === "month") periodStart.setMonth(now.getMonth() - 1);
  else periodStart.setFullYear(now.getFullYear() - 1);

  const periodOrders = orders.filter(o => new Date(o.createdAt) >= periodStart);

  // --- KPIs FINANCIEROS Y OPERATIVOS ---

  // 1. Ingresos y Margen
  const totalRevenue = periodOrders.reduce((sum, o) => sum + (o.estimatedCost || 0), 0);
  const totalPartsCost = periodOrders.reduce((sum, o) => sum + (o.partsCost || 0), 0);
  const grossProfit = totalRevenue - totalPartsCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // 2. Eficiencia / Conversión
  const completedOrders = periodOrders.filter(o => o.status === "entregado" || o.status === "reparado").length;
  const cancelledOrders = periodOrders.filter(o => o.status === "cancelado").length;
  const totalClosed = completedOrders + cancelledOrders;
  const conversionRate = totalClosed > 0 ? (completedOrders / totalClosed) * 100 : 0;

  // 3. Ticket Promedio (Solo órdenes con costo > 0)
  const paidOrders = periodOrders.filter(o => (o.estimatedCost || 0) > 0);
  const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // 4. Tiempo Promedio de Reparación (Días)
  const avgRepairTime = (() => {
    const delivered = orders.filter(o => o.status === "entregado" && o.statusHistory && o.statusHistory.length > 0);
    if (delivered.length === 0) return 0;

    const totalDays = delivered.reduce((sum, o) => {
      const created = new Date(o.createdAt).getTime();
      // Buscar cuando pasó a "reparado" o "entregado"
      const completedEvent = o.statusHistory.find(h => h.to === "reparado" || h.to === "entregado");
      const finished = completedEvent ? new Date(completedEvent.date).getTime() : new Date().getTime();
      return sum + (finished - created) / (1000 * 60 * 60 * 24);
    }, 0);

    return Math.round(totalDays / delivered.length * 10) / 10;
  })();

  // --- ANÁLISIS DE RENTABILIDAD ---

  // Top Marcas (Por volumen y por dinero)
  const brandStats = periodOrders.reduce((acc, o) => {
    const brand = o.deviceBrand || "Sin marca";
    if (!acc[brand]) acc[brand] = { count: 0, revenue: 0 };
    acc[brand].count++;
    acc[brand].revenue += (o.estimatedCost || 0);
    return acc;
  }, {} as Record<string, { count: number, revenue: number }>);

  const topBrandsByRevenue = Object.entries(brandStats)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 5);

  // Equipos Estancados (Más de 5 días sin moverse y NO entregados/cancelados)
  const stuckOrders = orders.filter(o => {
    if (["entregado", "cancelado", "reparado"].includes(o.status)) return false;
    const lastUpdate = new Date(o.updatedAt).getTime();
    const daysSinceUpdate = (now.getTime() - lastUpdate) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 5;
  }).sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()); // Los más viejos primero


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary-600" />
            Dashboard Ejecutivo
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Visión estratégica de la operación y finanzas del taller.
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${period === p
                ? "bg-primary-50 text-primary-700 shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              {p === "week" ? "Semana" : p === "month" ? "Mes" : "Año"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Ventas Netas */}
        <div className="card border-l-4 border-l-green-500">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ventas Totales</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatMoneyShort(totalRevenue, currency)}</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-600 font-medium">Margen {Math.round(profitMargin)}%</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">Ticket prom: {formatMoneyShort(avgTicket, currency)}</span>
          </div>
        </div>

        {/* Órdenes Activas */}
        <div className="card border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Órdenes Nuevas</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{periodOrders.length}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-blue-600 font-medium">{completedOrders} completadas</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{cancelledOrders} canceladas</span>
          </div>
        </div>

        {/* Eficiencia */}
        <div className="card border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tasa de Éxito</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{Math.round(conversionRate)}%</h3>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Percent className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            De órdenes cerradas, porcentaje reparado exitosamente.
          </p>
        </div>

        {/* Tiempos */}
        <div className="card border-l-4 border-l-orange-500">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiempo Promedio</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{avgRepairTime} <span className="text-sm font-medium text-gray-500">días</span></h3>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Desde recepción hasta listo para entrega.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Columna Izquierda: Rentabilidad */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-500" />
              Marcas Más Rentables
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Marca</th>
                    <th className="px-4 py-3 font-semibold text-center">Volumen</th>
                    <th className="px-4 py-3 font-semibold text-right">Ingresos Totales</th>
                    <th className="px-4 py-3 font-semibold text-right">% del Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topBrandsByRevenue.map(([brand, stats]) => (
                    <tr key={brand} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{brand}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{stats.count}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatMoneyShort(stats.revenue, currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {totalRevenue > 0 ? Math.round((stats.revenue / totalRevenue) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                  {topBrandsByRevenue.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                        No hay datos suficientes en este periodo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Summary Breakdown */}
            <div className="card bg-gray-50 border-0">
              <h4 className="font-semibold text-gray-900 mb-4">Desglose Financiero</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ingresos Brutos</span>
                  <span className="font-medium">{formatMoneyShort(totalRevenue, currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Costo de Refacciones</span>
                  <span>- {formatMoneyShort(totalPartsCost, currency)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold text-gray-900">
                  <span>Ganancia Neta</span>
                  <span>{formatMoneyShort(grossProfit, currency)}</span>
                </div>
              </div>
            </div>

            {/* Efficiency visual */}
            <div className="card bg-gray-50 border-0">
              <h4 className="font-semibold text-gray-900 mb-4">Eficiencia Operativa</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Tasa de Reparación</span>
                    <span className="font-medium">{Math.round(conversionRate)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${conversionRate}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Tasa de Cancelación</span>
                    <span className="font-medium">{totalClosed > 0 ? Math.round((cancelledOrders / totalClosed) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: `${totalClosed > 0 ? (cancelledOrders / totalClosed) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Alertas */}
        <div className="space-y-6">
          <div className="card border-l-4 border-l-amber-400 bg-amber-50/50">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Equipos Estancados
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Órdenes sin movimiento por más de 5 días. ¡Requieren atención!
            </p>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {stuckOrders.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                  ¡Todo fluye! No hay equipos estancados.
                </div>
              ) : (
                stuckOrders.map(order => (
                  <Link href={`/admin/ordenes/${order.id}`} key={order.id} className="block group">
                    <div className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-900 text-sm">#{order.orderNumber}</span>
                        <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                          {Math.floor((now.getTime() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24))}d
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate font-medium">{order.deviceBrand} {order.deviceModel}</p>
                      <p className="text-xs text-amber-600 mt-1">
                        {STATUS_CONFIG[order.status]?.label || order.status}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h4 className="font-semibold text-blue-800 mb-2 text-sm">Consejo del Sistema</h4>
            <p className="text-xs text-blue-600 leading-relaxed">
              {profitMargin < 30
                ? "Tu margen de ganancia está por debajo del 30%. Considera revisar tus costos de refacciones o ajustar tus precios de mano de obra."
                : "¡Buen margen de ganancia! Mantén el control de costos para seguir creciendo."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
