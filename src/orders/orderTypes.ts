/**
 * @fileoverview Tipos del dominio de órdenes y la relación entre estados de pago y de orden.
 */

import type { ShippingDetails } from '../components/checkout/checkoutTypes';

/** Estado general de una orden. */
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

/** Estado del pago asociado a una orden. */
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

/** Estados de pago posibles una vez que la pasarela respondió. */
export type ProcessedPaymentStatus = Exclude<PaymentStatus, 'PENDING'>;

/** Producto incluido en una orden, con su precio fijado al momento de la compra. */
export interface OrderItem {
    productId: string;
    name: string;
    image: string;
    unitPrice: number;
    currency: string;
    quantity: number;
    /** Precio unitario multiplicado por la cantidad. */
    lineSubtotal: number;
}

/** Montos que resumen el costo de una orden. */
export interface OrderTotals {
    subtotal: number;
    iva: number;
    shipping: number;
    total: number;
}

/** Constancia de aceptación de los términos y condiciones. */
export interface TermsAcceptance {
    /** Fecha y hora de aceptación en ISO 8601. */
    acceptedAt: string;
    termsVersion: string;
}

/** Orden de compra con sus productos, datos del cliente y estado del pago. */
export interface Order extends OrderTotals {
    /** Identificador legible con el formato ORD-AAAAMMDD-XXXXXX. */
    orderNumber: string;
    createdAt: string;
    updatedAt: string;
    currency: string;
    customer: ShippingDetails;
    /**
     * Constancia de aceptación de términos. Es opcional solo porque las órdenes
     * guardadas antes de que existiera este campo pueden no tenerlo.
     */
    termsAcceptance?: TermsAcceptance;
    items: OrderItem[];
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    /** Cantidad de intentos de pago realizados. */
    paymentAttempts: number;
    /** Identificador de la transacción devuelto por la pasarela de pago. */
    transactionId?: string;
    /** Mensaje devuelto por la pasarela de pago en el último intento. */
    paymentMessage?: string;
}

/**
 * Estado que adopta la orden según el resultado del pago. Un error del
 * servicio mantiene la orden en PENDING para que el cliente pueda reintentar.
 */
export const ORDER_STATUS_BY_PAYMENT_STATUS: Record<
    ProcessedPaymentStatus,
    OrderStatus
> = {
    APPROVED: 'CONFIRMED',
    DECLINED: 'FAILED',
    ERROR: 'PENDING'
};

