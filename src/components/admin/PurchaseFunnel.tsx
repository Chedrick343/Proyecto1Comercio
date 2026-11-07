/**
 * @fileoverview Embudo con las personas que llegaron a cada paso del
 * recorrido de compra, junto con la conversión del checkout y las ventas.
 */

import { useTranslation } from 'react-i18next';

import type { FunnelStep, UsageTotals } from '../../activity/usageSummary';
import { formatRate } from '../../utils/formatRate';
import DashboardPanel from './DashboardPanel';
import { EVENT_TYPE_ICONS } from './eventTypeIcons';
import PurchaseStats from './PurchaseStats';

import styles from './PurchaseFunnel.module.css';

/** Ancho mínimo, en porcentaje, de una barra con valor mayor que cero. */
const MIN_VISIBLE_BAR_PERCENT = 3;

/** Propiedades de PurchaseFunnel. */
interface PurchaseFunnelProps {
    /** Pasos del recorrido, en orden, con las personas que llegaron a cada uno. */
    steps: FunnelStep[];
    totals: UsageTotals;
    /** Clase adicional del panel. */
    className?: string;
}

/**
 * Describe qué parte de las personas del paso anterior llegó a este.
 *
 * @param previousCount Personas del paso anterior.
 * @param count Personas de este paso.
 * @return La proporción entre 0 y 1, o null si el paso anterior está vacío.
 */
const getStepRate = (previousCount: number, count: number): number | null =>
    previousCount > 0 ? count / previousCount : null;

/**
 * Muestra cuántos usuarios e invitados distintos llegaron a cada paso, de ver
 * un producto a comprarlo. Cada barra se mide contra el paso con más
 * personas, y cada paso indica qué parte del anterior siguió adelante.
 *
 * @param props Propiedades del componente.
 * @return El panel del embudo.
 */
export default function PurchaseFunnel({ steps, totals, className }: PurchaseFunnelProps) {
    const { t } = useTranslation('admin');
    const maxCount = Math.max(0, ...steps.map((step) => step.subjectCount));

    return (
        <DashboardPanel
            title={t('usage.funnel.title')}
            description={t('usage.funnel.description')}
            className={className}
        >
            <ol className={styles.steps}>
                {steps.map(({ type, subjectCount }, index) => {
                    const Icon = EVENT_TYPE_ICONS[type];
                    const rate = index > 0
                        ? getStepRate(steps[index - 1].subjectCount, subjectCount)
                        : null;
                    const width = subjectCount > 0 && maxCount > 0
                        ? Math.max((subjectCount / maxCount) * 100, MIN_VISIBLE_BAR_PERCENT)
                        : 0;

                    return (
                        <li key={type} className={styles.step}>
                            <div className={styles.stepHeader}>
                                <span className={styles.stepLabel}>
                                    <Icon aria-hidden="true" className={styles.stepIcon} />
                                    {t(`usage.eventTypes.${type}`)}
                                </span>
                                <span className={styles.stepValue}>
                                    {t('usage.funnel.people', { count: subjectCount })}
                                </span>
                            </div>

                            <div className={styles.track} aria-hidden="true">
                                <div className={styles.bar} style={{ width: `${width}%` }} />
                            </div>

                            {rate !== null && (
                                <span className={styles.rate}>
                                    {rate <= 1
                                        ? t('usage.funnel.continued', { rate: formatRate(rate) })
                                        : t('usage.funnel.moreThanPrevious')}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>

            <PurchaseStats totals={totals} />
        </DashboardPanel>
    );
}
