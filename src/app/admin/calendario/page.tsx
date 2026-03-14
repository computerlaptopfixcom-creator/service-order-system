"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    User,
    Phone,
    FileText,
    X,
    Search,
    Wrench,
    Package,
    CalendarCheck,
    Trash2,
    Edit3,
    Check,
} from "lucide-react";

interface Appointment {
    id: string;
    title: string;
    type: "diagnostico" | "entrega" | "seguimiento";
    date: string;
    time: string;
    duration: number;
    notes?: string;
    customerName: string;
    customerPhone: string;
    orderId?: string;
    orderNumber?: string;
    status: "pendiente" | "confirmada" | "completada" | "cancelada";
}

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    estimatedDelivery: string;
    status: string;
    deviceType: string;
    deviceBrand: string;
}

const APPOINTMENT_TYPES = {
    diagnostico: { label: "Diagnostico", color: "bg-indigo-500", textColor: "text-indigo-700", bgColor: "bg-indigo-100", icon: Search },
    entrega: { label: "Entrega", color: "bg-emerald-500", textColor: "text-emerald-700", bgColor: "bg-emerald-100", icon: Package },
    seguimiento: { label: "Seguimiento", color: "bg-amber-500", textColor: "text-amber-700", bgColor: "bg-amber-100", icon: Wrench },
};

