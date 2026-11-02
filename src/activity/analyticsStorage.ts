/**
 * @fileoverview Persistencia de los eventos de analítica en localStorage.
 */

import {
    ANALYTICS_EVENT_TYPES,
    type AnalyticsEvent,
    type AnalyticsEventType
} from './analyticsTypes';

/** Clave de localStorage donde se guardan los eventos. */
const ANALYTICS_STORAGE_KEY = 'analytics-events-v1';

/**
 * Cantidad máxima de eventos guardados, sumando todos los usuarios e
 * invitados. Al superarla se descartan los más antiguos, para no agotar el
 * espacio de localStorage.
 */
export const MAX_STORED_EVENTS = 500;

/**
 * Verifica si un valor es un objeto no nulo.
 *
 * @param value Valor a verificar.
 * @return Verdadero si el valor es un objeto.
 */
const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

/**
 * Verifica que un valor recuperado tenga la forma de un evento. Revisa la
 * estructura común a todos los eventos; el payload solo se verifica como objeto.
 *
 * @param value Valor a verificar.
 * @return Verdadero si el valor es un evento válido.
 */
const isAnalyticsEvent = (value: unknown): value is AnalyticsEvent =>
    isObject(value) &&
    typeof value.id === 'string' &&
    ANALYTICS_EVENT_TYPES.includes(value.type as AnalyticsEventType) &&
    typeof value.timestamp === 'string' &&
    isObject(value.subject) &&
    (value.subject.type === 'user' || value.subject.type === 'guest') &&
    typeof value.subject.id === 'string' &&
    isObject(value.payload);

/**
 * Recupera los eventos guardados.
 *
 * @return Los eventos válidos, del más antiguo al más reciente, o una lista
 *     vacía si no hay datos o están dañados.
 */
export function readStoredEvents(): AnalyticsEvent[] {
    try {
        const storedEvents = localStorage.getItem(ANALYTICS_STORAGE_KEY);

        if (!storedEvents) {
            return [];
        }

        const parsedEvents: unknown = JSON.parse(storedEvents);
        return Array.isArray(parsedEvents) ? parsedEvents.filter(isAnalyticsEvent) : [];
    } catch (error) {
        console.error('No se pudieron recuperar los eventos de analítica:', error);
        return [];
    }
}

/**
 * Guarda los eventos, conservando solo los MAX_STORED_EVENTS más recientes.
 *
 * @param events Eventos del más antiguo al más reciente.
 */
export function writeStoredEvents(events: AnalyticsEvent[]) {
    try {
        localStorage.setItem(
            ANALYTICS_STORAGE_KEY,
            JSON.stringify(events.slice(-MAX_STORED_EVENTS))
        );
    } catch (error) {
        console.error('No se pudieron guardar los eventos de analítica:', error);
    }
}
