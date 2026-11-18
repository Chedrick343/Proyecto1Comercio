/**
 * @fileoverview Consulta de todas las órdenes en el panel administrativo.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaBuilding, FaCheckCircle, FaReceipt, FaSyncAlt, FaWallet } from 'react-icons/fa';

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
import { formatShortDateTime } from '../../utils/formatDate';
import { OrderStatusBadge, PaymentStatusBadge } from '../order/OrderStatusBadge';
import Pagination from '../pagination/Pagination';
import DropdownSelect from '../select/DropdownSelect';
import SearchField from '../select/SearchField';
import CollapsibleFilters from './CollapsibleFilters';
import StatTile from './StatTile';

import statStyles from './StatTile.module.css';
import styles from './AdminTable.module.css';

/** Cantidad de órdenes por página. */
const ORDERS_PER_PAGE = 10;

/** Tipos de cliente que pueden comprar, en el orden del filtro. */
const CUSTOMER_TYPES: AccessLevel[] = ['GUEST', 'B2C', 'B2B'];

/** Estados de orden, en el orden del filtro. */
const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'FAILED'];

/**
 * Muestra el resumen de las órdenes: cuántas hay, cuántas se confirmaron,
 * cuánto se vendió en las confirmadas y cuántas hicieron empresas.
 *
 * @param props Propiedades del componente.
 * @param props.orders Todas las órdenes.
 * @return La fila de tarjetas.
 */
function OrdersSummary({ orders }: { orders: Order[] }) {
    const { t } = useTranslation('admin');
    const confirmedOrders = orders.filter((order) => order.orderStatus === 'CONFIRMED');
    const salesTotal = confirmedOrders.reduce((total, order) => total + order.total, 0);
    const businessOrders = orders.filter((order) => order.buyer?.role === 'B2B');

    return (
        <dl className={statStyles.tiles} aria-label={t('orders.summary.label')}>
            <StatTile
                icon={FaReceipt}
                label={t('orders.summary.orders')}
                value={String(orders.length)}
                detail={t('orders.summary.ordersDetail')}
            />
            <StatTile
                icon={FaCheckCircle}
                label={t('orders.summary.confirmed')}
                value={String(confirmedOrders.length)}
                detail={t('orders.summary.confirmedDetail', { count: orders.length - confirmedOrders.length })}
            />
            <StatTile
                icon={FaWallet}
                label={t('orders.summary.sales')}
                value={formatCurrency(salesTotal)}
                detail={t('orders.summary.salesDetail')}
            />
            <StatTile
                icon={FaBuilding}
                label={t('orders.summary.business')}
                value={String(businessOrders.length)}
                detail={t('orders.summary.businessDetail')}
            />
        </dl>
    );
}

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
            <td data-label={t('admin:orders.columns.orderNumber')} className={styles.cellOrder}>
                <Link to={`/orden/${order.orderNumber}`} className={styles.orderChip}>
                    <FaReceipt aria-hidden="true" />
                    {order.orderNumber}
                </Link>
            </td>
            <td data-label={t('admin:orders.columns.date')} className={styles.cellDate}>{formatShortDateTime(order.createdAt)}</td>
            <td data-label={t('admin:orders.columns.customer')} className={styles.cellCustomer}>
                <span className={styles.primaryText}>{order.buyer?.name ?? order.customer.fullName}</span>
                <span className={styles.secondaryText}>{order.buyer?.email ?? order.customer.email}</span>
            </td>
            <td data-label={t('admin:orders.columns.customerType')} className={styles.cellType}>
                {order.buyer ? t(`orders:buyerRoles.${order.buyer.role}`) : notRecorded}
            </td>
            <td
                data-label={t('admin:orders.columns.company')}
                className={order.buyer?.company ? styles.cellCompany : `${styles.cellCompany} ${styles.cellEmpty}`}
            >
                {order.buyer?.company?.name ?? t('admin:orders.noCompany')}
            </td>
            <td data-label={t('admin:orders.columns.branch')} className={styles.cellBranch}>{order.branch?.name ?? notRecorded}</td>
            <td data-label={t('admin:orders.columns.total')} className={`${styles.strongCell} ${styles.cellTotal}`}>
                {formatCurrency(order.total, order.currency)}
            </td>
            <td data-label={t('admin:orders.columns.statuses')} className={styles.cellStatuses}>
                <span className={styles.statusStack}>
                    <OrderStatusBadge status={order.orderStatus} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                </span>
            </td>
        </tr>
    );
}

/**
 * Muestra todas las órdenes de la tienda, guardadas en este navegador y en el
 * índice de órdenes, con un resumen, búsqueda, filtros por tipo de cliente,
 * sucursal y estado, y paginación. Permite volver a leer el índice para ver
 * órdenes nuevas.
 *
 * @return La consulta de órdenes.
 */
