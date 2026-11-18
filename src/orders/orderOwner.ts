/**
 * @fileoverview Dueño de las órdenes: quién hizo cada una y quién puede verla.
 */

import { getGuestSessionId } from '../session/guestSession';
import { getAccessLevel, hasPermission } from '../session/permissions';
import type { User } from '../session/userTypes';
import type { ShippingDetails } from '../components/checkout/checkoutTypes';
import type { Order, OrderBuyer } from './orderTypes';

/**
 * Obtiene el identificador con el que se asocian las órdenes a quien usa la
 * tienda.
 *
 * @param user Usuario con sesión iniciada, o null si es un invitado.
 * @return El identificador del usuario, o el del invitado de este navegador.
 */
export const getOrderOwnerId = (user: User | null): string =>
    user?.id ?? getGuestSessionId();

/**
 * Arma los datos del comprador para guardarlos en la orden. El invitado no
 * tiene cuenta, así que su nombre y correo salen de los datos de entrega.
 *
 * @param user Usuario con sesión iniciada, o null si es un invitado.
 * @param customer Datos de entrega ingresados en el checkout.
 * @return El comprador tal como queda registrado en la orden.
 */
export function createOrderBuyer(user: User | null, customer: ShippingDetails): OrderBuyer {
    return {
        userId: getOrderOwnerId(user),
        role: getAccessLevel(user),
        name: user?.name ?? customer.fullName,
        email: user?.email ?? customer.email,
        company: user?.company ? { ...user.company } : undefined
    };
}

/**
 * Indica si una orden pertenece a quien usa la tienda. Las órdenes guardadas
 * antes del Proyecto III no tienen dueño, así que no pertenecen a nadie.
 *
 * @param order Orden a revisar.
 * @param user Usuario con sesión iniciada, o null si es un invitado.
 * @return Verdadero si la orden es suya.
 */
export const isOwnOrder = (order: Order, user: User | null): boolean =>
    order.userId !== undefined && order.userId === getOrderOwnerId(user);

/**
 * Indica si alguien puede ver una orden: el dueño o quien puede consultar
 * todas las órdenes, como el administrador.
 *
 * @param order Orden a revisar.
 * @param user Usuario con sesión iniciada, o null si es un invitado.
 * @return Verdadero si puede verla.
 */
export const canViewOrder = (order: Order, user: User | null): boolean =>
    hasPermission(user, 'VIEW_ALL_ORDERS') || isOwnOrder(order, user);
