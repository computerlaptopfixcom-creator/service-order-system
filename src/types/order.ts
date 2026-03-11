export type OrderStatus =
  | "recibido"
  | "diagnosticando"
  | "reparando"
  | "listo"
  | "entregado"
  | "cancelado";

export interface StatusHistoryEntry {
  from: OrderStatus;
  to: OrderStatus;
  date: string;
  note?: string;
}

export interface InternalNote {
  id: string;
  text: string;
  date: string;
}

export interface OrderUsedPart {
  partId: string;
  partName: string;
  quantity: number;
  unitCost: number;
}

export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "OTRO";
export type PaymentStatus = "PENDIENTE" | "ANTICIPO" | "PAGADO" | "CANCELADO";

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  note?: string;
}

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber: string;
  accessories: string;
  problemDescription: string;
  diagnosis: string;
  detailedDiagnosis?: string;
  estimatedCost: number;
  partsCost: number;
  estimatedDelivery: string;
  signature: string;
  devicePhotos: string[];
  usedParts: OrderUsedPart[];
  selectedServices?: { id: string; name: string; basePrice: number; linkedPartId?: string; linkedPartName?: string; linkedPartCost?: number }[];
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  internalNotes: InternalNote[];
  budgetStatus: "none" | "pending" | "approved" | "rejected";
  budgetSentAt?: string;
  budgetRespondedAt?: string;
  budgetNote?: string;
  clientNote?: string;
  approvalSignature?: string;
  createdAt: string;
  updatedAt: string;
  payments: Payment[];
  paymentStatus: PaymentStatus;
  totalPaid: number;
  balanceDue: number;
}

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  recibido: {
    label: "Recibido",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    icon: "inbox",
  },
  diagnosticando: {
    label: "Diagnosticando",
    color: "text-indigo-700",
    bgColor: "bg-indigo-100",
    icon: "search",
  },
  reparando: {
    label: "Reparando",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: "wrench",
  },
  listo: {
    label: "Listo para Entrega",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    icon: "check-circle",
  },
  entregado: {
    label: "Entregado",
    color: "text-slate-700",
    bgColor: "bg-slate-100",
    icon: "package-check",
  },
  cancelado: {
    label: "Cancelado",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: "x-circle",
  },
};

export const DEVICE_TYPES = [
  "Laptop",
  "PC de Escritorio",
  "All in One",
  "Tablet",
  "Impresora",
  "Monitor",
  "Otro",
];

export const DEVICE_BRANDS = [
  "HP",
  "Dell",
  "Lenovo",
  "Asus",
  "Acer",
  "Apple",
  "Samsung",
  "Toshiba",
  "MSI",
  "Otra",
];
