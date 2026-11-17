/**
 * @fileoverview Hook que carga el catálogo completo para las consultas del
 * panel administrativo.
 */

import { useEffect, useState } from 'react';

import { searchProductsByText } from '../../utils/algolia';
import type { Product } from '../../utils/Products';

/** Resultados solicitados a Algolia: el catálogo completo cabe en una página. */
const CATALOG_HITS_PER_PAGE = 1000;

/** Estado de la carga del catálogo. */
interface UseAdminProductsState {
    products: Product[];
    isLoading: boolean;
    hasError: boolean;
}

/**
 * Carga todos los productos del índice de Algolia una vez al montar. Los
 * productos ya incluyen los ajustes de inventario simulados.
 *
 * @return Los productos, si siguen cargando y si hubo un error.
 */
export function useAdminProducts(): UseAdminProductsState {
    const [state, setState] = useState<UseAdminProductsState>({
        products: [],
        isLoading: true,
        hasError: false
    });

    useEffect(() => {
        let isCurrent = true;

        searchProductsByText('', CATALOG_HITS_PER_PAGE)
            .then((products) => {
                console.log(`Panel administrativo: ${products.length} productos cargados.`);

                if (isCurrent) {
                    setState({ products, isLoading: false, hasError: false });
                }
            })
            .catch((error: unknown) => {
                console.error('No se pudo cargar el catálogo para el panel administrativo:', error);

                if (isCurrent) {
                    setState({ products: [], isLoading: false, hasError: true });
                }
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    return state;
}
