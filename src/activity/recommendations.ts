/**
 * @fileoverview Recomendaciones de productos según las categorías que más le
 * interesan al usuario, calculadas a partir de sus eventos.
 */

import type { Product } from '../utils/Products';
import type { AnalyticsEvent, AnalyticsEventType } from './analyticsTypes';

/** Cantidad máxima de productos recomendados. */
export const RECOMMENDATIONS_LIMIT = 8;

/** Cantidad de categorías favoritas que se usan para recomendar. */
export const TOP_CATEGORIES_LIMIT = 3;

/**
 * Peso de cada evento al medir el interés en una categoría. Agregar al
 * carrito muestra más intención de compra que solo ver el producto.
 */
const INTEREST_WEIGHTS: Partial<Record<AnalyticsEventType, number>> = {
    PRODUCT_VIEW: 1,
    ADD_TO_CART: 3
};

/**
 * Suma el interés del usuario en cada categoría según los productos que vio
 * o agregó al carrito.
 *
 * @param events Eventos del usuario.
 * @return La puntuación de cada categoría.
 */
export function getCategoryInterest(events: AnalyticsEvent[]): Map<string, number> {
    const interest = new Map<string, number>();

    for (const event of events) {
        if (event.type !== 'PRODUCT_VIEW' && event.type !== 'ADD_TO_CART') {
            continue;
        }

        const { category } = event.payload;

        if (category) {
            interest.set(category, (interest.get(category) ?? 0) + (INTEREST_WEIGHTS[event.type] ?? 0));
        }
    }

    return interest;
}

/**
 * Obtiene las categorías que más le interesan al usuario.
 *
 * @param events Eventos del usuario.
 * @param limit Cantidad máxima de categorías.
 * @return Las categorías con su puntuación, de mayor a menor interés.
 */
export function getTopCategories(
    events: AnalyticsEvent[],
    limit: number = TOP_CATEGORIES_LIMIT
): [category: string, score: number][] {
    return [...getCategoryInterest(events)]
        .sort(([, firstScore], [, secondScore]) => secondScore - firstScore)
        .slice(0, limit);
}

/**
 * Obtiene los productos con los que el usuario ya interactuó, para no
 * recomendárselos de nuevo.
 *
 * @param events Eventos del usuario.
 * @return Los identificadores de los productos vistos o agregados al carrito.
 */
const getSeenProductIds = (events: AnalyticsEvent[]): Set<string> =>
    new Set(
        events
            .filter((event) => event.type === 'PRODUCT_VIEW' || event.type === 'ADD_TO_CART')
            .map((event) => event.payload.productId)
    );

/**
 * Indica si un producto se puede recomendar en la tienda para clientes.
 *
 * @param product Producto a revisar.
 * @return Verdadero si está activo, a la venta y en stock.
 */
const isRecommendable = (product: Product): boolean =>
    product.active && product.b2c.enabled && product.in_stock;

/**
 * Recomienda productos de las categorías favoritas del usuario que todavía
 * no ha visto. Primero van los de la categoría con más interés y, dentro de
 * cada categoría, los de mejor calificación.
 *
 * @param events Eventos del usuario.
 * @param catalog Productos disponibles para recomendar.
 * @param limit Cantidad máxima de productos.
 * @return Los productos recomendados; una lista vacía si aún no hay datos.
 */
export function recommendProducts(
    events: AnalyticsEvent[],
    catalog: Product[],
    limit: number = RECOMMENDATIONS_LIMIT
): Product[] {
    const topCategories = getTopCategories(events);

    if (topCategories.length === 0) {
        return [];
    }

    const seenProductIds = getSeenProductIds(events);

    /**
     * Puntúa un producto con el interés de su categoría favorita.
     *
     * @param product Producto candidato.
     * @return El mayor interés entre sus categorías, o 0 si no coincide.
     */
    const getInterestScore = (product: Product): number =>
        Math.max(0, ...topCategories
            .filter(([category]) => product.categories.includes(category))
            .map(([, score]) => score));

    return catalog
        .filter((product) => isRecommendable(product) && !seenProductIds.has(product.objectID))
        .map((product) => ({ product, score: getInterestScore(product) }))
        .filter(({ score }) => score > 0)
        .sort((first, second) =>
            second.score - first.score || second.product.rating - first.product.rating
        )
        .slice(0, limit)
        .map(({ product }) => product);
}
