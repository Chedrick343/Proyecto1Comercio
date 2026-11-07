/**
 * @fileoverview Persistencia en localStorage de las búsquedas que cada
 * usuario o invitado quitó de su historial.
 */

import type { HiddenSearch } from './userHistory';

/** Clave de localStorage donde se guardan las búsquedas ocultas. */
const HIDDEN_SEARCHES_STORAGE_KEY = 'hidden-searches-v1';

/** Búsquedas ocultas de cada sujeto, indexadas por getSubjectKey. */
export type HiddenSearchesBySubject = Record<string, HiddenSearch[]>;

/**
 * Verifica que un valor recuperado tenga la forma de una búsqueda oculta.
 *
 * @param value Valor a verificar.
 * @return Verdadero si es una búsqueda oculta válida.
 */
const isHiddenSearch = (value: unknown): value is HiddenSearch =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as HiddenSearch).query === 'string' &&
    typeof (value as HiddenSearch).hiddenAt === 'string';

/**
 * Recupera las búsquedas ocultas de todos los sujetos.
 *
 * @return Las búsquedas ocultas válidas, o un objeto vacío si no hay datos o
 *     están dañados.
 */
export function readHiddenSearches(): HiddenSearchesBySubject {
    try {
        const storedValue = localStorage.getItem(HIDDEN_SEARCHES_STORAGE_KEY);
        const parsedValue: unknown = storedValue ? JSON.parse(storedValue) : {};

        if (typeof parsedValue !== 'object' || parsedValue === null || Array.isArray(parsedValue)) {
            return {};
        }

        return Object.fromEntries(
            Object.entries(parsedValue)
                .filter((entry): entry is [string, unknown[]] => Array.isArray(entry[1]))
                .map(([subjectKey, searches]) => [subjectKey, searches.filter(isHiddenSearch)])
        );
    } catch (error) {
        console.error('No se pudieron recuperar las búsquedas ocultas:', error);
        return {};
    }
}

/**
 * Guarda las búsquedas ocultas de todos los sujetos.
 *
 * @param hiddenSearches Búsquedas ocultas a guardar.
 */
export function writeHiddenSearches(hiddenSearches: HiddenSearchesBySubject): void {
    try {
        localStorage.setItem(HIDDEN_SEARCHES_STORAGE_KEY, JSON.stringify(hiddenSearches));
    } catch (error) {
        console.error('No se pudieron guardar las búsquedas ocultas:', error);
    }
}
