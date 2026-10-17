import { useEffect, useState } from 'react';

import {
    pickRelatedProducts,
    RELATED_PRODUCTS_CANDIDATES
} from '../../product/relatedProducts';
import { searchProductsByText } from '../../utils/algolia';
import type { Product } from '../../utils/Products';

interface RelatedProductsResult {
    productId: string;
    products: Product[];
}

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
