export function formatCurrency(
    amount: number,
    currency: string = 'CRC'
): string {
    return new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}