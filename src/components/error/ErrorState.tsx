/**
 * @fileoverview Mensaje de error reutilizable para páginas y secciones.
 */

import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { FaExclamationTriangle } from 'react-icons/fa';

import styles from './ErrorState.module.css';

/** Propiedades de ErrorState. */
interface ErrorStateProps {
    title: string;
    description: string;
    /** Ícono a mostrar; por defecto, un triángulo de advertencia. */
    icon?: IconType;
    /** Botones o enlaces para recuperarse del error. */
    actions?: ReactNode;
}

/**
 * Muestra un error con ícono, título, descripción y acciones opcionales.
 *
 * @param props Propiedades del componente.
 * @return El mensaje de error, anunciado como alerta.
 */
export default function ErrorState({
    title,
    description,
    icon: Icon = FaExclamationTriangle,
    actions
}: ErrorStateProps) {
    return (
        <div className={styles.errorState} role="alert">
            <span className={styles.iconCircle}>
                <Icon aria-hidden="true" />
            </span>

            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>

            {actions && <div className={styles.actions}>{actions}</div>}
        </div>
    );
}
