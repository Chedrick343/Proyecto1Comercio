/**
 * @fileoverview Pasarela de pago simulada. Reproduce aprobaciones, rechazos, errores del
 * servicio y falta de respuesta para probar el flujo de pago sin cobros reales. También
 * procesa los reembolsos de las órdenes que no se pudieron confirmar.
 */

import type {
    PaymentRequest,
    PaymentResponse,
    PaymentResponseStatus,
    RefundRequest,
    RefundResponse,
    SandboxScenario
} from './paymentSandboxTypes';

/** Tiempo simulado que tarda la pasarela en responder. */
const PROCESSING_DELAY_MS = 1200;
/** Espera del escenario sin respuesta; supera el tiempo límite del cliente. */
const NO_RESPONSE_DELAY_MS = 30000;

/** Mensaje que acompaña a cada resultado de transacción. */
const RESPONSE_MESSAGES: Record<PaymentResponseStatus, string> = {
    PAYMENT_APPROVED: 'Transacción aprobada.',
    PAYMENT_DECLINED: 'Transacción rechazada por el emisor de la tarjeta.'
};

/** Error lanzado cuando la pasarela no puede procesar el pago. */
export class PaymentServiceError extends Error {
    /** Código del error, equivalente al resultado PAYMENT_ERROR. */
    readonly code = 'PAYMENT_ERROR';

    /** @param message Descripción del error. */
    constructor(message: string) {
        super(message);
        this.name = 'PaymentServiceError';
    }
}

/**
 * Espera la cantidad de milisegundos indicada.
 *
 * @param milliseconds Tiempo de espera.
 * @return Una promesa que se resuelve al terminar la espera.
 */
const wait = (milliseconds: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

/**
 * Genera un identificador de transacción único.
 *
 * @return Un identificador con el formato TXN-<tiempo>-<aleatorio>.
 */
function generateTransactionId(): string {
    const timePart = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

    return `TXN-${timePart}-${randomPart}`;
}

/**
 * Valida que la solicitud tenga orden, moneda y un monto positivo.
 *
 * @param request Solicitud a validar.
 * @throws {PaymentServiceError} Si la solicitud es inválida.
 */
function assertValidRequest(request: PaymentRequest) {
    const isValid =
        request.orderId.trim() !== '' &&
        request.currency.trim() !== '' &&
        Number.isFinite(request.amount) &&
        request.amount > 0;

    if (!isValid) {
        throw new PaymentServiceError('La solicitud de pago es inválida.');
    }
}

/**
 * Construye la respuesta de una transacción procesada.
 *
 * @param request Solicitud procesada.
 * @param status Resultado de la transacción.
 * @return La respuesta con un identificador de transacción nuevo.
 */
function buildResponse(
    request: PaymentRequest,
    status: PaymentResponseStatus
): PaymentResponse {
    return {
        transactionId: generateTransactionId(),
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency,
        status,
        message: RESPONSE_MESSAGES[status],
        processedAt: new Date().toISOString()
    };
}

/**
 * Procesa un pago simulado según el escenario elegido.
 *
 * @param request Solicitud de cobro.
 * @param scenario Escenario a reproducir.
 * @return La respuesta de la pasarela si la transacción fue aprobada o rechazada.
 * @throws {PaymentServiceError} Si la solicitud es inválida o el escenario
 *     simula un error del servicio o falta de respuesta.
 */
export async function processSandboxPayment(
    request: PaymentRequest,
    scenario: SandboxScenario
): Promise<PaymentResponse> {
    if (scenario === 'NO_RESPONSE') {
        await wait(NO_RESPONSE_DELAY_MS);
    } else {
        await wait(PROCESSING_DELAY_MS);
    }

    assertValidRequest(request);

    switch (scenario) {
        case 'APPROVE':
            return buildResponse(request, 'PAYMENT_APPROVED');
        case 'DECLINE':
            return buildResponse(request, 'PAYMENT_DECLINED');
        case 'SERVICE_ERROR':
        case 'NO_RESPONSE':
            throw new PaymentServiceError(
                'El proveedor de pagos no está disponible.'
            );
    }
}

/**
 * Devuelve el monto de una transacción aprobada. La tienda lo solicita cuando
 * cobró una orden que después no pudo confirmar.
 *
 * @param request Solicitud de reembolso.
 * @return La respuesta con un identificador de reembolso nuevo.
 * @throws {PaymentServiceError} Si la solicitud es inválida.
 */
export async function refundSandboxPayment(request: RefundRequest): Promise<RefundResponse> {
    await wait(PROCESSING_DELAY_MS);

    assertValidRequest(request);

    if (request.transactionId.trim() === '') {
        throw new PaymentServiceError('La solicitud de reembolso no indica la transacción.');
    }

    return {
        refundId: generateTransactionId().replace('TXN', 'RFD'),
        transactionId: request.transactionId,
        amount: request.amount,
        currency: request.currency,
        status: 'REFUND_COMPLETED',
        processedAt: new Date().toISOString()
    };
}
