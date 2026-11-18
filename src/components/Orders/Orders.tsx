/**
 * @fileoverview Historial de órdenes del cliente.
 */

import { Link } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';
import { GoArchive } from 'react-icons/go';
import { useTranslation } from 'react-i18next';

import type { Order } from '../../orders/orderTypes';
import { useOwnOrders } from '../../orders/useOwnOrders';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { OrderStatusBadge, PaymentStatusBadge } from '../order/OrderStatusBadge';

import styles from './Orders.module.css';

/** Cantidad máxima de miniaturas de productos por orden. */
const MAX_VISIBLE_THUMBNAILS = 2;

/**
 * Cuenta las unidades de una orden.
 *
 * @param order Orden a contar.
 * @return La suma de las cantidades de sus productos.
 */
const countItems = (order: Order) =>
    order.items.reduce((total, item) => total + item.quantity, 0);

/**
 * Muestra miniaturas de los primeros productos de una orden y cuántos más
 * contiene.
 *
 * @param props Propiedades del componente.
 * @param props.order Orden a mostrar.
 * @return Las miniaturas, ocultas para lectores de pantalla.
 */
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

/**
 * Muestra el resumen de una orden como enlace a su detalle.
 *
 * @param props Propiedades del componente.
 * @param props.order Orden a mostrar.
 * @return La tarjeta de la orden.
 */
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

/**
 * Indica que todavía no hay órdenes e invita a explorar el catálogo.
 *
 * @return El mensaje de historial vacío.
 */
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

/**
 * Muestra las órdenes de quien usa la tienda, de la más reciente a la más
 * antigua.
 *
 * @return El panel del historial de órdenes.
 */
export default function Orders() {
    const { t } = useTranslation('orders');
    const orders = useOwnOrders();

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
