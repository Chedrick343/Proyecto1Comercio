/**
 * @fileoverview Historial del usuario (productos vistos y búsquedas
 * recientes), obtenido a partir de sus eventos de analítica.
 */

import type { AnalyticsEvent, ProductSnapshot } from './analyticsTypes';

/** Cantidad máxima de productos vistos recientemente. */
export const RECENTLY_VIEWED_LIMIT = 8;

/** Cantidad máxima de búsquedas recientes. */
export const RECENT_SEARCHES_LIMIT = 5;

/**
 * Toma los elementos más recientes sin repetir, del más reciente al más
 * antiguo. Si un elemento aparece varias veces, se conserva su aparición
 * más reciente.
 *
 * @param items Elementos ordenados del más antiguo al más reciente.
 * @param getKey Obtiene la clave que identifica a un elemento repetido.
 * @param limit Cantidad máxima de elementos.
 * @return Los elementos únicos más recientes.
 * @template T
 */
function takeLatestUnique<T>(
    items: T[],
    getKey: (item: T) => string,
    limit: number
): T[] {
    const seenKeys = new Set<string>();
    const latestItems: T[] = [];

    for (let index = items.length - 1; index >= 0 && latestItems.length < limit; index -= 1) {
        const item = items[index];
        const key = getKey(item);

        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            latestItems.push(item);
        }
    }

    return latestItems;
}

/**
 * Obtiene los productos que el usuario vio más recientemente.
 *
 * @param events Eventos del usuario, del más antiguo al más reciente.
 * @param limit Cantidad máxima de productos.
 * @return Los productos vistos, del más reciente al más antiguo y sin repetir.
 */
export function getRecentlyViewedProducts(
    events: AnalyticsEvent[],
    limit: number = RECENTLY_VIEWED_LIMIT
): ProductSnapshot[] {
    const viewedProducts = events
        .filter((event) => event.type === 'PRODUCT_VIEW')
        .map((event) => event.payload);

    return takeLatestUnique(viewedProducts, (product) => product.productId, limit);
}

/**
 * Obtiene los textos que el usuario buscó más recientemente. Dos búsquedas
 * que solo difieren en mayúsculas se consideran la misma.
 *
 * @param events Eventos del usuario, del más antiguo al más reciente.
 * @param limit Cantidad máxima de búsquedas.
 * @return Los textos buscados, del más reciente al más antiguo y sin repetir.
 */
export function getRecentSearches(
    events: AnalyticsEvent[],
    limit: number = RECENT_SEARCHES_LIMIT
): string[] {
    const queries = events
        .filter((event) => event.type === 'SEARCH')
        .map((event) => event.payload.query);

    return takeLatestUnique(queries, (query) => query.toLocaleLowerCase('es'), limit);
}
