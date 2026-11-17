/**
 * @fileoverview Tarjeta con una métrica destacada, usada en las métricas de
 * uso y en las consultas del panel administrativo. Las tarjetas se agrupan
 * dentro de un <dl> con la clase "tiles" de StatTile.module.css.
 */

import type { IconType } from 'react-icons';

import styles from './StatTile.module.css';

/** Propiedades de StatTile. */
interface StatTileProps {
    icon: IconType;
    label: string;
    /** Valor ya formateado, por ejemplo "1 234" o "₡250 000". */
    value: string;
    /** Dato de contexto bajo el valor. */
    detail: string;
}

/**
 * Muestra una métrica principal con su ícono y su valor destacado.
 *
 * @param props Propiedades del componente.
 * @return La tarjeta de la métrica.
 */
export default function StatTile({ icon: Icon, label, value, detail }: StatTileProps) {
    return (
        <div className={styles.tile}>
            <dt className={styles.tileLabel}>
                {label}
                <span className={styles.tileIcon}>
                    <Icon aria-hidden="true" />
                </span>
            </dt>
            <dd className={styles.tileValue}>{value}</dd>
            <dd className={styles.tileDetail}>{detail}</dd>
        </div>
    );
}
