/**
 * @fileoverview Diálogo modal reutilizable para confirmar o continuar una
 * acción: ícono, encabezado, contenido opcional y botones de acción.
 */

import { useEffect, useId, useRef, type ReactNode } from 'react';
import type { IconType } from 'react-icons';

import styles from './ActionDialog.module.css';

/** Tono del ícono: dorado para confirmaciones y rojo para acciones delicadas. */
type ActionDialogTone = 'accent' | 'danger';

/** Propiedades de ActionDialog. */
interface ActionDialogProps {
    /** Indica si el diálogo está abierto. */
    isOpen: boolean;
    /** Se llama cuando el diálogo se cierra por cualquier vía. */
    onClose: () => void;
    icon: IconType;
    tone?: ActionDialogTone;
    eyebrow: string;
    title: string;
    /** Texto breve bajo el título; es opcional. */
    description?: string;
    /** Contenido adicional entre el encabezado y las acciones. */
    children?: ReactNode;
    /**
     * Botones de acción. Para cerrar el diálogo, deben llamar a onClose. Para
     * los estilos, usar las clases primaryAction, secondaryAction y
     * dangerAction de ActionDialog.module.css.
     */
    actions: ReactNode;
}

/**
 * Muestra un diálogo modal con el elemento <dialog> nativo, que atrapa el
 * foco y se cierra con Escape; React solo refleja su estado de apertura, así
 * que cerrarlo consiste en que el consumidor cambie isOpen a falso. Un clic
 * fuera del contenido también llama a onClose.
 *
 * @param props Propiedades del componente.
 * @return El diálogo.
 */
export default function ActionDialog({
    isOpen,
    onClose,
    icon: Icon,
    tone = 'accent',
    eyebrow,
    title,
    description,
    children,
    actions
}: ActionDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;

        if (isOpen && !dialog?.open) {
            dialog?.showModal();
        } else if (!isOpen && dialog?.open) {
            dialog.close();
        }
    }, [isOpen]);

    return (
        <dialog
            ref={dialogRef}
            className={styles.dialog}
            aria-labelledby={titleId}
            onClose={onClose}
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className={styles.content}>
                <span
                    className={tone === 'danger' ? `${styles.icon} ${styles.iconDanger}` : styles.icon}
                    aria-hidden="true"
                >
                    <Icon />
                </span>

                <p className={styles.eyebrow}>{eyebrow}</p>
                <h2 id={titleId} className={styles.title}>{title}</h2>
                {description && <p className={styles.description}>{description}</p>}

                {children}

                <div className={styles.actions}>{actions}</div>
            </div>
        </dialog>
    );
}
