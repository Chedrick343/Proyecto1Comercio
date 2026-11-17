/**
 * @fileoverview Filtros de la consulta de órdenes del panel administrativo.
 */

import type { AccessLevel } from '../session/permissions';
import type { Order, OrderStatus } from './orderTypes';

/** Valor de un filtro que no restringe nada. */
export const ALL_FILTER = 'ALL';

/** Criterios para filtrar las órdenes en el panel administrativo. */
export interface AdminOrderFilters {
    /** Texto a buscar en el número de orden, el cliente, su correo o su empresa. */
    search: string;
    /** Tipo de cliente con el que se compró, o ALL. */
    customerType: AccessLevel | typeof ALL_FILTER;
    /** Sucursal de la orden, o ALL. */
    branchId: string;
    /** Estado de la orden, o ALL. */
    orderStatus: OrderStatus | typeof ALL_FILTER;
}

/** Filtros iniciales: muestran todas las órdenes. */
export const INITIAL_ADMIN_ORDER_FILTERS: AdminOrderFilters = {
    search: '',
    customerType: ALL_FILTER,
    branchId: ALL_FILTER,
    orderStatus: ALL_FILTER
};

/**
 * Normaliza un texto para buscar sin distinguir mayúsculas ni tildes.
 *
 * @param text Texto a normalizar.
 * @return El texto en minúsculas, sin tildes ni espacios en los extremos.
 */
const normalizeText = (text: string): string =>
    text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/**
 * Indica si una orden contiene el texto buscado.
 *
 * @param order Orden a revisar.
 * @param term Texto buscado, ya normalizado.
 * @return Verdadero si el número, el cliente, el correo o la empresa lo contienen.
 */
function matchesSearch(order: Order, term: string): boolean {
    const searchableText = normalizeText(
        [
            order.orderNumber,
            order.buyer?.name ?? order.customer.fullName,
            order.buyer?.email ?? order.customer.email,
            order.buyer?.company?.name ?? ''
        ].join(' ')
    );

    return searchableText.includes(term);
}

/**
 * Filtra las órdenes según los criterios del panel. Las órdenes anteriores al
 * Proyecto III no tienen tipo de cliente ni sucursal, así que solo aparecen
 * cuando esos filtros están en ALL.
 *
 * @param orders Órdenes a filtrar.
 * @param filters Criterios de filtrado.
 * @return Las órdenes que cumplen todos los criterios.
 */
export function filterAdminOrders(orders: Order[], filters: AdminOrderFilters): Order[] {
    const term = normalizeText(filters.search);

    return orders.filter((order) => {
        if (term !== '' && !matchesSearch(order, term)) {
            return false;
        }

        if (filters.customerType !== ALL_FILTER && order.buyer?.role !== filters.customerType) {
            return false;
        }

        if (filters.branchId !== ALL_FILTER && order.branch?.id !== filters.branchId) {
            return false;
        }

        if (filters.orderStatus !== ALL_FILTER && order.orderStatus !== filters.orderStatus) {
            return false;
        }

        return true;
    });
}
