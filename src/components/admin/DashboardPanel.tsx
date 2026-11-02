/**
 * @fileoverview Contenedor común de las secciones del dashboard.
 */

import { useId, type ReactNode } from 'react';

import styles from './DashboardPanel.module.css';

/** Propiedades de DashboardPanel. */
interface DashboardPanelProps {
    title: string;
    /** Texto breve bajo el título que explica cómo leer la sección. */
    description?: string;
    /** Contenido alineado a la derecha del título, por ejemplo un total. */
    aside?: ReactNode;
    children: ReactNode;
    /** Clase adicional del panel. */
    className?: string;
}

/**
 * Muestra una sección del dashboard con su encabezado.
 *
 * @param props Propiedades del componente.
 * @return El panel con su contenido.
 */
export default function DashboardPanel({
    title,
    description,
    aside,
    children,
    className
}: DashboardPanelProps) {
    const headingId = useId();

    return (
        <section
            className={className ? `${styles.panel} ${className}` : styles.panel}
            aria-labelledby={headingId}
        >
            <header className={styles.header}>
                <div className={styles.heading}>
                    <h3 id={headingId} className={styles.title}>{title}</h3>
                    {description && <p className={styles.description}>{description}</p>}
                </div>
                {aside}
            </header>

            {children}
        </section>
    );
}
