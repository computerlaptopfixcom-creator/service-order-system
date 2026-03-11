import { Payment, PaymentMethod } from "@/types/order";
import { formatMoneyShort } from "@/lib/currencies";
import { useCurrency } from "@/components/providers/currency-provider";
import { Trash2, CreditCard, Banknote, Smartphone, HelpCircle } from "lucide-react";

interface PaymentHistoryProps {
    payments: Payment[];
    onDelete: (id: string) => void;
}

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
    EFECTIVO: <Banknote className="h-4 w-4" />,
    TARJETA: <CreditCard className="h-4 w-4" />,
    TRANSFERENCIA: <Smartphone className="h-4 w-4" />,
    OTRO: <HelpCircle className="h-4 w-4" />,
};

export function PaymentHistory({ payments, onDelete }: PaymentHistoryProps) {
    const { currency } = useCurrency();

    if (payments.length === 0) {
        return <p className="text-sm text-gray-400 py-4 text-center">No hay pagos registrados</p>;
    }

    return (
        <div className="space-y-2">
            {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-full border border-gray-200 text-gray-500">
                            {METHOD_ICONS[payment.method] || <HelpCircle className="h-4 w-4" />}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {formatMoneyShort(payment.amount, currency)}
                                <span className="text-xs font-normal text-gray-500 ml-1">
                                    ({payment.method.toLowerCase()})
                                </span>
                            </p>
                            <p className="text-xs text-gray-500">
                                {new Date(payment.date).toLocaleDateString("es-MX")}
                                {payment.note && ` • ${payment.note}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onDelete(payment.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Eliminar pago"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
