import { useTranslation } from 'react-i18next';

import type { OrderStatus, PaymentStatus } from '../../orders/orderTypes';

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
    const { t } = useTranslation('orders');

    return (
        <StatusBadge
            label={t(`status.order.${status}`)}
            tone={ORDER_STATUS_TONES[status]}
        />
    );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
    const { t } = useTranslation('orders');

    return (
        <StatusBadge
            label={t(`status.payment.${status}`)}
            tone={PAYMENT_STATUS_TONES[status]}
        />
    );
}
