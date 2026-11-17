/**
 * @fileoverview Consulta de todas las órdenes en el panel administrativo.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSyncAlt } from 'react-icons/fa';

import { useOrders } from '../../context/OrdersContext';
import { BRANCHES } from '../../inventory/branches';
import {
    ALL_FILTER,
    filterAdminOrders,
    INITIAL_ADMIN_ORDER_FILTERS,
    type AdminOrderFilters
} from '../../orders/adminOrderFilters';
import type { Order, OrderStatus } from '../../orders/orderTypes';
import type { AccessLevel } from '../../session/permissions';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { OrderStatusBadge, PaymentStatusBadge } from '../order/OrderStatusBadge';

import styles from './AdminOrdersList.module.css';

/** Tipos de cliente que pueden comprar, en el orden del filtro. */
const CUSTOMER_TYPES: AccessLevel[] = ['GUEST', 'B2C', 'B2B'];

/** Estados de orden, en el orden del filtro. */
const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'FAILED'];

/**
 * Muestra una fila de la tabla con los datos de una orden. Las órdenes
 * anteriores al Proyecto III no tienen comprador ni sucursal; en ese caso se
 * usa el nombre de entrega y se indica que el dato no se registró.
 *
 * @param props Propiedades del componente.
 * @param props.order Orden a mostrar.
 * @return La fila de la orden.
 */
function OrderRow({ order }: { order: Order }) {
    const { t } = useTranslation(['admin', 'orders']);
    const notRecorded = t('admin:orders.notRecorded');

    return (
        <tr>
            <td data-label={t('admin:orders.columns.orderNumber')}>
                <Link to={`/orden/${order.orderNumber}`} className={styles.orderLink}>
                    {order.orderNumber}
                </Link>
            </td>
            <td data-label={t('admin:orders.columns.date')}>{formatDateTime(order.createdAt)}</td>
            <td data-label={t('admin:orders.columns.customer')}>
                <span className={styles.customerName}>{order.buyer?.name ?? order.customer.fullName}</span>
                <span className={styles.customerEmail}>{order.buyer?.email ?? order.customer.email}</span>
            </td>
            <td data-label={t('admin:orders.columns.customerType')}>
                {order.buyer ? t(`orders:buyerRoles.${order.buyer.role}`) : notRecorded}
            </td>
            <td data-label={t('admin:orders.columns.company')}>
                {order.buyer?.company?.name ?? t('admin:orders.noCompany')}
            </td>
            <td data-label={t('admin:orders.columns.branch')}>{order.branch?.name ?? notRecorded}</td>
            <td data-label={t('admin:orders.columns.total')} className={styles.totalCell}>
                {formatCurrency(order.total, order.currency)}
            </td>
            <td data-label={t('admin:orders.columns.orderStatus')}>
                <OrderStatusBadge status={order.orderStatus} />
            </td>
            <td data-label={t('admin:orders.columns.paymentStatus')}>
                <PaymentStatusBadge status={order.paymentStatus} />
            </td>
        </tr>
    );
}

/**
 * Muestra todas las órdenes de la tienda, guardadas en este navegador y en el
 * índice de órdenes, con búsqueda y filtros por tipo de cliente, sucursal y
 * estado. Permite volver a leer el índice para ver órdenes nuevas.
 *
 * @return La consulta de órdenes.
 */
