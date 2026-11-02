/**
 * @fileoverview Hook con las recomendaciones para el usuario o invitado activo.
 */

import { useMemo } from 'react';

import { useAnalytics } from '../context/AnalyticsContext';
import type { Product } from '../utils/Products';
import { getTopCategories, recommendProducts } from './recommendations';

/**
 * Recomienda productos del catálogo según las categorías que más le
 * interesan a quien está usando la tienda.
 *
 * @param catalog Productos disponibles para recomendar.
 * @return Los productos recomendados y las categorías en las que se basan,
 *     de mayor a menor interés.
 */
export function useRecommendations(catalog: Product[]) {
    const { events } = useAnalytics();

    const recommendedProducts = useMemo(() => recommendProducts(events, catalog), [events, catalog]);
    const basedOnCategories = useMemo(
        () => getTopCategories(events).map(([category]) => category),
        [events]
    );

    return { recommendedProducts, basedOnCategories };
}
