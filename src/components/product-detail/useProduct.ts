import { useEffect, useState } from 'react';

import {
    getProductById,
    ProductLoadError,
    type ProductLoadErrorCode
} from '../../utils/algolia';
import type { Product } from '../../utils/Products';

interface ProductLoadResult {
    productId: string;
    product: Product | null;
    errorCode: ProductLoadErrorCode | null;
}

interface UseProductState {
    product: Product | null;
    errorCode: ProductLoadErrorCode | null;
    isLoading: boolean;
}

const getProductLoadErrorCode = (error: unknown): ProductLoadErrorCode =>
    error instanceof ProductLoadError ? error.code : 'unavailable';

export function useProduct(productId: string | undefined): UseProductState {
    const [result, setResult] = useState<ProductLoadResult | null>(null);

    useEffect(() => {
        if (!productId) {
            return;
        }

        let isCurrentRequest = true;

        getProductById(productId)
            .then((product) => {
                if (isCurrentRequest) {
                    setResult({ productId, product, errorCode: null });
                }
            })
            .catch((error: unknown) => {
                if (isCurrentRequest) {
                    setResult({ productId, product: null, errorCode: getProductLoadErrorCode(error) });
                }
            });

        return () => {
            isCurrentRequest = false;
        };
    }, [productId]);

    if (!productId) {
        return { product: null, errorCode: 'notFound', isLoading: false };
    }

    // A result for a different product means the new one is still loading.
    if (result?.productId !== productId) {
        return { product: null, errorCode: null, isLoading: true };
    }

    return { product: result.product, errorCode: result.errorCode, isLoading: false };
}
