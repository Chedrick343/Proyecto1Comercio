import { Link } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';
import { GoArchive } from 'react-icons/go';
import { useTranslation } from 'react-i18next';

import { useOrders } from '../../context/OrdersContext';
import type { Order } from '../../orders/orderTypes';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { OrderStatusBadge, PaymentStatusBadge } from '../order/OrderStatusBadge';

import styles from './Orders.module.css';

const MAX_VISIBLE_THUMBNAILS = 2;

const countItems = (order: Order) =>
    order.items.reduce((total, item) => total + item.quantity, 0);

function OrderThumbnails({ order }: { order: Order }) {
    const visibleItems = order.items.slice(0, MAX_VISIBLE_THUMBNAILS);
    const hiddenItemCount = order.items.length - visibleItems.length;

    return (
        <div className={styles.thumbnails} aria-hidden="true">
            {visibleItems.map((item) => (
                <img key={item.productId} src={item.image} alt="" />
            ))}
            {hiddenItemCount > 0 && (
                <span className={styles.moreItems}>+{hiddenItemCount}</span>
            )}
        </div>
    );
}

function OrderCard({ order }: { order: Order }) {
    const { t } = useTranslation('common');
    const itemCount = countItems(order);

    return (
        <Link to={`/orden/${order.orderNumber}`} className={styles.orderCard}>
            <OrderThumbnails order={order} />

            <div className={styles.orderInfo}>
                <strong className={styles.orderNumber}>{order.orderNumber}</strong>
                <span className={styles.orderMeta}>
                    {formatDateTime(order.createdAt)} · {t('itemCount', { count: itemCount })}
                </span>
                <div className={styles.badges}>
                    <OrderStatusBadge status={order.orderStatus} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                </div>
            </div>

            <strong className={styles.orderTotal}>
                {formatCurrency(order.total, order.currency)}
            </strong>

            <FaChevronRight className={styles.chevron} aria-hidden="true" />
        </Link>
    );
}

function EmptyOrders() {
    const { t } = useTranslation('orders');

    return (
        <div className={styles.emptyState}>
            <GoArchive className={styles.emptyIcon} aria-hidden="true" />
            <h3>{t('history.emptyTitle')}</h3>
            <p>{t('history.emptyDescription')}</p>
            <Link to="/" className={styles.catalogLink}>
                {t('history.exploreCatalog')}
            </Link>
        </div>
    );
}

export default function Orders() {
    const { t } = useTranslation('orders');
    const { orders } = useOrders();

    return (
        <section className={styles.ordersPanel} aria-labelledby="orders-heading">
            <div className={styles.panelHeader}>
                <h2 id="orders-heading">{t('history.title')}</h2>
                {orders.length > 0 && (
                    <span className={styles.count}>{orders.length}</span>
                )}
            </div>

            {orders.length === 0 ? (
                <EmptyOrders />
            ) : (
                <ul className={styles.orderList}>
                    {orders.map((order) => (
                        <li key={order.orderNumber}>
                            <OrderCard order={order} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
