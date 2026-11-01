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
