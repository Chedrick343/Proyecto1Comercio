/**
 * @fileoverview Tipos del dominio de órdenes. El estado de la orden y el del
 * pago se manejan por separado: un pago aprobado no garantiza que la orden se
 * confirme, y una orden puede fallar sin que se haya cobrado.
 */

import type { ShippingDetails } from '../components/checkout/checkoutTypes';
import type { PriceTier } from '../pricing/customerPrice';

/** Estado general de una orden. */
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

/** Estado del pago asociado a una orden. */
export type PaymentStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'DECLINED'
    | 'ERROR'
    | 'REFUNDED'
    /** La orden falló antes de que se lograra cobrar, así que ya no se cobrará. */
    | 'CANCELLED';

/** Estados de pago posibles una vez que la pasarela respondió a un cobro. */
export type ProcessedPaymentStatus = Extract<PaymentStatus, 'APPROVED' | 'DECLINED' | 'ERROR'>;

/** Motivo por el que una orden pasó a FAILED. */
export type OrderFailureReason =
    /** Un producto se agotó antes de cobrar. */
    | 'OUT_OF_STOCK'
    /** El total de la orden no coincide con los precios vigentes. */
    | 'AMOUNT_MISMATCH'
    /** El pago se aprobó, pero la orden no se pudo confirmar y se reembolsó. */
    | 'CONFIRMATION_ERROR'
    /** Se rechazaron todos los intentos de pago permitidos. */
    | 'MAX_ATTEMPTS';

/** Hecho que provocó un cambio de estado en la orden o en su pago. */
export type OrderEvent =
    | 'CREATED'
    | 'PAYMENT_APPROVED'
    | 'PAYMENT_DECLINED'
    | 'PAYMENT_ERROR'
    | 'PAYMENT_REFUNDED'
    | 'ORDER_CONFIRMED'
    | 'ORDER_FAILED';

/** Registro de un cambio de estado de la orden. */
export interface OrderStatusEntry {
    /** Fecha y hora del cambio en ISO 8601. */
    changedAt: string;
    event: OrderEvent;
    /** Estado de la orden después del cambio. */
    orderStatus: OrderStatus;
    /** Estado del pago después del cambio. */
    paymentStatus: PaymentStatus;
    /** Motivo del fallo, si el cambio dejó la orden en FAILED. */
    failureReason?: OrderFailureReason;
}

/** Producto incluido en una orden, con su precio fijado al momento de la compra. */
export interface OrderItem {
    productId: string;
    name: string;
    image: string;
    unitPrice: number;
    /**
     * Tipo de precio con el que se cobró el producto. Es opcional porque las
     * órdenes guardadas antes de los precios B2B no lo tienen (eran B2C).
     */
    priceTier?: PriceTier;
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
    /**
     * Tipo de precio con el que se hizo la compra (condición comercial). Es
     * opcional porque las órdenes guardadas antes de los precios B2B no lo tienen.
     */
    priceTier?: PriceTier;
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
    /** Motivo del fallo; solo existe cuando la orden está en FAILED. */
    failureReason?: OrderFailureReason;
    /**
     * Cambios de estado, del más antiguo al más reciente. Es opcional porque
     * las órdenes guardadas antes de que existiera pueden no tenerlo.
     */
    statusHistory?: OrderStatusEntry[];
}
