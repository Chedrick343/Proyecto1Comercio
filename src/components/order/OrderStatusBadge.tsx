import {
    ORDER_STATUS_LABELS,
    PAYMENT_STATUS_LABELS,
    type OrderStatus,
    type PaymentStatus
} from '../../orders/orderTypes';

import styles from './OrderStatusBadge.module.css';

type StatusTone = 'success' | 'warning' | 'danger';

const ORDER_STATUS_TONES: Record<OrderStatus, StatusTone> = {
    CONFIRMED: 'success',
    PENDING: 'warning',
    FAILED: 'danger'
};

const PAYMENT_STATUS_TONES: Record<PaymentStatus, StatusTone> = {
    APPROVED: 'success',
    PENDING: 'warning',
    DECLINED: 'danger',
    ERROR: 'danger'
};

function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
    return <span className={`${styles.badge} ${styles[tone]}`}>{label}</span>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    return (
        <StatusBadge
            label={ORDER_STATUS_LABELS[status]}
            tone={ORDER_STATUS_TONES[status]}
        />
    );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
    return (
        <StatusBadge
            label={PAYMENT_STATUS_LABELS[status]}
            tone={PAYMENT_STATUS_TONES[status]}
        />
    );
}
