/**
 * @fileoverview Formateo de montos monetarios según la configuración regional activa.
 */

import { getFormatLocale } from '../i18n/formatLocale';

/**
 * Formatea un monto como moneda sin decimales.
 *
 * @param amount Monto a formatear.
 * @param currency Código ISO 4217 de la moneda; por defecto colones (CRC).
 * @return El monto formateado (por ejemplo, "₡25 000").
 */
export function formatCurrency(
    amount: number,
    currency: string = 'CRC'
): string {
    return new Intl.NumberFormat(getFormatLocale(), {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}
