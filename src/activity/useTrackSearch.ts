/**
 * @fileoverview Hook que registra las búsquedas del catálogo.
 */

import { useEffect } from 'react';

import { useAnalytics } from '../context/AnalyticsContext';
import type { AnalyticsEvent } from './analyticsTypes';

/**
 * Tiempo que la búsqueda debe mantenerse sin cambios para registrarse. La
 * búsqueda se actualiza mientras se escribe, así que sin esta espera se
 * registrarían textos incompletos como "ani" antes de "anillo".
 */
const SEARCH_SETTLE_MS = 1000;

/**
 * Obtiene el texto de la búsqueda más reciente.
 *
 * @param events Eventos del sujeto activo, del más antiguo al más reciente.
 * @return El texto buscado, o undefined si no hay búsquedas.
 */
const findLastSearchQuery = (events: AnalyticsEvent[]): string | undefined =>
    events.findLast((event) => event.type === 'SEARCH')?.payload.query;

/**
 * Registra un evento SEARCH cuando una búsqueda con texto termina de cargar
 * y se mantiene sin cambios. No repite la búsqueda anterior, para que volver
 * al catálogo o cambiar los filtros no la registre de nuevo.
 *
 * @param query Texto buscado.
 * @param resultCount Cantidad de productos que ve el cliente.
 * @param isSettled Indica si los resultados ya corresponden a la búsqueda.
 */
export function useTrackSearch(query: string, resultCount: number, isSettled: boolean) {
    const { events, track } = useAnalytics();
    const trimmedQuery = query.trim();
    const isRepeatedSearch = findLastSearchQuery(events) === trimmedQuery;

    useEffect(() => {
        if (!trimmedQuery || !isSettled || isRepeatedSearch) {
            return;
        }

        const timeoutId = window.setTimeout(
            () => track('SEARCH', { query: trimmedQuery, resultCount }),
            SEARCH_SETTLE_MS
        );

        return () => window.clearTimeout(timeoutId);
    }, [trimmedQuery, resultCount, isSettled, isRepeatedSearch, track]);
}
