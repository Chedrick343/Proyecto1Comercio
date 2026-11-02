/**
 * @fileoverview Conversión del checkout, ventas y ticket promedio.
 */

import { useTranslation } from 'react-i18next';

import { getCheckoutConversion, type UsageTotals } from '../../activity/usageSummary';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRate } from '../../utils/formatRate';

import styles from './PurchaseStats.module.css';

/** Propiedades de PurchaseStats. */
interface PurchaseStatsProps {
    totals: UsageTotals;
}

/**
 * Muestra qué parte de los checkouts terminó en compra, lo vendido y el
 * ticket promedio. El ticket solo se calcula si todas las ventas están en la
 * misma moneda.
 *
 * @param props Propiedades del componente.
 * @return La fila de cifras.
 */
export default function PurchaseStats({ totals }: PurchaseStatsProps) {
    const { t } = useTranslation('admin');
    const conversion = getCheckoutConversion(totals);

    const sales = totals.sales.length > 0
        ? totals.sales.map(({ amount, currency }) => formatCurrency(amount, currency)).join(' + ')
        : formatCurrency(0);

    const averageTicket = totals.sales.length === 1 && totals.purchases > 0
        ? formatCurrency(totals.sales[0].amount / totals.purchases, totals.sales[0].currency)
        : '—';

    return (
        <dl className={styles.stats}>
            <div>
                <dt>{t('usage.conversion.title')}</dt>
                <dd>{conversion === null ? '—' : formatRate(conversion)}</dd>
            </div>
            <div>
                <dt>{t('usage.conversion.sales')}</dt>
                <dd>{sales}</dd>
            </div>
            <div>
                <dt>{t('usage.conversion.averageTicket')}</dt>
                <dd>{averageTicket}</dd>
            </div>
        </dl>
    );
}
