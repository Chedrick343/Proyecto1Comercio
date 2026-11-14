/**
 * @fileoverview Detalle completo de una orden.
 */

import { useTranslation } from 'react-i18next';

import { IVA_RATE, SHIPPING_RATE } from '../../context/CartContext';
import type { Order } from '../../orders/orderTypes';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { formatRate } from '../../utils/formatRate';
import { OrderStatusBadge, PaymentStatusBadge } from './OrderStatusBadge';
import OrderStatusTimeline from './OrderStatusTimeline';

import styles from './OrderDetails.module.css';

/**
 * Muestra quién hizo la compra, desde qué sucursal y en qué condiciones
 * comerciales. Las órdenes guardadas antes del Proyecto III no tienen estos
 * datos, así que el panel lo indica.
 *
 * @param props Propiedades del componente.
 * @param props.order Orden a mostrar.
 * @return El panel del comprador y las condiciones.
 */
function OrderBuyerPanel({ order }: { order: Order }) {
    const { t } = useTranslation('orders');
    const { buyer, branch, priceTier } = order;

    return (
        <section className={styles.panel} aria-labelledby="order-buyer-heading">
            <h2 id="order-buyer-heading">{t('details.buyerTitle')}</h2>

            {!buyer ? (
                <p className={styles.legacyNote}>{t('details.legacyOrder')}</p>
            ) : (
                <dl className={styles.infoList}>
                    <div>
                        <dt>{t('details.buyer')}</dt>
                        <dd>{buyer.name} · {buyer.email}</dd>
                    </div>
                    <div>
                        <dt>{t('details.customerType')}</dt>
                        <dd>{t(`buyerRoles.${buyer.role}`)}</dd>
                    </div>
                    {buyer.company && (
                        <div>
                            <dt>{t('details.company')}</dt>
                            <dd>
                                {t('details.companyValue', {
                                    name: buyer.company.name,
                                    taxId: buyer.company.taxId
                                })}
                            </dd>
                        </div>
                    )}
                    {priceTier && (
                        <div>
                            <dt>{t('details.priceTier')}</dt>
                            <dd>{t(`priceTiers.${priceTier}`)}</dd>
                        </div>
                    )}
                    {branch && (
                        <div>
                            <dt>{t('details.branch')}</dt>
                            <dd>{branch.name}</dd>
                        </div>
                    )}
                    <div>
                        <dt>{t('details.purchase')}</dt>
                        <dd>
                            {order.isPartialPurchase
                                ? t('details.partialPurchase')
                                : t('details.wholePurchase')}
                        </dd>
                    </div>
                </dl>
            )}
        </section>
    );
}

/**
 * Muestra el estado de la orden y del pago, el comprador y las condiciones
 * comerciales, los datos de entrega, los productos y los totales.
 *
 * @param props Propiedades del componente.
 * @param props.order Orden a mostrar.
 * @return El detalle de la orden.
 */
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
                    {order.failureReason && (
                        <div>
                            <dt>{t('orders:details.failureReason')}</dt>
                            <dd>{t(`orders:failureReasons.${order.failureReason}`)}</dd>
                        </div>
                    )}
                    <div>
                        <dt>{t('orders:details.attempts')}</dt>
                        <dd>{order.paymentAttempts}</dd>
                    </div>
                    {order.transactionId && (
                        <div>
                            <dt>{t('orders:details.transaction')}</dt>
                            <dd>{order.transactionId}</dd>
                        </div>
                    )}
                    {order.termsAcceptance && (
                        <div>
                            <dt>{t('orders:details.terms')}</dt>
                            <dd>
                                {t('orders:details.termsAcceptedAt', {
                                    date: formatDateTime(order.termsAcceptance.acceptedAt)
                                })}
                            </dd>
                        </div>
                    )}
                </dl>
            </section>

            <OrderBuyerPanel order={order} />

            <section
                className={`${styles.panel} ${styles.deliveryPanel}`}
                aria-labelledby="order-delivery-heading"
            >
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

            {order.statusHistory && order.statusHistory.length > 0 && (
                <section
                    className={`${styles.panel} ${styles.historyPanel}`}
                    aria-labelledby="order-history-heading"
                >
                    <h2 id="order-history-heading">{t('orders:details.historyTitle')}</h2>
                    <OrderStatusTimeline history={order.statusHistory} />
                </section>
            )}

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
                                    {item.priceTier === 'B2B' && (
                                        <span className={styles.tierTag}>B2B</span>
                                    )}
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