export default function AdminOrdersList() {
    const { t } = useTranslation(['admin', 'orders']);
    const { orders, reloadOrders } = useOrders();
    const [filters, setFilters] = useState<AdminOrderFilters>(INITIAL_ADMIN_ORDER_FILTERS);
    const [isReloading, setIsReloading] = useState(false);
    const [reloadFailed, setReloadFailed] = useState(false);

    const visibleOrders = filterAdminOrders(orders, filters);

    /**
     * Cambia uno de los filtros.
     *
     * @param field Filtro modificado.
     * @param value Nuevo valor.
     */
    const handleFilterChange = (field: keyof AdminOrderFilters, value: string) => {
        setFilters((currentFilters) => ({ ...currentFilters, [field]: value }));
    };

    /** Vuelve a leer las órdenes del índice e informa si falló. */
    const handleReload = async () => {
        console.log('El administrador vuelve a leer las órdenes del índice.');
        setIsReloading(true);
        const wasReloaded = await reloadOrders();
        setReloadFailed(!wasReloaded);
        setIsReloading(false);
    };

    return (
        <section className={styles.ordersSection} aria-labelledby="admin-orders-heading">
            <header className={styles.header}>
                <div>
                    <h2 id="admin-orders-heading" className={styles.heading}>{t('admin:orders.title')}</h2>
                    <p className={styles.description}>{t('admin:orders.description')}</p>
                </div>

                <button
                    type="button"
                    className={styles.reloadButton}
                    onClick={handleReload}
                    disabled={isReloading}
                >
                    <FaSyncAlt aria-hidden="true" />
                    {isReloading ? t('admin:orders.reloading') : t('admin:orders.reload')}
                </button>
            </header>

            {reloadFailed && (
                <p className={styles.errorNote} role="alert">{t('admin:orders.reloadFailed')}</p>
            )}

            <div className={styles.filters}>
                <label className={styles.field}>
                    <span>{t('admin:orders.filters.search')}</span>
                    <input
                        type="search"
                        className={styles.control}
                        value={filters.search}
                        placeholder={t('admin:orders.filters.searchPlaceholder')}
                        onChange={(event) => handleFilterChange('search', event.target.value)}
                    />
                </label>

                <label className={styles.field}>
                    <span>{t('admin:orders.filters.customerType')}</span>
                    <select
                        className={styles.control}
                        value={filters.customerType}
                        onChange={(event) => handleFilterChange('customerType', event.target.value)}
                    >
                        <option value={ALL_FILTER}>{t('admin:orders.filters.all')}</option>
                        {CUSTOMER_TYPES.map((customerType) => (
                            <option key={customerType} value={customerType}>
                                {t(`orders:buyerRoles.${customerType}`)}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={styles.field}>
                    <span>{t('admin:orders.filters.branch')}</span>
                    <select
                        className={styles.control}
                        value={filters.branchId}
                        onChange={(event) => handleFilterChange('branchId', event.target.value)}
                    >
                        <option value={ALL_FILTER}>{t('admin:orders.filters.all')}</option>
                        {BRANCHES.map((branch) => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </select>
                </label>

                <label className={styles.field}>
                    <span>{t('admin:orders.filters.orderStatus')}</span>
                    <select
                        className={styles.control}
                        value={filters.orderStatus}
                        onChange={(event) => handleFilterChange('orderStatus', event.target.value)}
                    >
                        <option value={ALL_FILTER}>{t('admin:orders.filters.all')}</option>
                        {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>{t(`orders:status.order.${status}`)}</option>
                        ))}
                    </select>
                </label>
            </div>

            <p className={styles.count}>
                {t('admin:orders.count', { count: visibleOrders.length, total: orders.length })}
            </p>

            {visibleOrders.length === 0 ? (
                <p className={styles.emptyNote}>
                    {orders.length === 0 ? t('admin:orders.empty') : t('admin:orders.noMatches')}
                </p>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.ordersTable}>
                        <thead>
                            <tr>
                                <th scope="col">{t('admin:orders.columns.orderNumber')}</th>
                                <th scope="col">{t('admin:orders.columns.date')}</th>
                                <th scope="col">{t('admin:orders.columns.customer')}</th>
                                <th scope="col">{t('admin:orders.columns.customerType')}</th>
                                <th scope="col">{t('admin:orders.columns.company')}</th>
                                <th scope="col">{t('admin:orders.columns.branch')}</th>
                                <th scope="col">{t('admin:orders.columns.total')}</th>
                                <th scope="col">{t('admin:orders.columns.orderStatus')}</th>
                                <th scope="col">{t('admin:orders.columns.paymentStatus')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleOrders.map((order) => (
                                <OrderRow key={order.orderNumber} order={order} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
