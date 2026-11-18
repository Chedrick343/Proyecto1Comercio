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
interface AdminProductsState {
    products: Product[];
    isLoading: boolean;
    hasError: boolean;
}

/** Resultado del hook: el estado de la carga y una función para recargar. */
interface UseAdminProductsResult extends AdminProductsState {
    /** Vuelve a leer el catálogo, por ejemplo después de guardar un cambio. */
    reloadProducts: () => void;
}

/**
 * Carga todos los productos del índice de Algolia al montar y cada vez que
 * se pide recargar. Los productos ya incluyen los ajustes de inventario
 * locales y los cambios del administrador guardados en Algolia.
 *
 * @return Los productos, si siguen cargando, si hubo un error y la función
 *     para recargar.
 */
export function useAdminProducts(): UseAdminProductsResult {
    const [state, setState] = useState<AdminProductsState>({
        products: [],
        isLoading: true,
        hasError: false
    });
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        let isCurrent = true;

        searchProductsByText('', CATALOG_HITS_PER_PAGE)
            .then((products) => {
                console.log(`Panel administrativo: ${products.length} productos cargados (carga ${reloadCount + 1}).`);

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
    }, [reloadCount]);

    return { ...state, reloadProducts: () => setReloadCount((count) => count + 1) };
}