export default function AdminOrdersList() {
    const { t } = useTranslation(['admin', 'orders']);
    const { orders, reloadOrders } = useOrders();
    const [filters, setFilters] = useState<AdminOrderFilters>(INITIAL_ADMIN_ORDER_FILTERS);
    const [currentPage, setCurrentPage] = useState(1);
    const [isReloading, setIsReloading] = useState(false);
    const [reloadFailed, setReloadFailed] = useState(false);

    const filteredOrders = filterAdminOrders(orders, filters);
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
    const page = Math.min(currentPage, totalPages);
    const visibleOrders = filteredOrders.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);

    /**
     * Cambia uno de los filtros y vuelve a la primera página.
     *
     * @param field Filtro modificado.
     * @param value Nuevo valor.
     */
    const handleFilterChange = (field: keyof AdminOrderFilters, value: string) => {
        setFilters((currentFilters) => ({ ...currentFilters, [field]: value }));
        setCurrentPage(1);
    };

    /** Vuelve a leer las órdenes del índice e informa si falló. */
    const handleReload = async () => {
        console.log('El administrador vuelve a leer las órdenes del índice.');
        setIsReloading(true);
        const wasReloaded = await reloadOrders();
        setReloadFailed(!wasReloaded);
        setIsReloading(false);
    };

    const allOption = { value: ALL_FILTER, label: t('admin:orders.filters.all') };
    const activeFilterCount = [filters.customerType, filters.branchId, filters.orderStatus]
        .filter((value) => value !== ALL_FILTER)
        .length;

    return (
        <section className={styles.section} aria-labelledby="admin-orders-heading">
            <header className={styles.header}>
                <div>
                    <h2 id="admin-orders-heading" className={styles.heading}>{t('admin:orders.title')}</h2>
                    <p className={styles.description}>{t('admin:orders.description')}</p>
                </div>

                <button
                    type="button"
                    className={styles.actionButton}
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

            <OrdersSummary orders={orders} />

            <div className={styles.filters}>
                <div className={styles.searchFilter}>
                    <SearchField
                        label={t('admin:orders.filters.search')}
                        value={filters.search}
                        placeholder={t('admin:orders.filters.searchPlaceholder')}
                        onChange={(value) => handleFilterChange('search', value)}
                    />
                </div>
                <CollapsibleFilters activeCount={activeFilterCount}>
                    <DropdownSelect
                        layout="stacked"
                        label={t('admin:orders.filters.customerType')}
                        value={filters.customerType}
                        onChange={(value) => handleFilterChange('customerType', value)}
                        options={[
                            allOption,
                            ...CUSTOMER_TYPES.map((type) => ({ value: type, label: t(`orders:buyerRoles.${type}`) }))
                        ]}
                    />
                    <DropdownSelect
                        layout="stacked"
                        label={t('admin:orders.filters.branch')}
                        value={filters.branchId}
                        onChange={(value) => handleFilterChange('branchId', value)}
                        options={[allOption, ...BRANCHES.map((branch) => ({ value: branch.id, label: branch.name }))]}
                    />
                    <DropdownSelect
                        layout="stacked"
                        label={t('admin:orders.filters.orderStatus')}
                        value={filters.orderStatus}
                        onChange={(value) => handleFilterChange('orderStatus', value)}
                        options={[
                            allOption,
                            ...ORDER_STATUSES.map((status) => ({ value: status, label: t(`orders:status.order.${status}`) }))
                        ]}
                    />
                </CollapsibleFilters>
            </div>

            <p className={styles.count}>
                {t('admin:orders.count', { count: filteredOrders.length, total: orders.length })}
            </p>

            {visibleOrders.length === 0 ? (
                <p className={styles.emptyNote}>
                    {orders.length === 0 ? t('admin:orders.empty') : t('admin:orders.noMatches')}
                </p>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th scope="col">{t('admin:orders.columns.orderNumber')}</th>
                                <th scope="col">{t('admin:orders.columns.date')}</th>
                                <th scope="col">{t('admin:orders.columns.customer')}</th>
                                <th scope="col">{t('admin:orders.columns.customerType')}</th>
                                <th scope="col">{t('admin:orders.columns.company')}</th>
                                <th scope="col">{t('admin:orders.columns.branch')}</th>
                                <th scope="col">{t('admin:orders.columns.total')}</th>
                                <th scope="col">{t('admin:orders.columns.statuses')}</th>
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

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                label={t('admin:orders.paginationLabel')}
            />
        </section>
    );
}
