export type PaymentResult =
    | 'PAYMENT_APPROVED'
    | 'PAYMENT_DECLINED'
    | 'PAYMENT_ERROR';

export function getPaymentResult(randomValue: number): PaymentResult {
    if (randomValue < 0.7) {
        return 'PAYMENT_APPROVED';
    }

    if (randomValue < 0.9) {
        return 'PAYMENT_DECLINED';
    }

    return 'PAYMENT_ERROR';
}

export async function processPayment(): Promise<PaymentResult> {
    await new Promise<void>((resolve) => setTimeout(resolve, 700));
    return getPaymentResult(Math.random());
}