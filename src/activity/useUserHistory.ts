/**
 * @fileoverview Hook con el historial del usuario o invitado activo.
 */

import { useMemo, useState } from 'react';

import { useAnalytics } from '../context/AnalyticsContext';
import { getSubjectKey } from './eventPayloads';
import { readHiddenSearches, writeHiddenSearches } from './hiddenSearchesStorage';
import {
    excludeHiddenSearches,
    getExploredCategories,
    getRecentSearches,
    getRecentlyViewedProducts,
    normalizeSearchQuery
} from './userHistory';

/**
 * Da acceso al historial de quien está usando la tienda: si cambia la
 * sesión, el historial cambia con ella.
 *
 * @return Los productos vistos, las búsquedas recientes y las categorías
 *     exploradas (del más reciente al más antiguo), y una función para
 *     quitar una búsqueda del historial.
 */
export function useUserHistory() {
    const { events, activeSubject } = useAnalytics();
    const [hiddenSearchesBySubject, setHiddenSearchesBySubject] = useState(readHiddenSearches);
    const subjectKey = getSubjectKey(activeSubject);

    const recentlyViewedProducts = useMemo(() => getRecentlyViewedProducts(events), [events]);
    const exploredCategories = useMemo(() => getExploredCategories(events), [events]);
    const recentSearches = useMemo(
        () => getRecentSearches(excludeHiddenSearches(events, hiddenSearchesBySubject[subjectKey] ?? [])),
        [events, hiddenSearchesBySubject, subjectKey]
    );

    /**
     * Quita una búsqueda del historial del sujeto activo. Los eventos se
     * conservan, porque las métricas siguen contando esa búsqueda.
     *
     * @param query Texto buscado a quitar.
     */
    const removeRecentSearch = (query: string) => {
        const normalizedQuery = normalizeSearchQuery(query);
        const otherHiddenSearches = (hiddenSearchesBySubject[subjectKey] ?? [])
            .filter((hiddenSearch) => hiddenSearch.query !== normalizedQuery);

        const nextHiddenSearches = {
            ...hiddenSearchesBySubject,
            [subjectKey]: [
                ...otherHiddenSearches,
                { query: normalizedQuery, hiddenAt: new Date().toISOString() }
            ]
        };

        writeHiddenSearches(nextHiddenSearches);
        setHiddenSearchesBySubject(nextHiddenSearches);
    };

    return { recentlyViewedProducts, recentSearches, exploredCategories, removeRecentSearch };
}
