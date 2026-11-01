/**
 * @fileoverview Capa entre el checkout y la pasarela de pago, con tiempo límite de respuesta.
 */

import { processSandboxPayment } from '../../services/paymentSandbox/paymentSandboxService';
import type {
    PaymentRequest,
    SandboxScenario
} from '../../services/paymentSandbox/paymentSandboxTypes';
import type { ProcessedPaymentStatus } from '../../orders/orderTypes';

/** Resultado de un intento de pago, tal como lo ve la interfaz. */
export type PaymentResult =
    | 'PAYMENT_APPROVED'
    | 'PAYMENT_DECLINED'
    | 'PAYMENT_ERROR';

/** Estado de pago de la orden que corresponde a cada resultado. */
export const PAYMENT_STATUS_BY_RESULT: Record<PaymentResult, ProcessedPaymentStatus> = {
    PAYMENT_APPROVED: 'APPROVED',
    PAYMENT_DECLINED: 'DECLINED',
    PAYMENT_ERROR: 'ERROR'
};

/** Resultado de un intento de pago con los datos de la transacción. */
export interface PaymentOutcome {
    result: PaymentResult;
    transactionId?: string;
    providerMessage?: string;
}

/** Tiempo máximo de espera de la respuesta de la pasarela. */
const PAYMENT_TIMEOUT_MS = 5000;

/**
 * Espera una operación, pero la rechaza si no termina a tiempo.
 *
 * @param operation Operación a esperar.
 * @param timeoutMs Tiempo máximo de espera en milisegundos.
 * @return El resultado de la operación.
 * @throws {Error} Si se agota el tiempo o la operación falla.
 * @template T
 */
async function withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
            () => reject(new Error('El servicio de pago no respondió a tiempo.')),
            timeoutMs
        );
    });

    try {
        return await Promise.race([operation, timeout]);
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Envía un pago a la pasarela. Nunca lanza errores: cualquier falla del
 * proveedor o tiempo agotado se convierte en PAYMENT_ERROR para que la
 * interfaz pueda ofrecer reintentar.
 *
 * @param request Solicitud de cobro.
 * @param scenario Escenario que debe reproducir la pasarela simulada.
 * @return El resultado del pago.
 */
export async function submitPayment(
    request: PaymentRequest,
    scenario: SandboxScenario
): Promise<PaymentOutcome> {
    try {
        const response = await withTimeout(
            processSandboxPayment(request, scenario),
            PAYMENT_TIMEOUT_MS
        );

        return {
            result: response.status,
            transactionId: response.transactionId,
            providerMessage: response.message
        };
    } catch (error) {
        console.error('Fallo en el servicio de pago:', error);

        return { result: 'PAYMENT_ERROR' };
    }
}
