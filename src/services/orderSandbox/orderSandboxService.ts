/**
 * @fileoverview Servicio de órdenes simulado (sandbox). Representa los
 * sistemas de la tienda que validan la orden antes de cobrar (inventario y
 * precios vigentes) y que la confirman después del pago (reserva del
 * inventario). Permite provocar fallos de la orden independientes del pago.
 */

import type { Order, OrderFailureReason } from '../../orders/orderTypes';

/** Escenario que el servicio de órdenes simulado debe reproducir. */
export type OrderScenario =
    | 'NORMAL'
    | 'OUT_OF_STOCK'
    | 'AMOUNT_MISMATCH'
    | 'CONFIRMATION_ERROR';

/** Tiempo simulado que tarda el servicio en responder. */
const PROCESSING_DELAY_MS = 600;

/** Aumento de precio que simula el escenario AMOUNT_MISMATCH. */
const SIMULATED_PRICE_INCREASE = 0.1;

/**
 * Espera la cantidad de milisegundos indicada.
 *
 * @param milliseconds Tiempo de espera.
 * @return Una promesa que se resuelve al terminar la espera.
 */
const wait = (milliseconds: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

/**
 * Obtiene las unidades disponibles de cada producto de la orden. En el
 * escenario OUT_OF_STOCK, el primer producto se reporta agotado.
 *
 * @param order Orden a revisar.
 * @param scenario Escenario a reproducir.
 * @return Las unidades disponibles por identificador de producto.
 */
function getAvailableStock(order: Order, scenario: OrderScenario): Map<string, number> {
    return new Map(order.items.map((item, index) => [
        item.productId,
        scenario === 'OUT_OF_STOCK' && index === 0 ? 0 : item.quantity
    ]));
}

/**
 * Obtiene el precio vigente de cada producto de la orden. En el escenario
 * AMOUNT_MISMATCH, el primer producto aparece con un precio más alto.
 *
 * @param order Orden a revisar.
 * @param scenario Escenario a reproducir.
 * @return Los precios vigentes por identificador de producto.
 */
function getCurrentPrices(order: Order, scenario: OrderScenario): Map<string, number> {
    return new Map(order.items.map((item, index) => [
        item.productId,
        scenario === 'AMOUNT_MISMATCH' && index === 0
            ? Math.round(item.unitPrice * (1 + SIMULATED_PRICE_INCREASE))
            : item.unitPrice
    ]));
}

/**
 * Indica si los montos guardados en la orden son coherentes entre sí y con
 * los precios vigentes.
 *
 * @param order Orden a revisar.
 * @param currentPrices Precio vigente de cada producto.
 * @return Verdadero si los montos coinciden.
 */
function hasConsistentAmounts(order: Order, currentPrices: Map<string, number>): boolean {
    const pricesMatch = order.items.every(
        (item) => currentPrices.get(item.productId) === item.unitPrice
    );
    const linesSubtotal = order.items.reduce((sum, item) => sum + item.lineSubtotal, 0);
    const totalMatches = order.subtotal + order.iva + order.shipping === order.total;

    return pricesMatch && linesSubtotal === order.subtotal && totalMatches;
}

/**
 * Valida la orden antes de cobrarla: que haya unidades de cada producto y
 * que los montos correspondan a los precios vigentes.
 *
 * @param order Orden a validar.
 * @param scenario Escenario a reproducir.
 * @return El motivo por el que la orden no puede cobrarse, o null si es válida.
 */
export async function validateOrderForPayment(
    order: Order,
    scenario: OrderScenario
): Promise<OrderFailureReason | null> {
    await wait(PROCESSING_DELAY_MS);

    const availableStock = getAvailableStock(order, scenario);
    const hasStock = order.items.every(
        (item) => (availableStock.get(item.productId) ?? 0) >= item.quantity
    );

    if (!hasStock) {
        return 'OUT_OF_STOCK';
    }

    if (!hasConsistentAmounts(order, getCurrentPrices(order, scenario))) {
        return 'AMOUNT_MISMATCH';
    }

    return null;
}

/**
 * Reserva el inventario de una orden pagada para poder confirmarla.
 *
 * @param order Orden con el pago aprobado.
 * @param scenario Escenario a reproducir.
 * @return Verdadero si la reserva se completó; falso en el escenario CONFIRMATION_ERROR.
 */
export async function reserveOrderInventory(
    order: Order,
    scenario: OrderScenario
): Promise<boolean> {
    await wait(PROCESSING_DELAY_MS);

    return order.items.length > 0 && scenario !== 'CONFIRMATION_ERROR';
}
