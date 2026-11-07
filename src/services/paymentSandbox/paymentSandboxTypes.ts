/**
 * @fileoverview Tipos del contrato con la pasarela de pago simulada (sandbox).
 */

/** Escenario que la pasarela simulada debe reproducir. */
export type SandboxScenario =
    | 'APPROVE'
    | 'DECLINE'
    | 'SERVICE_ERROR'
    | 'NO_RESPONSE';

/** Solicitud de cobro enviada a la pasarela. */
export interface PaymentRequest {
    /** Número de la orden que se está pagando. */
    orderId: string;
    amount: number;
    currency: string;
}

/** Resultado de una transacción procesada por la pasarela. */
export type PaymentResponseStatus = 'PAYMENT_APPROVED' | 'PAYMENT_DECLINED';

/** Respuesta de la pasarela cuando la transacción fue procesada. */
export interface PaymentResponse {
    transactionId: string;
    orderId: string;
    amount: number;
    currency: string;
    status: PaymentResponseStatus;
    /** Mensaje descriptivo del resultado para mostrar al cliente. */
    message: string;
    /** Fecha y hora del procesamiento en ISO 8601. */
    processedAt: string;
}

/** Solicitud para devolver el monto de una transacción aprobada. */
export interface RefundRequest {
    transactionId: string;
    /** Número de la orden a la que pertenece la transacción. */
    orderId: string;
    amount: number;
    currency: string;
}

/** Respuesta de la pasarela cuando el reembolso fue procesado. */
export interface RefundResponse {
    refundId: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: 'REFUND_COMPLETED';
    /** Fecha y hora del procesamiento en ISO 8601. */
    processedAt: string;
}
