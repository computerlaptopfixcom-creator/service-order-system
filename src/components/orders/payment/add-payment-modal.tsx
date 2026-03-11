"use client";

import { useState } from "react";
import { PaymentMethod, Payment } from "@/types/order";
import { X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface AddPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (payment: Payment) => void;
    suggestedAmount: number;
}

export function AddPaymentModal({ isOpen, onClose, onAdd, suggestedAmount }: AddPaymentModalProps) {
    const [amount, setAmount] = useState(suggestedAmount > 0 ? suggestedAmount.toString() : "");
    const [method, setMethod] = useState<PaymentMethod>("EFECTIVO");
    const [note, setNote] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;

        const newPayment: Payment = {
            id: uuidv4(),
            amount: val,
            method,
            date: new Date(date).toISOString(),
            note: note.trim() || undefined,
        };

        onAdd(newPayment);
        onClose();
        setAmount("");
        setNote("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Registrar Pago</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto a pagar</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="input-field pl-7 text-lg font-semibold"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                        {suggestedAmount > 0 && (
                            <p className="text-xs text-gray-500 mt-1">Saldo pendiente: ${suggestedAmount.toFixed(2)}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "OTRO"] as PaymentMethod[]).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMethod(m)}
                                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${method === m
                                        ? "bg-primary-50 border-primary-500 text-primary-700 shadow-sm"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {m.charAt(0) + m.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="input-field"
                            placeholder="Ej: Anticipo"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full btn-primary py-2.5 text-base font-semibold shadow-lg"
                        >
                            Registrar Pago
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
