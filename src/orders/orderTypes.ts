import type { ShippingDetails } from '../components/checkout/checkoutTypes';

/**
 * Estado de la orden: describe lo que ocurrió con la compra como un todo.
 * - PENDING: la orden existe pero aún no tiene un pago aprobado
 *   (recién creada o el servicio de pago falló y se puede reintentar).
 * - CONFIRMED: el pago fue aprobado y la compra quedó confirmada.
 * - FAILED: el pago fue rechazado; la orden no se confirmó.
 */
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

/**
 * Estado del pago: describe la respuesta del servicio de pagos Sandbox.
 * Se maneja separado de OrderStatus porque un mismo estado de orden
 * puede venir de resultados de pago distintos.
 */
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

/**
 * Copia de un producto del carrito en el momento de crear la orden.
 * Se guarda como "foto" para que la orden no cambie si luego cambia el carrito.
 */
export interface OrderItem {
    productId: string;
    name: string;
    image: string;
    unitPrice: number;
    currency: string;
    quantity: number;
    lineSubtotal: number;
}

/** Montos de la orden, tomados tal cual de los calculados por el carrito. */
export interface OrderTotals {
    subtotal: number;
    iva: number;
    shipping: number;
    total: number;
}

export interface Order extends OrderTotals {
    /** Número de orden visible para el usuario, p. ej. ORD-20261016-K3F9QZ. */
    orderNumber: string;
    /** Fecha de creación en formato ISO 8601. */
    createdAt: string;
    /** Última vez que cambió el estado de la orden o del pago (ISO 8601). */
    updatedAt: string;
    currency: string;
    /** Información del comprador y de entrega capturada en el checkout. */
    customer: ShippingDetails;
    items: OrderItem[];
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    /** Cantidad de intentos de pago realizados sobre esta orden. */
    paymentAttempts: number;
    /** Identificador de la transacción devuelto por el Sandbox, si existe. */
    transactionId?: string;
    /** Mensaje del último resultado de pago, para mostrarlo al usuario. */
    paymentMessage?: string;
}

/**
 * Traduce el resultado del pago al estado que debe tener la orden.
 * Un error del servicio deja la orden en PENDING para permitir reintentar.
 */
export function getOrderStatusForPayment(
    paymentStatus: PaymentStatus
): OrderStatus {
    switch (paymentStatus) {
        case 'APPROVED':
            return 'CONFIRMED';
        case 'DECLINED':
            return 'FAILED';
        case 'ERROR':
        case 'PENDING':
        default:
            return 'PENDING';
    }
}

/** Etiquetas en español para mostrar los estados en la interfaz. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    FAILED: 'Fallida'
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobado',
    DECLINED: 'Rechazado',
    ERROR: 'Error del servicio'
};
