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
