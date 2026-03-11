import { formatMoney } from "@/lib/currencies";
import { useCurrency } from "@/components/providers/currency-provider";
import { PaymentStatus } from "@/types/order";

interface PaymentSummaryProps {
    totalCost: number;
    totalPaid: number;
    balanceDue: number;
    paymentStatus: PaymentStatus;
}

export function PaymentSummary({ totalCost, totalPaid, balanceDue, paymentStatus }: PaymentSummaryProps) {
    const { currency } = useCurrency();

    const getStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case "PAGADO": return "bg-green-100 text-green-800 border-green-200";
            case "ANTICIPO": return "bg-blue-100 text-blue-800 border-blue-200";
            case "CANCELADO": return "bg-red-100 text-red-800 border-red-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Estado de Pago</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(paymentStatus)}`}>
                    {paymentStatus}
                </span>
            </div>

            <div className="space-y-1 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Estimado</span>
                    <span className="font-medium text-gray-900">{formatMoney(totalCost, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Pagado</span>
                    <span className="font-medium text-blue-600">-{formatMoney(totalPaid, currency)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
                    <span className="text-gray-900">Saldo Pendiente</span>
                    <span className={`${balanceDue > 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatMoney(balanceDue, currency)}
                    </span>
                </div>
            </div>
        </div>
    );
}
