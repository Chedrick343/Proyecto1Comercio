/**
 * @fileoverview Hook para cargar un producto desde Algolia.
 */

import { useEffect, useState } from 'react';

import {
    getProductById,
    ProductLoadError,
    type ProductLoadErrorCode
} from '../../utils/algolia';
import type { Product } from '../../utils/Products';

/** Resultado de la última carga, asociado al producto solicitado. */
interface ProductLoadResult {
    productId: string;
    product: Product | null;
    errorCode: ProductLoadErrorCode | null;
}

/** Estado de la carga de un producto. */
interface UseProductState {
    product: Product | null;
    errorCode: ProductLoadErrorCode | null;
    isLoading: boolean;
}

/**
 * Obtiene la causa de un error de carga.
 *
 * @param error Error capturado.
 * @return El código del error, o "unavailable" si es un error desconocido.
 */
const getProductLoadErrorCode = (error: unknown): ProductLoadErrorCode =>
    error instanceof ProductLoadError ? error.code : 'unavailable';

/**
 * Carga un producto y descarta las respuestas que lleguen tarde si el
 * identificador cambió mientras tanto.
 *
 * @param productId Identificador del producto, tomado de la URL.
 * @return El producto, el código de error si falló y si sigue cargando.
 */
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
