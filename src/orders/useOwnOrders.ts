/**
 * @fileoverview Hook para obtener las órdenes de quien usa la tienda.
 */

import { useOrders } from '../context/OrdersContext';
import { useSession } from '../context/SessionContext';
import { isOwnOrder } from './orderOwner';
import type { Order } from './orderTypes';

/**
 * Obtiene las órdenes del usuario actual, o las del invitado de este
 * navegador si no hay sesión.
 *
 * @return Las órdenes propias, de la más reciente a la más antigua.
 */
export function useOwnOrders(): Order[] {
    const { orders } = useOrders();
    const { currentUser } = useSession();

    return orders.filter((order) => isOwnOrder(order, currentUser));
}
