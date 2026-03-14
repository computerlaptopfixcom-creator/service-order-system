"use client";

import { DeliveryChecklist as DeliveryChecklistType } from "@/types/order";
import { CheckCircle2, Circle, Package, UserCheck, Boxes, FileSignature, CreditCard, AlertTriangle } from "lucide-react";

interface ChecklistItem {
  key: keyof Omit<DeliveryChecklistType, "completedAt">;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    key: "equipmentWorking",
    label: "Equipo funciona correctamente",
    description: "Se verificó que el equipo enciende y opera sin problemas",
    icon: <Package className="h-5 w-5" />,
  },
  {
    key: "customerVerified",
    label: "Cliente verificó funcionamiento",
    description: "El cliente probó el equipo y confirmó que funciona",
    icon: <UserCheck className="h-5 w-5" />,
  },
  {
    key: "accessoriesDelivered",
    label: "Accesorios entregados completos",
    description: "Todos los accesorios recibidos fueron devueltos al cliente",
    icon: <Boxes className="h-5 w-5" />,
  },
  {
    key: "customerSigned",
    label: "Cliente firmó conformidad",
    description: "El cliente firmó el documento de entrega conforme",
    icon: <FileSignature className="h-5 w-5" />,
  },
  {
    key: "paymentCompleted",
    label: "Pago completado",
    description: "El cliente liquidó el total del servicio",
    icon: <CreditCard className="h-5 w-5" />,
  },
];

interface DeliveryChecklistProps {
  checklist: DeliveryChecklistType;
  onChange: (checklist: DeliveryChecklistType) => void;
  accessories?: string;
  paymentStatus?: string;
  readOnly?: boolean;
}

export function DeliveryChecklistComponent({
  checklist,
  onChange,
  accessories,
  paymentStatus,
  readOnly = false,
}: DeliveryChecklistProps) {
  const completedCount = CHECKLIST_ITEMS.filter(
    (item) => checklist[item.key]
  ).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const isComplete = completedCount === totalCount;
  const progressPercent = (completedCount / totalCount) * 100;

  const toggleItem = (key: keyof Omit<DeliveryChecklistType, "completedAt">) => {
    if (readOnly) return;
    const newValue = !checklist[key];
    const updatedChecklist = { ...checklist, [key]: newValue };

    // Check if all items are complete
    const allComplete = CHECKLIST_ITEMS.every((item) => updatedChecklist[item.key]);
    if (allComplete && !checklist.completedAt) {
      updatedChecklist.completedAt = new Date().toISOString();
    } else if (!allComplete) {
      updatedChecklist.completedAt = undefined;
    }

    onChange(updatedChecklist);
  };

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Checklist de Entrega
        </h3>
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${
            isComplete
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
          }`}
        >
          {completedCount}/{totalCount} completados
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isComplete ? "bg-emerald-500" : "bg-amber-500"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => {
          const isChecked = checklist[item.key];
          const isAccessoriesItem = item.key === "accessoriesDelivered";
          const isPaymentItem = item.key === "paymentCompleted";

          return (
            <div
              key={item.key}
              role="checkbox"
              aria-checked={isChecked}
              aria-label={item.label}
              tabIndex={readOnly ? -1 : 0}
              onClick={() => toggleItem(item.key)}
              onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleItem(item.key); } }}
              className={`
                flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-200
                ${readOnly ? "cursor-default" : "cursor-pointer"}
                ${
                  isChecked
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700"
                    : "bg-white dark:bg-gray-800 dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-750 active:bg-gray-100 dark:active:bg-gray-700"
                }
              `}
            >
              {/* Checkbox */}
              <div
                className={`
                  flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all
                  ${
                    isChecked
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                  }
                `}
              >
                {isChecked ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>

              {/* Icon */}
              <div
                className={`flex-shrink-0 ${
                  isChecked ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {item.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium ${
                    isChecked ? "text-emerald-900 dark:text-emerald-300" : "text-gray-900 dark:text-white dark:text-gray-100"
                  }`}
                >
                  {item.label}
                </p>
                <p
                  className={`text-sm mt-0.5 ${
                    isChecked ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {item.description}
                </p>

                {/* Show accessories info if applicable */}
                {isAccessoriesItem && accessories && (
                  <div className="mt-2 text-xs bg-white dark:bg-gray-800/70 dark:bg-gray-800/50 rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-700">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Accesorios recibidos:</span>{" "}
                    <span className="text-gray-600 dark:text-gray-400">{accessories}</span>
                  </div>
                )}

                {/* Show payment status warning if applicable */}
                {isPaymentItem && paymentStatus && paymentStatus !== "PAGADO" && !isChecked && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-lg px-3 py-2 border border-amber-200 dark:border-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Estado de pago actual: <strong>{paymentStatus}</strong></span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {isComplete && (
        <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                Checklist completo
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Todos los pasos de entrega han sido verificados. Puedes marcar la orden como entregada.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Incomplete warning */}
      {!isComplete && !readOnly && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-300">
                Completa todos los pasos antes de entregar
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Debes verificar todos los items del checklist para poder marcar la orden como entregada.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to check if checklist is complete
export function isDeliveryChecklistComplete(checklist?: DeliveryChecklistType): boolean {
  if (!checklist) return false;
  return CHECKLIST_ITEMS.every((item) => checklist[item.key]);
}

// Helper to create empty checklist
export function createEmptyDeliveryChecklist(): DeliveryChecklistType {
  return {
    equipmentWorking: false,
    customerVerified: false,
    accessoriesDelivered: false,
    customerSigned: false,
    paymentCompleted: false,
  };
}
