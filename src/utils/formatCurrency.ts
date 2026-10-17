import { getFormatLocale } from '../i18n/formatLocale';

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
