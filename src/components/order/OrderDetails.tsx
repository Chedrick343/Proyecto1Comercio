import { useTranslation } from 'react-i18next';

import { IVA_RATE, SHIPPING_RATE } from '../../context/CartContext';
import type { Order } from '../../orders/orderTypes';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRate } from '../../utils/formatRate';
import { OrderStatusBadge, PaymentStatusBadge } from './OrderStatusBadge';

import styles from './OrderDetails.module.css';

export default function OrderDetails({ order }: { order: Order }) {
    const { t } = useTranslation(['orders', 'common']);
    const { customer } = order;

    return (
        <div className={styles.orderDetails}>
            <section className={styles.panel} aria-labelledby="order-status-heading">
                <h2 id="order-status-heading">{t('orders:details.statusTitle')}</h2>

                <dl className={styles.infoList}>
                    <div>
                        <dt>{t('orders:details.order')}</dt>
                        <dd><OrderStatusBadge status={order.orderStatus} /></dd>
                    </div>
                    <div>
                        <dt>{t('orders:details.payment')}</dt>
                        <dd><PaymentStatusBadge status={order.paymentStatus} /></dd>
                    </div>
                    {order.transactionId && (
                        <div>
                            <dt>{t('orders:details.transaction')}</dt>
                            <dd>{order.transactionId}</dd>
                        </div>
                    )}
                </dl>
            </section>

            <section className={styles.panel} aria-labelledby="order-delivery-heading">
                <h2 id="order-delivery-heading">{t('orders:details.deliveryTitle')}</h2>

                <dl className={styles.infoList}>
                    <div>
                        <dt>{t('common:delivery.recipient')}</dt>
                        <dd>{customer.fullName}</dd>
                    </div>
                    <div>
                        <dt>{t('common:delivery.contact')}</dt>
                        <dd>{customer.email} · {customer.phone}</dd>
                    </div>
                    <div>
                        <dt>{t('common:delivery.address')}</dt>
                        <dd>
                            {customer.address}, {customer.canton}, {customer.province}
                        </dd>
                    </div>
                    {customer.deliveryNotes.trim() && (
                        <div>
                            <dt>{t('common:delivery.notes')}</dt>
                            <dd>{customer.deliveryNotes}</dd>
                        </div>
                    )}
                </dl>
            </section>

            <section
                className={`${styles.panel} ${styles.productsPanel}`}
                aria-labelledby="order-products-heading"
            >
                <h2 id="order-products-heading">{t('orders:details.productsTitle')}</h2>

                <table className={styles.itemsTable}>
                    <thead>
                        <tr>
                            <th scope="col">{t('orders:details.columns.product')}</th>
                            <th scope="col">{t('orders:details.columns.quantity')}</th>
                            <th scope="col">{t('orders:details.columns.unitPrice')}</th>
                            <th scope="col">{t('common:summary.subtotal')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item) => (
                            <tr key={item.productId}>
                                <td data-label={t('orders:details.columns.product')}>{item.name}</td>
                                <td data-label={t('orders:details.columns.quantity')}>{item.quantity}</td>
                                <td data-label={t('orders:details.columns.unitPrice')}>
                                    {formatCurrency(item.unitPrice, item.currency)}
                                </td>
                                <td data-label={t('common:summary.subtotal')}>
                                    {formatCurrency(item.lineSubtotal, item.currency)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <dl className={styles.totals}>
                    <div>
                        <dt>{t('common:summary.subtotal')}</dt>
                        <dd>{formatCurrency(order.subtotal, order.currency)}</dd>
                    </div>
                    <div>
                        <dt>{t('common:summary.iva', { rate: formatRate(IVA_RATE) })}</dt>
                        <dd>{formatCurrency(order.iva, order.currency)}</dd>
                    </div>
                    <div>
                        <dt>{t('common:summary.shipping', { rate: formatRate(SHIPPING_RATE) })}</dt>
                        <dd>{formatCurrency(order.shipping, order.currency)}</dd>
                    </div>
                    <div className={styles.totalRow}>
                        <dt>{t('common:summary.total')}</dt>
                        <dd>{formatCurrency(order.total, order.currency)}</dd>
                    </div>
                </dl>
            </section>
        </div>
    );
}
