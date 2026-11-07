/**
 * @fileoverview Hook para buscar los productos relacionados con un producto.
 */

import { useEffect, useState } from 'react';

import {
    pickRelatedProducts,
    RELATED_PRODUCTS_CANDIDATES
} from '../../product/relatedProducts';
import { searchProductsByText } from '../../utils/algolia';
import type { Product } from '../../utils/Products';

/** Productos relacionados, asociados al producto para el que se buscaron. */
interface RelatedProductsResult {
    productId: string;
    products: Product[];
}

/**
 * Busca productos de la misma marca y elige los más relacionados. Si la
 * búsqueda falla solo se registra el error, ya que la sección es opcional.
 *
 * @param product Producto de referencia, o null mientras se carga.
 * @return Los productos relacionados; una lista vacía mientras se buscan.
 */
export function useRelatedProducts(product: Product | null): Product[] {
    const [result, setResult] = useState<RelatedProductsResult | null>(null);

    useEffect(() => {
        if (!product) {
            return;
        }

        let isCurrentRequest = true;

        searchProductsByText(product.brand, RELATED_PRODUCTS_CANDIDATES)
            .then((candidates) => {
                if (isCurrentRequest) {
                    setResult({
                        productId: product.objectID,
                        products: pickRelatedProducts(product, candidates)
                    });
                }
            })
            // Related products are optional, so a failure only hides the section.
            .catch((error: unknown) => console.error('No se pudieron cargar productos relacionados:', error));

        return () => {
            isCurrentRequest = false;
        };
    }, [product]);

    return result?.productId === product?.objectID ? result?.products ?? [] : [];
}
