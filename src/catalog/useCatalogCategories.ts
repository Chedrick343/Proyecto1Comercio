/**
 * @fileoverview Hook con las categorías principales del catálogo.
 */

import { useEffect, useState } from 'react';

import { searchProductsByText } from '../utils/algolia';
import { getMainCategory } from '../utils/Products';

/**
 * Resultados solicitados a Algolia. El catálogo completo cabe en una página,
 * igual que en la vista del catálogo.
 */
const CATALOG_HITS_PER_PAGE = 1000;

/**
 * Obtiene las categorías principales de los productos del catálogo, es
 * decir, la categoría que guarda cada evento. Se consultan una vez al montar.
 *
 * @return Las categorías en orden alfabético, o una lista vacía mientras
 *     cargan o si Algolia no responde.
 */
export function useCatalogCategories(): string[] {
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        let isCurrent = true;

        searchProductsByText('', CATALOG_HITS_PER_PAGE)
            .then((products) => {
                const mainCategories = new Set(
                    products
                        .map(getMainCategory)
                        .filter((category): category is string => Boolean(category))
                );

                if (isCurrent) {
                    setCategories(
                        [...mainCategories].sort((first, second) => first.localeCompare(second, 'es'))
                    );
                }
            })
            .catch((error: unknown) => {
                console.error('No se pudieron cargar las categorías del catálogo:', error);
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    return categories;
}
