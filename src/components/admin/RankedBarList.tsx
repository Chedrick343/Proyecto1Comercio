/**
 * @fileoverview Panel con una lista de valores representados como barras horizontales.
 */

import type { ReactNode } from 'react';

import { getFormatLocale } from '../../i18n/formatLocale';
import DashboardPanel from './DashboardPanel';

import styles from './RankedBarList.module.css';

/** Ancho mínimo, en porcentaje, de una barra con valor mayor que cero. */
const MIN_VISIBLE_BAR_PERCENT = 2;

/** Elemento de la lista. */
export interface RankedBarItem {
    key: string;
    label: ReactNode;
    value: number;
}

/** Propiedades de RankedBarList. */
interface RankedBarListProps {
    title: string;
    /** Texto breve bajo el título que explica qué se cuenta. */
    description?: string;
    items: RankedBarItem[];
    /** Mensaje cuando la lista está vacía. */
    emptyMessage: string;
    /** Contenido adicional bajo la lista, por ejemplo una conclusión. */
    footer?: ReactNode;
}

/**
 * Calcula el ancho de una barra respecto al valor más alto.
 *
 * @param value Valor de la barra.
 * @param maxValue Valor más alto de la lista.
 * @return El ancho en porcentaje; las barras con valor cero no se dibujan.
 */
function getBarWidth(value: number, maxValue: number): string {
    if (value <= 0 || maxValue <= 0) {
        return '0%';
    }

    return `${Math.max((value / maxValue) * 100, MIN_VISIBLE_BAR_PERCENT)}%`;
}

/**
 * Muestra cada elemento con su valor escrito y una barra proporcional al
 * valor más alto. Las barras son decorativas: el valor siempre se lee como texto.
 *
 * @param props Propiedades del componente.
 * @return El panel con la lista.
 */
export default function RankedBarList({
    title,
    description,
    items,
    emptyMessage,
    footer
}: RankedBarListProps) {
    const maxValue = Math.max(0, ...items.map((item) => item.value));

    return (
        <DashboardPanel title={title} description={description}>
            {items.length === 0 ? (
                <p className={styles.empty}>{emptyMessage}</p>
            ) : (
                <ol className={styles.list}>
                    {items.map((item) => (
                        <li key={item.key} className={styles.item}>
                            <div className={styles.row}>
                                <span className={styles.label}>{item.label}</span>
                                <span className={styles.value}>
                                    {item.value.toLocaleString(getFormatLocale())}
                                </span>
                            </div>

                            <div className={styles.track} aria-hidden="true">
                                <div
                                    className={styles.bar}
                                    style={{ width: getBarWidth(item.value, maxValue) }}
                                />
                            </div>
                        </li>
                    ))}
                </ol>
            )}

            {footer}
        </DashboardPanel>
    );
}
