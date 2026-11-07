/**
 * @fileoverview Formateo de fechas según la configuración regional activa.
 */

import { getFormatLocale } from '../i18n/formatLocale';

/**
 * Formatea una fecha ISO con fecha larga y hora corta.
 *
 * @param isoDate Fecha en formato ISO 8601.
 * @return La fecha y hora formateadas para mostrar al usuario.
 */
export function formatDateTime(isoDate: string): string {
    return new Intl.DateTimeFormat(getFormatLocale(), {
        dateStyle: 'long',
        timeStyle: 'short'
    }).format(new Date(isoDate));
}

/**
 * Formatea una fecha ISO con fecha y hora cortas, para tablas y espacios reducidos.
 *
 * @param isoDate Fecha en formato ISO 8601.
 * @return La fecha y hora formateadas (por ejemplo, "2/11/26, 14:30").
 */
export function formatShortDateTime(isoDate: string): string {
    return new Intl.DateTimeFormat(getFormatLocale(), {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date(isoDate));
}
