import type { Product } from '../utils/Products';

export const RELATED_PRODUCTS_LIMIT = 4;

// Extra candidates so there are enough left after removing the current or out-of-stock products.
export const RELATED_PRODUCTS_CANDIDATES = 24;

function getRelatednessScore(product: Product, candidate: Product): number {
    const sameCollection =
        candidate.facets.collection !== undefined &&
        candidate.facets.collection === product.facets.collection;
    const sharesCategory = candidate.categories.some((category) =>
        product.categories.includes(category)
    );

    return (sameCollection ? 2 : 0) + (sharesCategory ? 1 : 0);
}

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
