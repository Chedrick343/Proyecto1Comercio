/**
 * @fileoverview Selección de productos relacionados para la página de detalle.
 */

import type { Product } from '../utils/Products';

/** Cantidad máxima de productos relacionados que se muestran. */
export const RELATED_PRODUCTS_LIMIT = 4;

/**
 * Candidatos que se solicitan a la búsqueda. Son más que el límite para que
 * sobren suficientes tras descartar el producto actual y los agotados.
 */
export const RELATED_PRODUCTS_CANDIDATES = 24;

/**
 * Puntúa qué tan relacionado está un candidato con el producto. Compartir
 * colección vale 2 puntos y compartir alguna categoría vale 1.
 *
 * @param product Producto de referencia.
 * @param candidate Producto candidato.
 * @return La puntuación, entre 0 y 3.
 */
function getRelatednessScore(product: Product, candidate: Product): number {
    const sameCollection =
        candidate.facets.collection !== undefined &&
        candidate.facets.collection === product.facets.collection;
    const sharesCategory = candidate.categories.some((category) =>
        product.categories.includes(category)
    );

    return (sameCollection ? 2 : 0) + (sharesCategory ? 1 : 0);
}

/**
 * Elige los productos relacionados: de la misma marca, en stock y distintos
 * del producto actual, ordenados de mayor a menor relación.
 *
 * @param product Producto que se está viendo.
 * @param candidates Productos candidatos.
 * @return Hasta RELATED_PRODUCTS_LIMIT productos relacionados.
 */
export function pickRelatedProducts(product: Product, candidates: Product[]): Product[] {
    return candidates
        .filter((candidate) =>
            candidate.objectID !== product.objectID &&
            candidate.brand === product.brand &&
            candidate.in_stock
        )
        .sort((a, b) => getRelatednessScore(product, b) - getRelatednessScore(product, a))
        .slice(0, RELATED_PRODUCTS_LIMIT);
}
