/**
 * @fileoverview Recorrido de compra de una sola persona: hasta qué paso llegó.
 */

import { useTranslation } from 'react-i18next';
import { FaCheck } from 'react-icons/fa';

import type { JourneyStep, UsageTotals } from '../../activity/usageSummary';
import { getFormatLocale } from '../../i18n/formatLocale';
import DashboardPanel from './DashboardPanel';
import { EVENT_TYPE_ICONS } from './eventTypeIcons';
import PurchaseStats from './PurchaseStats';

import styles from './PurchaseJourney.module.css';

/**
 * Formatea el momento de un paso: solo la hora si fue hoy, o también el día
 * si fue antes.
 *
 * @param isoDate Fecha en formato ISO 8601.
 * @return La fecha formateada (por ejemplo, "14:02" o "1 nov, 14:02").
 */
function formatStepTime(isoDate: string): string {
    const date = new Date(isoDate);
    const isToday = date.toDateString() === new Date().toDateString();

    return new Intl.DateTimeFormat(getFormatLocale(), {
        ...(isToday ? {} : { day: 'numeric', month: 'short' }),
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).format(date);
}

/** Propiedades de PurchaseJourney. */
interface PurchaseJourneyProps {
    /** Nombre de la persona cuyo recorrido se muestra. */
    subjectName: string;
    /** Pasos del recorrido, en orden. */
    steps: JourneyStep[];
    totals: UsageTotals;
}

/**
 * Muestra como una línea de pasos hasta dónde llegó una persona, de ver un
 * producto a comprarlo. Cada paso alcanzado indica cuántas veces se realizó
 * y cuándo fue la primera; la línea se marca hasta el último paso alcanzado.
 *
 * @param props Propiedades del componente.
 * @return El panel del recorrido.
 */
export default function PurchaseJourney({ subjectName, steps, totals }: PurchaseJourneyProps) {
    const { t } = useTranslation('admin');

    return (
        <DashboardPanel
            title={t('usage.journey.title')}
            description={t('usage.journey.description', { name: subjectName })}
        >
            <ol className={styles.steps}>
                {steps.map(({ type, count, firstAt }, index) => {
                    const Icon = EVENT_TYPE_ICONS[type];
                    const isReached = count > 0;
                    const isNextReached = (steps[index + 1]?.count ?? 0) > 0;

                    return (
                        <li
                            key={type}
                            className={isReached ? `${styles.step} ${styles.reached}` : styles.step}
                        >
                            <span className={styles.marker} aria-hidden="true">
                                {isReached && <FaCheck />}
                            </span>

                            {index < steps.length - 1 && (
                                <span
                                    className={
                                        isReached && isNextReached
                                            ? `${styles.connector} ${styles.connectorReached}`
                                            : styles.connector
                                    }
                                    aria-hidden="true"
                                />
                            )}

                            <div className={styles.body}>
                                <span className={styles.label}>
                                    <Icon aria-hidden="true" className={styles.icon} />
                                    {t(`usage.eventTypes.${type}`)}
                                </span>

                                <span className={styles.detail}>
                                    {isReached && firstAt
                                        ? t('usage.journey.reached', {
                                            count,
                                            time: formatStepTime(firstAt)
                                        })
                                        : t('usage.journey.notReached')}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>

            <PurchaseStats totals={totals} />
        </DashboardPanel>
    );
}
