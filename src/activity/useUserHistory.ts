/**
 * @fileoverview Hook con el historial del usuario o invitado activo.
 */

import { useMemo } from 'react';

import { useAnalytics } from '../context/AnalyticsContext';
import { getRecentSearches, getRecentlyViewedProducts } from './userHistory';

/**
 * Da acceso al historial de quien está usando la tienda: si cambia la
 * sesión, el historial cambia con ella.
 *
 * @return Los productos vistos y las búsquedas recientes, del más reciente
 *     al más antiguo.
 */
export function useUserHistory() {
    const { events } = useAnalytics();

    const recentlyViewedProducts = useMemo(() => getRecentlyViewedProducts(events), [events]);
    const recentSearches = useMemo(() => getRecentSearches(events), [events]);

    return { recentlyViewedProducts, recentSearches };
}
