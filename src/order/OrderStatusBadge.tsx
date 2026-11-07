/**
 * @fileoverview Etiquetas de color para los estados de órdenes y pagos.
 */

import { useTranslation } from 'react-i18next';

import type { OrderStatus, PaymentStatus } from '../../orders/orderTypes';

import styles from './OrderStatusBadge.module.css';

/** Color de la etiqueta según la gravedad del estado. */
type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

/** Color de cada estado de orden. */
const ORDER_STATUS_TONES: Record<OrderStatus, StatusTone> = {
    CONFIRMED: 'success',
    PENDING: 'warning',
    FAILED: 'danger'
};

/** Color de cada estado de pago. */
const PAYMENT_STATUS_TONES: Record<PaymentStatus, StatusTone> = {
    APPROVED: 'success',
    PENDING: 'warning',
    DECLINED: 'danger',
    ERROR: 'danger',
    REFUNDED: 'neutral',
    CANCELLED: 'neutral'
};

/**
 * Muestra una etiqueta de estado.
 *
 * @param props Propiedades del componente.
 * @param props.label Texto de la etiqueta.
 * @param props.tone Color de la etiqueta.
 * @return La etiqueta.
 */
function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
    return <span className={`${styles.badge} ${styles[tone]}`}>{label}</span>;
}

/**
 * Muestra el estado de una orden.
 *
 * @param props Propiedades del componente.
 * @param props.status Estado de la orden.
 * @return La etiqueta del estado.
 */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    const { t } = useTranslation('orders');

    return (
        <StatusBadge
            label={t(`status.order.${status}`)}
            tone={ORDER_STATUS_TONES[status]}
        />
    );
}

/**
 * Muestra el estado de un pago.
 *
 * @param props Propiedades del componente.
 * @param props.status Estado del pago.
 * @return La etiqueta del estado.
 */
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
    const { t } = useTranslation('orders');

    return (
        <StatusBadge
            label={t(`status.payment.${status}`)}
            tone={PAYMENT_STATUS_TONES[status]}
        />
    );
}
