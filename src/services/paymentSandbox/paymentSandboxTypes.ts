export type SandboxScenario =
    | 'APPROVE'
    | 'DECLINE'
    | 'SERVICE_ERROR'
    | 'NO_RESPONSE';

export interface PaymentRequest {
    orderId: string;
    amount: number;
    currency: string;
}

export type PaymentResponseStatus = 'PAYMENT_APPROVED' | 'PAYMENT_DECLINED';

export interface PaymentResponse {
    transactionId: string;
    orderId: string;
    amount: number;
    currency: string;
    status: PaymentResponseStatus;
    message: string;
    processedAt: string;
}
