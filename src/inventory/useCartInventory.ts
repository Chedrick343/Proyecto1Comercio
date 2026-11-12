/**
 * @fileoverview Hook para consultar en Algolia el inventario actual de los
 * productos del carrito. El carrito solo guarda nombre, precio y cantidad, así
 * que la disponibilidad por sucursal se consulta cada vez que se necesita.
 */

import { useEffect, useState } from 'react';

import { getProductById } from '../utils/algolia';
import type { Product } from '../utils/Products';

/** Resultado de la última consulta, asociado a los productos consultados. */
interface CartInventoryResult {
    /** Identificadores consultados, separados por comas. */
    productIdsKey: string;
    productsById: Record<string, Product>;
    hasError: boolean;
}

/** Estado de la consulta del inventario del carrito. */
interface UseCartInventoryState {
    /** Productos encontrados, indexados por su identificador. */
    productsById: Record<string, Product>;
    isLoading: boolean;
    /** Indica si no se pudo consultar alguno de los productos. */
    hasError: boolean;
}

/**
 * Consulta los productos indicados y los indexa por identificador. Los que no
 * se pudieron consultar quedan fuera del resultado.
 *
 * @param productIds Identificadores de los productos.
 * @return Los productos encontrados y si alguno falló.
 */
async function loadProducts(productIds: string[]): Promise<Omit<CartInventoryResult, 'productIdsKey'>> {
    console.log(`Consultando el inventario de ${productIds.length} productos del carrito...`);

    const results = await Promise.allSettled(productIds.map((productId) => getProductById(productId)));
    const productsById: Record<string, Product> = {};
    let hasError = false;

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            productsById[productIds[index]] = result.value;
        } else {
            console.error(`No se pudo consultar el inventario de ${productIds[index]}:`, result.reason);
            hasError = true;
        }
    });

    console.log('Inventario del carrito consultado:', productsById);
    return { productsById, hasError };
}

/**
 * Consulta el inventario de los productos del carrito. Solo vuelve a consultar
 * cuando cambian los productos, no cuando cambian sus cantidades, y descarta
 * las respuestas que lleguen tarde.
 *
 * @param productIds Identificadores de los productos del carrito.
 * @return Los productos con su inventario, si sigue cargando y si hubo errores.
 */
export function useCartInventory(productIds: string[]): UseCartInventoryState {
    const productIdsKey = productIds.join(',');
    const [result, setResult] = useState<CartInventoryResult | null>(null);

    useEffect(() => {
        if (productIdsKey === '') {
            return;
        }

        let isCurrentRequest = true;

        loadProducts(productIdsKey.split(',')).then((loadedInventory) => {
            if (isCurrentRequest) {
                setResult({ productIdsKey, ...loadedInventory });
            }
        });

        return () => {
            isCurrentRequest = false;
        };
    }, [productIdsKey]);

    if (productIdsKey === '') {
        return { productsById: {}, isLoading: false, hasError: false };
    }

    // Un resultado de otros productos significa que la consulta nueva sigue en curso.
    if (result?.productIdsKey !== productIdsKey) {
        return { productsById: {}, isLoading: true, hasError: false };
    }

    return { productsById: result.productsById, isLoading: false, hasError: result.hasError };
}
