import type { ShippingDetails } from '../components/checkout/checkoutTypes';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

export type ProcessedPaymentStatus = Exclude<PaymentStatus, 'PENDING'>;

export interface OrderItem {
    productId: string;
    name: string;
    image: string;
    unitPrice: number;
    currency: string;
    quantity: number;
    lineSubtotal: number;
}

export interface OrderTotals {
    subtotal: number;
    iva: number;
    shipping: number;
    total: number;
}

export interface Order extends OrderTotals {
    orderNumber: string;
    createdAt: string;
    updatedAt: string;
    currency: string;
    customer: ShippingDetails;
    items: OrderItem[];
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentAttempts: number;
    transactionId?: string;
    paymentMessage?: string;
}

// A service error keeps the order PENDING so the customer can retry the payment.
export const ORDER_STATUS_BY_PAYMENT_STATUS: Record<
    ProcessedPaymentStatus,
    OrderStatus
> = {
    APPROVED: 'CONFIRMED',
    DECLINED: 'FAILED',
    ERROR: 'PENDING'
};

