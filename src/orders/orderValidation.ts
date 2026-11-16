/**
 * @fileoverview Verificación de órdenes recuperadas de localStorage o del
 * índice de órdenes de Algolia.
 */

import type { Order } from './orderTypes';

/**
 * Verifica si un valor es un objeto no nulo.
 *
 * @param value Valor a verificar.
 * @return Verdadero si el valor es un objeto.
 */
const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

/**
 * Verifica que un valor recuperado tenga la forma de una orden.
 *
 * @param order Valor a verificar.
 * @return Verdadero si el valor es una orden válida.
 */
export const isValidOrder = (order: unknown): order is Order =>
    isObject(order) &&
    typeof order.orderNumber === 'string' &&
    typeof order.createdAt === 'string' &&
    typeof order.total === 'number' &&
    typeof order.orderStatus === 'string' &&
    typeof order.paymentStatus === 'string' &&
    isObject(order.customer) &&
    Array.isArray(order.items) &&
    order.items.every(isObject);
