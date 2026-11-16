/**
 * @fileoverview Servicio del índice de órdenes de Algolia. Las órdenes se
 * guardan por medio del Cloudflare Worker, que tiene la clave de escritura, y
 * se leen directamente del índice con la clave pública de búsqueda.
 */

import { isValidOrder } from '../../orders/orderValidation';
import type { Order } from '../../orders/orderTypes';
import { ordersIndexName, searchClient } from '../../utils/algolia';

/** Dirección del Cloudflare Worker que guarda las órdenes. */
const ordersWorkerUrl = import.meta.env.VITE_ORDERS_WORKER_URL;

/** Cantidad máxima de órdenes que se leen del índice en una consulta. */
const MAX_ORDERS_PER_QUERY = 1000;

/** Resultado de enviar una orden al Worker. */
export interface SaveOrderResult {
    /** Indica si el Worker guardó la orden en el índice. */
    saved: boolean;
    /** Indica si el Worker descontó el stock en el índice de productos. */
    stockDiscounted: boolean;
}

/**
 * Envía una orden al Worker para guardarla en el índice de órdenes. Nunca
 * lanza un error: si algo falla, lo registra y devuelve que no se guardó.
 *
 * @param order Orden a guardar.
 * @return Si se guardó y si se descontó el stock en Algolia.
 */
export async function saveOrderToIndex(order: Order): Promise<SaveOrderResult> {
    if (!ordersWorkerUrl) {
        console.error('Falta VITE_ORDERS_WORKER_URL; la orden solo se guarda en este navegador.');
        return { saved: false, stockDiscounted: false };
    }

    try {
        const response = await fetch(ordersWorkerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        const body: unknown = await response.json().catch(() => null);

        if (!response.ok) {
            console.error(`El Worker no guardó la orden ${order.orderNumber} (HTTP ${response.status}):`, body);
            return { saved: false, stockDiscounted: false };
        }

        const stockDiscounted = (body as { stockDiscounted?: unknown } | null)?.stockDiscounted === true;

        console.log(
            `Orden ${order.orderNumber} (${order.orderStatus}) guardada en el índice de órdenes.` +
            (stockDiscounted ? ' Stock descontado en Algolia.' : '')
        );
        return { saved: true, stockDiscounted };
    } catch (error) {
        console.error(`No se pudo contactar al Worker para guardar la orden ${order.orderNumber}:`, error);
        return { saved: false, stockDiscounted: false };
    }
}

/**
 * Quita de un registro de Algolia los campos que agrega el índice.
 *
 * @param hit Registro devuelto por Algolia.
 * @return El registro sin objectID ni datos de resaltado.
 */
function removeAlgoliaFields(hit: Record<string, unknown>): Record<string, unknown> {
    const order = { ...hit };
    delete order.objectID;
    delete order._highlightResult;
    delete order._snippetResult;
    return order;
}

/**
 * Lee las órdenes guardadas en el índice. Si el índice todavía no existe
 * (nadie ha comprado), devuelve una lista vacía.
 *
 * @return Las órdenes válidas del índice.
 * @throws {Error} Si el índice está configurado pero no se pudo consultar.
 */
export async function loadOrdersFromIndex(): Promise<Order[]> {
    if (!searchClient || !ordersIndexName) {
        return [];
    }

    try {
        const { results } = await searchClient.searchForHits<Record<string, unknown>>({
            requests: [{ indexName: ordersIndexName, query: '', hitsPerPage: MAX_ORDERS_PER_QUERY }]
        });
        const orders = (results[0]?.hits ?? [])
            .map((hit): unknown => removeAlgoliaFields(hit))
            .filter(isValidOrder);

        console.log(`Órdenes leídas del índice: ${orders.length}.`);
        return orders;
    } catch (error) {
        const status = (error as { status?: unknown }).status;

        if (status === 404) {
            console.log('El índice de órdenes todavía no existe; se crea con la primera compra.');
            return [];
        }

        throw error;
    }
}
