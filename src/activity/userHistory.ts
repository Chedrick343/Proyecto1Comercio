/**
 * @fileoverview Historial del usuario (productos vistos y búsquedas
 * recientes), obtenido a partir de sus eventos de analítica.
 */

import type { AnalyticsEvent, ProductSnapshot } from './analyticsTypes';

/** Cantidad máxima de productos vistos recientemente. */
export const RECENTLY_VIEWED_LIMIT = 8;

/** Cantidad máxima de búsquedas recientes. */
export const RECENT_SEARCHES_LIMIT = 6;

/** Cantidad máxima de categorías en "Seguir explorando". */
export const EXPLORED_CATEGORIES_LIMIT = 4;

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

    return takeLatestUnique(queries, normalizeSearchQuery, limit);
}

/**
 * Normaliza un texto buscado para comparar búsquedas sin distinguir mayúsculas.
 *
 * @param query Texto buscado.
 * @return El texto en minúsculas.
 */
export const normalizeSearchQuery = (query: string): string => query.toLocaleLowerCase('es');

/** Búsqueda que el usuario quitó de su historial. */
export interface HiddenSearch {
    /** Texto buscado, normalizado. */
    query: string;
    /** Momento en que se quitó, en ISO 8601. */
    hiddenAt: string;
}

/**
 * Descarta las búsquedas que el usuario quitó de su historial. Solo se
 * ocultan las anteriores al momento en que la quitó, así que si vuelve a
 * buscar lo mismo, reaparece.
 *
 * @param events Eventos del usuario.
 * @param hiddenSearches Búsquedas quitadas del historial.
 * @return Los eventos sin las búsquedas ocultas.
 */
export function excludeHiddenSearches(
    events: AnalyticsEvent[],
    hiddenSearches: HiddenSearch[]
): AnalyticsEvent[] {
    if (hiddenSearches.length === 0) {
        return events;
    }

    const hiddenAtByQuery = new Map(hiddenSearches.map(({ query, hiddenAt }) => [query, hiddenAt]));

    return events.filter((event) => {
        if (event.type !== 'SEARCH') {
            return true;
        }

        const hiddenAt = hiddenAtByQuery.get(normalizeSearchQuery(event.payload.query));
        return hiddenAt === undefined || event.timestamp > hiddenAt;
    });
}

/** Categoría que el usuario estuvo explorando. */
export interface ExploredCategory {
    category: string;
    /** Cantidad de productos distintos que vio de esa categoría. */
    viewedCount: number;
    /** Imagen del último producto que vio de esa categoría. */
    imageUrl: string;
}

/**
 * Obtiene las categorías que el usuario exploró más recientemente, con
 * cuántos productos vio de cada una.
 *
 * @param events Eventos del usuario, del más antiguo al más reciente.
 * @param limit Cantidad máxima de categorías.
 * @return Las categorías, de la vista más reciente a la más antigua.
 */
export function getExploredCategories(
    events: AnalyticsEvent[],
    limit: number = EXPLORED_CATEGORIES_LIMIT
): ExploredCategory[] {
    // Map keeps insertion order, so walking from newest to oldest leaves the latest category first.
    const explored = new Map<string, { imageUrl: string; productIds: Set<string> }>();

    for (const event of events.toReversed()) {
        if (event.type !== 'PRODUCT_VIEW' || !event.payload.category) {
            continue;
        }

        const entry = explored.get(event.payload.category) ?? {
            imageUrl: event.payload.imageUrl,
            productIds: new Set<string>()
        };

        entry.productIds.add(event.payload.productId);
        explored.set(event.payload.category, entry);
    }

    return [...explored]
        .slice(0, limit)
        .map(([category, { imageUrl, productIds }]) => ({
            category,
            viewedCount: productIds.size,
            imageUrl
        }));
}
