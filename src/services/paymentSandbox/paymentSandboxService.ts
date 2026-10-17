import type {
    PaymentRequest,
    PaymentResponse,
    PaymentResponseStatus,
    SandboxScenario
} from './paymentSandboxTypes';

const PROCESSING_DELAY_MS = 1200;
const NO_RESPONSE_DELAY_MS = 30000;

const RESPONSE_MESSAGES: Record<PaymentResponseStatus, string> = {
    PAYMENT_APPROVED: 'Transacción aprobada.',
    PAYMENT_DECLINED: 'Transacción rechazada por el emisor de la tarjeta.'
};

export class PaymentServiceError extends Error {
    readonly code = 'PAYMENT_ERROR';

    constructor(message: string) {
        super(message);
        this.name = 'PaymentServiceError';
    }
}

const wait = (milliseconds: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function generateTransactionId(): string {
    const timePart = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

    return `TXN-${timePart}-${randomPart}`;
}

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
