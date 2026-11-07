/**
 * @fileoverview Línea de tiempo con los cambios de estado de una orden.
 */

import { useTranslation } from 'react-i18next';

import type { OrderEvent, OrderStatusEntry } from '../../orders/orderTypes';
import { formatDateTime } from '../../utils/formatDate';
import { OrderStatusBadge, PaymentStatusBadge } from './OrderStatusBadge';

import styles from './OrderStatusTimeline.module.css';

/** Color del punto de cada evento según su efecto. */
const EVENT_TONES: Record<OrderEvent, 'neutral' | 'success' | 'danger'> = {
    CREATED: 'neutral',
    PAYMENT_APPROVED: 'success',
    PAYMENT_DECLINED: 'danger',
    PAYMENT_ERROR: 'danger',
    PAYMENT_REFUNDED: 'neutral',
    ORDER_CONFIRMED: 'success',
    ORDER_FAILED: 'danger'
};

/**
 * Muestra cada cambio de estado con su fecha, el evento que lo provocó y
 * cómo quedaron la orden y el pago.
 *
 * @param props Propiedades del componente.
 * @param props.history Cambios de estado, del más antiguo al más reciente.
 * @return La lista de cambios.
 */
export default function OrderStatusTimeline({ history }: { history: OrderStatusEntry[] }) {
    const { t } = useTranslation('orders');

    return (
        <ol className={styles.timeline}>
            {history.map((entry, index) => (
                <li key={`${entry.changedAt}-${index}`} className={styles.entry}>
                    <span className={`${styles.dot} ${styles[EVENT_TONES[entry.event]]}`} aria-hidden="true" />

                    <div className={styles.entryBody}>
                        <p className={styles.event}>
                            {t(`events.${entry.event}`)}
                            {entry.failureReason && (
                                <span className={styles.reason}>
                                    {' · '}{t(`failureReasons.${entry.failureReason}`)}
                                </span>
                            )}
                        </p>
                        <time className={styles.date} dateTime={entry.changedAt}>
                            {formatDateTime(entry.changedAt)}
                        </time>
                    </div>

                    <dl className={styles.statuses}>
                        <div>
                            <dt>{t('details.order')}</dt>
                            <dd><OrderStatusBadge status={entry.orderStatus} /></dd>
                        </div>
                        <div>
                            <dt>{t('details.payment')}</dt>
                            <dd><PaymentStatusBadge status={entry.paymentStatus} /></dd>
                        </div>
                    </dl>
                </li>
            ))}
        </ol>
    );
}
