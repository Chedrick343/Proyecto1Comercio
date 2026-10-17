import { processSandboxPayment } from '../../services/paymentSandbox/paymentSandboxService';
import type {
    PaymentRequest,
    SandboxScenario
} from '../../services/paymentSandbox/paymentSandboxTypes';
import type { ProcessedPaymentStatus } from '../../orders/orderTypes';

export type PaymentResult =
    | 'PAYMENT_APPROVED'
    | 'PAYMENT_DECLINED'
    | 'PAYMENT_ERROR';

export const PAYMENT_STATUS_BY_RESULT: Record<PaymentResult, ProcessedPaymentStatus> = {
    PAYMENT_APPROVED: 'APPROVED',
    PAYMENT_DECLINED: 'DECLINED',
    PAYMENT_ERROR: 'ERROR'
};

export interface PaymentOutcome {
    result: PaymentResult;
    transactionId?: string;
    providerMessage?: string;
}

const PAYMENT_TIMEOUT_MS = 5000;

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

// Never throws: any provider failure or timeout becomes PAYMENT_ERROR so the UI can offer a retry.
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