const APPOINTMENT_STATUS = {
    pendiente: { label: "Pendiente", color: "text-amber-700", bgColor: "bg-amber-100" },
    confirmada: { label: "Confirmada", color: "text-blue-700", bgColor: "bg-blue-100" },
    completada: { label: "Completada", color: "text-emerald-700", bgColor: "bg-emerald-100" },
    cancelada: { label: "Cancelada", color: "text-red-700", bgColor: "bg-red-100" },
};

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function CalendarioPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [showOrderSelector, setShowOrderSelector] = useState(false);
    const [orderSearchQuery, setOrderSearchQuery] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        type: "diagnostico" as "diagnostico" | "entrega" | "seguimiento",
        date: "",
        time: "09:00",
        duration: 30,
        notes: "",
        customerName: "",
        customerPhone: "",
        orderId: "",
        orderNumber: "",
        status: "pendiente" as "pendiente" | "confirmada" | "completada" | "cancelada",
    });

    useEffect(() => {
        loadData();
    }, [currentDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

            const [appointmentsRes, ordersRes] = await Promise.all([
                fetch(`/api/appointments?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`),
                fetch("/api/orders?limit=1000"),
            ]);

            const appointmentsData = await appointmentsRes.json();
            const ordersData = await ordersRes.json();

            setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
            setOrders(Array.isArray(ordersData?.orders) ? ordersData.orders : Array.isArray(ordersData) ? ordersData : []);
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setLoading(false);
    };

    // Calendar grid calculation
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        // Previous month days
        const prevMonth = new Date(year, month, 0);
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonth.getDate() - i),
                isCurrentMonth: false,
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true,
            });
        }

        // Next month days
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false,
            });
        }

        return days;
    }, [currentDate]);

    // Get appointments for a specific date
    const getAppointmentsForDate = (date: Date) => {
        const dateStr = date.toISOString().split("T")[0];
        return appointments.filter((a) => a.date.split("T")[0] === dateStr);
    };

    // Get orders with estimated delivery for a specific date
    const getOrdersWithDeliveryForDate = (date: Date) => {
        const dateStr = date.toISOString().split("T")[0];
        return orders.filter((o) =>
            o.estimatedDelivery?.split("T")[0] === dateStr &&
            o.status !== "entregado" &&
            o.status !== "cancelado"
        );
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const navigateMonth = (delta: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    };

    const openNewAppointmentModal = (date?: Date) => {
        setEditingAppointment(null);
        const targetDate = date || new Date();
        setFormData({
            title: "",
            type: "diagnostico",
            date: targetDate.toISOString().split("T")[0],
            time: "09:00",
            duration: 30,
            notes: "",
            customerName: "",
            customerPhone: "",
            orderId: "",
            orderNumber: "",
            status: "pendiente",
        });
        setShowModal(true);
    };

    const openEditAppointmentModal = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        setFormData({
            title: appointment.title,
            type: appointment.type,
            date: appointment.date.split("T")[0],
            time: appointment.time,
            duration: appointment.duration,
            notes: appointment.notes || "",
            customerName: appointment.customerName,
            customerPhone: appointment.customerPhone,
            orderId: appointment.orderId || "",
            orderNumber: appointment.orderNumber || "",
            status: appointment.status,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingAppointment
                ? `/api/appointments/${editingAppointment.id}`
                : "/api/appointments";
            const method = editingAppointment ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowModal(false);
                loadData();
            }
        } catch (error) {
            console.error("Error saving appointment:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta cita?")) return;
        try {
            const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
            if (res.ok) {
                loadData();
                setSelectedDate(null);
            }
        } catch (error) {
            console.error("Error deleting appointment:", error);
        }
    };

    const handleMarkComplete = async (appointment: Appointment) => {
        try {
            await fetch(`/api/appointments/${appointment.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...appointment, status: "completada" }),
            });
            loadData();
        } catch (error) {
            console.error("Error updating appointment:", error);
        }
    };

    const selectOrder = (order: Order) => {
        setFormData({
            ...formData,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            orderId: order.id,
            orderNumber: order.orderNumber,
            title: formData.type === "entrega"
                ? `Entrega ${order.orderNumber}`
                : formData.type === "diagnostico"
                ? `Diagnostico ${order.orderNumber}`
                : `Seguimiento ${order.orderNumber}`,
        });
        setShowOrderSelector(false);
        setOrderSearchQuery("");
    };

    const filteredOrders = useMemo(() => {
        if (!orderSearchQuery) return orders.slice(0, 10);
        const q = orderSearchQuery.toLowerCase();
        return orders.filter(
            (o) =>
                o.orderNumber.toLowerCase().includes(q) ||
                o.customerName.toLowerCase().includes(q) ||
                o.customerPhone.includes(q)
        ).slice(0, 10);
    }, [orders, orderSearchQuery]);

    const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];
    const selectedDateDeliveries = selectedDate ? getOrdersWithDeliveryForDate(selectedDate) : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-blue-600" />
                        Calendario de Citas
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Gestiona tus citas de diagnostico y entrega</p>
                </div>
                <button
                    onClick={() => openNewAppointmentModal()}
                    className="btn-primary flex items-center gap-2 w-fit"
                >
                    <Plus className="h-4 w-4" />
                    Nueva Cita
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h3>
                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 mb-2">
                        {DAYS_OF_WEEK.map((day) => (
                            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                            const dayAppointments = getAppointmentsForDate(day.date);
                            const dayDeliveries = getOrdersWithDeliveryForDate(day.date);
                            const hasEvents = dayAppointments.length > 0 || dayDeliveries.length > 0;
                            const isSelected = selectedDate?.toDateString() === day.date.toDateString();

                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDate(day.date)}
                                    className={`
                                        relative min-h-[80px] p-1 sm:p-2 rounded-xl border transition-all text-left
                                        ${day.isCurrentMonth ? "bg-white" : "bg-gray-50"}
                                        ${isToday(day.date) ? "border-blue-500 border-2" : "border-gray-100"}
                                        ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""}
                                        hover:border-blue-300 hover:shadow-sm
                                    `}
                                >
                                    <span
                                        className={`
                                            text-sm font-medium block mb-1
                                            ${day.isCurrentMonth ? "text-gray-900 dark:text-white" : "text-gray-400"}
                                            ${isToday(day.date) ? "text-blue-600" : ""}
                                        `}
                                    >
                                        {day.date.getDate()}
                                    </span>

                                    {hasEvents && (
                                        <div className="space-y-0.5">
                                            {dayAppointments.slice(0, 2).map((apt) => (
                                                <div
                                                    key={apt.id}
                                                    className={`${APPOINTMENT_TYPES[apt.type].color} text-white text-[10px] px-1 py-0.5 rounded truncate`}
                                                >
                                                    {apt.time} {apt.title.slice(0, 10)}
                                                </div>
                                            ))}
                                            {dayDeliveries.slice(0, 1).map((order) => (
                                                <div
                                                    key={order.id}
                                                    className="bg-rose-500 text-white text-[10px] px-1 py-0.5 rounded truncate"
                                                >
                                                    Entrega {order.orderNumber}
                                                </div>
                                            ))}
                                            {(dayAppointments.length + dayDeliveries.length) > 3 && (
                                                <div className="text-[10px] text-gray-500 pl-1">
                                                    +{dayAppointments.length + dayDeliveries.length - 3} mas
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
                        {Object.entries(APPOINTMENT_TYPES).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
                                <span className={`w-3 h-3 rounded ${value.color}`} />
                                {value.label}
                            </div>
                        ))}
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <span className="w-3 h-3 rounded bg-rose-500" />
                            Entrega Estimada
                        </div>
                    </div>
                </div>

                {/* Side Panel - Selected Date Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                    {selectedDate ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {selectedDate.toLocaleDateString("es-MX", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                    })}
                                </h3>
                                <button
                                    onClick={() => openNewAppointmentModal(selectedDate)}
                                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors"
                                >
                                    <Plus className="h-4 w-4 text-blue-600" />
                                </button>
                            </div>

                            {selectedDateAppointments.length === 0 && selectedDateDeliveries.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">Sin citas para este dia</p>
                                    <button
                                        onClick={() => openNewAppointmentModal(selectedDate)}
                                        className="text-blue-600 text-xs font-medium mt-2"
                                    >
                                        Agregar cita
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Appointments */}
                                    {selectedDateAppointments.map((apt) => {
                                        const TypeIcon = APPOINTMENT_TYPES[apt.type].icon;
                                        return (
                                            <div
                                                key={apt.id}
                                                className={`p-3 rounded-xl border ${APPOINTMENT_TYPES[apt.type].bgColor} border-transparent`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${APPOINTMENT_TYPES[apt.type].color}`}>
                                                            <TypeIcon className="h-3.5 w-3.5 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-semibold ${APPOINTMENT_TYPES[apt.type].textColor}`}>
                                                                {apt.title}
                                                            </p>
                                                            <p className="text-xs text-gray-600 flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {apt.time} ({apt.duration} min)
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${APPOINTMENT_STATUS[apt.status].bgColor} ${APPOINTMENT_STATUS[apt.status].color}`}>
                                                        {APPOINTMENT_STATUS[apt.status].label}
                                                    </span>
                                                </div>

                                                <div className="mt-2 space-y-1 text-xs text-gray-600">
                                                    <p className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {apt.customerName}
                                                    </p>
                                                    <p className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {apt.customerPhone}
                                                    </p>
                                                    {apt.orderNumber && (
                                                        <Link
                                                            href={`/admin/ordenes/${apt.orderId}`}
                                                            className="flex items-center gap-1 text-blue-600 hover:underline"
                                                        >
                                                            <FileText className="h-3 w-3" />
                                                            Orden {apt.orderNumber}
                                                        </Link>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200/50">
                                                    {apt.status !== "completada" && (
                                                        <button
                                                            onClick={() => handleMarkComplete(apt)}
                                                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-medium rounded-lg transition-colors"
                                                        >
                                                            <Check className="h-3 w-3" />
                                                            Completar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openEditAppointmentModal(apt)}
                                                        className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5 text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(apt.id)}
                                                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Estimated Deliveries */}
                                    {selectedDateDeliveries.map((order) => (
                                        <Link
                                            key={order.id}
                                            href={`/admin/ordenes/${order.id}`}
                                            className="block p-3 rounded-xl bg-rose-50 border border-rose-100 hover:border-rose-200 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-rose-500">
                                                    <Package className="h-3.5 w-3.5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-rose-700">
                                                        Entrega Estimada
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        Orden {order.orderNumber}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 space-y-1 text-xs text-gray-600">
                                                <p className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {order.customerName}
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <Wrench className="h-3 w-3" />
                                                    {order.deviceBrand} {order.deviceType}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">Selecciona un dia para ver detalles</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New/Edit Appointment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {editingAppointment ? "Editar Cita" : "Nueva Cita"}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Cita
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(APPOINTMENT_TYPES).map(([key, value]) => {
                                        const Icon = value.icon;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: key as typeof formData.type })}
                                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                                                    formData.type === key
                                                        ? `${value.bgColor} border-current ${value.textColor}`
                                                        : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            >
                                                <Icon className="h-5 w-5" />
                                                <span className="text-xs font-medium">{value.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Link to Order */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Vincular a Orden (opcional)
                                </label>
                                {formData.orderNumber ? (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                                        <span className="text-sm text-blue-700 font-medium">
                                            Orden {formData.orderNumber} - {formData.customerName}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData({
                                                    ...formData,
                                                    orderId: "",
                                                    orderNumber: "",
                                                    customerName: "",
                                                    customerPhone: "",
                                                    title: "",
                                                })
                                            }
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowOrderSelector(!showOrderSelector)}
                                            className="w-full flex items-center gap-2 p-3 border border-gray-200 rounded-xl text-gray-500 hover:border-gray-300 transition-colors"
                                        >
                                            <Search className="h-4 w-4" />
                                            <span className="text-sm">Buscar orden...</span>
                                        </button>

                                        {showOrderSelector && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                                                <div className="p-2 border-b border-gray-100">
                                                    <input
                                                        type="text"
                                                        value={orderSearchQuery}
                                                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                                                        placeholder="Buscar por numero, nombre o telefono..."
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                                        autoFocus
                                                    />
                                                </div>
                                                {filteredOrders.map((order) => (
                                                    <button
                                                        key={order.id}
                                                        type="button"
                                                        onClick={() => selectOrder(order)}
                                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                                                    >
                                                        <div className="bg-blue-100 p-2 rounded-lg">
                                                            <FileText className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {order.orderNumber}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {order.customerName} - {order.deviceBrand} {order.deviceType}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                                {filteredOrders.length === 0 && (
                                                    <p className="p-3 text-sm text-gray-400 text-center">
                                                        No se encontraron ordenes
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Titulo
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                                    placeholder="Ej: Diagnostico laptop HP"
                                    required
                                />
                            </div>

                            {/* Date and Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hora
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Duracion (minutos)
                                </label>
                                <select
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                                >
                                    <option value={15}>15 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={45}>45 min</option>
                                    <option value={60}>1 hora</option>
                                    <option value={90}>1.5 horas</option>
                                    <option value={120}>2 horas</option>
                                </select>
                            </div>

                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre Cliente
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.customerName}
                                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Telefono
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.customerPhone}
                                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Status (only when editing) */}
                            {editingAppointment && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estado
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                                    >
                                        {Object.entries(APPOINTMENT_STATUS).map(([key, value]) => (
                                            <option key={key} value={key}>
                                                {value.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notas (opcional)
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                                    rows={3}
                                    placeholder="Notas adicionales..."
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                                >
                                    {editingAppointment ? "Guardar Cambios" : "Crear Cita"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
